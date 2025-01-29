/** 
 * @Module: user cache
 * @Author: Xiao Ling
 * @Date  : 12/16/2021
*/


import UserModel from './userModel';

const { 
	setServerUserValue,
} = require('./userModel');


const { 
	trivialString, 	
	trivialProps,
	illValued,
	swiftNow,
} = require('./utils');

const { 
	  POST_ENDPOINTS
	, go_axios_post
	, make_post_params
	, uploadPhotoFromURL
	, toTokenContentKind
} = require('./core');




class UserModelCache {


	constructor(){
		this.dataSource = {};
		this.adminUserID = ""
		this.delegate = null;
	}

	/**
	 * 
	 * @Use: sync w/ app's latest data
	 * 
	 */ 
	async sync(){
		return;
	}

	/**
	 * 
	 * @Use: set this pages's user account as `to`
	 * 
	 */ 
	async setAdminUser({ to }){
		if (!trivialString(to)){
			this.adminUserID = to
			await this.get({ userID: to });
		}
	}

	/**
	 * 
	 * @Use: get this admin user's account 
	 * 
	 */ 
	async getAdminUser(){
		if (trivialString(this.adminUserID)){
			return null;
		} else {
			let user = await this.get({ userID: this.adminUserID });
			return user;
		}
	}

	/**
	 *  
	 * @Use: if is autheticated, then return `true`
	 * 
	 **/ 
	isAuthed(){
		return !trivialString(this.adminUserID)
	}

	/**
	 * 
	 * @Use: read existing user from dataSource
	 * 
	 */ 
	read({ userID }){
		if (trivialString(userID)){
			return null;
		} else {
			return this.dataSource[userID]
		}
	}

	async _get({ userID }){
		if ( trivialString(userID) ){
			return {}
		}
		let user = this.dataSource[userID]
		if ( !trivialProps(user,'userID') ){
			return user;
		} else {
			let user = new UserModel(userID);
			this.dataSource[userID] = user;
			await user.sync({ then: (b) => { return } })
			return user;				
		}
	}

	/**
	 * 
	 * @use: get useren `userID` from store;
	 *       if not in store, get from db
	 *       if `_terminal`, do not get neighbors
	 * 
	 */ 
	async get({ userID, then }){

		if ( trivialString(userID) ){

			if (illValued(then)){
				return null;
			} else {
				return then({});
			}

		} else {

			let user = this.dataSource[userID]

			if (!trivialProps(user,'userID')){

				if (illValued(then)){
					return user;
				} else {
					return then(user)
				}

			} else {

				// create this user and store
				let user = new UserModel(userID)
				this.dataSource[userID] = user;
				await user.sync({ then: b => {
					if ( !illValued(then) ){
						then(user);
					}
				}});
			}
		}
	}

	/**
	 *
	 * @use: update admin user's info 
	 * 
	 **/
	async updateAdminUser({
		then,
		then_saving,
	    name,
	    about, 
	    twitter,
	    openSea,
	    imdb,
	    instagram,
	    website,
	    image_file,
	}){

		let user = await this.getAdminUser()
		if ( trivialProps(user,'userID') || trivialString(user.userID) ){
			return;
		}

		async function _go_save(url){
			await setServerUserValue({
				userID: user.userID,
				name: name ?? "",
			    about: about ?? "", 
			    twitter: twitter ?? "",
			    openSea: openSea ?? "",
			    instagram: instagram ?? "",
			    website: website ?? "",
	            imdb: imdb ?? "",
			    image_url: url ?? "",
			    then: async (res) => {
			    	then(res)
			    	await user.sync({ then: () => { return } })
			    }
			})
		}

		if ( !trivialProps(image_file,'type') ){

			let local_file_url = URL.createObjectURL(image_file)

		    await uploadPhotoFromURL({ 
		    	url : local_file_url,
		    	type: toTokenContentKind(image_file.type),
		    	then_loading: (str) => {
		    		then_saving(`uploaded ${str}%`)
		    	},
		    	then: async ({ success, downloadURL }) => {
		    		if ( !success || trivialString(downloadURL) ){
		    			await _go_save("");
		    		} else {
		    			await _go_save(downloadURL);		    			
		    		}
		    	}
		    });	

		} else {

			await _go_save("")
		}
	}

	async before_auth_on_mobile({ then }){

		let user = await this.getAdminUser();

		let post_params = {
			userID: trivialProps(user,'userID') ? '' : user.userID,
			ugc_seed: `${swiftNow()}`
		}
		return await go_axios_post({
			endpoint: POST_ENDPOINTS.before_auth_on_mobile,
			post_params: make_post_params(post_params),
			then: (res) => {
				then(res)
			}
		})	

	}

}


export default UserModelCache;
