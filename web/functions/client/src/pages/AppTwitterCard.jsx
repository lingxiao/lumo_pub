/**
 *
 *
 * @Package: AppTwitter Card
 * @Date   : 6/12/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";

import Stack from '@mui/material/Stack';
import Grid from "@material-ui/core/Grid";

import AppFooter from './../components/AppFooter';
import AppSnackbar from './../components/AppSnackbar';

import Tilt from './../components/Tilt'
import AppHeaderPage from './AppHeader';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import Box from '@mui/material/Box';

import { NonfungibleTokenCard } from './../components/NonFungibleTokenCard';
import { AppTextFieldDarkUnderline } from './../components/ChatTextInput'

import {
	trivialProps,
	trivialString,
	contractMetamaskAddress,
} from './../model/utils'

import { 
	GLOBAL_STAGING,
	erc_721_tok_opensea_url,
	home_page_url,
 }  from './../model/core';

import { 
	useNftvieWstyles,
}  from './AppStoryboard'

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import StoryboardModel from './../model/storyboardModel'

import { COLORS } from './../components/constants'
import { useStyles } from './../components/AppBodyTemplate';
import { ActionProgressWithProgress } from './../components/ButtonViews';

import { FooterInstruction } from './../dialogs/DialogUtils';
import DialogDonate from './../dialogs/DialogDonate';

import burn_img from './../assets/burn1.jpeg';

import DialogMintToken from './../dialogs/DialogMintToken';

import icon_twitter  from './../assets/icon_twitter.svg'
import { PlayBackIcon } from './../components/FullScreenCommandView'


/******************************************************
	@View exported
******************************************************/


function AppTwitterCard(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		location,
		nft_cache,
		userid,
		web3_job_cache,
		chain_id,
		did_change_chain,
	} = props;


	/******************************************************
	    @mount
	******************************************************/

	// get data
	const [ update, eupdate ] = useState(0)
	const [ storyboard, estoryboard ] = useState(StoryboardModel.mzero());
	const [ item, eitem ] = useState({})

	// view states
	const [ name, ename ]   = useState("");
	const [ about, eabout ] = useState("");
	const [ img, eimg   ]   = useState("");
	const [ anime_url, eanime_url ] = useState("");

	const [ address, eaddress ] = useState("")
	const [ host, ehost ] = useState('')

	const [ btn, ebtn ] = useState("");
	const [ btn_text, ebtn_text ] = useState("");
	const [ showProgress, eshowProgress ] = useState(false)

	// dialogs
	const [ showMintItemDialog, eshowMintItemDialog ] = useState(false);
	const [ showDonateDialog, eshowDonateDialog ] = useState(false);


	/// load data
	useEffect(async () => {

		const { pathname, search } = location;
        let url    = pathname.replace('/','')
        const bits = url.split('/')

        if ( bits.length !== 3 ){
        	return;
        }

        let [ _, _address, tok_id ] = bits;

       	eaddress(contractMetamaskAddress({ pk: _address, n: 7, m: 5 }) );

       	// set basic read info
        await nft_cache.getStoryBoard({ address: _address, then: async (storyboard) => {                	

        	let item = storyboard.get_item(tok_id);

        	estoryboard(storyboard);
        	eitem(item)

        	let img  = trivialProps(item,'image_url')
        		? storyboard.get_hero_image()
        		: item.image_url	

        	let animation_url = item.animation_url ?? "";
        	eanime_url(animation_url)


        	let name = storyboard.get_name();
        	eimg(img);
        	ename(name);
        	eabout(item.text ?? "");
        	eupdate(Math.random())

        	await set_mint_state(item);

        	// tweet the page
        	// if ( search === '?tweet=true' && !trivialProps(storyboard,'eth_address') ){
        		// onTweet(item)
        	// }

	    }});

	},[]);

	// on chain update, change btn state
	useEffect(async () => {
		await set_mint_state(item);
		if ( !trivialString(chain_id)  ){
			tellUser(`You are now on chain ${chain_id}`);
			setTimeout(() => {
				tellUser("")
			},3000);		
		}
	},[chain_id, did_change_chain])

    // set mint-state
    async function set_mint_state(item){
        await web3_job_cache.lookup_mint_state({
        	item: item,
        	then_failed_to_lookup: (str) => {
        		tellUser(str)
        	},
			then_dne: () => {
				ebtn("")
			},
			then_imported: ({ migrated_contract_address, migrated_token_id  }) => {
				eaddress( contractMetamaskAddress({ pk: migrated_contract_address, n: 7, m: 5 }) );
				ebtn('buy on opensea')
			}, 
			then_contract_not_deployed: () => {
				ebtn('donate')
			}, 
			then_minted: ({ contract_address, tok_id }) => {					
				ebtn("see on opensea")
			},
			then_can_mint: () => {
				ebtn("mint")
			},
        });
    }

    function onTweet(data){
		let root = storyboard.get_first_root();
        let tweet_message = `${(data.text ?? "") ?? (root['about'] ?? "")}\n\n`
        let url  = `${home_page_url()}/house/${storyboard.eth_address}`;
        let link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet_message)}&url=${encodeURIComponent(url)}`;        
        let win  = window.open(link, '_blank');
        win.focus();        		
    }


	//@Use: mint | donate | go to opensea
	async function onPatronize(){
        await web3_job_cache.lookup_mint_state({
        	item: item,
        	then_failed_to_lookup: (str) => {
        		tellUser(str)
        	},        	
			then_dne: () => {
	            return tellUser(`Oh no! We can't locate this item`)
			},
			then_imported: ({ migrated_contract_address, migrated_token_id  }) => {
	            let url = `https://opensea.io/assets/ethereum/${migrated_contract_address}/${migrated_token_id}`
	            let win = window.open(url, '_blank');
	            win.focus();
			}, 
			then_contract_not_deployed: () => {
				if ( GLOBAL_STAGING ){
					eshowDonateDialog(true);
				} else {
					tellUser("coming soon!")
				}
			}, 
			then_minted: ({ contract_address, tok_id }) => {					
				// eshowDonateDialog(true);
                const { url } = erc_721_tok_opensea_url(contract_address, tok_id)
                let win = window.open(url, '_blank');
                win.focus();
			},
			then_can_mint: () => {
				eshowMintItemDialog(true);
			}
		});
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
	            <title>{name}</title>
	        </Helmet>
			<AppHeaderPage 
				{...props} 
				showLeft
				delay_bg = {30}
				in_full_screen_mode = {false}
				header_gradient = {{background: COLORS.offBlack}}
				name={name ?? ""}
				tellUser={tellUser}
			/>
            <AppSnackbar
                showSnack    = {snack_content.show}
                snackMessage = {snack_content.str}
                vertical={"bottom"}
                horizontal={"right"}
            />    			
			<div className={ classes.bodyContainer }>
				<div className={tclasses.scroll_container}>
					<TwitterCardHero 
						{...props}
						update   = {update}
						img_url  = {img}
						anime_url = {anime_url}
						name     = {name}
						text     = {about}
						address  = {address}
						host     = {host}
						onAccept = {onPatronize}
						btn      = { btn }
						btn_text = { btn_text }
						showProgress={showProgress}
						style={{marginTop:'36px'}}
						storyboard = {storyboard}
						onTweet    = {() => { onTweet(item) }}
					/>							
				</div>
				<AppFooter {...props} show_progress={showProgress}/>
			</div>
            <DialogMintToken
                {...props}
                address       = {storyboard.eth_address}
                storyboard    = {storyboard}
                mint_item     = {item}
                open          = {showMintItemDialog}
                did_mint      = {() => {
                	eupdate(Math.random())
                }}
                handleClose   = {async (reload) => { 
                	eshowMintItemDialog(false);
                	await set_mint_state(item);
                }}
            />                                              			
            <DialogDonate
                {...props}
                storyboard    = {storyboard}
                mint_item     = {item}
                open          = {showDonateDialog}
                tellUser      = {tellUser}
                did_donate    = {() => {
                	eupdate(Math.random())
                }}
                handleClose   = {async (reload) => { 
                	eshowDonateDialog(false);
                }}            
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

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();
	const { 

		onAccept,
		onTweet,

		storyboard,
		img_url,
		anime_url,
		name,
		update,
		address,
		host,
		text,
		btn,
		btn_text,
		showProgress,
		style,
	} = props;


	function onClickFooterRight(){
		return;
	}


	function onMore(){
		if ( !trivialString(storyboard.eth_address) ){
            props.navigate(`/house/${storyboard.eth_address}`);			
		}
	}


	const margin_top_bot_2em =  {marginTop:'32px', marginBottom: '32px'}

	const inputPropsBig = {
	    fontSize: `20px`,
	    lineHeight: 1.5,
	    fontFamily: 'NeueMachina-Black',    
	    color: COLORS.offBlack,
	    height:'fit-content',	    
	}	
	const inputPropsSmall = {
	    fontSize: `13px`,
	    fontFamily: 'NeueMachina-Bold',
	    color: COLORS.text
	}	

	const inviteContainer = {
		border: `0.5px solid ${COLORS.surface2}`, 
		marginTop: isOnMobile ? '-68px' : '0px'        
	}

	const body_right_style = {
		backgroundImage: `url(${burn_img})`,	
		padding: '36px',
		height: '50vh',
		marginTop:'-2px',
        overflow  : 'hidden',
        overflowY : "scroll",		
	}


	// one line in invite note
	function Line(props){
		const { value, style } = props;
		return (
	        <AppTextFieldDarkUnderline
	        	{...props}
	            standard
	            disabled
	            hiddenLabel
	            multiline
	            value = {value ?? ""}
	            onChange={(e) => {return}}
	            inputProps={{style: {...inputPropsBig, ...(style ?? {})}}}
	            style={{height:'fit-content'}}
	        />	
        )
	}

	function InviteText(){
		return (
			<div style={inviteContainer}>
	        	<Stack direction='column' className={tclasses.hero_right} style={body_right_style}>
	        		<br/>
                    <Line value = {`about this item`.toUpperCase()} style={inputPropsSmall} />
                    <br/><br/>
                    <div style={inputPropsBig}>
                    	{text ?? ""}
                    </div>
                    <Line value = {``}/>
                    <Line value = {``}/>
                </Stack>
                <FooterInstruction 
                    {...props}
                    footer_top={name ?? ""}
                    footer_left={address ?? ""}
                    footer_right={`0xparc.xyz`}
                    footer_bot = {''}
                    footer_top_style={{fontSize:'15px', font: 'NeueMachina-Black'}}
                />
            </div>			
		)
	}

	function ImageBlock(){

		return (
			<div>
	            <Tilt>
			        <NonfungibleTokenCard
			        	style={{
			        		margin:'8px',
			        		marginTop:'16px',
			        		marginBottom: '16px',
			        	}}
			        	full_image   
			        	data         = {{}}
			        	image_height = {'50vh'}
						footer_left  = {name ?? ""}
						footer_right = {address ?? ""}
						image_url    = {img_url}
						preview_url  = {img_url}
						anime_url    = {anime_url}
						onClickFooterRight = {onClickFooterRight}
						on_click_image = {onMore}
					/>
				</Tilt>

			    <Stack direction='row' style={{ ...(isOnMobile ? margin_top_bot_2em : {}) }}>
			    	{ true ? <div/> :
			    	<div style={{ marginTop: '-2px'}}>
						<PlayBackIcon onClick={onTweet} src={icon_twitter} tip={'tweet story'}/>
					</div>
					}
	                <Box sx={{ flexGrow: 1 }} />
				    {	trivialString(btn) && trivialString(btn_text)
				    	?
				    	<div/>
				    	:
	                    <ActionProgressWithProgress
	                        showProgress={showProgress}
	                        onClick = {onAccept}
	                        label={btn ?? ""}
	                        sx={{width: '100%'}}
	                        subtext={btn_text}
	                    />
	                }
	            </Stack>
			</div>
		)		
	}

	return (
		<Grid container columns={{xs:1,s:1,md:2,lg:2}} className={tclasses.hero_container} style={ style ?? {}}>
			<Grid item xs={12} sm={12} md={1} lg={1}/>
			<Grid item xs={12} sm={12} md={5} lg={5}>
				{ isOnMobile ? <ImageBlock/> : <InviteText/> }
			</Grid>
			<Grid item xs={12} sm={12} md={5} lg={5} style={{padding: '24px'}}>
				{ isOnMobile ? <InviteText/> : <ImageBlock/> }
			</Grid>			
			<Grid item xs={12} sm={12} md={1} lg={1}/>			
		</Grid>
	)

}



export default withRouter(withAuth(AppTwitterCard));

