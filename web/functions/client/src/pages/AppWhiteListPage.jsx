/**
 *
 *
 * @Package: AppWhiteListPage
 * @Date   : 7/9/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";

import AppFooter from './../components/AppFooter';
import AppSnackbar from './../components/AppSnackbar';

import AppHeaderPage from './AppHeader';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import {
	trivialProps,
	trivialString,
	contractMetamaskAddress,
} from './../model/utils'

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import StoryboardModel from './../model/storyboardModel'

import { COLORS } from './../components/constants'
import { useStyles } from './../components/AppBodyTemplate';

import { TwitterCardHero } from './AppInvitePage'
import { useNftvieWstyles }  from './AppStoryboard'

import cube from './../assets/3-blur.jpeg'
import cubeS from './../assets/3-blur-small.jpeg'
import { GiphBackgroundView } from './../components/VideoBackground';

/******************************************************
	@View exported
******************************************************/

/**
 *
 *
 * @Use: app template view w/ progressive
 *       loading of different elemnents
 *
**/
function AppWhiteListPage(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		location,
		nft_cache,
		user_cache,
		navigate,	
	} = props;


	// get data
	const [ update, eupdate ] = useState(0)
	const [ storyboard, estoryboard ] = useState(StoryboardModel.mzero());
	const [ col_id, ecol_id ] = useState("");

	// view states
	const [ address, eaddress ] = useState("");
	const [ btn_str, ebtn_str ] = useState("whitelist me");
	const [ showProgress, eshowProgress ] = useState(false);

	// img states
	const [ name, ename ] = useState("")
	const [ img, eimg   ] = useState("");
	const [ proj_name, eproj_name ] = useState("");
	const [ host_name, ehost_name ] = useState("");

	/// load data
	useEffect(async () => {
		await load()
		setTimeout(async () => {
			await load()
		},2000)		
	},[]);

	async function load(){

		const { pathname, search } = location;
        let url    = pathname.replace('/','')
        const bits = url.split('/')
        if ( bits.length < 3 ){
        	return;
        }

        const [ _, eth_address, col_id ] = bits;
        ecol_id(col_id);

        await nft_cache.getStoryBoard({ address: eth_address, then: async (storyboard) => {        

        	estoryboard(storyboard);

        	let board = await storyboard.get_board({ at: col_id });
        	let items = await storyboard.get_board_items({ storyboardID: col_id });

        	let img = items.length > 0
        		? (items[0]['image_url'] ?? "")
        		: storyboard.get_hero_image();
        	eimg(img);
        	ename(board.name ?? storyboard.get_name())
        	eproj_name(storyboard.get_name());
        	eaddress(contractMetamaskAddress({ pk: storyboard.eth_address, n: 7, m: 5 }) );
        	eupdate(Math.random());
        }});

	}

	// accept
	async function onAccept(){
		let user = await user_cache.getAdminUser();
		if ( trivialProps(user,'userID') || trivialString(user.userID) ){
			tellUser("Please sign up first")
			setTimeout(() => {
				tellUser('')
			},3000)
		} else {
			eshowProgress(true);
			ebtn_str("adding you to the whitelist")        	
			await storyboard.whitelist_user({ storyboardID: col_id, then: ({ success, message }) => {
				tellUser(message)
				eshowProgress(false);
				ebtn_str("Done!");
				tellUser("Taking you to the house home")
				setTimeout(() => {
					navigate(`/house/${storyboard.eth_address}`)
				},2000)
			}})
		}
	}

	/***********************************************************/
    // render

	// snack
    const [ snack_content, setSnackContent] = useState({ show: false, str: "" });
    
    async function tellUser(snack_message){
    	if ( !trivialString(snack_message) ){
			setSnackContent({ show: true, str: snack_message ?? "" });
		} else {
			setSnackContent({ show: false, str: "" });
		}
	}


	return (
		<div>
	        <Helmet>
	            <title>{name}</title>
	        </Helmet>
			<GiphBackgroundView no_delay pushLeft darken showVignette image_url={cube} preview_url={cubeS}/>
			<AppHeaderPage 
				{...props} 
				showLeft
				delay_bg = {30}
				in_full_screen_mode = {false}
				header_gradient = {{background: 'transparent'}}
				name={proj_name}
				tellUser={tellUser}
			/>
			<div className={ classes.bodyContainer } style={{background:'transparent'}}>
				<div className={tclasses.scroll_container}>
					<TwitterCardHero 
						{...props}
						update   = {update}
						img_url  = {img}
						name     = {name}
						t1   = {`You have been invited`}
						t2   = {`To be whitelisted for`}
						t3   = {name}
						t4   = {`as a collector`}
						btn_str = {btn_str}
						progress_text={btn_str}
						name = {''}						
						address  = {address}
						host     = {host_name}
						onAccept ={onAccept}
						showProgress={showProgress}
						storyboard={storyboard}
						style={{marginTop:'36px'}}
						footer_style = {{ background: COLORS.offBlack }}						
					/>							
				</div>
				{ showProgress ? <AppFooter {...props} show_progress={showProgress}/> : <div/> }
			</div>
            <AppSnackbar
                showSnack    = {snack_content.show}
                snackMessage = {snack_content.str}
                vertical={"bottom"}
                horizontal={"right"}
            />    			
		</div>
	)   

}


/******************************************************
	@View: hero	
******************************************************/





export default withRouter(withAuth(AppWhiteListPage));

