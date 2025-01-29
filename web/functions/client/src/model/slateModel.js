/**
 * 
 * 
 * @Module: slate model
 * @Author: Xiao Ling
 * @Date  : 6/20/2021
 * 
*/


const { 
	swiftNow,
	trivialString, 	
	trivialProps,
	trivialNum,
	illValued,
} = require('./utils');

const {
	get_project,
	get_trailer,
	accept_invite_link,
	read_invite_link,
	edit_storyboard_donation,
} = require('./api_storyboard');

const {
	getEthPrice
} = require('./api_opensea');

const {
	Networks,
	ETH_NETWORK,
	POST_ENDPOINTS,
	make_post_params,
	go_axios_post,
	urlToFileExtension,
	TokenContentKind,
	to_social_links,
} = require('./core');




/**
 * 
 * @Use:  model for all story boards at `eth_address`
 * 
 **/ 
export default class SlateModel {

	constructor(eth_address, user_cache){

		// storyboard id
		this.eth_address = eth_address ?? "";

		this.root  = {};
		this.slots = [];
		this.didSync = false;
		this.user_cache = user_cache;
	}

	/**
	 * 
	 * @Use: trivial token instance
	 * 
	 **/
	static mzero(){
		let em = new SlateModel("", null, null);
		return em;
	}

	/**
	 * 
	 * @use: check lt === rt
	 * 
	 **/ 
	static eq(lt, rt){
		if ( trivialProps(lt, 'data') || trivialProps(rt,'data') ){
			return false;
		} else {
			return lt.eth_address === rt.eth_address;
		}
	}

	/******************************************************
		@delegate fn
	******************************************************/

	// @use: alert delegate of update
	bubble_update = () => {
		if ( !trivialProps(this.delegate, 'did_update_slate')){
			this.delegate.did_update_slate()
		}				
	}

	/******************************************************
		@Load from db
	******************************************************/

	/**
	 * 
	 * 
	 * @Use: sync token with lumo/core db
	 *       for download all images because some are huge
	 *       fetch all multimedia content if any
	 *       bubble event to delegate to alert delegate that
	 *       syncing has completed.
	 * 
	**/ 
	async sync({ reload, fast, then }){
		if ( this.didSync && !reload ){
			return then();
		}
		await go_axios_post({
			post_params: make_post_params({ slate_id: this.eth_address }),
			endpoint: POST_ENDPOINTS.get_slate,
			then: async ({ slate, slots }) => {
				this.root = slate ?? {}
				this.slots = slots ?? [];
				this.didSync = true;
				then();
			}
		})			
	}

	/**
	 * 
	 * @Use: read item at slot `(x,y)`
	 * 
	 **/
	read_slot({ x, y }){
		if ( trivialNum(x) || trivialNum(y) ){
			return {}
		}
		let slot = this.slots.filter(s => {
			return s.x_idx === x && s.y_idx === y
		})
		return slot.length > 0 ? slot[0] : {}
	}

	/**
	 *
	 * @use: get free slot 
	 * 
	 **/
	get_free_slot(){
		let slots = this.read_all_slots();
		let free_slots = slots.filter(m => {
			return trivialString(m.bookingUserID) && trivialString(m.projectID)
		})
		return free_slots.length > 0 ? free_slots[0] : {}
	}

	/**
	 * 
	 * @use: get all slots
	 * 
	 **/
	read_all_slots = () => {
		return Object.values(this.slots);
	}

	/***
	 * 
	 * 
	 **/
	read_slots_in_rows = () => {
		let num_rows = 10;
		let idxs = Array.from({length:num_rows}, (vi,i) => i)
		let slots = this.read_all_slots();
		let rows = idxs.map(ridx => {
			let _rslots = slots
				.filter(s => s.x_idx === ridx)
				.sort((s,t) => s.y_idx - t.y_idx)
			return _rslots;
		});
		return rows;
	}

	/******************************************************
		@update
	******************************************************/

	/**
	 * 
	 * @use: check if slot at (x,y) can be booked
	 * 
	 **/
	async can_fill_slot({ x, y, then }){
		await this.sync({  reload: true, fast: false, then: () => {
			let slot = this.read_slot({ x,y });
			if ( trivialProps(slot,'ID') ){
				return then(false);
			} else {
				return then(trivialString(slot.storyboardID) && trivialString(slot.bookingUserID))
			}
		}})
	}

}
























