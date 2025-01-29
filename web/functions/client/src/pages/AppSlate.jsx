
/**
 *
 *
 * @Package: AppSlate
 * @Date   : 6/19/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Stack from '@mui/material/Stack';
import {Helmet} from "react-helmet";
import { createStyles, makeStyles } from "@material-ui/core/styles";

import AppSnackbar from './../components/AppSnackbar';

import AppHeaderPage from './AppHeader';

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import AppImageView from './../components/AppImageView'
import { BootstrapTooltip } from './../components/UtilViews';

import {
	illValued,
	trivialProps,
	trivialString,
} from './../model/utils'

import {
	ProjectState,
	ProjectStates
} from './../model/core';


import StoryboardModel from './../model/storyboardModel'

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import { COLORS } from './../components/constants'
import { RemoteVideoBackgroundView } from './../components/VideoBackground';

import DialogSetting from './../dialogs/DialogSettings';


/******************************************************
	@Style
******************************************************/

const hide_header = true;
const slate_ht = hide_header ? '100vh' : '90vh'
const num_rows = 10;
const num_square_on_desktop = 10;
const num_square_on_mobile = 5;

const useSlateStyles = (isOnMobile) =>  makeStyles((theme) => createStyles({

	bodyContainer: {
		height: '100vh',
		background: 'transparent',

	},

    slateTable : {
    	height: '100vh',
    	width: '100vw',
		background: 'transparent', // COLORS.offBlack,
    },


    slateTableRow : {
    	height: `calc(${slate_ht}/${num_rows})`,
    	width: '100vw',
    },

    slateCell :{
    	height: '100%',
    	width: `calc(100vw/${ isOnMobile ? num_square_on_mobile : num_square_on_desktop })`,
    	display: 'in-line-block',
    	position: 'relative',
    },

    dummy : {
    	marginTop: '75%'
    },

    tvScreen: {
    	position:'absolute',
    	top: 0,
    	bottom: 0,
    	left: 0,
    	right: 0,
    	borderRadius: '10px',
    	border: `0.50px solid ${COLORS.offBlack}`,
    	cursor: 'pointer',
    },


}));




/******************************************************
	@View exported
******************************************************/


function AppSlate(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const classes = useSlateStyles(isOnMobile)();

	const { 
		userid,
		chain_id,
		did_change_chain,
		navigate,
		nft_cache,
		reauthenticate,
		_hoc_does_user_have_account,
		_hoc_sign_up_with_metamask,
	} = props;


	/******************************************************
	    @mount
	******************************************************/

	// states
	const [ datasource, edatasource ] = useState([]);
	const [ showVignette, eshowVignette ] = useState(true);
	const [ active_slot, eactive_slot   ] = useState({});
	const [ showNewStoryDialog, eshowNewStoryDialog ] = useState(false);

	/// load data
	useEffect(async () => {
		setTimeout(async () => {
			await mount_db(false);
		},1000);
	},[userid]);

	/**
	  @TODO:
		1. test server fn
		2. test client side read with one
		3. book existing items onto slate using POSTMAN
		4. check rervet spto works as intended
		5. populate data with slate, not with fake storybaord data
		6. onclick, book the i-jth item on slate
		7. check the booking is correct on reload. 
		8
		8. migrate all to unslate.xyz
		... test: can book slate
	*/
	async function mount_db(reload){
		if ( trivialProps(nft_cache,'get_top_slate') ){
			return;
		}
		let slate = nft_cache.get_top_slate();
		if ( trivialProps(slate,'sync') ){
			return;
		}
		await slate.sync({ reload: reload, fast: false, then: () => {
			let rows = slate.read_slots_in_rows();
			edatasource(rows ?? [])
			setTimeout(() => {
				eshowVignette(false)
			},100)
		}})
	}

	// on chain update, change btn state
	useEffect(async () => {
		if ( !trivialString(chain_id)  ){
			tellUser(`You are now on chain ${chain_id}`);
			setTimeout(() => {
				tellUser("")
			},3000);		
		}
	},[chain_id, did_change_chain]);

	// @use: on did sync storyboard, update slate
    async function did_succeed_in_posting({ address }){
        if ( !trivialString(address) ){
            navigate(`/house/${address}`)
			let slate = nft_cache.get_top_slate();
			await slate.sync({ reload: true, fast: false, then: () => {return}});
        }
    }

    // @use: on book slate, auth and then open new slate modal
    async function onBookSlate(slot){

    	console.log("SLOT: ", slot)

    	if ( !trivialString(userid) ){

    		eactive_slot(slot);
    		eshowNewStoryDialog(true);

    	} else {

    		tellUser("one second while we reauthenticate you")

    		await _hoc_does_user_have_account({ then: async({ user_exists, message, pk  }) => {	

    			if ( trivialString(pk) ){
    				return tellUser(message)
    			}

		        await _hoc_sign_up_with_metamask({ then: async ({ success, message }) => {
		        	if ( !success ){
		        		tellUser(message)
		        	} else {
		        		tellUser("Just a few seconds while we connect you")
		        		await reauthenticate();
		        		setTimeout(() => {
				    		eshowNewStoryDialog(true);
				    		tellUser("");
		        		},3000)
		        	}
		        }});

    		}})

    	}
    }

	/******************************************************
	    @render
	******************************************************/

	// snack
    const [ snack_content, setSnackContent] = useState({ show: false, str: "" });
    function tellUser(snack_message){
    	if ( !trivialString(snack_message) ){
			setSnackContent({ show: true, str: snack_message ?? "" });
		} else {
			setSnackContent({ show: false, str: "" })
		}
	}

	return (
		<div>
	        <Helmet>
	            <title>{"Slate"}</title>
	        </Helmet>
	        { hide_header 
	        	? 
	        	<div/> 
	        	:
				<AppHeaderPage 
					{...props} 
					showLeft
					delay_bg = {30}
					in_full_screen_mode = {false}
					header_gradient = {{background: COLORS.offBlack}}
					name={"// slate".toUpperCase()}
					tellUser={tellUser}
				/>
			}
            <AppSnackbar
                showSnack    = {snack_content.show}
                snackMessage = {snack_content.str}
                vertical={"bottom"}
                horizontal={"right"}
            />    			
			<div className={ classes.bodyContainer }>
				<RemoteVideoBackgroundView darken showVignette={showVignette}/>
				<Stack direction='column' className={classes.slateTable}>	
					{
						datasource.map((row,index) => (
							<Stack direction='row' className={classes.slateTableRow}>
								{
									row.map((slot,index) => (
										<div className={classes.slateCell} key={index}>
											<div className={classes.dummy}>
						                       	<SlateSlot {...props}
						                       		slot={slot}
						                       		tellUser={tellUser}
						                       		onBookSlate={onBookSlate}
						                       	/>
											</div>
										</div>
									))
								}
							</Stack>	
						))
					}
				</Stack>
	            <DialogSetting
	                {...props}
	                slot    = {active_slot}
	                address = {'header_address'}
	                open    = {showNewStoryDialog}
	                did_succeed_in_posting={did_succeed_in_posting}
	                handleClose={() => { eshowNewStoryDialog(false) }}
	            />
			</div>				
		</div>
	)   

}


/******************************************************
	@View: one tv screen
******************************************************/

// @use: display one tv scren and define responders
function SlateSlot({ slot, nft_cache, tellUser, navigate, onBookSlate }){

	const isOnMobile = useCheckMobileScreen(1000);
	const classes = useSlateStyles(isOnMobile)();	

	const [ img_url, eimg_url ] = useState("");
	const [ tip, etip ] = useState("")
	const [ isempty, e_isempty ] = useState(true)
	const [ storyboard, estoryboard ] = useState({})
	const [ is_reserved, eis_reserved ] = useState(false);


	useEffect(async () => {

		if ( trivialProps(slot,'ID') ){
			return;
		}

		const { state, creatorUserID, bookingUserID, projectID, x_idx, y_idx, } = slot;

		if ( trivialString(bookingUserID) && trivialString(projectID)  ){
			e_isempty(true)
			etip(`Click here to claim slot #${x_idx+1}#${y_idx+1}`)
		} else if ( state === ProjectState.preproduction && trivialString(projectID) ){
			etip("This slot has been reserved!")
			eis_reserved(true)
		} else {
			await nft_cache.getStoryBoard({ address: projectID, then: async (storyboard) => {
				let hero = storyboard.get_hero_image()
				eimg_url(hero);
				etip(`Go to ${storyboard.get_name() ?? "this film"}`)
				e_isempty(false)
				eis_reserved(true)
				estoryboard(storyboard)
			}});
		}
	},[slot])


	async function onClickImage(){
		if ( trivialProps(storyboard,'eth_address') ){
			onBookSlate(slot);
		} else if ( !trivialProps(storyboard, 'eth_address') ){
			let eth_address = storyboard.eth_address;
			navigate(`/house/${eth_address}`)
		} else if ( is_reserved ){
			tellUser("This spot has been booked!")
			setTimeout(() => {
				tellUser('')
			},2000)
		} else {
			return;
		}
	}	


	return (
        <BootstrapTooltip title={tip} style={{cursor: 'pointer'}}>
			<div className={classes.tvScreen} onClick={onClickImage}>
				{ isempty
					? 
					<div style={{background:'transparent'}}/> 
					:
	                <AppImageView 
	                    showStatic
	                    corner = {'10px'}
	                    width  = {'100%'}
	                    height = {'100%'}
	                    preview_url  = {img_url}
	                    imgSrc       = {img_url}
	                    imgStyle  = {{ cursor:'pointer', marginTop:'-2px', marginLeft:'-2px'}}
	                />                                                           
				}
			</div>
        </BootstrapTooltip>

	)

}


/******************************************************
	@View: componets
******************************************************/




export default withRouter(withAuth(AppSlate));

