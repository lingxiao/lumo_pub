/**
 *
 *
 * @Package: AppStoryboardSlate
 * @Date   : June 2nd, 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";

import Grid from "@material-ui/core/Grid";

import { 
	BootstrapTooltip,
} from './../components/UtilViews';

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import DragToSave    from './../components/DragToSave';


import { 
	NonfungibleTokenCard, 
	StoryBoardCard,
	ExplainCard,
} from './../components/NonFungibleTokenCard';


import {
	split_time,
	useNftvieWstyles,
} from './AppStoryboardFragments';


import {
	CollectionKind,
} from './../model/core'

import {
	trivialProps,
	trivialString,
	ppSwiftTime,
	contractMetamaskAddress,
} from './../model/utils';

import AppStoryboardRare from './AppStoryboardRare'
import AppStoryboardTickets from './AppStoryboardTickets';
import AppStoryboardLicense from './AppStoryboardLicense';
import AppStoryboardMembership from './AppStoryboardMembership';


/******************************************************
	@View exported
******************************************************/


/**
 *
 *
 * @Use: one app storyboard pannel
 *
**/
export default function AppStoryboardSlate(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 

		// base data
		update,
		storyboard,
		userid,
		board_id,
		chain_id,
		did_change_chain,

		job_cache,

		style,
		eshowlinearprogress,
		onEditDonation,

		// snack
		tellUser,

	} = props;

	const [ board, eboard ] = useState({ kind: "" })
	const [ datasource, edatasource ] = useState([]);
	const [ accept_donation_btn, eaccept_donation_btn ] = useState("open donation")

	// load data on storybaord loaded
	useEffect(async () => {
		await load_data();
	},[board_id, userid, update, storyboard]);

	// load data on chain id changed
	// on chain update, change btn state
	useEffect(async () => {
		await load_data();
		if ( !trivialString(chain_id) ){
			tellUser(`You are now on chain ${chain_id}`);
			setTimeout(() => {
				tellUser("")
			},3000)
		}
	},[chain_id, did_change_chain])	

	// load storyboard data
	async function load_data(){

		if ( trivialProps(storyboard,'get_board_items') || trivialString(board_id) ){
			return;
		}

		// get board root
		let board = await storyboard.get_board({ at: board_id });
		eboard(board);

		// get nfts
		edatasource([]);
		let items = await storyboard.get_board_items({ storyboardID: board_id });
		let is_owner = await storyboard.is_owner();
		let prefix = [0]; // is_owner ? [0,1] : [0]
		let _datasource = prefix.concat(items);
		edatasource(_datasource);

	}

	// open accept donation modal
	async function onAcceptDonation(){
		onEditDonation(board_id);
	}

	// drag and drop
    async function handleFileDrop(inputs){

		if ( !trivialString(board_id) && board.kind === CollectionKind.simple ){

	        let _fs =  Object.values(inputs).filter(f => {
	            return !trivialString(f.type) && !trivialString(f.name)
	        })
	        if (_fs.length === 0){
	        	tellUser("oh no! we cannot save this file!")
	        } else {

		        await job_cache.post_storyboard_item({
		        	text: "",
		        	files: _fs,
		        	storyboardID: board_id,
		        	storyboard: storyboard,
		        	then_progress: (str) => {
		        		tellUser(str)
		        	},
		        	then_posting: (str) => {
		        		tellUser(str)
		        		eshowlinearprogress(true)
		        	}, 
		        	then: async({ success, message }) => {
		        		eshowlinearprogress(false);
		        		if (!success){
		        			tellUser(message)
		        		} else {
			        		tellUser('Done!');
			        		setTimeout(() => {
			        			tellUser('')
			        		},800)
				        	await load_data();
		        		}
		        	}
		        })
		    }
	    }
    }

    return (
    	<div>
    	{
    		board.kind === CollectionKind.rare
    		?
			<div className={tclasses.scroll_container_alt} style={{...(style ?? {}) }}>
	    		<AppStoryboardRare {...props} tellUser={tellUser}/>
    		</div>
    		:
    		board.kind === CollectionKind.tickets
    		?
			<div className={tclasses.scroll_container_alt} style={{...(style ?? {}) }}>
	    		<AppStoryboardTickets {...props} tellUser={tellUser} />
    		</div>
    		:
    		board.kind === CollectionKind.license
    		?
			<div className={tclasses.scroll_container_alt} style={{...(style ?? {}) }}>
	    		<AppStoryboardLicense {...props} tellUser={tellUser} />
    		</div>
			: 
			board.kind === CollectionKind.membership
			?
			<div className={tclasses.scroll_container_alt} style={{...(style ?? {}) }}>
				<AppStoryboardMembership {...props} tellUser={tellUser}/>
			</div>
    		:
	        <DragToSave handleDrop={handleFileDrop}>
				<div className={tclasses.scroll_container_alt} style={{...(style ?? {}) }}>
				    <BootstrapTooltip title="Drag and Drop a .png or .mp4 file anywhere in this area to contribute to the spool">
					<Grid container spacing={0} columns={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
						{datasource.map((data,index) => (
							<Grid item xs={12} sm={12} md={6} lg={4} className={tclasses.storyboard_item_container} key={index}>
							{ index === 0
								?	
								<StoryBoardProductionCard {...props} board_id={board_id} data={data}/>
								: index === 1 && data === 1
								?
								<ExplainCard
									title='donations'
									h1 = {'* Do you know someone that could be a great patron to this house?'}
									h2 = {`Invite them to dontate! When they contribute to the collection, proceeds of their donation will be deposited into your metamask address.`}
									header={'fundraising widget'}
									buttonLabel={accept_donation_btn}
									onClickButton={onAcceptDonation}
								/>
								:
								<StoryBoardCardBasic {...props} tellUser={tellUser} data={data}/>
							}
							</Grid>
						))}
					</Grid>      
					</BootstrapTooltip>			
				</div>
			</DragToSave>
    	}
    	</div>
    )

}

/******************************************************
	@View comopnent
******************************************************/


/**
 *
 * @Use: one storybaord card
 *
 **/
function StoryBoardCardBasic(props){

	const {
		data,
		storyboard,
		update,
		index,
		onClickEdit,
		user_cache,
		onNavToTweetCard,
		onClickUser,
		onClickCollaborater,
		web3_job_cache,
		tellUser,
	} = props;
	
	// view state
	const [ header_right, eheader_right ] = useState("")
	const [ t1_right , et1_right  ] = useState("")
	const [ t5_bottom, et5_bottom ] = useState("")
	const [ footer_right, efooter_right ] = useState("")
	const [ time, etime ] = useState("")
	
	const [ tok_id, etok_id ] = useState("**".toUpperCase())

	const [ image_url, eimage_url ] = useState("")
	const [ anime_url, eanime_url ] = useState("")
	const [ text, etext ] = useState("")

	const [ op, eop ] = useState({name:""})
	const [ collabs, setCollabs ] = useState([]);

	const [ mint_btn_label, emint_btn_label ] = useState("");
	const [ mint_btn_style, emint_btn_style ] = useState({})
	const [ mint_label_str, emint_label_str ] = useState("premint")


	useEffect(async () => {

		et1_right('>/credit')
		eheader_right('')

		if ( trivialProps(data,'ID') ){
			return;
		}

		const {
			itemID,
			text, 
			image_url, 
			animation_url, 
			timeStampCreated,
			migrated_token_id,
			migrated_contract_address,
		} = data;

		etext(text);
		eimage_url(image_url ?? "");
		eanime_url(animation_url ?? "");

		// set header values
		etime(ppSwiftTime({ timeStamp: timeStampCreated,  dateOnly: true }));

		// set header value right
		await storyboard.get_user_for({ data: data, then: (user) => {
			let pk = trivialProps(user,'metamask_pk') ? '' : user.metamask_pk;
			let pk_short = contractMetamaskAddress({ pk: pk, n: 7, m:5 })
			eheader_right( pk_short ?? user.name )
		}});

		// set nft original poster
		await user_cache.get({ userID: data.userID, then: (user) => {
			if ( !trivialProps(user,'userID') ){
				eop(user)
			}
		}})

		// get collabs
		await storyboard.fetch_contributors_at({ at: itemID, then: (data) => {
			setCollabs(data);
		}});		

		// set mint btn
        await web3_job_cache.lookup_mint_state({
        	item: data,
        	then_failed_to_lookup: (str) => {
        		// tellUser(str)
        	},        	
			then_dne: () => {
				return;
			},
			then_imported: ({ migrated_contract_address, migrated_token_id  }) => {

				emint_btn_label('buy');
				let maddr = contractMetamaskAddress({ pk: migrated_contract_address ?? "", n: 5, m:3 })
				etok_id(`${maddr}/${migrated_token_id}`)
				emint_btn_style({
				    border      : `0.5px solid green`,
				    textShadow  : `var(--green-glow)`,
				    // visibility: 'hidden',
				});
				emint_label_str("minted")	

			}, 
			then_contract_not_deployed: () => {
				emint_btn_label("");
				emint_label_str("premint")	
			}, 
			then_minted: ({ contract_address, tok_id }) => {
				emint_btn_label('minted');
				let addr = contractMetamaskAddress({ pk: contract_address ?? "", n: 5, m:3 })
				etok_id(`${addr}/${tok_id}`)
				emint_btn_style({
				    border      : `0.5px solid red`,
				    textShadow  : `var(--red-glow)`,						
				});
				emint_label_str("minted")
			},
			then_can_mint: () => {
				emint_btn_label('mint');
				etok_id("**");					
				emint_btn_style({
				    border      : `0.5px solid green`,
				    textShadow  : `var(--green-glow)`,						
				});
				emint_label_str("premint")					
			}
		});		


	}, [update,storyboard]);

	function on_tweet(){
		onNavToTweetCard(data)
	}

	return (
        <StoryBoardCard
        	{...props}
        	style={{
        		margin:'8px',
        		marginTop:'16px',
        		marginBottom: '16px',
        	}}
        	full_image
        	hide_twitter_btn = {false}
        	data         = {data}
        	text         = { text }
        	header_left  = {'Seeded by'}
        	header_right = {header_right}
			t1_left      = {'hide story'}
			t1_right     = {t1_right}
			t5_bottom    = {t5_bottom}
			onClickEdit  = {onClickEdit}			
			on_tweet     = {on_tweet}
			footer_left  = {'show story'}
			footer_right = {footer_right}
			image_url    = {image_url}
			anime_url    = {anime_url}
			table_title  = {'collaborators'}

			t2          = {mint_label_str}
			t3_left     = {'Seeded by:'}
			t3_right    = {op.name ?? ""}
			t4_top      = {'Seeded on'}
			t4_middle   = {split_time(time, 0)}
			t4_bottom   = {split_time(time,1)}
			t5_top      = {"token address"}
			t5_bottom   = {tok_id}

        	mint_btn_label = {mint_btn_label}
        	mint_btn_style = {mint_btn_style}
			
			onClickt3right = {() => { onClickUser(op) }}
			table_data_source = {collabs}
			onClickUser       = {onClickCollaborater}

		/>
	)
}


export { StoryBoardCardBasic }



/******************************************************
	@View comopnent production card
******************************************************/


/**
 *
 * @use: story board card A
 *
 **/
function StoryBoardProductionCard(props){

	const {
		top,
		update,
		storyboard,		
		onNavToStoryEtherscan,
		onNavToContributor,
		board_id,
	} = props;

	// view state
	const [ name, ename ] = useState("")
	const [ time, etime ] = useState("")
	const [ board_address, eboard_address ] = useState("")
	const [ collabs, setCollabs ] = useState([]);
	const [ contract_deployed, econtract_deployed ] = useState(false);

	useEffect(async () => {

		if ( trivialProps(storyboard, 'sync') ){
			return;
		}

		let hero = storyboard.get_first_root();
		let board = await storyboard.get_board({ at: board_id })
		let { name, timeStampCreated } = hero
		ename( trivialProps(board,'name') ? name : board.name );

		etime(ppSwiftTime({ timeStamp: trivialProps(board,'timeStampCreated') ? timeStampCreated : board.timeStampCreated,  dateOnly: true }));

		let _address = storyboard.get_any_contract_address() ?? storyboard.eth_address;
		eboard_address( contractMetamaskAddress({
			n : 7,
			m : 5,
			pk: _address
		}))

		await storyboard.fetch_contributors({ then: async (users) => {
			setCollabs(users)
		}});

		econtract_deployed( storyboard.contracts.length > 0 );

	}, [update,top]);

	function onClickNFTaddress(){
		onNavToStoryEtherscan();
	}	

	function onClickCollaborater(user){
		onNavToContributor(user)
	}

	return (
        <NonfungibleTokenCard
        	{...props}
        	show_partial
        	style={{
        		margin:'8px',
        		marginTop:'16px',
        		marginBottom: '16px',
        	}}
        	data         = {storyboard}
        	header_left  = {'header_left'}
        	header_right = {'header_right'}

			t1_left     = {'about this collection'}
			t1_right    = {''}
			t2          = {name}
			t3_left     = {'Contract:'}
			t3_right    = {contract_deployed ? `Deployed` : '!deployed'}
			t4_top      = {'Created on'}

			t4_middle   = {split_time(time, 0)}
			t4_bottom   = {split_time(time,1)}

			t5_top       = {"contract address"}
			t5_bottom    = {board_address}
			footer_left  = {'bounty size'.toUpperCase()}
			footer_right = {'footer_right'}
			image_url    = {''}
			table_title  = {'collaborators'}
			table_data_source = {collabs}
			
			onClickt5_bottom   = {onClickNFTaddress}
			onClickUser        = {onClickCollaborater}

		/>
	)
}






