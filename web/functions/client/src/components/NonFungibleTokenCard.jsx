/**
 *
 *
 * @Package: NonFungibleTokenCard
 * @Date   : Feb 28th, 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { createStyles, makeStyles } from "@material-ui/core/styles";
import icon_twitter  from './../assets/icon_twitter.svg'
import { PlayBackIcon } from './FullScreenCommandView'

import WithChangeOpacity from './WithChangeOpacity';
import { urlToFileExtension, GLOBAL_STAGING } from './../model/core';

import {
	trivialProps,
	trivialString,
	contractMetamaskAddress,
} from './../model/utils'
import { DarkButton } from './../components/ButtonViews';

import { COLORS } from './constants';
import AppImageView from './AppImageView';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { identicon } from 'minidenticons';

/******************************************************
	@styles
******************************************************/

// font size
function computeFontSize(project_name){

    let len = typeof project_name === 'string'
        ? project_name.length
        : 0

    if ( len < 20 ){
        return `5vh`        
    } else if ( len <= 30 ){
        return `3.5vh`        
    } else {
        return `2.5vh`
    }
}

// trello board styles
const useCardstYle = (mobile, project_name) => makeStyles((theme) => createStyles({

    // bounty card	
	bounty_card : {
        height        : '95%',
        width         : '95%',
        margin        : theme.spacing(2),
        border: `0.8px solid ${COLORS.translucent}`,
	},

	bounty_card_row_1 : {
		height    : '20px',
		// width     : '95%',
		padding   : theme.spacing(2),
        display   : 'flex',
	},

	// storyboard card
  	story_card_text_container : {
        // height: '100%',
        height: '20vh',
    	overflowY: 'scroll',        
        padding: theme.spacing(2),
        borderRadius: '30px',
        border: `0.4px solid ${COLORS.surface2}`,
        background: COLORS.offBlack,
        color: COLORS.text, 
  	},

	// card text container
  	bounty_card_text_container: {
        height: '100%',
        padding: theme.spacing(2),
        borderRadius: '1px 60px 1px 60px',
        border: `0.4px solid ${COLORS.surface2}`,
        background: COLORS.offBlack,
        color: COLORS.text,
  	},


    card_row_1: {
        height: `20px`,
        textAlign: 'left',
        borderBottom  : `2px solid ${COLORS.translucent}`,        
        paddingRight: theme.spacing(3),
        paddingBottom: theme.spacing(1),
    },

    card_row_2: {
        height: `25%`,
        fontSize: computeFontSize(project_name),
        fontFamily: 'NeueMachina-Black',
        filter: `brightness(1.0)`,
        borderBottom  : `2px solid ${COLORS.translucent}`,        
        overflowWrap: 'anywhere',
        display: 'flex',
        alignItems: 'center',
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    

    card_row_3: {
        fontSize: `2.5vh`,
        fontFamily: 'NeueMachina-Medium',
        filter: `brightness(0.75)`,
        display: 'flex',
        paddingTop    : theme.spacing(2),
        paddingBottom : theme.spacing(2),
        borderBottom  : `2px solid ${COLORS.translucent}`,        
    },  	

    card_row_4 : {
        paddingTop: theme.spacing(1),
    	height: '100%'
    },

    card_row_4_half : {
    	width: '45%',
    },

    card_row_4_half_lg: {
    	width: '55%',
    },

    table_container : {
    	overflow: 'scroll',
    	marginBottom: theme.spacing(1),
    	maxHeight: '20vh',

    },

    tableCell : {
    	cursor     : 'pointer',
    	padding    : theme.spacing(1),
    	paddingLeft: '0px',
        fontSize   : `11px`,
        height     : '13px',
        color      : COLORS.text3,
        filter     : `brightness(0.50)`,
        fontFamily : 'NeueMachina-Medium',
        borderBottom  : `1px solid ${COLORS.translucent}`,        
    },

    // bounty card minimal
    bounty_card_minimal : {
        color: COLORS.text,
        width: '90%',
        fontSize: `2vh`,
        fontFamily: 'NeueMachina-Medium',
        filter: `brightness(0.75)`,
       	padding    : theme.spacing(2),
        borderTop : `2px solid ${COLORS.translucent}`,        
    },

    mintButtonSmall : {
        fontSize    : '12px',
        color       : 'white',                
        fontFamily  : 'NeueMachina-Black',
        textAlign   : 'center',        
        cursor      : "pointer",        
        border      : `1px solid green`,
        textShadow  : `var(--green-glow)`,
        paddingRight: "12px",
        paddingLeft : "12px",
        paddingTop  : "8px",
        paddingBottom: "8px",
        marginLeft   : theme.spacing(2),
        borderRadius: '4px 10px 4px 10px',       	
    },

    // font
    h1 : {
    	color: COLORS.white,
    	fontSize:'35px',
    	fontFamily: 'NeueMachina-Black',
    	letterSpacing:'1px',
    },

    h1b : {
    	color: COLORS.text,
    	fontSize:'16px',
    	fontFamily: 'NeueMachina-Ultralight'
    },

    h1c : {
    	color: COLORS.white,
    	fontSize:'55px',
    	fontFamily: 'NeueMachina-Black',
    	letterSpacing:'1px',
    },    


    h2 : {
    	color: COLORS.text,
    	fontSize:'25px',
    	fontFamily: 'NeueMachina-Bold',
        filter: `brightness(0.75)`,
    },

    h3 : {
    	color: COLORS.text,
    	fontSize:'12px',
    	fontFamily: 'NeueMachina-Bold',
    },

    h4 : {
    	color: COLORS.text,
    	fontSize:'12px',
    	fontFamily: 'NeueMachina-Medium',
        filter: `brightness(0.75)`,
    },

    h5 : {
    	color: COLORS.text3,
    	fontSize:'12px',
    	fontFamily: 'NeueMachina-Regular',
        filter: `brightness(0.75)`,    	
    },

    h6 : {
    	color: COLORS.text,
    	fontSize:'13px',
    	letterSpacing: '1px',
    	lineHeight: '1.5em',
    	fontFamily: 'NeueMachina-Medium',
        filter: `brightness(0.75)`,    	
    },    

    h6b : {
    	color: COLORS.text2,
    	fontSize:'15px',
    	letterSpacing: '1px',
    	lineHeight: '1.5em',
    	fontFamily: 'NeueMachina-Medium',
    },    

    h7 : {
    	color: COLORS.text3,
    	fontSize:'12px',
    	fontFamily: 'NeueMachina-Ultralight'
    },    
}));



/******************************************************
	@View nft card + image
******************************************************/

/**
 *
 * @use: one bounty card
 *
**/
function NonfungibleTokenCard(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useCardstYle(isOnMobile, "")();

	const {
		data,
		seed_str,
		text_style  ,
		card_style  ,
		full_image  ,
		header_left ,
		header_right,
		footer_left ,
		footer_right,
		preview_url ,
		image_url   ,
		anime_url   ,
		hide_footer,
		show_partial,		
		image_height,
		onClickFooterRight,
		on_click_image,
		on_click_footer_left,
	} = props;

	// view state
	const [ show_full, set_show_full ] = useState(typeof full_image === 'boolean' ? !full_image : true)

	let img_ht = show_full 
		? '30vh' 
		: trivialString(image_height) ? '100%' : image_height; 

	useEffect(() => {
		set_show_full(!full_image)
	},[full_image])

	function onClickImage(){
		if (typeof on_click_image === 'function'){
			on_click_image(data);
		}
	}

	function onClickFooterLeft(){
		if ( typeof on_click_footer_left === 'function' ){
			on_click_footer_left()
		}
	}

	function header(){
		return (
            <Stack direction='row' className={tclasses.bounty_card_row_1}>
            	<div className={tclasses.h4}>
                {(header_left ?? "").toUpperCase()}
                </div>
                <Box sx={{ flexGrow: 1 }} />
            	<div className={tclasses.h4}>
				{(header_right ?? "").toUpperCase()}
				</div>
            </Stack>    		
        )
	}

	var footer_left_style = text_style ?? {}
	if ( typeof on_click_footer_left === 'function'){
		footer_left_style = { cursor: 'pointer', ...footer_left_style }
	}

	return (
		<Stack className={tclasses.bounty_card} style={card_style ?? {}}>
           
            { show_partial
            	? 
            	<div/>
            	:
            	<div onClick={onClickImage} style={typeof on_click_image === 'function' ? {cursor:'pointer'} : {}}>
            		{
            			trivialString(image_url)
            			?
            			<div style={{width:'100%',height:img_ht}}>
	                        <identicon-svg 
	                            username={seed_str ?? ""}
	                            saturation="95"
	                            lightness="60"
	                        />
                        </div>
            			:
			            <AppImageView 	
			                width  = {'100%'}
			                height = {img_ht}
			                style  = {{}}
			                imageDidLoad = {() => {return}}
			                preview_url  = {image_url}
			                imgSrc       = {image_url}
			                videoSrc     = {trivialString(anime_url) ? image_url : anime_url}
			                type         = { 
			                	trivialString(anime_url)
				                	? urlToFileExtension(image_url)
				                	: 'mp4'
			                }
			            />   
			        }	
	            </div>
	        }


            {	show_full 
            	?
	            <NonFunbileTokenCardText {...props}/>
	            : 
	            <div/>
	        }

            <Box sx={{ flexGrow: 1 }} />


		    { show_full || hide_footer
		    	? 
		    	<div/> 
		    	: 
	            <Stack direction='row' className={tclasses.bounty_card_row_1} style={text_style ?? {}}>
	            	<div className={tclasses.h3} style={footer_left_style} onClick={onClickFooterLeft}>
		                {footer_left.toUpperCase()}
	                </div>
	                <Box sx={{ flexGrow: 1 }} />             
	            	<div className={tclasses.h3} style={{cursor:'pointer', ...(text_style ?? {})}} onClick={onClickFooterRight}>
					{footer_right.toUpperCase()}
					</div>
	            </Stack>     	
	        }	
		</Stack>
	)
}

/******************************************************
	@View component: text portion
******************************************************/

/**
 *
 * @use: commonbounty card text full view for the 
 *       whole project
 *
 **/
function NonFunbileTokenCardText(props){

	const { 

		// text
		t1_left,
		t1_right,
		t2,
		t3_left,
		t3_right,
		t4_top,
		t4_middle,
		t4_bottom,
		t5_top,
		t5_bottom,
		table_title,
		table_data_source,

		//styles
		style,
		t3_style, 
		table_style_r,
		table_style_l,

		// alt view
		action_btn_text,
		onClickActionBtn,

		// fns
		onClickUser,
		onClickTitle,
		onClickt3right,
		onClickt5_bottom,
		onClickCardRightHeader,
		data,
		hide_table_values,
		hide_table_keys,
	} = props;

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useCardstYle(isOnMobile, t2)();


	const [ tdatasource, etdatasource ] = useState([])

	useEffect(() => {
		let small_table_data_source = (table_data_source ?? []); //.slice(0,5);
		etdatasource(small_table_data_source);
		setTimeout(() => {
			etdatasource(small_table_data_source);
		},1000)
	}, [table_data_source,data])


	//
    function getKey(item){
    	if ( trivialProps(item,'key') ){
    		return ""
    	} else {
    		let str = item['key'] ?? ""
    		return contractMetamaskAddress({ pk: str, n: 5, m: 5 });
    	}
    }

    function getValue(item){
    	if ( trivialProps(item,'value') ){
    		return ''
    	} else {
    		let str = item['value'] ?? ""
	        const _str = contractMetamaskAddress({ pk: str, n: 7, m: 5})
	        return _str;
    	}
    }

    function getValue2(item){
    	if ( trivialProps(item,'valuec') ){
    		return ''
    	} else {
    		let str = item['valuec'] ?? ""
    		return str;
    	}
    }

    

    function onClickUserItem(user){
    	if ( typeof onClickUser === 'function' ){
    		onClickUser(user)
    	}
    }

    function on_click_title(){
    	if (typeof onClickTitle === 'function'){
    		onClickTitle(data)
    	}	
    }

    const pointer_style = (fn) => {
    	return typeof fn === 'function' ? {cursor: 'pointer'} : {}
    }
    
	return (
	    <Stack className={tclasses.bounty_card_text_container} style={style ?? {}}>

	        <Stack direction='row' className={tclasses.card_row_1}>
	        	<div className={tclasses.h4}>
	            {(t1_left ?? "").toUpperCase()}
				</div>
	            <Box sx={{ flexGrow: 1 }} />
	        	<div className={tclasses.h4} style={{cursor:'pointer'}} onClick={onClickCardRightHeader} >
				{(t1_right ?? "").toUpperCase()}
				</div>
	        </Stack>     		

	        <div 
	        	className = {tclasses.card_row_2} 
	        	style={{  ...pointer_style(onClickTitle), height: 'fit-content'  }} 
	        	onClick={on_click_title}
	        >
	            {(t2 ?? "").toUpperCase()}
	        </div>                

	        <div className={tclasses.card_row_3} style={{fontSize: `calc(12px+0.8vw)`, height:'fit-content'}} >
	            <div>{(t3_left ?? "").toUpperCase()}</div>
	            <Box sx={{ flexGrow: 1 }} />
	            <div 
	            	onClick={onClickt3right}
	            	style={typeof onClickt3right === 'function' 
	            		? {cursor:'pointer', ...(t3_style ?? {}), fontSize:`calc(12px+0.8vw)`, overflow:'hidden'} 
	            		: {...(t3_style ?? {}), fontSize:`calc(12px+0.8vw)`, overflow:'hidden'}
	            	}> 
	            	{t3_right ?? ""}
	            </div>
	        </div>     

	        <Stack direction='row' className={tclasses.card_row_4}>

	        	<Stack direction='column' className={tclasses.card_row_4_half} style={table_style_l ?? {}}>	
	        		<div className={tclasses.h4} style={{ marginTop:'12px', marginBottom: '12px'}}>
	            		{(t4_top ?? "").toUpperCase()}
	            	</div>
	        		<div className={tclasses.h2}>
	            		{t4_middle ?? ""}
	            	</div>
	        		<div className={tclasses.h2}>
	            		{(t4_bottom ?? "").toUpperCase()}
	            	</div>

		            <Box sx={{ flexGrow: 1 }} />

	        		<div className={tclasses.h5} style={{color: COLORS.text3, paddingTop:'36px'}}>
	            		{(t5_top ?? "").toUpperCase()}
	            	</div>
	        		<div 
	        			className={tclasses.h5} 
	        			style={{ ...pointer_style(onClickt5_bottom),  paddingBottom:'24px',paddingTop:'8px'}} 
	        			onClick={onClickt5_bottom}
	        		>
	            		{t5_bottom ?? ""}
	            	</div>
	        	</Stack>

	            <Box sx={{ flexGrow: 1 }}/>

	        	<Stack className={tclasses.card_row_4_half_lg} style={table_style_r ?? {}}>
					{ typeof onClickActionBtn === 'function'  
						?
				        <Stack direction="column" style={{ height: '100%' }}>
				            <Box sx={{ flexGrow: 1 }} />
				            <Stack direction='row'>
					            <Box sx={{ flexGrow: 1 }} />
					            <div style={{transform: 'rotate(0deg)', marginBottom:'12px'}}>
						            <DarkButton onClick={onClickActionBtn} sx={{borderRadius:3}} > 
					                	{ action_btn_text ?? "" }
						            </DarkButton>				
					            </div>		
					        </Stack>
			            </Stack>
		            	:
	        			<div>
			        		<div className={tclasses.h4} style={{marginTop:'12px', marginBottom: '12px'}}>
			            		{(table_title ?? "").toUpperCase()}
			            	</div>
					        <Stack direction="column" className={tclasses.table_container}>
					            {(tdatasource ?? []).map((user) => {
					                return (
					                    <Stack 
						                    direction = {'row'}
						                    className = {tclasses.tableCell}
					                    	onClick   = {() => {onClickUserItem(user)}}
					                    	style     = {pointer_style(onClickUser)}
						                >
					                        <div style={{width: hide_table_values ? '100%' : '45%'}}>
					                            {hide_table_keys ? '' : getKey(user)}
					                        </div>
					                        {
					                        	trivialString(getValue2(user))
					                        	? 
					                        	<div/>
					                        	: 
						                        <div style={{width: '55%', textAlign:'center'}}>
							                        { getValue2(user)}
						                        </div>			                        	
					                        }			                        
					                        <div style={{width: hide_table_keys ? '100%' : '55%', textAlign:'right'}}>
						                        { hide_table_values ? '' : getValue(user)}
					                        </div>
					                    </Stack>
					                )
					            })}
					        </Stack>	                	
				        </div>
					    }
	        	</Stack>
	        </Stack>
	    </Stack>
	    
	)	
}


/******************************************************
	@View storyboard card
******************************************************/

/**
 *
 * @use: common story board card
 *
 **/
function StoryBoardCardText(props){

	const { 
		style, 
		t2,
		text,
		data,
		t1_left,
		t1_right,
		on_click_left_header,
		on_click_right_header,
		onClickEdit,
	} = props;

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useCardstYle(isOnMobile, t2)();

    function onClickRightHeader(){
    	if (typeof on_click_right_header === 'function'){
    		on_click_right_header();
    	}
    }
    function onClickLeftHeader(){
    	if (typeof on_click_left_header === 'function'){
    		on_click_left_header();
    	}
    }

	return (
	    <Stack className={tclasses.story_card_text_container} style={style ?? {}}>

	        <Stack direction='row' className={tclasses.card_row_1}>
	        	<div className={tclasses.h4}  onClick={onClickLeftHeader}>
	            {(t1_left ?? "").toUpperCase()}
				</div>
	            <Box sx={{ flexGrow: 1 }} />
	        	<div className={tclasses.h4}  onClick={onClickRightHeader}>
				{(t1_right ?? "").toUpperCase()}
				</div>
	        </Stack>     		

	        <Stack direction='column' className={tclasses.card_row_4} style={{overflowY:'scroll'}}>
	        	<div className={tclasses.h6}>
	        		{text ?? ""}
	        	</div>
        	</Stack>

        	<Stack direction='row' onClick={() => {onClickEdit(data)}} style={{marginTop:'12px', cursor:'pointer'}}>
                <Box sx={{ flexGrow: 1 }} />
	        	<div className={tclasses.h7}>
	        		{'edit'}
	        	</div>
        	</Stack>

	    </Stack>
	    
	)	
}



/**
 *
 * @use: one stoyrboard card
 *
**/
function StoryBoardCard(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useCardstYle(isOnMobile, "")();

	const {
		data,
		full_image  ,
		anime_url,
		hide_header ,
		header_left ,
		header_right,
		footer_left ,
		footer_right,
		image_url,
		onClickTitle,
		on_mint_item,
		on_tweet,
		hide_story_btn,
		t1_a_left,
		t1_a_right,

		mint_btn_label,
		mint_btn_style,

		hide_footer,

		hide_twitter_btn,
		container_style
	} = props;

	// view state
	const [ show_full, set_show_full ] = useState(
		  typeof full_image === 'boolean' 
		? !full_image 
		: true
	)

	const [ show_credit, eshow_credit ] = useState(false);

	function on_click_image(){
		if ( typeof onClickTitle === 'function' ){
			onClickTitle(data)
		}
	}

	let img_ht = show_full 
		? '30vh' 
		: show_credit
		? '12vh'
		: '52vh'

	// on click right, hide/show card
	function onHideHeader(){
		set_show_full(false)
	}

	function onShowCard(){
		set_show_full(true)		
	}

	function onShowCredit(){
		eshow_credit(true);
		set_show_full(false);
	}

	function onHideCredit(){
		eshow_credit(false);
		set_show_full(true);		
	}

	function onMintCard(){
		if (typeof on_mint_item === 'function'){
			on_mint_item(data)
		}
	}

	function onTweet(){
		if (typeof on_tweet === 'function'){
			on_tweet();
		}
	}


	return (
		<Stack className={tclasses.bounty_card} style={container_style ?? {}}>
           
           { hide_header 
           		? <div/> 
           		: 
	            <Stack direction='row' className={tclasses.bounty_card_row_1}>
	            	<div className={tclasses.h4}>
	                {(header_left ?? "").toUpperCase()}
	                </div>
	                <Box sx={{ flexGrow: 1 }} />
	            	<div className={tclasses.h4}>
					{(header_right ?? "").toUpperCase()}
					</div>
	            </Stack>     	
	        }

            <div style={ typeof onClickTitle === 'function' ? {cursor:'pointer'} : {}} onClick={on_click_image}>
	            <AppImageView 	
	                width  = {'100%'}
	                height = {img_ht}
	                style  = {{}}
	                imageDidLoad = {() => {return}}
	                preview_url  = {image_url}
	                imgSrc       = {image_url}
	                videoSrc     = {trivialString(anime_url) ? image_url : anime_url}
	                type         = { 
	                	trivialString(anime_url)
		                	? urlToFileExtension(image_url)
		                	: 'mp4'
	                }
	            />   
            </div>

            { show_full 
            	?
	            <StoryBoardCardText 
	            	{...props}
	            	on_click_left_header  = {onHideHeader}
	            	on_click_right_header = {onShowCredit}
	            />
	            : 
	            <div/>
	        }
	        
            {	show_credit
            	?
	            <NonFunbileTokenCardText 
		            {...props}
	            	t1_left = { t1_a_left ?? 'credit'}
	            	t1_right={ t1_a_right ??  '>/hide credit'}
	            	onClickCardRightHeader={onHideCredit}
	            />
	            : 
	            <div/>
	        }

		    { show_full || show_credit || hide_footer
		    	? 
		    	<div/> 
		    	: 
	            <Stack direction='row' className={tclasses.bounty_card_row_1} style={{height:'28px'}}>

	            	{hide_story_btn ? <div/> :
		            	<div className={tclasses.h3} onClick={onShowCard} style={{marginTop:'10px'}}>
			                {footer_left.toUpperCase()}
		                </div>
		            }

		            { hide_twitter_btn 
		            	? <div/> 
		            	:  
						<PlayBackIcon onClick={onTweet} src={icon_twitter} tip={'tweet story'}/>
					}

	                <Box sx={{ flexGrow: 1 }} />

	            	<div className={tclasses.h3} style={{marginTop:'10px'}} >
						{footer_right.toUpperCase()}
					</div>

					{ !trivialString(mint_btn_label)  
						?
						<WithChangeOpacity onClick={onMintCard}>
			            	<div className = {tclasses.mintButtonSmall} style={ mint_btn_style ?? {} }>
								{(mint_btn_label ?? "").toUpperCase()}
			                </div>     
			            </WithChangeOpacity>
			            :
			            <div/>
			        }
	            </Stack>     	
	        }	


		</Stack>
	)
}

/******************************************************
	@View utility cards
******************************************************/


/**
 *
 * @use: one stoyrboard card
 *
**/
function CommandCard(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useCardstYle(isOnMobile, "")();

	const {
		onClick,
		h1,
		h2,
	} = props;


	function on_click_image(){
		if ( typeof onClick === 'function' ){
			onClick()
		}
	}

	return (
		<Stack className={tclasses.bounty_card} style={{minHeight:'40vh'}}>

			<Stack
				className={tclasses.h6b} 
				style={{width:'100%',height:'100%', cursor:'pointer', textAlign:'center'}}
				onClick={on_click_image}
			>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction='row'>
	                <Box sx={{ flexGrow: 1 }} />
					{h1 ?? "" }<br/>
					{h2 ?? "" }
	                <Box sx={{ flexGrow: 1 }} />
				</Stack>
                <Box sx={{ flexGrow: 1 }} />
			</Stack>	            

		</Stack>
	)
}

/**
 *
 * @use: one stoyrboard card
 *
**/
function ExplainCard(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useCardstYle(isOnMobile, "")();

	const {
		style,
		header,
		title,

		h1,
		h2,

		buttonLabel,
		onClickButton,
	} = props;

	const padding = { paddingBottom:'12px', paddingTop: '12px'}

	return (
		<Stack className={tclasses.bounty_card}>
	    	<Stack className={tclasses.bounty_card_text_container} style={style ?? {}}>

		        <Stack 
		        	direction='row' 
		        	className={tclasses.card_row_1}
		        	style={{margin: '16px'}}
		        >
		        	<div className={tclasses.h4}>
		            {(header ?? "").toUpperCase()}
					</div>
		            <Box sx={{ flexGrow: 1 }} />
		        	<div className={tclasses.h4}>
		        		{""}	        	
					</div>
		        </Stack>     	

		    	<Stack direction='column' style={{marginLeft:'20px', marginRight:'10px'}}>
			        <div className = {tclasses.card_row_2} style={padding}>
			            {(title ?? "").toUpperCase()}
			        </div>                	        
					<div className={tclasses.h2} style={{width:'100%',height:'100%', marginTop:'24px'}}>
						{h1 ?? ''}
					</div>	            		        
					<div className={tclasses.h6b} style={{width:'100%',height:'100%', marginTop:'24px'}}>
						{h2 ?? ''}
					</div>	            		        
	            </Stack>			

	            <Box sx={{ flexGrow: 1 }} />		        

	            <Stack 
	            	direction='row' 
	            	className={tclasses.h3}
	            	style={{ cursor:'pointer', marginTop:'24px' }}
	            >
	                <Box sx={{ flexGrow: 1 }} />
		            <Button 
		                variant="outlined" 
		                color="error" 
		                className={tclasses.mintButton} 
		                sx={ { borderRadius: 18, width: '50%', marginRight:'16px', height:'36px', textAlign:'center' } }
		                onClick = {onClickButton}
		            >
		                <h4 style={{fontFamily: 'NeueMachina-Black'}}>
		                	{( buttonLabel ?? "").toUpperCase()}
		                </h4>
		            </Button>
	                <Box sx={{ flexGrow: 1 }} />
				</Stack>
			</Stack>
		</Stack>
	)
}


/******************************************************
	@export
******************************************************/


	
export { 
	NonFunbileTokenCardText,
	NonfungibleTokenCard, 
	CommandCard, 
	StoryBoardCard,
	ExplainCard,
	useCardstYle 
}













