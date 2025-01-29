/**
 * 
 * @Module: JobCache
 * @Author: Xiao Ling
 * @Date  : 1/11/2022
 * 
 * 
*/

import { 
	cap,
	trivialProps,
	trivialString,
	resizeFile,
} from './utils';

import {
	toTokenContentKind,
	uploadPhotoFromURL,
	ProjectStates,
	TokenContentKind,
} from './core'


import {
	create_project,
	create_story_board,
	edit_story_board_item,
	create_story_board_item,
	upload_trailer,
	edit_project,
	delete_crew,
	edit_schedule,
	download_youtube_mp4,
} from './api_storyboard';

import {
	fetch_contract_and_inventory_from_opensea
} from './api_opensea';

const uuid  = require('uuid');


/******************************************************
	@On Chain job queue
******************************************************/



/**
 * 
 * @Use: app API for on chain tx
 * @Functions:
 * 		
 * 		
 * 
 */ 
export default class JobCache {


	constructor(user_cache, nft_cache){
		this.user_cache    = user_cache;
		this.nft_cache     = nft_cache;

		this.jobs = {}
		this.recent_proposal = {};
		this.delegate = null;
	}

    /******************************************************
        @read
    ******************************************************/ 


    readJobs = () => {
    	return Object.values(this.jobs);
    }

    readOnGoingJobs = () => {
    	return this.readJobs().filter(x => x.in_progress !== false)
    }

    haveOnGoingJobs = () => {
    	return this.readOnGoingJobs().length > 0
    }

    isRecentlyProposedStoryboard = (board) => {

    	if ( trivialProps(board,'eth_addresss') ){
    		return false;
    	} else if ( trivialProps(this.recent_proposal,'eth_addresss') ){
    		return false;
    	} else {
    		return board.eth_address === this.recent_proposal.eth_address
    	}
    }

    /******************************************************
        @internal job queue
    ******************************************************/ 


    // @use: enqueue job into jobs queue, bubble event
    enqueue = (job_blob) => {

    	let id = job_blob['ID'];

    	if ( trivialString(id) ){
    		return false;
    	}

    	job_blob['in_progress'] = true;
	    this.jobs[id] = job_blob;

		if ( !trivialProps(this.delegate,'willPushJob') ){
			this.delegate.willPushJob(job_blob);
		}	    

		return true;
    }


    // dequeue job from job queue, bubble event
    dequeue = ({ id, success, message, meta }) => {

    	var job = this.jobs[id];
    	if ( trivialProps(job,'ID') ){
    		return { success, message, meta, id };
    	}

    	job['in_progress'] = false;
    	job['success'] = success;
    	job['message'] = message;
    	job['meta']    = meta ?? {}
    	this.jobs[id] = job;

    	if ( !trivialProps(this.delegate, 'didFinishJob') ){
    		this.delegate.didFinishJob(job);
    	}    	

    	return job;
    }

    /******************************************************
        @post film proposal
    ******************************************************/ 

    /**
     * 
     * @use: post film proposal
     * @Note: this is a variation of story proposal
     * 
     **/ 
    async post_film_proposal({
    	slot,
    	name,
    	symbol,
    	about, 
    	twitter,
    	instagram,
    	website,
    	discord,
    	logo_file,
    	poster_file,
    	trailer_link,
    	trailer_file,

    	then,
    	then_progress,
    	then_uploading,    	
    }){


    	const slate_id = trivialProps(slot,'slate_id')
    		? ""
    		: (slot.slate_id) ?? ""
    	const x_idx = trivialProps(slot,'x_idx') ? 0 : slot.x_idx;
    	const y_idx = trivialProps(slot,'y_idx') ? 0 : slot.y_idx;

		let id = uuid.v4();
		var job_blob = {
	        ID           : id,
	        meta         : {},
	        success      : false,
	        message      : '', 
	        address      : '',
	        in_progress  : true,
	        pretty_print : `posting film proposal for ${name}`
	    }   		

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		job_blob['message'] = 'please sign in first'
    		job_blob['in_progress'] = false;
    		return then(job_blob)
    	}

    	if ( trivialString(name) ){
    		job_blob['message'] = 'please provide name'
    		job_blob['in_progress'] = false;
    		return then(job_blob)
    	}


    	// upload files
    	let files_blobs = [
    		{ id: uuid.v4(), name: 'poster' , file: poster_file , file_url: ""},
    		{ id: uuid.v4(), name: 'logo'   , file: logo_file   , file_url: ""},
    		// { id: uuid.v4(), name: 'trailer', file: trailer_file, file_url: ""}
    	]
    	await this._go_upload_files({
			head: files_blobs,
			tail: [],
			then_uploading: then_uploading,
			then_progress: then_progress,
			then: async (saved_files) => {

				var logo_url  = '';
				var image_url = '';
				let logo_url_candidates  = saved_files.filter(m => m.name === 'logo');
				let image_url_candidates = saved_files.filter(m => m.name === 'poster');
				if ( logo_url_candidates.length > 0 ){
					logo_url = logo_url_candidates[0].file_url ?? "";
				}
				if ( image_url_candidates.length > 0 ){
					image_url = image_url_candidates[0].file_url ?? "";
				}

		    	await create_project({
					name     : name ?? "", 
					about    : about ?? "", 
					symbol   : symbol ?? "",
					image_url: image_url,
					logo_url : logo_url,
					twitter  : twitter ?? "",
					instagram: instagram ?? "",
					website  : website ?? "",
					discord  : discord ?? "",	
					userID   : user.userID,
				    budget   : 1000,
				    rarity   : 1000,
				    date_mo  : 12,
				    date_day : 30,
			        slate_id : slate_id,
				    slate_idx_x: x_idx,
				    slate_idx_y: y_idx,
					then  : async (res) => {				

						const { success, message, data } = res;
						
						if ( success ){
							this.recent_proposal = data;
						}

						// upload preview url as well
						await this._upload_small_preview({
							projectID: trivialProps(data,'ID') ? "" : data.ID,
							file: poster_file,
						})

						let address = trivialProps(data,'eth_address') ? '' : data.eth_address;
						var response = this.dequeue({ id: id, success: success, message: message, meta: data });	
						response['data'] = data;
						response['address'] = address;
						return then(response);

					}
				})
			}
    	});
    }


    /**
     * 
     * @use: edit film proposal
     * 
     **/
    async edit_project({
    	about, 
    	twitter,
    	instagram,
    	website,
    	discord,
    	projectID,
    	storyboard,
    	image_file,
    	logo_file,
    	then_progress,
    	then_saved_basics,
    	then_saved_logo,
    	then_saved_poster,
    	then,
    }){

    	var total_saved = [ 
    		trivialProps(image_file,'type') ? 0 : 1, 
    		trivialProps(logo_file,'type') ? 0 : 1,
    		1,
    	].reduce((a,b) => a+b, 0)


		await edit_project({
			projectID: projectID,
			about: about,
			twitter: twitter,
			instagram: instagram,
			website: website,
			discord: discord,
			image_url:  "",
			logo_url: "",
			then: async (res) => {
				then_saved_basics(res);
				total_saved = total_saved - 1;
				if ( total_saved === 0 ){
					await storyboard.sync({ reload: true, fast: true, then: () => {
						then(res)
					}});
				}
			}
		})

		if ( !trivialProps(image_file,'type') ){
		    await uploadPhotoFromURL({ 
		    	url : URL.createObjectURL(image_file),
		    	type: toTokenContentKind(image_file.type),
		    	then_loading: (progress) => {
		    		if ( typeof then_progress === 'function' ){
			    		then_progress(`uploaded poster: ${progress}%`)
			    	}
		    	},
		    	then: async ({ downloadURL }) => {
					await this._upload_small_preview({ projectID: projectID, file: image_file });
		    		await edit_project({ projectID: projectID, image_url: downloadURL, then: async (res) => {
						total_saved = total_saved - 1;
						if ( total_saved === 0 ){
							await storyboard.sync({ reload: true, fast: true, then: () => {
								then(res)
							}});
						}		    			
		    		}})
		    	}
		    });
		}

		if ( !trivialProps(logo_file,'type') ){
		    await uploadPhotoFromURL({ 
		    	url : URL.createObjectURL(logo_file),
		    	type: toTokenContentKind(logo_file.type),
		    	then_loading: (progress) => {
		    		if ( typeof then_progress === 'function' ){
			    		then_progress(`uploaded logo: ${progress}%`)
			    	}
		    	},
		    	then: async ({ downloadURL }) => {
		    		await edit_project({ projectID: projectID, logo_url: downloadURL, then: async (res) => {
						total_saved = total_saved - 1;
						if ( total_saved === 0 ){
							await storyboard.sync({ reload: true, fast: true, then: () => {
								then(res)
							}});
						}		    			
		    		}})
		    	}
		    });
		}

    }   

    async _upload_small_preview({ projectID, file }){

    	if ( trivialProps(file,'type') || trivialString(projectID) ){
    		return;
    	}

    	let type = toTokenContentKind(file.type);
    	if ( type === TokenContentKind.PNG ){
	    	try {
				const small = await resizeFile({ file: file, quality: 30 });
				await uploadPhotoFromURL({ 
					url : small,
					type: toTokenContentKind(file.type),
					then_loading: cap,
					then: async ({ success, downloadURL }) => {
						if ( success ){
							await edit_project({
								projectID: projectID,
								image_preview_url:  downloadURL,
								then: cap
							})  			
						}
				}});    	
			} catch (e) {
				return;
			}
		} else {
			return;
		}
    }

    /******************************************************
        @post film proposal accessories
    ******************************************************/ 

    /**
     * 
     * @Use: delete crew 
     * 
     **/
    async delete_crew({ storyboard, crew, then }){

		let user = await this.user_cache.getAdminUser();
		let uid = trivialProps(user,'userID') ? '' : user.userID
 
    	await delete_crew({
    		address: trivialProps(storyboard, 'eth_address') ? '' : storyboard.eth_address,
    		crewEntryID: trivialProps(crew,'ID') ? '' : crew.ID,
    		adminUserID: uid,
    		then: then
    	})
	}


    /**
     * 
     * @use: edit film proposal
     * 
     **/
    async edit_schedule(params){
    	if ( trivialProps(params,'storyboard') || trivialProps(params, 'then')){
    		return;
    	}
    	const { storyboard, then_saving, then } = params;
		let user = await this.user_cache.getAdminUser();
		let uid = trivialProps(user,'userID') ? '' : user.userID

		then_saving()

		// loop through schedules
		const save_all = await (ProjectStates.map(async (st) => {
			let blob = params[st];
			if ( !trivialProps(blob,'projectState') ){
				await edit_schedule({
					...blob,
					userID: uid,
					address: storyboard.eth_address,
					then: async (res) => { return; }
				});
			} else {
				return;
			}
		}));
		await Promise.all(save_all);

		await storyboard.sync({ reload: true, fast: false, then: () => {
			then({ success: true, message: 'saved!' });
		}});

    }    

    /**
     * 
     * @use: load movie trailer for storyboard
     * 
     **/ 
    async upload_trailer({ storyboard, file, youtube_url, num_whitelist, projectID, then_uploading, then }){

		let id = uuid.v4();
		var job_blob = {
	        ID           : id,
	        meta         : {},
	        success      : false,
	        message      : '', 
	        in_progress  : true,
	        pretty_print : `posting film trailer`
	    }   		

		let user = await this.user_cache.getAdminUser();

    	if ( trivialProps(user,'userID') ){

    		job_blob['message'] = 'please sign in first';
    		job_blob['in_progress'] = false;
    		return then(job_blob);

    	} else if ( trivialString(projectID) ){

    		job_blob['message'] = 'please provide project id';
    		job_blob['in_progress'] = false;
    		return then(job_blob);

    	} else if ( !trivialProps(file,'type') && file.type === "video/mp4" ){

	    	this.enqueue(job_blob);		    		

			let local_file_url = URL.createObjectURL(file);

		    await uploadPhotoFromURL({ 
		    	url : local_file_url,
		    	type: 'mp4',
		    	then_loading: (progress) => {
		    		then_uploading(`uploading mp4: ${progress}%`);
		    	},
		    	then: async ({ success, downloadURL, message }) => {

					if ( trivialString(downloadURL) || !success ){
			    		job_blob['message'] = 'oh no! we failed to save your mp4'
			    		job_blob['in_progress'] = false;
			    		return then(job_blob)						
					}

					await upload_trailer({
						userID        : user.userID,
						trailer_url   : downloadURL,
						num_whitelist : num_whitelist ?? 0,
						projectID     : projectID,
						then: async ({ success, message, data }) => {
							var response = this.dequeue({ id: id, success: success, message: message, meta: data });	
							response['data'] = data;
							await storyboard.get_trailer({ then: () => {
								return then(response);
							}})
						}
					});
		    	}
		    });

	    } else if ( !trivialString(youtube_url) ) {

	    	this.enqueue(job_blob);			    	

	    	await download_youtube_mp4({
	    		url: youtube_url,
	    		then: async ({ success, message,downloadURL }) => {

					if ( trivialString(downloadURL) ){
			    		job_blob['message'] = 'oh no! we failed to save your mp4'
			    		job_blob['in_progress'] = false;
			    		return then(job_blob)						
					}

					await upload_trailer({
						userID      : user.userID,
						trailer_url : downloadURL,
						projectID   : projectID,
						num_whitelist: num_whitelist ?? 0,
						then: async ({ success, message, data }) => {
							var response = this.dequeue({ id: id, success: success, message: message, meta: data });	
							response['data'] = data;
							await storyboard.get_trailer({ then: () => {
								return then(response);
							}})
						}
					});
					
	    		}
	    	})

	    } else {

    		job_blob['message'] = 'please upload either youtube url or fil'
    		job_blob['in_progress'] = false;
    		return then(job_blob)
	    }
    }


    /**
     * 
     * @use: upload each of these files if they exist
     * @Param: files: [{ id, file, name, file_url }]
     * 
     **/ 
    async _go_upload_files({ head, tail, then_uploading, then_progress, then }){

    	if ( head.length === 0 ){

    		return then(tail)

    	} else {

    		let top = head[0];
    		let small_head = head.filter(m => m.id !== top.id)

    		if ( trivialProps(top,'file') || trivialProps(top.file,'type') ){

    			return await this._go_upload_files({ 
					head: small_head, 
					tail: tail, 
					then: then, 
					then_uploading: then_uploading, 
				});

    		} else {

    			then_uploading(`uploading ${top.name}`)
				let local_file_url = URL.createObjectURL(top.file)

			    await uploadPhotoFromURL({ 
			    	url : local_file_url,
			    	type: toTokenContentKind(top.file),
			    	then_loading: (progress) => {
			    		if ( typeof then_progress === 'function' ){
				    		then_progress(`uploaded ${progress}%`)
				    	}
			    	},
			    	then: async ({ success, downloadURL }) => {

			    		if ( !success || trivialString(downloadURL) ){
			    			return await this._go_upload_files({ 
								head: small_head, 
								tail: tail, 
								then: then, 
								then_uploading: then_uploading, 
							});
			    		} else {
			    			let new_top = { ...top, file_url: downloadURL };
			    			let new_tail = tail.concat([new_top]);
			    			return await this._go_upload_files({ 
								head: small_head, 
								tail: new_tail,
								then_uploading: then_uploading, 
								then: then, 
							});
			    		}
			    	}
			    });
    		}
    	}
    }


    /******************************************************
        @post story board 
    ******************************************************/ 

    /***
     * 
     * @Use: post create storyboard 
     * 
     **/
    async post_create_story_board({
    	name,
    	about,
    	kind,
    	is_public,
    	is_fiat,
    	price_in_eth,
		price_in_cents,
    	percent_rake,
    	num_items,
    	then_saving,
    	storyboard,
    	then,
    }){

		let id = uuid.v4();
		var job_blob = {
	        ID           : id,
	        meta         : {},
	        success      : false,
	        message      : '', 
	        in_progress  : true,
	        pretty_print : `creating collection`
	    }   		

		let user = await this.user_cache.getAdminUser();

    	if ( trivialProps(user,'userID') ){

    		job_blob['message'] = 'please sign in first';
    		job_blob['in_progress'] = false;
    		return then(job_blob);

    	} else if ( trivialProps(storyboard,'eth_address') ){

    		job_blob['message'] = 'please provide project address';
    		job_blob['in_progress'] = false;
    		return then(job_blob);

		} else {

		   	this.enqueue(job_blob);		    		
	    	then_saving();
	    	await create_story_board({ 
	    		userID: user.userID, 
	    		address: storyboard.eth_address, 
	    		name: name, 
	    		about: about, 
	    		num_items: num_items ?? 0,
	    		kind : kind ?? "",
				is_public: is_public,
				is_fiat: is_fiat ?? false,
				price_in_cents: price_in_cents ?? 0,
	    		price_in_eth: price_in_eth ?? 0,
	    		percent_rake: percent_rake ?? 0,
	    		then: async (res) => {
					await storyboard.sync({ reload: true, fast: false, then: () => {
		    			let response = this.dequeue({ id: id, success: true, message: 'done!', meta: {} });	
						then(res)
					}});	    			
	    		}
	    	})
		}
    }

    /**
     *
     * @use: post item to 1/1 collection
     * 
     **/
    async post_rare_item_collection({
    	name,
    	file,
    	license_item,  // either use that or licensed item
    	about,
    	kind,
    	storyboard,
    	percent_rake,
    	is_public,
    	num_items,
    	price_in_eth,
    	price_in_cents,
    	then_saving,
    	then_posting,
    	then_progress,    	
    	then,    	
    }){

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') || trivialString(user.userID) ){
    		return then({ success: false, message: 'please sign in first', data: {} });
    	}

    	let license_id = trivialProps(license_item, 'license_id') ? "" : license_item.license_id;

    	await this.post_create_story_board({
    		name,
    		about,
    		storyboard,
    		kind, 
    		is_public,
    		num_items,
    		price_in_eth,
    		price_in_cents,
    		percent_rake,
    		license_id: license_id ?? '',
    		then_saving,
    		then: async (_res) => {

    			const {  success, data  } = _res;
    			
    			if ( !success || trivialProps(data,'storyboardID') ){
    				return then(_res)
    			}

    			let { storyboardID } = data;

    			then_posting("Saving the file...");

    			await storyboard.sync({ reload: true, fast: false, then: async () => {
	    			setTimeout(async () => {

	    				// if licensing it, then post
	    				if ( !trivialProps(license_item, 'license_id') ){

	    					const  { image_url } = license_item;

					    	then_posting(`using the licensed file`);

					    	await create_story_board_item({
								text: about, 
								image_url: image_url,
								animation_url: "",
								license_id: license_id,
								userID   : user.userID, 
								storyboardID: storyboardID,
								then  : async (item_res) => { 

					    			await storyboard.sync({ reload: true, fast: false, then: async () => {
					    				setTimeout(() => {
					    					var res = { ...item_res, data: data }
					    					return then(res);
					    				},1000)
				    				}});
								}
					    	});

	    				} else {
	    					// else save file and post
			    			await this.post_storyboard_item({
			    				text: about,
			    				files: [file],
			    				storyboardID,
			    				storyboard,
			    				then_posting: then_posting,
			    				then_progress: then_progress,
			    				then: (item_res) => {
			    					var res = { ...item_res, data: data }
			    					return then(res);
			    				}
			    			});
			    		}

	    			},1000)
    			}})    			
    		}
    	})

    }



    /******************************************************
        @post 1/1 item
    ******************************************************/ 


    /**
     *  
     *  @Use: post storyboard item
     *  
     *  
     **/
    async post_storyboard_item({
    	text,
    	files,
    	storyboardID,
    	storyboard,
    	license_id,
    	then_posting,
    	then_progress,
    	then,
    }){

		let id = uuid.v4();
		var job_blob = {
	        ID           : id,
	        meta         : {},
	        success      : false,
	        message      : '', 
	        in_progress  : true,
	        pretty_print : `posting new storyboard card`
	    }   		

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		job_blob['message'] = 'please sign in first'
    		job_blob['in_progress'] = false;
    		return then(job_blob)
    	}

    	if ( files.length == 0 ){
    		job_blob['message'] = `Please drop valid files`
    		job_blob['in_progress'] = false;
    		return then(job_blob)
    	}

    	if ( trivialString(storyboardID) ){
    		job_blob['message'] = 'No storyboard found'
    		job_blob['in_progress'] = false;
    		return then(job_blob)
		}

		if ( trivialProps(storyboard, 'sync') ){
			job_blob['message'] = 'please attach to valid film'
			job_blob['in_progress'] = false;
			return then(job_blob);
		}

		let board = storyboard.get_board({ at: storyboardID });
		let about_txt = trivialProps(board, 'about')
			? ""
			: (board['about'] ?? "")

		// enqueu job, start routine
    	let good_files = files
    		.filter(m => !trivialProps(m,'type'))
    		.map(m => {
    			m['id'] = uuid.v4();
    			return m;
    		})
    	let total_num  = good_files.length;
    	var current_idx = 0;

    	let _suffix = total_num > 1 
    		? `files, please do not close the window until all files have been saved` 
    		: 'file'
    	then_posting(`Saved ${total_num} ${_suffix}`);	    
    	this.enqueue(job_blob);		

    	await this._rec_create_storyboard_item({
    		files: good_files,
    		text: about_txt,
    		user: user,
    		license_id: license_id ?? "",
    		storyboardID: storyboardID,
    		total_num: total_num,
    		then_posting: then_posting,
    		then_progress: then_progress,
    		then: async () => {
		    	// reload storyboard and exit fn
				await storyboard.sync({ reload: true, fast: false, then: () => {
		    		let response = this.dequeue({ id: id, success: true, message: `done`, meta: {} });	
		    		then(response);
				}});	  							

    		}
    	});
    }
    

    // @use: save all board items
    async _rec_create_storyboard_item(params){

    	const { files, text, user, storyboardID, total_num, then_posting, then_progress, license_id, then } = params;

    	if ( files.length === 0  ){

    		return then();

    	} else {

    		let file = files[0];
    		let tail = files.filter(m => m.id !== file.id)    		
	    	let { type } = file;
	    	let url = URL.createObjectURL(file);

	    	if ( trivialString(url)  ){

				await this._rec_create_storyboard_item({ ...params, files: tail })

	    	} else {

			    await uploadPhotoFromURL({ 
			    	url : url,
			    	type: toTokenContentKind(type),
			    	then_loading: (str) => {
			    		then_progress(`uploaded ${str}%`)
			    	},
			    	then: async ({ success, downloadURL }) => {
			    		if ( success && !trivialString(downloadURL) ){
					    	then_posting(`saving ${total_num - tail.length}/${total_num} files`)		    	
					    	await create_story_board_item({
								text: text, 
								image_url: downloadURL, 
								animation_url: "",
								license_id: license_id ?? "",
								userID   : user.userID, 
								storyboardID: storyboardID,
								then  : async (res) => { 
									await this._rec_create_storyboard_item({ ...params, files: tail })
								}
					    	});
					    } else {
							await this._rec_create_storyboard_item({ ...params, files: tail })
					    }
				    }
				});
			}    		 
    	}
    }

    /** 
     * 
     * @use: edit storyboard item
     * 
     **/ 
    async edit_storyboard_item({
    	text,
    	storyboard,
    	storyboardItemId,
    	then_posting,
    	then,
    }){

		let id = uuid.v4();
		var job_blob = {
	        ID           : id,
	        meta         : {},
	        success      : false,
	        message      : '', 
	        in_progress  : true,
	        pretty_print : `posting new storyboard card`
	    }   		

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		job_blob['message'] = 'please sign in first'
    		job_blob['in_progress'] = false;
    		return then(job_blob)
    	}

    	if ( trivialString(storyboardItemId) ){
    		job_blob['message'] = 'Oh no! An error occured!'
    		job_blob['in_progress'] = false;
    		return then(job_blob)
    	}

		// enqueu job, start routine
    	then_posting();	    
    	this.enqueue(job_blob);	 	    	

    	await edit_story_board_item({
			text: text, 
			userID   : user.userID, 
			itemID   : storyboardItemId,
    		then: async ({ success, message }) => {
				await storyboard.sync({ reload: true, fast: false, then: () => {
	    			let response = this.dequeue({ id: id, success: success, message: message, meta: {} });	
					then(response)
				}});	    			
    		}
    	})
    }



    /******************************************************
        @import collection from opensea
    ******************************************************/ 

    /**
     * 
     * @use: import collection from opensea 
     * 
     **/
    async import_collection({ 
    	storyboard,
    	then_fetching,
    	then_fetched_success,
    	then_fetched_fail,
    	then_migrating,
    	then_did_migrate_succ,
    	then_did_migrate_fail,
    }) {

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then_fetched_fail({ success: false, message: 'please sign in first', user: {}, data: {} })
    	}		    	

    	const collection_address = '';
    	// '0xe4e9c12a087cdea3f22a0bd8c2a8dbac047f0efa'; // hourglass
    	// ashvalley: '0xb066853df113e950c6e3a5dbdfff89faabb7cfb1';

    	then_fetching("fetching contract from opensea")
    	await fetch_contract_and_inventory_from_opensea({

			contractAddress: collection_address,

			then: async ({ success, message, base, inventory }) => {

				if ( !success ){
					return then_fetched_fail(message)
				}

				then_fetched_success(`Fetched ${inventory.length} items from this collection!`)

			    const { symbol, name, description, payout_address } = base;

			    then_migrating('importing contract base');

		    	await create_story_board({ 
		    		userID : user.userID, 
		    		address: storyboard.eth_address, 
		    		name   : name ?? (symbol ?? ""),
		    		about  : description ?? "",
		    		price_in_eth: 0,
					migrated_contract_address: collection_address ?? "",
					migrated_payout_address: payout_address ?? "",
					migrated_symbol: symbol ?? "",
		    		then: async ({ success, message, data }) => {

		    			if ( !success || trivialProps(data,'storyboardID') ){
		    				return then_did_migrate_fail(message)
		    			}

					    then_migrating('importing contract nfts')

		    			await this._rec_migrate_item({
		    				userID: user.userID,
		    				storyboardID: data.storyboardID,
		    				inventory: inventory,
		    				text: description ?? "",
		    				total_num: inventory.length ?? 1,
		    				migrated_contract_address: collection_address,
		    				then_migrating: then_migrating,
		    				then_did_migrate_succ: async ({ success, message }) => {
								await storyboard.sync({ reload: true, fast: false, then: () => {
									then_did_migrate_succ({ message: 'imported all items!', storyboardID: data.storyboardID });
								}});	    			
		    				}
		    			})
		    		}
		    	})
			}
    	})

    }

	/**
	 *
	 * @Use: imoprt item from opensea, item is of format:
	 * 
	 *  animation_original_url: null
	 *  animation_url: null
	 *  asset_contract: {address: '0xed5af388653567af2f388e6224dc7c4b324..."
	 *  background_color: null
	 *  collection: {banner_image_url: 'https://lh3.googleusercontent.com..."
	 *  creator: {user: {…}, profile_img_url: 'https://storage.googleapis..."
	 *  decimals: 0
	 *  description: null
	 *  external_link: null
	 *  id: 225566789
	 *  image_original_url: "https://ikzttp.mypinata.cloud/ipfs/..."
	 *  image_preview_url: "https://lh3.googleusercontent.com/vd..."
	 *  image_thumbnail_url: "https://lh3.googleusercontent.com/..."
	 *  image_url: "https://lh3.googleusercontent.com/vdYvVdy8-9..."
	 *  is_nsfw: false
	 *  is_presale: false
	 *  last_sale: {asset: {…}, asset_bundle: null, event_type: 'successful', event_timestamp: '2022-05-19T16:12:18', auction_type: null, …}
	 *  listing_date: null
	 *  name: "Azuki #9999"
	 *  num_sales: 2
	 *  owner: {user: {…}, profile_img_url: 'https://storage.googleapis.com/..."
	 *  permalink: "https://opensea.io/assets/ethereum/0xed5af388653567af2f388e6224dc7c4b3241c544/9999"
	 *  seaport_sell_orders: null
	 *  sell_orders: null
	 *  token_id: "9999"
	 *  token_metadata: "https://ikzttp.mypinata.cloud/ipfs/QmQFkLSQysj94s5GvTHPyzTxrawwtjgiiYS2TBLgrvw8CW/9999"
	 *  top_bid: null
	 *  traits: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
	 *  transfer_fee: null
	 *  transfer_fee_payment_token: null 
	 * 
	 *  while base is of form 
	 * \
	 * 
	 * address: "0xed5af388653567af2f388e6224dc7c4b3241c544"
	 * asset_contract_type: "non-fungible"
	 * banner_image_url: "https://lh3.googleusercontent.c..."
	 * buyer_fee_basis_points: 0
	 * collection: 0
	 * created_date: "2022-01-12T04:18:22.531632"
	 * default_to_fiat: false
	 * description: "Take the red bean to join the garden...."
	 * dev_buyer_fee_basis_points: "0"
	 * dev_seller_fee_basis_points: "500"
	 * discord_url: "https://discord.gg/azuki"
	 * display_data: 0
	 * external_link: "http://www.azuki.com"
	 * external_url: "http://www.azuki.com"
	 * featured: false
	 * hidden: false
	 * image_url: "https://lh3.googleusercontent....""
	 * instagram_username: "azuki"
	 * is_nsfw: false
	 * is_subject_to_whitelist: false
	 * name: "Azuki"
	 * nft_version: "3.0"
	 * only_proxied_transfers: false
	 * opensea_buyer_fee_basis_points: "0"
	 * opensea_seller_fee_basis_points: "250"
	 * owner: 443508449
	 * payout_address: "0xb4d24dacbdffa1bbf9a624044484b3feeb7fdf74"
	 * require_email: false
	 * safelist_request_status: "verified"
	 * schema_name: "ERC721"
	 * seller_fee_basis_points: 750
	 * slug: "azuki"
	 * symbol: "AZUKI"
	 * total_supply: "0"
	 * 
	 * @NOTE: video-url: https://arweave.net/mNI7a-ld-9tqlu0HPEHf6GbZDu4CX6yXIWPX5rXIZTc
	 * 
	 **/
	async _rec_migrate_item({ 
		userID, 
		storyboardID, 
		inventory, 
		text, 
		total_num,
		migrated_contract_address,
		then_migrating, 
		then_did_migrate_succ 
	}){

	    if ( trivialString(userID) || trivialString(storyboardID) ){
	        return then_did_migrate_succ({ success: true, message: 'done', data: {} })
	    }

	    if ( inventory.length === 0 ){
	        return then_did_migrate_succ({ success: true, message: 'done', data: {} })        
	    }

	    let _head = inventory[0];
	    let _tail = inventory.slice(1,);

        const { 
            image_original_url, 
            image_preview_url,
            image_thumbnail_url,
            animation_url,
            animation_original_url,            
            image_url, 
            token_id, 
            token_metadata 
        } = _head;

	    let img_url = image_url ?? (image_original_url ?? (image_preview_url ?? image_thumbnail_url ?? ""));
	    let anime_url = animation_url ?? (animation_original_url ?? "");

    	then_migrating(`migrating ${total_num - _tail.length}/${total_num} nfts`)		    	

    	await create_story_board_item({
			text: text, 
			image_url: img_url,
			animation_url: anime_url,
			userID   : userID, 
			storyboardID: storyboardID,
			migrated_contract_address: migrated_contract_address,
			migrated_token_id: token_id ?? "",
			migrated_token_metadata: token_metadata ?? "",
			then  : async (res) => { 
			    return this._rec_migrate_item({ 
					userID: userID,
					storyboardID: storyboardID, 
					text: text,
					total_num: total_num,
					inventory: _tail, 
					migrated_contract_address: migrated_contract_address,
					then_migrating: then_migrating,
					then_did_migrate_succ: then_did_migrate_succ,
				});

			}
    	});

	}





    
}











































