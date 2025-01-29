/**
 *
 *
 * @Package: AppBurnPageComponents
 * @Date   : Aug 29th, 2022
 * @Author : Xiao Ling   
 *
 *
**/


import React, {useState, useEffect} from 'react'


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { DarkButton } from './../components/ButtonViews';
import AppImageView from './../components/AppImageView'
import WithChangeOpacity from './../components/WithChangeOpacity';
import { BootstrapTooltip } from './../components/UtilViews';
import { CenterVerticalView, CenterHorizontalView } from './../components/UtilViews'

import Tilt from './../components/Tilt'
import { ActionProgressWithProgress } from './../components/ButtonViews'
import { AboutAttributeSimple } from './../dialogs/DialogUtils';

import { COLORS, getCube, getRandomInt }  from './../components/constants';
import {CubeTableWithImage} from './../components/CubeTable';

import useCheckMobileScreen, {
	useHeight,
	useWidth,
} from './../hoc/useCheckMobileScreen';

import useCountdown from './../hoc/useCountdown'

import {
	urlToFileExtension,
	ETHERSCAN_TX_LINK,
	ETHERSCAN_ADDRESS_LINK,
} from './../model/core'

import {
	roundTo,
	swiftNow,
	trivialProps,
	trivialString,
	contractMetamaskAddress, 
} from './../model/utils';


import icon_twitter  from './../assets/icon_twitter1.png'
import icon_link     from './../assets/icon_link_2.png'
import icon_ig       from './../assets/icon_ig.png'
import icon_discord  from './../assets/icon_discord.png'
import icon_play     from './../assets/icon_play.svg'


const flame    = require("./../assets/FLAME.png");
const MATCHBOX = require('./../assets/MATCHBOX.png');
const lumologo = require("./../assets/lumologo.png");
const acid     = require("./../assets/acid1.png");
const acid4    = require("./../assets/acid4.png");
const acid5    = require("./../assets/acid5.png");
const mobilemock = require("./../assets/mobilemock.jpg");


/******************************************************
	@constants
******************************************************/

const RED_FILTER = 'invert(15%) sepia(99%) saturate(6825%) hue-rotate(359deg) brightness(97%) contrast(111%)'

export const AppBurnPageKind = {
	header     : 'header',
	countdown  : 'countdown',
	video_block: 'video_block',
	banner3x   : 'banner3x',
	acid_grid  : 'acid_grid'
}


/******************************************************
    @style
******************************************************/

// style params
const ItemSize = 50.0;
const num_acid_rows = 5;
export { ItemSize }

const body_font = {
    color     : COLORS.black,
    fontFamily: 'NeueMachina-Bold',
    fontSize  : '18px',
    textAlign : 'left',        
    marginLeft: '20px',
    lineHeight: 1.5,	
}

export const useBurnStyles = (mobile) => makeStyles((theme) => createStyles({

    scroll_container : {
        height: `calc(100vh - 152px)`, 
        overflowY: 'scroll',   
        overflowX:  'hidden',
    },

    title : {
        color     : COLORS.black,
        fontFamily: 'NeueMachina-Black',
        fontSize  : mobile ? '48px' : '6vw',// '6vw', 
        textAlign : 'left',        
        marginLeft: '20px',
        //animation: 'text-flicker 3s linear',
        //animationDuration: '5.0s',        
        // textShadow  : `var(--red-glow)`,     
    },  

    manifesto_title : {
        color     : COLORS.surface1, // 'white',                
        fontFamily: 'NeueMachina-Black',
        fontSize  : '20vw',
    },  

    manifesto : {
        color     : COLORS.surface1, // 'white',                
        fontFamily: 'NeueMachina-Black',
        fontSize  : '15vw',
        textAlign : 'left',        
    },

    h2 : {
        color     : COLORS.black,
        fontFamily: 'NeueMachina-Black',
        fontSize  : '48px',
        textAlign : 'left',        
        marginLeft: '20px',
    },


    h3 : {
        fontFamily: 'NeueMachina-Black',
        fontSize  : '24px',
        textAlign : 'left',        
        marginLeft: '20px',
    },

    h4 : {
        fontFamily: 'NeueMachina-Bold',
        fontSize  : '22px',
        textAlign : 'left',        
        marginLeft: '20px',
    },

    body : body_font,

    tos: {
	    color     : COLORS.black,
	    fontFamily: 'NeueMachina-Regular', 
	    fontSize  : '14px',
	    textAlign : 'left',        
	    marginLeft: '20px',
	    lineHeight: 1.5,	
	},

    footer : {
        color     : COLORS.text3,
        fontFamily: 'NeueMachina-Medium',
        fontSize  : '13px',
        textAlign : 'left',        
        marginLeft: '20px',
        lineHeight: 1.3
    },


    time_int : {
        color     : COLORS.text, // 'white',                
        fontFamily: 'NeueMachina-Medium',
        fontSize  : '24px',
        textAlign : 'left',        
        marginLeft: '20px',
        // textDecoration: 'underline',
    },

    time_str : {
        color     : COLORS.surface1, // 'white',                
        fontFamily: 'NeueMachina-Medium',
        fontSize  : '24px',
        textAlign : 'left',        
        marginLeft: '10px',
        textDecoration: 'underline',
    },

    number_str : {
        color     : COLORS.text, 
        fontFamily: 'NeueMachina-Medium',
        fontSize  : '10vw',
        textAlign : 'left',        
        textDecoration: 'underline',
    },

    // signature table
    table_container : {
    	width: '100%',
        display   : 'grid',
        // overflow  : 'hidden',
        // overflowY : "hidden",        
        gridTemplateColumns: 'repeat(3, 1fr)',
        // gridTemplateRows: 'repeat(5, 1fr)',        
     },    

    // acid grid
    wall_container : {
    	background: COLORS.black,
    	width: '100%',
        display   : 'grid',
        overflow  : 'hidden',
        overflowY : "scroll",        
        gridTemplateColumns: 'repeat(20, 1fr)',
        gridTemplateRows: 'repeat(20, 1fr)',        
        justifyItems: 'center',
        alignItems: 'center',        
    	// height: `${ItemSize*num_acid_rows}px`,
     },

    acid_tab : {
        width: `${ItemSize}px`,
        height: `${ItemSize}px`,
        cursor: 'pointer',
        justifyContent: 'center',        
        alignItems: 'center',
    },

    acid_tab_container: {
        width  : ItemSize,
        height : ItemSize,
        display: 'flex',
        justifyContent: 'center',        
        alignItems: 'center',
        // border: `0.25px solid ${COLORS.surface3}`,
    },

    incomplete: {
        height: ItemSize*2/3,
        marginRight: (ItemSize - ItemSize*2/3)/2,
        marginBottom: (ItemSize - ItemSize*2/3)/2,
        opacity: 0.75,
    },

    incompleteTrue: {
        height: ItemSize/2,
        filter: 'brightness(0) invert(1)',
        position: 'absolute',
    },

    incompleteFalse: {
        height: ItemSize/2,
        filter: RED_FILTER,
        position: 'absolute'
    },    

    // footer
    burn_footer : {
    	background:  COLORS.black,
    	height: 'fit-content',
    	paddingTop : '24px',
    	paddingLeft: '24px',
    	paddingRight:'24px',
    	paddingBottom:'24px',
    },

    footer_left: {
    	height: '100%',
    	width: mobile ? "100%" : '33vw',
   	    overflowWrap: 'break-word'
    },

    footer_center: {
    	padding: '20px',
    	height: '100%',
    	width: mobile ? "0vw" : '33vw',
   	    overflowWrap: 'break-word',
    },

}));

/******************************************************
	@components
******************************************************/

export function UserProfileHeader({ user_cache, navigate, style, flush_left }){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ img, eimg ] = useState("");
	const [ show, eshow ] = useState(false);

	useEffect(async () => {
		await mount()
		setTimeout(async () => {
			await mount();
		},1000)
	},[])

	async function mount(){
		if ( trivialProps(user_cache,'getAdminUser') ){
			return;
		}
		let user = await user_cache.getAdminUser();
		if ( trivialProps(user,'userID') || trivialString(user.userID) ){
			eshow(false);
		} else {
			eshow(true);
			let url = user.profile_image_preview_url ?? ""
			if ( trivialString(url) || url === "" ){
				eimg(acid4);
			} else {
				eimg(url)
			}
		}		
	}

	async function onGoToProfile(){
		let user = await user_cache.getAdminUser();
		navigate(`/profile/${user.userID}`)
	}


    let container_style = {
		height      :'50px',
		paddingRight:'24px',
		...(style ?? {})
    }

    if (show){
		return (		
			<Stack direction='row' style={container_style}>			
	            { flush_left ? <div/> : <Box sx={{ flexGrow: 1 }} /> }
	            <div style={{cursor:'pointer'}} onClick={onGoToProfile}>
		            <AppImageView   
		                width={'30px'}
		                height={'30px'}
		                preview_url  = {img}
		                imgSrc       = {img}
		                type         = {urlToFileExtension(img)}
		                imgStyle ={{
		                	marginRight:'24px', 
		                	marginTop:'12px',
		                	borderRadius: `15px`,
		                	borderColor: COLORS.text,
		                }}
		            />    
	            </div>     	            
	            { !flush_left ? <div/> : <Box sx={{ flexGrow: 1 }} /> }
			</Stack>
		)
	} else {
		return <div/>
	}

}

/**
 * @use: header with 
**/
export function BurnHeader(props){

	const {
		text,
		use_flame,
		style,
		user_cache,
		navigate,
		force_on_mobile,
	} = props;

	const isOnMobile = useCheckMobileScreen(800) || force_on_mobile;
	const bstyle = useBurnStyles(isOnMobile)();


    let _name = typeof text === 'string' ? (text ?? "**") : "**"
    let _break = Math.round(Math.random()*10)
    let name_frag_1 = _name.slice(0,_break)
    let name_frag_2 = _name.slice(_break, _break+3)
    let name_frag_3 = _name.slice(_break+3, _name.length)
    var name_frag_mobile = _name.slice(0,20)
    if ( name_frag_mobile.length < text.length ){
        name_frag_mobile = `${name_frag_mobile}..`
    }	

    const [ span_name, set_span_name ] = useState('offset')
    useEffect(() => {
        setTimeout(() => {
            set_span_name('animate-done')
        },0); //400)
    },[]);

    let container_style = {
		// height      :'50px',
    	// paddingLeft :'25px',
		// paddingTop  :'70px', 
		// background: 'blue',
		paddingBottom: use_flame ? '0px' : '12px', 
		...(style ?? {})
    }

	return (
		<Stack direction='row' style={container_style}>
			{ use_flame && !isOnMobile
				?
	            <AppImageView   
	                width={'300px'}
	                imageDidLoad = {() => {}}
	                preview_url  = {flame}
	                imgSrc       = {flame}
	                type         = {urlToFileExtension(flame)}
	                imgStyle ={{marginTop:'-64px', marginLeft:'46px'}}
	            />         	            
	            : use_flame && isOnMobile
	            ?
	            <AppImageView   
		            height={'34px'}
		            width ={'34px'}
	                imageDidLoad = {() => {}}
	                preview_url  = {lumologo}
	                imgSrc       = {lumologo}
	                type         = {urlToFileExtension(lumologo)}
	                imgStyle ={{marginLeft:'6px', marginTop:'-2px', cursor:'pointer'}}
	            />  
	            :
	            <div/>
            }    
    		<div className={bstyle.title} 
    			style={{ 
    				marginLeft: isOnMobile ? "" : "58px",
    				...( isOnMobile ? {fontSize:'36px'} : {} )
    			}}>
	            {name_frag_1}<span id={span_name}>{name_frag_2}</span>{name_frag_3}
    		</div>  
            <Box sx={{ flexGrow: 1 }} />
            { use_flame || isOnMobile
            	?
            	<div/>
            	:
            	<div style={{marginTop:'-4px'}}>
		            <AppImageView   
			            height={'4vw'}
			            width ={'4vw'}
		                imageDidLoad = {() => {}}
		                preview_url  = {lumologo}
		                imgSrc       = {lumologo}
		                type         = {urlToFileExtension(lumologo)}
		                imgStyle ={{marginRight:'48px'}}
		            />    
	            </div>
	        }            
		</Stack>		
	)
}


/**
 * @use: count down timer
 **/
export function BurnTimer(props){

	const { 
		style,
		force_on_mobile,
		timeStampExpire,
	} = props;

	const isOnMobile = useCheckMobileScreen(800) || force_on_mobile
	const bstyle = useBurnStyles(isOnMobile)();


	const [days, hours, minutes, seconds] = useCountdown(timeStampExpire ?? swiftNow());

	const fontstyle = {
		fontSize: isOnMobile ? "36px" : '3.5vw',
	}

	function TimeBlock({ _int, _str }){
		return (
            <Stack direction="row" 
            	style={{ 
            		marginBottom: isOnMobile ? "12px" : "0px", 
            		marginRight: isOnMobile ? '56px' : '0px', 
            		marginLeft: isOnMobile ? "64px" : '0px',
            		borderBottom: isOnMobile ? `5px solid ${COLORS.surface1}` : '',
            	}}
            >
				<div className={bstyle.time_int} style={{
					...fontstyle, 
					width:'6vw', 
					textAlign:'right', 
					marginLeft: isOnMobile ? '-2px' : '0px',
				}}>
					{_int}
				</div>
				{ isOnMobile ? <Box sx={{ flexGrow: 1 }} /> : <div/> }
				<div className={bstyle.time_str} style={{
					...fontstyle, 
					...( isOnMobile ? {textDecoration:'none'} : {})					
				}}>
					{_str}
				</div>
			</Stack>			
		)
	}

	return (
		<Stack 
			direction={ isOnMobile ? 'column' :  'row' }
			style={{ ...(style ?? {}) }}
		>
            <Box sx={{ flexGrow: 1 }} />

            <TimeBlock _int={days} _str={'days'.toUpperCase()}/>
            <TimeBlock _int={hours} _str={'hours'.toUpperCase()}/>
            <TimeBlock _int={minutes} _str={'minutes'.toUpperCase()}/>
            <TimeBlock _int={seconds} _str={'seconds'.toUpperCase()}/>

            <Box sx={{ flexGrow: 1 }} />
		</Stack>
	)	
}


/**
 * @use: count down timer
 * 
 **/
export function Manifesto(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const { 
		style,
		image_url,
		name,
		subtitle,
		about,
		img_src,
		btn_str,
		btn_strb,
		showProgress,
		showCubeTable,
		onSignManifesto,
		onClickSubtext,
	} = props;

	const [ animateCubes, eanimateCubes ] = useState(false);
	const [ img, eimg ] = useState("");

	useEffect(() => {	
		setTimeout(() => {
			eanimateCubes(true)
		},1000)
	},[showCubeTable]);

	useEffect(() => {
		if ( !trivialString(img_src) ){
			eimg(img_src)
			eanimateCubes(false);
		}
	},[img_src])

	if ( isOnMobile ){
		return (
			<Stack 
				direction='column' 
				style={{ 
					marginTop: '24px', 
					marginBottom:'48px',
			}}>
				<CenterHorizontalView>
		            <Stack direction='column'>
			            <Box sx={{ flexGrow: 1 }} />
			            <Stack direction='column' style={{
			            	marginTop :'20px', 
			            	marginLeft:'2vw',
			            	marginRight:'2vw',
			            }}>
			                <div className={bstyle.h2}>
			                	{`** ${name ?? ""}`.toUpperCase()}
			                </div>
			                <div className={bstyle.body} style={{marginBottom:'12px'}}>
			                	{`** ${subtitle ?? ""}`}
			                </div>
			                <div className={bstyle.body} style={{whiteSpace: 'pre-wrap', width:'90vw'}}>
			                	{about ?? ""}
			                </div>
				            <br/>
							<CenterHorizontalView>
							{
								showCubeTable
								?
								<div style={{padding:'24px'}}>
									<CubeTableWithImage						
										imgSrc={img}
										preview_url={img}
										animateCubes={animateCubes}
										overlay_style={{background:COLORS.red_2}}
									/>
								</div>
								:
					            <AppImageView   
					                width = {'100vw'}
					                imageDidLoad = {() => {}}
					                preview_url  = {image_url}
					                imgSrc       = {image_url}
					                type         = {urlToFileExtension(image_url)}
					                imgStyle ={{}}
					            />    
					        }				            
							</CenterHorizontalView>
			                <Stack direction='column' style={{marginTop:'20px'}}>
				                <ActionProgressWithProgress                    
				                    showProgress={showProgress}
				                    onClick = {onSignManifesto}
				                    label={btn_str}
				                    progress_text={btn_str}
				                    subtext={btn_strb}
				                    onClickSubtext={onClickSubtext}
				                    sx = {{width: '120%', border: `0.5px solid ${COLORS.red_1}`, color: COLORS.surface1}}
				                />     
				            </Stack>
			            </Stack>
			        </Stack>				
				</CenterHorizontalView>
			</Stack>
		)
	} else {
		return (
			<Stack 
				direction='row' 
				style={{ 
					marginTop: '25px', 
					marginRight:'20px', 
			}}>
	            <Box sx={{ flexGrow: 1 }}/>
	            <Stack direction='column'>
		            <Stack direction='column' style={{
		            	marginTop : '24px' , 
		            	width     : '100vw', 
		            	margin    : '24px' ,
		            }}>
		                <div className={bstyle.h2}>
		                	{`** ${name ?? ""}`.toUpperCase()}
		                </div>
		                <div className={bstyle.body} style={{marginBottom:'12px'}}>
		                	{`** ${subtitle ?? ""}`}
		                </div>
			            <div className={bstyle.body} style={{whiteSpace: 'pre-wrap', width:'90vw'}}>
			            	{about ?? ""}
			            </div>
		                <Stack direction='column' style={{marginTop:'36px', marginLeft:'0px'}}>
			                <ActionProgressWithProgress                    
			                    showProgress={showProgress}
			                    onClick = {onSignManifesto}
			                    label={btn_str}
			                    progress_text={btn_str}
			                    subtext={btn_strb}
			                    onClickSubtext={onClickSubtext}
			                    sx = {{width: '120%', border: `0.5px solid ${COLORS.red_1}`, color: COLORS.surface1}}
			                />   
			            </Stack>		            			            
		            </Stack>
		        </Stack>		
		        {/*
		        <Stack direction={'column'}>
		        	{
		        		showCubeTable
		        		?
						<div style={{padding:'24px', marginTop:'25px'}}>
						<CubeTableWithImage						
							imgSrc={img}
							preview_url={img}
							animateCubes={animateCubes}
							overlay_style={{background:COLORS.red_2}}
						/>
						</div>
						:
			            <AppImageView   
			                height={'60vh'}
			                width = {'40vw'}
			                imageDidLoad = {() => {}}
			                preview_url  = {image_url}
			                imgSrc       = {image_url}
			                type         = {urlToFileExtension(image_url)}
			                imgStyle ={{marginTop:'25px'}}
			            />    
			        }
	                <Stack direction='column' style={{marginTop:'36px', marginLeft:'0px'}}>
		                <ActionProgressWithProgress                    
		                    showProgress={showProgress}
		                    onClick = {onSignManifesto}
		                    label={btn_str}
		                    progress_text={btn_str}
		                    subtext={btn_strb}
		                    onClickSubtext={onClickSubtext}
		                    sx = {{width: '120%', border: `0.5px solid ${COLORS.red_1}`, color: COLORS.surface1}}
		                />   
		            </Stack>		            
		        </Stack>
		        */}        	            
	            <Box sx={{ flexGrow: 1 }} />
	        </Stack>
        )
    }
}



/**
 * @use: count down timer
 * 
 **/
export function ManifestoAlt(props){

	const { 
		style,
		title, 
		faq,
		btn_str,
		onClickInitiate,
		state,
		hide_btn,
		force_on_mobile,
	} = props;

	const isOnMobile = useCheckMobileScreen(1000) || force_on_mobile;
	const bstyle = useBurnStyles(isOnMobile)();

	return (
		<Stack direction={isOnMobile ?'column' : 'row'} style={isOnMobile ? {} : {marginRight:'20px'}}>
			{ isOnMobile || force_on_mobile ? <div/> : <Box sx={{ flexGrow: 1 }} /> }
			{ 
				force_on_mobile || isOnMobile
				? <MatchImageMobile/> 
				: <MatchImageDesktop/> 
			}
            <Stack direction='column' style={{
            	...( isOnMobile ? {} : {width: '50vw'} ),
            	marginTop  : isOnMobile ? '20px': '10vh', 
            	marginLeft : isOnMobile ? '2vw' : '-10vw',
            	marginRight: isOnMobile ? '2vw' : '0px',
            }}>
            	{
            		hide_btn && !isOnMobile
            		? 
            		<div style={{height:'36px'}}/>
            		:
            		<div/>
            	}
                <div className={bstyle.h2}>
                	{title}
                </div>
                <div className={bstyle.body}>
                	{ typeof faq === 'function' ? faq() : faq }
                </div>
                { hide_btn 
                	? 
                	<div/> 
                	:
	                <ActionProgressWithProgress                    
	                    showProgress={false}
	                    onClick = {onClickInitiate}
	                    label={btn_str}
	                    progress_text={btn_str}
			            sx = {{width: '120%', marginTop: '24px', border: `0.5px solid ${COLORS.text}`, color: COLORS.surface1}}
	                />                   
                }      
	            <Box sx={{ flexGrow: 1 }} />
            </Stack>
			{ isOnMobile ? <div/> : <Box sx={{ flexGrow: 1 }} /> }
		</Stack>
	)	

	// view components
	function MatchImage({ style }){
		return (
	        <AppImageView   
	            imageDidLoad = {() => {}}
	            preview_url  = {MATCHBOX}
	            imgSrc       = {MATCHBOX}
	            type         = {urlToFileExtension(MATCHBOX)}
	            imgStyle ={{ ...(style ?? {}) }}
	        />    
		)
	}

	function MatchImageDesktop(){
		let ht = 700;
		let offset = ht/3/2
		return (
			<Stack direction='row' style={{ width: '50vw'}} >
	            <Box sx={{ flexGrow: 1 }} />
	            <MatchImage style={{height: `${ht}px`,marginLeft:`-${offset}px`}}/>   
	            <MatchImage style={{height: `${ht}px`,marginLeft:`-${offset*2}px`}}/>   
	            <Box sx={{ flexGrow: 1 }} />
            </Stack>			
		)
	}

	function MatchImageMobile(){
		return (
			<Stack direction='column' style={{ width: '100vw', height:'40vw'}}>
	            <Box sx={{ flexGrow: 1 }} />
	            <MatchImage style={{width:'100vw', transform: 'rotate(-45deg)', marginTop:'-15vw'}}/>
	            <Box sx={{ flexGrow: 1 }} />
            </Stack>				
		)
	}	

}


export function IconRow({ 
	style, 
	icon_sz, 
	chain,
	user_cache,
}){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ user, euser ] = useState({});

	useEffect(async () => {
		if ( trivialProps(chain,'root') || trivialProps(user_cache,'get') ){
			return;
		}		
		await user_cache.get({ userID: chain.root.userID, then: (_user) => {
			euser(_user);
		}})
	},[chain]);


	function on_icon_ig(){		
		if ( trivialString(chain.root.instagram) ){
			return;
		} else {
		    window.open(chain.root.instagram)
		}
	}
	
	function on_icon_link(){		
		if ( trivialString(chain.root.website) ){
			return;
		} else {
		    window.open(chain.root.website)
		}		
	}
	
	function on_icon_discord(){		
		if ( trivialString(chain.root.discord) ){
			return;
		} else {
		    window.open(chain.root.discord)
		}
	}
	
	function on_icon_play(){		
		if ( trivialString(chain.root.youtube) ){
			return;
		} else {
		    window.open(chain.root.youtube)
		}
	}
	
	function on_twitter(){		
		if (  !trivialString(chain.root.twitter) ){
		    window.open(chain.root.twitter);
		} else if ( !trivialString(user.twitterUserName) ){
		    window.open(`https://twitter.com/${user.twitterUserName}`)
		} else {
			return;
		}
	}	


	function Icon({ img, onClick }){
		return (
			<div style={{paddingRight:'18px', width: 'fit-content'}} onClick={onClick}>
            <AppImageView   
                width = { icon_sz ?? '24px' }
                height= { icon_sz ?? '24px' }
                imageDidLoad = {() => {}}
                preview_url  = {img}
                imgSrc       = {img}
                type         = {urlToFileExtension(img)}
                imgStyle ={{ cursor:'pointer', color: COLORS.offBlack, }}
            />  
            </div>
        )  	
	}

	if ( trivialProps(chain,'root') ){
		return <div/> 
	} else {
		return (
			<Stack direction='row' style={{ ...(style ?? {}) }}>
				{  trivialString(user.twitterUserName) ? <div/> : <Icon img={icon_twitter} onClick={on_twitter}/>}
				{  trivialString(chain.root.instagram) ? <div/> : <Icon img={icon_ig} onClick={on_icon_ig}/>}
				{  trivialString(chain.root.website)   ? <div/> : <Icon img={icon_link} onClick={on_icon_link}/>}
				{  trivialString(chain.root.discord)   ? <div/> : <Icon img={icon_discord} onClick={on_icon_discord}/>}
				{  trivialString(chain.root.youtube)   ? <div/> : <Icon img={icon_play} onClick={on_icon_play}/>}
			</Stack>
		)
	}
}

/**
 *
 * @use: burn detail
 *
*/
export function BurnDetail({
	str1,
	str2,
	str3,
	header,
}){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ item, eitem ] = useState(0);

	function pick(idx){
		eitem(idx);
	}

	const on_style = {
		marginLeft:'8vw',
		cursor: 'pointer',
	}

	const text_style1 = {
        paddingTop: '12px',
        fontSize  : '24px',
        color     : COLORS.red_1,
        fontFamily: 'NeueMachina-Bold',
        width     : '100vw',
        marginLeft: '12px',
        paddingBottom: '24px',
	}

	const text_style = {
        paddingTop: '48px',
        fontSize  : '36px',
        textAlign : 'left',        		
        color     : COLORS.text, 
        fontFamily: 'NeueMachina-Medium',
	}	

	function NumberBlock(){
		return (
			<Stack direction='row' style={{width:'100%'}}>
	            <Box sx={{ flexGrow: 1 }} />
		        <WithChangeOpacity onClick={() => {pick(0)}}>
					<div className={bstyle.number_str} style={{...on_style, color: item === 0 ? COLORS.surface1 : COLORS.text}}>
						{ `01${item===0 ? '*' : ''}`}
					</div>
				</WithChangeOpacity>
		        <WithChangeOpacity onClick={() => {pick(1)}}>
					<div className={bstyle.number_str} style={{...on_style, color: item === 1 ? COLORS.surface1 : COLORS.text}}>
						{`02${item===1 ? '*' : ''}`}
					</div>
				</WithChangeOpacity>
		        <WithChangeOpacity onClick={() => {pick(2)}}>
					<div className={bstyle.number_str} style={{...on_style, color: item === 2 ? COLORS.surface1 : COLORS.text}}>
						{`03${item===2 ? '*' : ''}`}
					</div>
				</WithChangeOpacity>
	            <Box sx={{ flexGrow: 1 }} />
			</Stack>
		)
	}

	return (
		<Stack direction='column' style={{}}>
			<div style={{...text_style1, alignItems:'center', textAlign:'center', marginTop:'12px', marginBottom:'12px'}}>
				{header ?? ""}
			</div>
			<NumberBlock/>
			<div style={{...text_style,padding:'24px',lineHeight:1.2, width:`calc(100vw-48px)`}}>

				{ item === 0
					? 
					typeof str1 === 'function' ? str1() : str1
					: item === 1
					? typeof str2 === 'function' ? str2() : str2
					: typeof str3 === 'function' ? str3() : str3
				}
			</div>
		</Stack>
	)	

}


// @use: app user display view
export function BurnUserRow({ user_cache, data, style }){

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ name, ename ] = useState("...");
	const [ img, eimg ] = useState("");


	useEffect(async () => {
		if (trivialProps(user_cache,'get') || trivialProps(data,'ID')){
			return;
		}
		await user_cache.get({ userID: data.userID ?? "", then: (user) => {
			ename(user.name ?? user.twitterUserName)
		}})
	},[])

	return (
		<div className={bstyle.body} style={{color:COLORS.surface1, cursor:'pointer', ...(style ?? {})}}>
			{name ?? ""}
		</div>
	)
}




/******************************************************
	@Acid bag
******************************************************/


/**
 *
 * @use: fullscreen acidiamge
 *
*/
export function AcidBagImage({ img_name, style, width, height }){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	return (
		<Stack 
			direction='column' 
			style={{ 
				paddingTop:'24px',
				paddingBottom:'24px',
				background: COLORS.black,
				...(style ?? {}),
			}}
		>
			<CenterHorizontalView>
	            <AppImageView   
	                width = { width  ?? '65vw'}
	                height= { height ?? '65vw'}
	                imageDidLoad = {() => {}}
	                preview_url  = {img_name ?? acid5}
	                imgSrc       = {img_name ?? acid5}
	                type         = {urlToFileExtension(img_name ?? acid5)}
	                imgStyle ={{}}
	            />    							
			</CenterHorizontalView>
		</Stack>
	)	
}



// @Use: check out screen
export function AcidBagCheckout({ style, btn_style, bag_width, bag_height, onClick, showProgress, btn_str,  }){

	return (
		<Stack 
			direction='column'
			style={{ 
				...(style ?? {}) ,
			}}
		>
			<CenterHorizontalView>
	            <AppImageView   
	                width = { bag_width  ?? '40vw'}
	                height= { bag_height ?? '40vw'}
	                imageDidLoad = {() => {}}
	                preview_url  = {acid5}
	                imgSrc       = {acid5}
	                type         = {urlToFileExtension(acid5)}
	                imgStyle ={{}}
	            />    							
			</CenterHorizontalView>	            
            <ActionProgressWithProgress                    
                showProgress={showProgress}
                onClick = {onClick}
                label={btn_str ?? ""}
                progress_text={btn_str ?? ""}
                sx = {{ 
					marginTop:'12px',
					width: '120%', 
					border:`3px solid ${COLORS.red_1}`, 
					...(btn_style ?? {})
                }}
            />      
		</Stack>
	)
}

//
// @Use: post-check out screen w/ receipt
//
export function AcidBagCheckoutRecepit({ 
	style, 
	onClick, 
	showProgress, 
	receipt,
	is_bare,
	btn_str,  
	onInstallApp,
}){
	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const bstyle2 = {
		borderRadius: 3,
		fontSize: isOnMobile ? '16px' : '18px',		
		fontFamily: 'NeueMachina-Bold',
		// width:'10vw',
		marginLeft:'12px',
		color: COLORS.text,
		background: 'transparent',
		maxWidth: isOnMobile ? '90vw' : '40vw',
	}

	function RowItem({ label, num }){
		return (
			<Stack direction='row' style={{width: '100%', marginBottom:'24px'}}>
				<div className={bstyle.time_int} style={{fontSize: isOnMobile ? "14px" : '18px', width:'fit-content'}}>
					{label}
				</div>
	            <Box sx={{ flexGrow: 1 }} />
				<div 
					className={bstyle.time_str} 
					style={{
						color: COLORS.text, 
						marginRight:'24px',
						fontSize: isOnMobile ? "14px" : '18px', 
				}}>
					{num}
				</div>
			</Stack>			
		)
	}

	const { payment_id, amt_in_lumo, charge_in_cents } = (receipt ?? {});
	const order_num = contractMetamaskAddress({ pk: payment_id ?? "", m: 5, n: 7 })

	return (
		<Stack 
			direction='column'
			style={{ 
				padding: isOnMobile ? "0px" : "24px",
				marginBottom: '36px',
				paddingTop: '46px',
				...(style ?? {}) ,
			}}>

	            { is_bare ? <div/> :
	            	<Stack>
						<div className={bstyle.h3} style={{fontSize:'4vh',color: COLORS.text, marginBottom:'4vh'}}>
							{"** Order Summary"}
						</div>
						<RowItem label={"Number of Tabs ordered"} num={amt_in_lumo ?? 1} />
						<RowItem label={"Price of Tabs ordered"} num={`$${(charge_in_cents ?? 0)/100}`} />
						<RowItem label={"Order number"} num={order_num} />
					</Stack>
				}

	            <AppImageView   
	                width = { isOnMobile ? '100vw' : '40vw'}
	                imageDidLoad = {() => {}}
	                preview_url  = {mobilemock}
	                imgSrc       = {mobilemock}
	                type         = {urlToFileExtension(mobilemock)}
	                imgStyle ={{ paddingBottom: isOnMobile ? '12px' : '0px' }}
	            />    							

	            { is_bare ? <div/> :
	            <DarkButton 
	            	onClick={onInstallApp}
	            	sx={bstyle2}
	            > 
	            	{"Consume tabs on the little red app"}
	            </DarkButton>			            
		        }

		</Stack>
	)
}


/******************************************************
	@merch
******************************************************/



// @Use: check out screen
export function MerchCheckout({ hide_image, image_url, style, btn_style, onClick, showProgress, hide_button, btn_str }){

	return (
		<Stack 
			direction='column'
			style={{ 
				...(style ?? {}) ,
			}}
		>	
			<CenterHorizontalView>
			{ hide_image ? <div/> : 
				<CubeTableWithImage						
					imgSrc={image_url}
					preview_url={image_url}
					videoSrc={image_url}					
					overlay_style={{background:COLORS.black}}
				/>   				
			}			
			</CenterHorizontalView>	            
			{
				hide_button
				?
				<div/>
				:
	            <ActionProgressWithProgress                    
	                showProgress={showProgress}
	                onClick = {onClick}
	                label={btn_str ?? ""}
	                progress_text={btn_str ?? ""}
	                sx = {{ 
						marginTop:'36px',
						width: '120%', 
						border:`3px solid ${COLORS.red_1}`, 
						...(btn_style ?? {})
	                }}
	            />      
	        }
		</Stack>
	)
}

//
// @Use: post-check out screen w/ receipt
//
export function MerchCheckoutRecepit({ 
	style, 
	receipt,
	collection,
	image_url,
	onGoToOpenSea,
	onGoToManifesto,
	navigate,
	hide_image,
}){
	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const bstyle2 = {
		borderRadius: 3,
		fontFamily: 'NeueMachina-Bold',
		marginLeft:'12px',
		color: COLORS.text,
		background: 'transparent',
		maxWidth: isOnMobile ? '90vw' : '40vw',
		fontSize: isOnMobile ? '16px' : '18px',		
	}

	function _onClick(){		
		const { contract_address } = collection;
		const { tok_id, is_offchain, paymentId, mint_hash } = (receipt ?? {});
		if ( trivialString(contract_address) ){
			navigate(`/thelittleredapp`);
		} else {
			if ( !trivialString(mint_hash) ){				
				let url = `${ETHERSCAN_TX_LINK()}${mint_hash}`;
				window.open(url)
			} else {
				let url = `${ETHERSCAN_ADDRESS_LINK()}${contract_address}`;
				window.open(url)
			}
		}

	}

	function RowItem({ label, num }){
		return (
			<Stack direction='row' style={{width: '100%', marginBottom:'24px', cursor: 'pointer'}} onClick={_onClick}>
				<div className={bstyle.time_int} style={{fontSize: isOnMobile ? "14px" : '18px', width:'fit-content'}}>
					{label}
				</div>
	            <Box sx={{ flexGrow: 1 }} />
				<div 
					className={bstyle.time_str} 
					style={{
						color: COLORS.text, 
						marginRight:'24px',
						fontSize: isOnMobile ? "14px" : '18px', 
				}}>
					{num}
				</div>
			</Stack>			
		)
	}

	const { price_in_eth, price_in_cents } = collection;
	const { mint_hash, tok_id, is_offchain, paymentId } = (receipt ?? {});
	const order_num = typeof is_offchain === 'boolean' && is_offchain
		? contractMetamaskAddress({ pk: (paymentId ?? ""), m: 5, n: 7 })
		: contractMetamaskAddress({ pk: (mint_hash ?? ""), m: 5, n: 7 });

	return (
		<Stack 
			direction='column'
			style={{ 
				padding: isOnMobile ? "0px" : "24px",
				marginBottom: '36px',
				paddingTop: '46px',
				background: COLORS.black,
				...( isOnMobile ? {width:'100vw'} : {} ),
				...(style ?? {}) ,
			}}>
            	<Stack>
					<div className={bstyle.h3} style={{fontSize:'4vh',color: COLORS.text, marginBottom:'4vh'}}>
						{"** Order Summary"}
					</div>
					<RowItem label={"Number of editions ordered"} num={1} />
					<RowItem label={"Token ID"}  num={tok_id ?? ""} />
					<RowItem 
						label={"Price of edition ordered"} 
						num={is_offchain ? `$${roundTo(price_in_cents/100,2)} USD` : `${price_in_eth} ETH`}
					/>
					<RowItem label={"Order ID"} num={order_num} />
				</Stack>
				{
					hide_image ? <div/> : 
					<CenterHorizontalView style={{width: isOnMobile ? '100vw' : '45vw'}}>
			            <AppImageView   
			                height = { isOnMobile ? '40vh' : '30vh'}
			                imageDidLoad = {() => {}}
			                preview_url  = {image_url ?? mobilemock}
			                imgSrc       = {image_url ?? mobilemock}
							videoSrc     = {image_url ?? ""}						                
			                type         = {urlToFileExtension(image_url ?? mobilemock)}
			                imgStyle ={{ paddingBottom: '12px' }}
			            />    							
					</CenterHorizontalView>		            
				}
				<br/>
                <ActionProgressWithProgress                    
                    onClick = { is_offchain ? onGoToManifesto : onGoToOpenSea }
                    label={is_offchain ? "See preminted item in my profile" : "See item on OpenSea"}
                    sx = {{width: '120%', border: `0.5px solid ${COLORS.red_1}`, color: COLORS.text2}}
                />   			
		</Stack>
	)
}


/******************************************************
	@footer
******************************************************/



/**
 *
 * @Use: buy acid button
 * @Doc: https://www.i2symbol.com/symbols/smileys
 *
 **/
export function AcidFooter({ style, btn_str, onClick,showProgress }){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const ht = '12px';
	const bstyle2 = {
		borderRadius: 3,
		fontSize: '18px',		
		fontFamily: 'NeueMachina-Bold',
		marginLeft:'12px',
		color: COLORS.offBlack,
		background: 'transparent',
		maxWidth: '5f0vw',
	}

	return (
		<Stack 
			direction='column' 
			style={{ 
				...(style ?? {}),
				padding:'12px',
				paddingBottom:'48px',
			}}
		>	
            <ActionProgressWithProgress                    
                showProgress={showProgress ?? false}
                onClick = {onClick}
                label={btn_str ?? ""}
                progress_text={btn_str ?? ""}
                sx = {{ 
					marginTop:'12px',
					width: '150%', 
					border:`3px solid ${COLORS.red_1}`, 
					color : COLORS.surface1
                }}
            />       							
			<div className={bstyle.body} style={{ marginLeft:'-3px', textAlign:'center', color:COLORS.text3, fontSize:'12px', width: '100%'}}>
				{'☺ Lumo ☺'.toUpperCase()}
			</div>            
		</Stack>
	)	
}


/******************************************************
	@Signature grid
******************************************************/


/**
 *
 * @use: signature wall
 *
 **/
export function BurnTable(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();
	const width = useWidth();

	const { style, datasource, withImage } = props;
	const grid_style = {
		gridTemplateColumns: width > 600 ? `repeat(3,1fr)` : `repeat(2, 1fr)`,
	}

	return (
		<div className={bstyle.table_container} style={{ 
			...(style ?? {}), 
			...grid_style,
	        overflowY: 'scroll',   
		}}>
            {(datasource ?? []).map((data,idx) => (
                <div key={idx}>
               	  	<BurnTableItem {...props} has_image data={data}/>
                </div>
            ))}
		</div>
	)	
}


export function BurnTable2(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();
	const width = useWidth();

	const { style, datasource } = props;
	const [ ds, eds ] = useState([]);

	useEffect(() => { 
		let _datasource = datasource.chunk_inefficient(2);
		eds(_datasource);
	},[datasource]);

	return (
		<Stack direction={'row'}>
			<div className={bstyle.scroll_container} style={{ 
				...(style ?? {}), 
				height:'100vh',
			}}>
	            {ds.map((data,idx) => (
	           	  	<BurnItemTwoColumns 
	           	  		{...props} 
	           	  		has_image 
	           	  		key={idx} 
	           	  		left={data[0]} 
	           	  		right={data[1]}
	           	  	/>
	            ))}
			</div>
			<div style={{height:'100px'}}/>
		</Stack>
	)	
}


function BurnItemTwoColumns(props){
	const { left, right } = props;
	return (
		<Stack direction={'row'}>
			<div style={{width:'240px'}}>
				<BurnTableItem {...props} has_image data={left}/>
			</div>
			<BurnTableItem {...props} has_image data={right}/>
		</Stack>
	)
}

function BurnTableItem(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const { data, user_cache, onClickUser, has_image } = props;
	// const { userID } = data;

	const [ user, euser ] = useState({ name: "" })
	const [ name, ename ] = useState("<*>");
	const [ img, eimg ] = useState("");

	useEffect(async () => {
		await load();
		setTimeout(async () => {
			await load();
		},800)
	},[data])

	async function load(){
		let userID = data.userID ?? "";
		if ( !trivialProps(user_cache,'get') ){
			await user_cache.get({ userID: userID ?? "", then: async (user) => {
				if ( trivialProps(user,'get_name') ){
					return;
				}
				euser(user);
				let name = user.get_name() ?? "";
				let _img_url = user.profile_image_preview_url;
				ename(user.get_name());
				eimg(_img_url);
				if ( trivialString(name) || trivialString(img) ){
					await user.fetch_twitter_name({ then: () => {
						ename(user.get_name());					
						eimg(user.twitter.profile_image);
					}})
				}
			}});
		}		
	}

	async function onClick(){
		onClickUser(user);
	}

	return (
		<Stack 
			direction={'row'}
			className={bstyle.body} 
			style={{ 
				cursor:'pointer',
				marginRight:'18px', 
				marginTop:'4px',
				opacity: name === "<*>" ? 0.0 : 1.0,
			}} 
			onClick={onClick}
		>	
			{ !has_image ? <div/> :
            <AppImageView   
                width={'20px'}
                height={'20px'}
                preview_url  = {img}
                imgSrc       = {img}
                type         = {urlToFileExtension(img)}
                imgStyle ={{
	                background: trivialString(img) ? COLORS.red_2 : COLORS.red_3,
                	marginRight:'8px', 
                	borderRadius: `10px`,
                	marginTop: '2px',
                	borderColor: COLORS.text,
                	opacity: trivialString(img) ? 0.50 : 1.0,
                }}
            />    
	        }
			{name ?? (user.name ?? "")}
		</Stack>
	)
}

Object.defineProperty(Array.prototype, 'chunk_inefficient', {
  value: function(chunkSize) {
    var array = this;
    return [].concat.apply([],
      array.map(function(elem, i) {
        return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
      })
    );
  }
});


/******************************************************
	@acid tab grid
******************************************************/


/**
 *
 * @Use: call to action banner
 *
 **/
export function BurnBanner(props){

	const isOnMobile = useCheckMobileScreen(1100);
	const bstyle = useBurnStyles(isOnMobile)();

	const { style, text } = props;

	function TextBlock(){
		return (
			<div className={bstyle.footer_center} style={{width:'33vw'}}>
				<div className={bstyle.body}
					style={{
						color: 'white', 
						fontFamily: 'NeueMachina-Regular',
						opacity: 0.85, 
						fontSize: isOnMobile ? '1.3vh' : '16px',
				}}>
					{text ?? "** The Burn App"}
				</div>
			</div>			
		)
	}

	return (
		<Stack direction='row'
			style={{width:'100%', height:'10vh', opacity: 0.75, background: COLORS.red_2, ...(style ?? {})}}
		>	
            <Box sx={{ flexGrow: 1 }} />
			<TextBlock/>
			<TextBlock/>
			<TextBlock/>
            <Box sx={{ flexGrow: 1 }} />
		</Stack>
	)	
}


/**
 *
 * @use: tabs wall
 *
 **/
export function BurnWall(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();
	const width = useWidth();
	const height = useHeight();

	const { 
		style,
		grid_width,
		grid_height,
		show_simple, 
		delay_show,
		showIcons,
		datasource, 
		selected_datasource,
		onClickItem,
	} = props;

	const grid_style = {
        gridTemplateColumns: `repeat(${Math.ceil(grid_width/ItemSize)}, 1fr)`,
        gridTemplateRows   : `repeat(${Math.ceil(grid_height/ItemSize)} , 1fr)`,        
	}

	if ( isOnMobile ){

		return ( <div/> )

	} else {
		return (
			<div className={bstyle.wall_container} style={{ ...(style ?? {}), ...grid_style }}>
		        {
		            datasource.map((item,idx) => (
		                <div key={idx} className={bstyle.acid_tab_container}>
		                    <AcidTab 
		                    	{...props} 
		                    	idx={idx} 
		                    	showIcons={showIcons}
		                    	show_simple={show_simple} 
		                    	delay_show={delay_show} 
		                    	data={item} 
		                    	onClickItem={onClickItem}
		                    	selected_datasource={selected_datasource ?? []}
		                    />
		                </div>
		            ))
		        }
			</div>
		)	
	}
}


/**
 * @Use: one grid item, should retrieve user's avatar or profile img
 *       if user exists, else render baseline image.
*/
export function AcidTab({ 
	idx,
	tip,
	style, 
	data,
	show_simple, 
	showIcons, 
	delay_show, 
	onClickItem, 
	user_cache,
	selected_datasource 
}){

    const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ op, eop ] = useState(1.0);
	const [ show, eshow ] = useState(false);
	const [ _tip, etip ] = useState(tip);

	// @use: 
	useEffect(async () => {
		if ( trivialProps(user_cache,'get') || trivialProps(data,'userID') ){
			return;
		} 
		if ( trivialString(tip) ){
			await user_cache.get({ userID: data.userID, then: (user) => {
				let str = `Rewarded to ${user.name??""}`
				etip(str)
			}})
		}
	},[data])

	useEffect(() => {
		if ( !trivialProps(selected_datasource,'includes') ){
			let _op = selected_datasource.includes(idx)	? 0.25 : 1.0
			eop(_op);
		}
	},[selected_datasource])

	useEffect(() => {
		setTimeout(() => {
			eshow(true)
		},delay_show ?? 0)
	},[])

	let rad = ItemSize*2/3;
	let _style = { 
		...(style ?? {}),
		cursor: "pointer" ,
		border: `0.4px dotted ${COLORS.surface1}`,
	}

	const font_style = {
		fontSize   : `${rad}px`,
		fontFamily : 'NeueMachina-Medium',
		color      : COLORS.text3,
		textAlign  : 'center',
	}

	let margin1 = `${(ItemSize-ItemSize*2/3)/2}px`;
	let margin2 = `${(ItemSize-ItemSize/2)/2}px`;

	// ☺

    return (
        <WithChangeOpacity>
            <BootstrapTooltip title={_tip ?? ""}>
	            <div
		            style={_style}
	            	className={bstyle.acid_tab} 
		            onClick={() => { onClickItem(idx)}}
		        >
	            	{ 	
	            		show_simple
	            		?
	            		<div className={bstyle.h2} style={font_style}>
	            			{'1'}  
	            		</div>
	            		:
	                    <div style={{
	                    	marginTop : show ? margin1 : margin2,
	                    	marginLeft: show ? margin1 : margin2, 
	                    	width:rad,
	                    	height:rad
	                    }}>
	                    	{ showIcons
	                    		?
			                    <LazyLoadImage
			                        className={ show ? bstyle.incomplete : (Math.random() > 0.7 ? bstyle.incompleteTrue : bstyle.incompleteFalse) }
			                        src={ show ? acid4 : getCube(getRandomInt(255)+1)}
			                        alt={ show ? acid4 : getCube(getRandomInt(255)+1)}
			                        style={{opacity: op}}
			                    />
			                    :
			                    <div/>
			                }
	                    </div>
		            }
	            </div>
            </BootstrapTooltip>
        </WithChangeOpacity>
    )
}





/******************************************************
	@Footer
******************************************************/



/**
 *
 * @Use: explain burn event
 *
 **/
export function BurnFooter({  navigate }){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const ht = '25px';

	let lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit, nibh purus dignissim mauris, ac volutpat tortor lacus sed velit. Integer consequat volutpat leo quis congue. Praesent laoreet sem vel nisi finibus cursus. Donec imperdiet quis ex aliquet mattis. Mauris tincidunt, metus eget iaculis molestie, mi metus semper lacus, vitae pharetra massa ante non quam. Curabitur at hendrerit nisi. Maecenas tincidunt porta nulla non pretium. Proin metus nunc, lacinia ac nunc sed, rutrum tincidunt nibh. Pellentesque bibendum imperdiet diam quis malesuada. Mauris aliquam libero turpis, at viverra risus ultrices in.";
	let faq1 = lorem; // "How long does a burn last?\nThe burn will continue as long as tabs are shared, burners are invited and the manifesto signed. Each time the manifesto is signed, the burn renews for 15 minutes. Each time a new member accepts an invitation, the burn is renewed for 30 minutes. Each time 1/10th of a tab is shared, the burn is renewed for 3 minutes."
	let faq2 = lorem; // "When does an event burn out?\nThe burn ends when members stop sharing. It can be rekindled anytime once existing members begin sharing again, or new members are invited into the burn."
	let faq3 = lorem; //"Who can burn?\nWe believe in an open and inclusive community, so anyone can pen manifestos and host burns. Anyone can sign the manifesto, and upon signature receipt, anyone can invite other burners."

	const style = {
		 color:COLORS.text3, 
		 paddingTop:'12px', 
		 fontSize:'12px',
		 cursor:'pointer',
        fontFamily: 'NeueMachina-Regular',
	}

	function onTOS(){
        navigate(`/tac`)		
	}

	function onPRIV(){
        navigate(`/privacy`)		
	}

	return (
		<Stack direction='column' className={bstyle.burn_footer}>
			<Stack direction='row' style={{paddingBottom:'12px'}}>
				<Stack direction='column' className={bstyle.footer_left}>
					<div className={bstyle.body} style={{color:COLORS.text3}}>
						{'** FAQ'}
					</div>
					<div style={{height:ht}}/>
					<div className={bstyle.footer} style={{color:COLORS.text3}}>
						{ isOnMobile ? faq1 : faq3}
					</div>			
				</Stack>
				{
					isOnMobile ? <div/> :
					<Stack direction='column' className={bstyle.footer_center}>
						<div style={{height:ht}}/>
						<div className={bstyle.footer}>
							{isOnMobile ? "" : faq2}
						</div>			
					</Stack>
				}
				{
					isOnMobile ? <div/> :
					<Stack direction='column' className={bstyle.footer_center}>
						<div style={{height:ht}}/>
						<div className={bstyle.footer}>
							{isOnMobile ? "" : faq1}
						</div>			
					</Stack>
				}
			</Stack>
			<Stack direction='row' style={{
				top:'12px', 
				paddingRight:'24px', 
				opacity: 0.75,
				borderTop:`1px solid ${COLORS.surface3}`,				
			}}>
				<div className={bstyle.footer} style={{ color:COLORS.text3, paddingTop:'12px', fontSize:'12px'}}>
					{isOnMobile ? "@2021 Lumos,Inc" : '@ 2021 Lumos,Inc. All rights reserved'}
				</div>
	            <Box sx={{ flexGrow: 1 }} />
				<div className={bstyle.footer} style={style} onClick={onPRIV}>
					{'Privacy'}
				</div>
				<div className={bstyle.footer} style={style} onClick={onTOS} >
					{ isOnMobile ? "Terms" : 'Terms and conditions'}
				</div>
			</Stack>
		</Stack>
	)	
}






