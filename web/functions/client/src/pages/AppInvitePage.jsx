/**
 *
 *
 * @Package: AppInvitePage Card
 * @Date   : 6/10/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";

import Stack from '@mui/material/Stack';
import Grid from "@material-ui/core/Grid";
import Box from '@mui/material/Box';

import AppFooter from './../components/AppFooter';
import AppSnackbar from './../components/AppSnackbar';
import WithChangeOpacity from './../components/WithChangeOpacity';

import Tilt from './../components/Tilt'
import AppHeaderPage from './AppHeader';
import useCheckMobileScreen, {useCheckBrowser} from './../hoc/useCheckMobileScreen';

import { NonfungibleTokenCard } from './../components/NonFungibleTokenCard';
import { AppTextFieldDarkUnderline } from './../components/ChatTextInput'

import {
	trivialProps,
	trivialString,
	contractMetamaskAddress,
} from './../model/utils'

import {home_page_url} from './../model/core';


import { 
	useNftvieWstyles,
}  from './AppStoryboardFragments'

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import StoryboardModel from './../model/storyboardModel'

import { COLORS } from './../components/constants'
import { useStyles } from './../components/AppBodyTemplate';
import { ActionProgressWithProgress, DarkButton } from './../components/ButtonViews';
import { FooterInstruction } from './../dialogs/DialogUtils';

import burn_img from './../assets/burn1.jpeg';
import icon_twitter  from './../assets/icon_twitter.svg'
import { PlayBackIcon } from './../components/FullScreenCommandView'

import cube from './../assets/1-blur.jpeg'
import cubeS from './../assets/1-blur-small.jpeg'
import { GiphBackgroundView } from './../components/VideoBackground';
import { CenterHorizontalView } from './../components/UtilViews'


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
function AppInvitePage(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		location,
		nft_cache,
		user_cache,
		userid,
		navigate,
	} = props;


	// get data
	const [ storyboard, estoryboard ] = useState(StoryboardModel.mzero());
	const [ update, eupdate ] = useState(0)
	const [ header_tok, eheader_tok ] = useState('')
	const [ invite_tok, einvite_tok ] = useState({})

	// view states
	const [ name, ename ] = useState("");
	const [ img, eimg   ] = useState("");
	const [ address, eaddress ] = useState("");
	const [ host, ehost ] = useState('');
	const [ showProgress, eshowProgress ] = useState(false);

	/// load data
	useEffect(async () => {

		const { pathname, search } = location;
        let url    = pathname.replace('/','')
        const bits = url.split('/')
        eheader_tok(search)

        if ( bits.length < 2 || trivialString(bits[1]) || trivialString(search) ){
        	return;
        }

        await nft_cache.getStoryBoard({ address: bits[1], then: async (storyboard) => {        
        	estoryboard(storyboard);
        	let img = storyboard.get_hero_image();
        	let name = storyboard.get_name();
        	eimg(img);
        	ename(name);
        	eaddress(contractMetamaskAddress({ pk: storyboard.eth_address, n: 7, m: 5 }) );
        	eupdate(Math.random())

        	// read invite token
        	await storyboard.get_invite_link({ then: (link,name,tok) => {
        		ehost(name);
        		einvite_tok(tok);
        	}})
        }});

	},[]);

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
			let _tok = header_tok.replace('?=','');
			await storyboard.accept_invite({ invite_tok: _tok, then: async ({ success, message }) => {
				if ( !success ){
					eshowProgress(false);
					return tellUser(message)
				} else {
					tellUser("Accepted! Three more seconds")
					setTimeout(() => {
						eshowProgress(false);
				        navigate(`/house/${storyboard.eth_address}`);
					},3000)
				}
			}})
		}
	}

	// --------------------------------------------------------------------------
    // @render

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
	            <title>{name}</title>
	        </Helmet>
			<GiphBackgroundView no_delay pushLeft darken showVignette image_url={cube} preview_url={cubeS} />
			<AppHeaderPage 
				{...props} 
				showLeft
				delay_bg = {30}
				in_full_screen_mode = {false}
				header_gradient = {{background: 'transparent'}}
				name={''}
				tellUser={tellUser}
			/>
			<div className={ classes.bodyContainer } style={{background:'transparent'}} >
				<div className={tclasses.scroll_container}>
					<TwitterCardHero 
						{...props}
						update   = {update}
						img_url  = {img}
						name     = {name}
						address  = {address}
						host     = {host}
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


/**
 *
 * @use: hero component
 *
 **/
function TwitterCardHero(props){

	const { 
		onAccept,
		img_url,
		name,
		update,
		t0,
		t1,
		t2,		
		t3,
		t4,
		progress_text,
		address,
		host,
		btn_str,
		show_full_image,
		storyboard,
		showProgress,
		style,
		card_style,
		navigate,
		imageOnLeft,
		CustomInviteView,		
		hide_button,
		aux_btn_label,
		onClickAuxBtn,
	} = props;

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();
	const { isSafari } = useCheckBrowser();


	const [ name_1, ename_1 ] = useState(name);
	const [ name_2, ename_2 ] = useState('')

	useEffect(() => {

		if ( !trivialString(name) && name.length > 35 ){
			let ws = name.split(' ');
			let xs = ws.slice(0,3).join(' ');
			let ys = ws.slice(3,).join(' ')
			ename_1(xs)
			ename_2(ys)
		} else {
			ename_1(name);
		}

	},[name, update])


	function onClickFooterRight(){
		return;
	}

	function onMore(){
		if ( trivialString(storyboard.eth_address) ){
			return;
		} else {
            navigate(`/house/${storyboard.eth_address}`);			
		}
	}

	var body_right_style = {
		background: COLORS.red_3,
		padding: '36px',
		height: '50vh',
		marginTop:'-2px',
	}

	// if ( !isOnMobile ){
	body_right_style['backgroundImage'] = `url(${burn_img})`;
	// }

	const inputPropsBig = {
	    fontSize: `2.2vh`,
	    fontFamily: 'NeueMachina-Black',    
	    color: COLORS.black, 
	}	
	const inputPropsSmall = {
	    fontSize: `13px`,
	    fontFamily: 'NeueMachina-Bold',
	    color: isOnMobile ?  'white' : COLORS.text,
	}	

	// one line in invite note
	function Line(props){
		const { value, style } = props;
		return (
	        <AppTextFieldDarkUnderline
	        	{...props}
	            standard
	            disabled = {!isSafari}
	            hiddenLabel
	            value = {(value ?? "").toUpperCase()}
	            onChange={(e) => {return}}
	            inputProps={{style: {...inputPropsBig, ...(style ?? {})}}}
	        />	
        )
	}

	function InviteText(){

		if (typeof CustomInviteView === 'function'){

			return CustomInviteView()

		} else {

			return (
				<div style={{border:`0.5px solid ${COLORS.surface2}`, marginTop: isOnMobile ? '-68px' : '0px'}}>
		        	<Stack direction='column' className={tclasses.hero_right} style={body_right_style}>
		        		<br/>
	                    <Line value = {(t0 ?? `This is your invitation`).toUpperCase()} style={inputPropsSmall} />
	                    <br/><br/>
	                    <Line value = {t1 ?? `You have been invited`}/>
	                    <Line value = {t2 ?? `to join the house`}/>
	                    <Line value = {t3 ?? (name_1 ?? "")} style={{fontSize: trivialString(name_2) ? '2.7vw' : '2.4vw' }}/>
	                    {  trivialString(name_2)
	                    	? 
	                    	<div/>
	                    	:
		                    <Line value = {name_2 ?? ""} style={{fontSize: '2.4vw' }}/>
	                    }
	                    <Line value = {t4 ?? `as a team member`}/>
	                    <Line value = {``}/>
	                    <Line value = {``}/>
	                </Stack>
	                <FooterInstruction 
	                    {...props}
	                    footer_top={
	                    	trivialString(host) 
		                    	? 'A personal invite'.toUpperCase() 
		                    	: `a personal invite from ${host}`.toUpperCase()
	                    }
	                    footer_left={address ?? ""}
	                    footer_right={home_page_url()}
	                    footer_bot = {''}
	                    footer_top_style={{fontSize:'15px', font: 'NeueMachina-Black'}}
	                />
	            </div>			
			)
		}
	}

	function ImageBlock(){
		return (
			<InviteImageBlock
				hide_button={hide_button}
				show_full_image={show_full_image}
				name={name}
				address={address}
				img_url={img_url}
				onClickFooterRight={onClickFooterRight}
				onMore={onMore}
				showProgress={showProgress}
				onAccept={onAccept}
				btn_str={btn_str}
				card_style = {card_style}
				progress_text={progress_text}
				aux_btn_label={aux_btn_label}
				onClickAuxBtn={onClickAuxBtn}
			/>
		)
	}

	if ( isOnMobile ){

		return (
			<Stack direction='column'>	
				<div style={{height:'3vh'}}/>
				<InviteText/>
				<ImageBlock/>
			</Stack>
		)


	} else {
		return (
			<Grid container columns={{xs:1,s:1,md:2,lg:2}} className={tclasses.hero_container} style={ style ?? {}}>

				<Grid item xs={12} sm={12} md={1} lg={1}/>

				<Grid item xs={12} sm={12} md={5} lg={5}>
					{ imageOnLeft ? <ImageBlock/> : <InviteText/> }
				</Grid>

				<Grid 
					item xs={12} sm={12} md={5} lg={5} 
					style={{padding: '24px', paddingTop: imageOnLeft && !isOnMobile ? '0px' : '24px'}}
				>
					{ imageOnLeft ? <InviteText/> : <ImageBlock/> }
				</Grid>			


				<Grid item xs={12} sm={12} md={1} lg={1}/>			
			</Grid>
		)
	}

}



function InviteImageBlock({ 
	hide_button, 
	show_full_image, 
	name, 
	address, 
	img_url, 
	onClickFooterRight, 
	onMore, 
	showProgress, 
	onAccept, 
	btn_str, 
	progress_text,

	card_style,
	aux_btn_label,
	onClickAuxBtn,
}){

	const isOnMobile = useCheckMobileScreen(1000);
	const { isSafari } = useCheckBrowser();
	const margin_top_bot_2em =  {marginTop:'32px', marginBottom: '32px'}

	const aux_btn_style = {
		borderRadius:2, 
		marginTop:'-24px', 
		fontSize:'14px', 
		fontFamily: 'NeueMachina-Light', 
		width:'50%'
	};

	return (
		<div>
            <Tilt>
		        <NonfungibleTokenCard
		        	style={{
		        		margin:'8px',
		        		marginTop:'16px',
		        		marginBottom: '16px',
		        	}}
		        	card_style   = {card_style ?? {}}
		        	full_image   
		        	hide_footer  = {show_full_image}
		        	data         = {{}}
		        	image_height = {isSafari ? '40vh' : '50vh'}
					footer_left  = {name ?? ""}
					footer_right = {address ?? ""}
					image_url    = {img_url}
					preview_url  = {img_url}
					onClickFooterRight = {onClickFooterRight}
					on_click_image = {onMore}
				/>
			</Tilt>
			{ hide_button 
				? 
				<div/> 
				:
			    <Stack direction='column' style={ isOnMobile ? margin_top_bot_2em : {}}>
	                <ActionProgressWithProgress
	                    showProgress={showProgress}
	                    onClick = {onAccept}
	                    label={(btn_str ?? 'Next').toUpperCase()}
	                    sx={{width: '100%'}}
	                    subtext={``}
	                    progress_text={progress_text ?? ""}
	                />
	                {
	                	typeof onClickAuxBtn === 'function'
	                	?
	                	<CenterHorizontalView>
				            <WithChangeOpacity onClick={onClickAuxBtn}>
				            	<div
					            	style={{ 
					            		fontFamily:'NeueMachina-Light',
					            		color: COLORS.text3, 
					            		fontSize:'12px', 
					            		minWidth: '150px',
					            		minWidth:'fit-content',
					            		cursor:"pointer",
					            		...(aux_btn_style) ?? {}}
					            	}
					            >
					            	{( aux_btn_label ?? "")}
					            </div>
				            </WithChangeOpacity>
	                	</CenterHorizontalView>
			            :
			            <div/>
	                }
                    {  isSafari ? <Box sx={{flexGrow:1}}/>	: <div/> }                 
	            </Stack>
	        }
		</div>
	)		
}


export { TwitterCardHero, InviteImageBlock }
export default withRouter(withAuth(AppInvitePage));

