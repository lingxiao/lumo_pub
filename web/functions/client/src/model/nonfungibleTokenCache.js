/** 
 * 
 * 
 * @Module: nonfungible token cache
 * @Author: Xiao Ling
 * @Date  : 12/16/2021
 * 
 * 
*/


import { doc, getDoc } from "firebase/firestore";

import {
	get_all_projects,
	get_top_project,
} from './api_storyboard'

import {
	get_all_nft_owned_by_user
} from './api_opensea';

import SlateModel from './slateModel';
import StoryboardModel from './storyboardModel'

const { 
	cap,
	trivialString, 	
	trivialProps,
} = require('./utils');

const {
    queryMetaMask,
} = require('./api_web3');

const {
	get_project
} = require('./api_storyboard');

const { 
	  POST_ENDPOINTS
	, make_post_params
	, go_axios_post
} = require('./core')



const { fire_db } = require('./core');



class NonFungibleTokenCache {


	constructor(user_cache){

		this.delegate     = null;
		this.user_cache = user_cache;
	
		// token datasource		
		this.dataSource = {};

		// storybaord data source
		this.storyboards     = {};
		this.top_storyboard  = {};
		this.storyboard_stack = [];
		this.admin_user_nfts = [];

		//slates
		this.slates = {};

		// client side view states
		this.showChat   = ""
		this.showStoryboard = ""
		this.active_player = null;
		this.onboarding_message = {};

		// twitter card states
		this.tweetImmedately = ""
	}

	/**
	 * 
	 * @Use: sync w/ app's latest data
	 * 
	 */ 
	async sync(){
		await this.get_top_story({ then: (res) => { return } });
		await this.get_other_stories({ force: true, then: (stories) => cap});
		//await this.sync_slates({ force: true, then: (slates) => cap });
	}

	/**
	 * 
	 * @use: sync user's opensea nfts	
	 * let pk = '0xe70e823e77d87ee06f573587555fccb6c337e9f5'
	 * let pk = '0x8eba23488d63089b6d5037e370678220ebb30d73'
	 * 
	 **/ 
	async syncUserOpenseaNfts(){
		let admin_user = await this.user_cache.getAdminUser();
		let public_key = trivialProps(admin_user,'metamask_pk') ? "" : admin_user.metamask_pk;
        await queryMetaMask({ then: async({ success, message, pk }) => {
			let my_public_key = pk || public_key;
			await get_all_nft_owned_by_user({ pk: my_public_key, then: ({ success, data }) => {
				this.admin_user_nfts = data;
			}})
        }})
	}	

	/**
	 *
	 * @use: sync slate model 
	 * 
	 **/
	async sync_slates({ force, then }){
		await go_axios_post({
			post_params: make_post_params({}),
			endpoint: POST_ENDPOINTS.get_slates,
			then: async ({ data }) => {
				const load_all = await (data ?? []).map(async ({ eth_address }) => {
					let mslate = new SlateModel(eth_address,this.user_cache)
					await mslate.sync({ reload: true, fast: false, then: cap })
					this.slates[eth_address] = mslate;
				})
				await Promise.all(load_all);
				then();
			}
		})			

	}

    /******************************************************
        @Read db
    ******************************************************/ 	


	/**
	 * 
	 * @Use: read existing tok from dataSource
	 * 
	 */ 
	read({ tokID }){
		if (trivialString(tokID)){
			return null;
		} else {
			return this.dataSource[tokID]
		}
	}


	/**
	 * 
	 * @use: get token `tokID` from store;
	 *       if not in store, get from db
	 *       if `_terminal`, do not get neighbors
	 * 
	 */ 
	async get({ tokID, peek, then }){
		return then({});
	}


    /******************************************************
        @slate
    ******************************************************/ 	

    get_top_slate = () => {
    	let slates = Object.values(this.slates);
    	return slates.length > 0 
    		? slates[0] 
    		: SlateModel.mzero()
    }


    /******************************************************
        @read storyboard
    ******************************************************/ 	

    /**
     * 
     * @use: get story board at `tredID`
     * 
     **/
    async getStoryBoard({ address, fast, then }){

    	if ( trivialString(address) ){
    		return then({})
    	}

		let board = this.storyboards[address]

		if (!trivialProps(board,'eth_addresss')){

			return then(board);

		} else {

			// create new storyboard at treeID, and sync to database
			// then return storyboard
			let board = new StoryboardModel(address, this, this.user_cache);
			this.storyboards[address] = board;

			await board.sync({ fast: fast, then: async (t) => { 
				then(board)
			}})
		}
    }

	/**
	 * 
	 * @use: get story by subdomain, used when user lands on 
	 *       `subdomainname.0xPARC.xyz`
	 * 
	 **/
    async get_story_by_subdomain({ subdomain, then }){

    	if (  trivialString(subdomain) ){
    		return then("")
    	}

    	await get_project({
    		address: "",
    		subdomain: subdomain, 
    		fast: true,
    		then: ({ success, message, root }) => {
    			if ( !success || trivialProps(root,'eth_address') ){
    				return then("")
    			} else {
    				return then(root.eth_address)
    			}
    		}
    	});
    }

    /**
     * 
     * @Use: get top story
     * 
     **/ 
    async get_top_story({ then }){
    	if ( !trivialProps(this.top_storyboard,'eth_address')  ){
    		return then(this.top_storyboard)
    	}
		await get_top_project({ then: async ({ root }) => {
			if ( trivialProps(root,'eth_address') ){
				return then({})
			} else {
				await this.getStoryBoard({ fast: true, address: root.eth_address, then: async (b) => {
					this.top_storyboard = b;
					this.storyboard_stack.push(root.eth_address);
					return then(b)
				}})
			}
		}});    	
    }	

    /**
     * 
     * @use: get other stories that's not top story
     * 
     * 
     **/ 
    async get_other_stories({ force, then }){

   		let top = this.top_storyboard;
   		let top_eth_address = trivialProps(top,'eth_address') ? '' : top.eth_address

    	if ( !force && Object.values(this.storyboards).length > 0 ){

    		let stories = Object.values(this.storyboards).filter(s => {
    			return s.eth_address !== top_eth_address
    		})

    		return then(stories)

    	} else {	

    		var stories = [];

	    	await get_all_projects({ then: async ({ data }) => {
	    		const get_all = await (data ?? []).map( async (datum) => {
	    			const { eth_address } = datum;
	    			return await this.getStoryBoard({ address: eth_address, then: (board) => {
	    				if ( board.eth_address !== top_eth_address ){
		    				stories.push(board)
		    			}
	    			}});
	    		})	    		
	    		await Promise.all(get_all);
	    	}});

    		return then(stories)
    	}

    }

    // @use: get all stories
    read_all_stories = () => {
    	let tail = Object.values(this.storyboards);
    	let tail_ids = tail.map(m => m.eth_address ?? "")
    	let top = this.top_storyboard;
    	if ( tail_ids.includes(top.eth_address) === false ){
    		tail.push(top)
    	}
    	tail.reverse()
    	return tail;
    }

    // @Use: get (storyboard, board, item) from itemID
    get_storyboard_from_itemID = ({ itemID }) => {
    	let projs = Object
    		.values(this.storyboards)
    		.filter(p => {
    			let item = p.get_item(itemID);
    			return !trivialProps(item,'ID');
    		})
    	let items = projs.map(p => {return p.get_item(itemID)});
    	if ( projs.length === 0 || items.length === 0 || trivialProps(items[0], 'storyboardID') ){
    		return { project: {}, board: {}, item: {} };
    	} else {
	    	let storyboardID = items[0]['storyboardID'];
	    	let board = projs[0].get_board({ at: storyboardID });
	    	return { project: projs[0], board: board, item: items[0] }
	    }
    }


    /******************************************************
        @Utils
    ******************************************************/ 	    

    /**
     * 
     * @use: read onboarding messsage
     * 
     **/ 
    async getCollabMessage(){

		const str = ".."

		if (!trivialProps(this.onboarding_message, 'collab')){
			return this.onboarding_message['collab'] ?? str;
		}

    	const docRef = doc(fire_db, 'onboard_message', 'collab');
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			let data = docSnap.data();
			this.onboarding_message['collab'] = data['str'] ?? str;
			return data['str'] ?? str;
		} else {
			return str;
		}
    }

    /**
     * 
     * @use: get help message
     * 
     **/ 
    async getHelpMessage(){

    	let key = 'help';
    	let str = "";

		if (!trivialProps(this.onboarding_message, key)){
			return this.onboarding_message[key] ?? str;
		}

    	const docRef = doc(fire_db, 'onboard_message', key);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			let data = docSnap.data();
			this.onboarding_message[key] = data['str'] ?? str;
			return data['str'] ?? str;
		} else {
			return str;
		}    	
    }


    setShowChat(id){
    	this.showChat = id ?? "";
    }

}


export default NonFungibleTokenCache;
























