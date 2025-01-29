/**
 *
 * @Package: DialogProfile
 * @Date   : 1/1/2022
 * @Author : Xiao Ling   
 * @Docs:
 *  Blurimage: https://www.befunky.com/create/blur-image/
 *
**/


import React, {useState, useEffect} from "react";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import cube1 from './../assets/1-blur.jpeg';
import cube3 from './../assets/3-blur.jpeg';
import logo from './../assets/lumologo_white-small.png';
import { COLORS } from './../components/constants';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import AppSnackbar from './../components/AppSnackbar';
import Button from '@mui/material/Button';

import {
    home_page_url
} from './../model/core';

import { 
    trivialString,
    trivialProps,
}  from './../model/utils';

import Tippy from "@tippyjs/react";
import { AppTextField, AppTextFieldNoUnderLine } from './../components/ChatTextInput'
import { CenterVerticalView } from './../components/UtilViews'

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';



/******************************************************
    @style
******************************************************/

let img_ht_num = 48
let row_1 = img_ht_num * 0.05
let row_2 = img_ht_num * 0.35
let row_3 = img_ht_num * 0.08
let row_4 = img_ht_num * 0.30


//@Use: dialog body style
const useStyles = (isOnMobile, editable, blur_img) => makeStyles((theme) => createStyles({

    // container

    container : {
        color: 'white',
        paddingTop: theme.spacing(4),
        background: typeof blur_img === 'boolean' && !blur_img
            ? COLORS.offBlack
            : COLORS.black,
        backgroundImage: typeof blur_img === 'boolean' && !blur_img
            ? ''
            : `url(${blur_img ? blur_img : (editable ? cube3 : cube1)})`,
    },

    textBorderContainer : {
        // marginLeft: theme.spacing(2),
        // marginRight: theme.spacing(2),
        marginTop: theme.spacing(2),
    },

    // row containers

    row_1: {
        height: `${row_1}vh`,
        fontFamily: 'NeueMachina-Medium',
        fontSize: `${row_1*0.7}vh`,
        textAlign: 'left',
        margin: 'auto',        
        display: 'flex',
        flex: 1,        
        borderBottom  : `2px solid ${COLORS.white}`,        
        // paddingRight: theme.spacing(3),

        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),

    },

    row_2: {

        height: `${row_2}vh`,
        fontSize: `${row_2*0.6}vh`,
        fontFamily: 'NeueMachina-Black',
        textAlign: 'left',        
        margin: 'auto',
        paddingRight: theme.spacing(3),
        paddingTop: theme.spacing(5),
        paddingBottom: theme.spacing(1),

        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),

    },

    row_3: {
        minHeight: `${row_3}vh`,
        fontSize: `${row_3*0.5}vh`,
        fontFamily: 'NeueMachina-Regular',
        textAlign : 'left',        
        margin    : 'auto',
        paddingTop: theme.spacing(3),
        display: 'flex',
        flex: 1,
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
    },    

    row_text_area: {
        minHeight: `${row_3}vh`,
        fontSize: `${row_3*0.5}vh`,
        fontFamily: 'NeueMachina-Regular',
        textAlign : 'left',        
        margin    : 'auto',
        paddingTop: theme.spacing(3),
        display: 'flex',
        flex: 1,
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        background: COLORS.black,
    },    


    row_4 : {
        height: `${row_4}vh`,
        display: 'flex',
        flex: 1,
        borderTop: `2px solid ${COLORS.translucent}`,
        paddingTop: theme.spacing(2),
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),        
    },

    row_4_left: {
        height: `${row_4}vh`,
        width : `${img_ht_num*0.3}vh`,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
    },

    row_4_left_no_ht: {
        // width : `${img_ht_num*0.3}vh`,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
    },


    row_4_lft_1: {
        width : `${img_ht_num*0.3}vh`,        
        fontSize: `${img_ht_num*0.25/10}vh`,
        fontFamily: 'NeueMachina-Bold',
        textAlign: 'left',        
    },

    row_4_lft_2: {
        paddingTop: theme.spacing(1.5),
        width : `${img_ht_num*0.3}vh`,        
        fontSize: `${row_3*0.7}vh`,
        fontFamily: 'NeueMachina-Medium',
        textAlign: 'left',        
    },

    row_4_lft_3: {
        width : `${img_ht_num*0.3}vh`,        
        fontSize: `${img_ht_num*0.25/10}vh`,
        fontFamily: 'NeueMachina-Ultralight',
        textAlign: 'left',        
        paddingTop: theme.spacing(0.5),
    },

    row_4_right: {
        height: `${row_4}vh`,
        width :  `${img_ht_num*1.0}vh`,
        // marginRight: theme.spacing(1),
        fontFamily: 'NeueMachina-Bold',
        fontSize: '13px',        
        textAlign: 'left',       
        lineHeight: 1.3,        
    },

    // generic row layout
    row_k : {
        display: 'flex',
        flex: 1,
        padding: theme.spacing(2),
        // paddingTop: theme.spacing(2),
        // marginLeft: theme.spacing(2),
        // marginRight: theme.spacing(2),        
    },

    /// avatar hide
    row_5_alt: {
        height: '12vh',
        minHeight: '140px',
        width: '100%',

        display: 'flex',
        justifyContent: 'center',
        position: 'relative', 

        // for some reason this centers an item
        // filter: `brightness(1.0)`,  
        // paddingLeft: theme.spacing(2),
        background: typeof blur_img === 'boolean' && !blur_img
            ? COLORS.offBlack
            : COLORS.black,        
    },

    change_avatar_btn : {
        height: '60px',
        width: '80vw',
        maxWidth: '600px',
    },

    change_avatar_btn_font: {
        fontSize: '25px',        
        fontFamily: 'NeueMachina-Black',
        // color: COLORS.text,
    },

    // avatar show
    row_5: {
        minHeight: '70vh',
        width    : '100%',
        display  : 'flex',
        position: 'relative', 
        justifyContent: 'center',
        background: COLORS.black,
        // for some reason this centers an item
        // filter: `brightness(1.0)`,  
    },

    row_5_center : {
        position: 'absolute',
        top: '50%',
        margin:0,
        transform: 'translateY(-50%)'
    },


    row_5_btn : {
        width: '100%',
        height: '10vh',
        display: 'flex',
        justifyContent: 'center',
    },

    boxContainer: {
        display: 'grid',
    },

    boxInner: {
        gridArea: '1 / 1',
    },

    // footer
    row_6 : {
        width: '100%',
        filter: `brightness(0.75)`,  
        // paddingLeft: theme.spacing(2),
        // background: editable ? COLORS.black : COLORS.transparent,
        // borderTop : editable ? `0.5px solid ${COLORS.translucent}` : "",                

    },

    row_bot_header : {
        color: COLORS.text3,
        fontFamily: 'NeueMachina-Medium',              
        fontSize: '12px',                               
        position: 'relative',
        paddingTop: theme.spacing(2),
        paddingLeft: theme.spacing(2),
        // paddingBottom: theme.spacing(2),
    },

    row_bot_body : {
        color: COLORS.text3,
        fontSize: '11px',                               
        fontFamily: 'NeueMachina-Medium',              
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        borderTop: `1px solid ${COLORS.translucent}`,                
    },

    icon: {
        width: `20px`,
        height: `20px`,
        paddingRight: theme.spacing(3),
        position: 'relative',
        bottom: '3px'
    },

    row_bot_body_left : {
        width: '40%',        
    },

    row_bot_body_right:{
        width: '40%',
        marginRight: theme.spacing(1),
    },

    row_bot_container: {
        background: 'black'
    },
}));



// @use: style for dialog only
const useDialogStyles = (isOnMobile) => makeStyles((theme) => createStyles({

    // text container
    container : {
        background: COLORS.black, // 'black'
    },

    titleBar : {
        // background: 'black',
        // color: 'white',
        color: COLORS.text3,
        fontFamily: 'NeueMachina-Regular',
        background: COLORS.black, // 'black',        
    }, 

    footerText: {
        color: COLORS.text3, // 'white',
        fontFamily: 'NeueMachina-Bold',
    },
}));


const useApplyStyles = (mobile) => makeStyles((theme) => createStyles({

    vert_align : {
        transform: 'translateY(20%)',             
    },

    metamask_button : {
        fontSize    : '15px',
        width       : '150px',
        color       : 'white',                
        fontFamily  : 'NeueMachina-Black',
        textAlign   : 'center',        
        border      : `1px solid ${COLORS.green_1}`,
        textShadow  : `var(--green-glow)`,
        padding     : theme.spacing(2),
        borderRadius: '10px',
    },

    address : {
        fontSize    : '18px',
        color       : 'white',                
        fontFamily  : 'NeueMachina-Bold',
        textShadow  : `var(--green-glow)`,
        padding   : theme.spacing(3),
        textAlign : 'center'
    },

    or_container : {
        fontSize: '14px',
        color: 'white',
        fontFamily  : 'NeueMachina-Bold',        
        transform: 'translateY(40%)',                
    }

}));





/******************************************************
    @view: parent hoc
******************************************************/


/**
 *
 * @use: app level dialog parent view
 *
 **/
function DialogParent(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const dclasses   = useDialogStyles(isOnMobile)();    
    const classes    = useStyles(isOnMobile, true, false)();    

    const { 
        open,
        maxWidth, 
        fullWidth,
        title,
        snack,
        footer_top,
        footer_left, 
        footer_right, 
        footer_bottom, 
        is_bare,
        onClose, 
        container_style,
        user_cache, 
    } = props;

    const [ _footer_left, _efooter_left ] = useState(footer_left ?? "");

    useEffect(async () => {
        if ( trivialProps(user_cache,'getAdminUser') ){
            return;
        }        
        let user = await user_cache.getAdminUser()
        if ( trivialProps(user,'userID') ){
            _efooter_left('not authenticated')
        } else {
            _efooter_left(`${user.metamask_pk ?? "***"}`)
        }
    },[open])


    return (
        <div>
            <Dialog fullWidth={fullWidth} maxWidth={ maxWidth ?? 'md'} open={open} onClose={onClose}>
                {/* error messge toast*/}
                <AppSnackbar
                    {...props}
                    showSnack = {snack.show}
                    snackMessage = {snack.str}
                    vertical={"bottom"}
                    horizontal={'center'}
                />                  
                {
                    is_bare
                    ?
                    <DialogContent className={dclasses.container}>
                        {props.children}
                        <FooterInstruction 
                            {...props}
                            footer_top={footer_top ?? ""}
                            footer_left={_footer_left ?? ""}
                            footer_right={footer_right ?? home_page_url()}
                            footer_bot = {footer_bottom ?? ""}
                        />
                    </DialogContent>
                    :
                    <DialogContent className={dclasses.container} style={ container_style ?? {}}>
                        <Box className={classes.container} style={ container_style ?? {}}>
                            <div className={classes.textBorderContainer}>                        
                                <div className = {classes.row_1} style={{color:COLORS.text3}}>
                                    <div> {(title ?? "").toUpperCase()} </div>
                                    <Box sx={{ flexGrow: 1 }} />
                                </div>
                                {props.children}
                                <FooterInstruction 
                                    {...props}
                                    footer_top={footer_top ?? ""}
                                    footer_left={_footer_left ?? ""}
                                    footer_right={footer_right ?? home_page_url()}
                                    footer_bot = {footer_bottom ?? ""}
                                />
                            </div>
                        </Box>
                    </DialogContent>
                }
                {/* footer */}
                <DialogActions className={dclasses.titleBar}>
                    <Button onClick={onClose} className={dclasses.footerText}>
                        <div className={dclasses.footerText} style={{filter:'brightness(0.7)'}}>
                            Close
                        </div>
                    </Button>
                </DialogActions>
            </Dialog>                        
            </div>
    );
}


export default withAuth(withRouter(DialogParent))

/******************************************************
    @style
******************************************************/


const inputPropsAttribute = {
    color: 'white',
    fontFamily: 'NeueMachina-Bold',
    fontSize: '13px',        
    marginTop: '-4vh',
}

const labelStyle = {
    fontSize: `10px`,
    fontFamily: 'NeueMachina-Medium',    
    color: "white",
    marginTop : '5px',
    textAlign : 'left',
    marginLeft: '20px',
    filter: COLORS.offwhite_filter,
}


const inputPropsAbout = {
    color: COLORS.text,
    fontFamily: 'NeueMachina-Medium',
    fontSize: '14px',        
}




/******************************************************
    @view: component
******************************************************/

/**
 *
 * @Use: tow row label
 *
 *
**/
function TwoRowLabel(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true, '')();    
    
    const { h1, h2, tip, style, width} = props;
    let str = tip ?? "";

    return (

        <Tippy content={str} disabled={false}>
            <div className={classes.row_4_left_no_ht} style={style ?? {}}>
                <div className={classes.row_4_lft_1}> {(h1 ?? "").toUpperCase()} </div>
                <div className={classes.row_4_lft_2} style={width ? {width:width} : {}}> {(h2 ?? "").toUpperCase()} </div>
            </div>  
        </Tippy>

    )
}


/**
 *
 * @Use: tow row label
 *
 *
**/
function ThreeRowLabel(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true, '')();    
    
    const { h1, h2, h3, tip, style } = props;
    let str = tip ?? "";

    return (
        <div style={{ textAlign:'center', ...( style ?? {}) }}>
            { trivialString(h1) ? <div/> : <div className={classes.row_4_lft_1} style={{color: COLORS.text, textAlign:'center'}}> {(h1 ?? "").toUpperCase()} </div>}
            <div className={classes.row_4_lft_2} style={{color: COLORS.text, textAlign: 'center',}}> {(h2 ?? "").toUpperCase()} </div>
            <div className={classes.row_4_lft_1} style={{marginTop:'8px', textAlign: 'center', color:COLORS.text3}}> {h3 ?? ""} </div>
        </div>  
    )

}


/**
 *
 * @use: standard attribute input
 *
 **/
function InputAttribute(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true, '')();    

    const {
        h1,
        h2,
        label,
        value,
        did_change,
        width,
        style,
        tip,
        disabled,
        autoFocus,
        multiline,
        rows,
        label_width,
    } = props;

    const _style = { ...inputPropsAttribute, ...style ?? {}  }
    const str = typeof tip === 'string' ? tip : ''
    const _stack = typeof h1 === 'string' && typeof h2 === 'string'

    return (
        <div className = {classes.row_3}>
            { _stack 
                ? 
                <TwoRowLabel
                    h1 = {h1}
                    h2 = {h2}
                    tip={str}
                    style={{marginTop:'-16px'}}
                    width={label_width ?? '100px'}
                />          
                :      
                <Tippy content={str} disabled={false}>
                    <div>{label}</div>
                </Tippy>
            }
            <Box sx={{ flexGrow: 1 }} />
            <div style={{width: width ?? '10vw'}}>
                <AppTextField            
                    standard
                    hiddenLabel
                    value = {value}
                    onChange={did_change}
                    className={classes.row_3}                            
                    inputProps={{style: _style}}
                    multiline = {typeof multiline === 'boolean' ? multiline : false}
                    rows      = {typeof multiline === 'boolean' && typeof rows === 'number' ? rows : 1}
                    disabled={typeof disabled === 'boolean' ? disabled : false}
                    autoFocus={typeof autoFocus === 'boolean' ? autoFocus : false}
                />
            </div>
        </div>     
    )
}


/**
 *
 * @use: about attribute w/ multiline input
 *
 **/
function AboutAttribute(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true, '')();    

    const { 
        h1,
        h2, 
        str,
        value, 
        onChange, 
        disabled, 
        width,
        style, 
        label_style,
        textFieldStyle,
        numLines,
        dark } = props;

    const _disabled = typeof disabled === 'boolean' 
        ? disabled
        : false;

    const dark_style = {
        background: COLORS.black,
        borderRadius: '12px',
        padding: '16px',
    }

    const dark_props = dark ? dark_style : {}
    const text_field_props = textFieldStyle ?? {}

    return (
        <div className={classes.row_4} style={style ?? {}}>

            <Stack 
                direction='column' 
                style={{marginTop: numLines === 1 ? '26px' : '', ...(label_style ?? {}) }}
            >
                <TwoRowLabel
                    h1  = {h1}
                    h2  = {h2}
                    tip = {str}
                />          
            </Stack>

            <div style={{marginLeft: '-12px'}}>
                <AppTextFieldNoUnderLine
                    standard
                    hiddenLabel
                    multiline
                    disabled  = {_disabled}
                    rows      = {typeof numLines === 'number' ? numLines : 3}
                    value     = {value}
                    onChange  = {onChange}                    
                    style     = {{
                        ...dark_props,
                        width: typeof width === 'string' ? width : '32vw',
                        ...text_field_props,                        
                    }}
                    inputProps={{style: {...inputPropsAbout}}}
                />
            </div>
        </div>

    )    
}


/**
 *
 * @use: about attribute w/ multiline input
 *
 **/
function AboutAttributeSimple(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true, '')();    
    const { value, onChange, disabled, width, style, input_style, numLines, dark } = props;
    const _disabled = typeof disabled === 'boolean' 
        ? disabled
        : false;

    return (
        <AppTextFieldNoUnderLine
            standard
            hiddenLabel
            multiline
            disabled  = {_disabled}
            rows      = {typeof numLines === 'number' ? numLines : 3}
            value     = {value}
            onChange  = {onChange}                    
            style     = {{                
                background: COLORS.offBlack2,
                borderRadius: '12px',
                padding: '16px',
                lineHeight: 1.5,        
                ...style,
            }}
            inputProps={{style: {...inputPropsAbout, ...( input_style ?? {}) }}}
        />
    )    
}


/**
 * 
 * @Use: about text attribute
 *
 **/
function AboutTextAttribute(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true, '')();    
    const { h1, h2, str, text, disabled, width, style } = props;

    const _style = { ...(style ?? {}), width: '90%' }
    return (
        <Stack direction='horizontal' className={classes.row_4} style={_style}>
            <Box sx={{ flexGrow: 1 }} />
            <TwoRowLabel
                h1  = {h1}
                h2  = {h2}
                tip = {str}
                style={{color:COLORS.text2}}
            />          
            <div style={{letterSpacing: '2px', color: COLORS.text2, lineHeight: '1.5em', fontFamily: 'NeueMachina-Regular', marginLeft:'36px', fontSize:'14px'}}>
                {text ?? ""}
            </div>
            <Box sx={{ flexGrow: 1 }} />
        </Stack>

    )   
}


/**
 *
 * @use: attribute to claim date
 *
 *
 **/
function DateAttribute(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true, '')();    

    const {
        month ,
        day   , 
        hour  ,
        min   ,
        label ,
        tip   ,
        has_hour,
        has_min ,
        change_mo,
        change_day,
        change_hr ,
        change_min,
        h1,
        h2,
    } = props;

    const str = tip ?? "";

         // className={classes.row_3}>

    return (
        <div className={classes.row_k}>

            <TwoRowLabel
                h1 = {h1}
                h2 = {h2}
                tip={str}
            />

            <Box sx={{ flexGrow: 1 }} />

            <Stack> 
                <div style={{width:'8vw'}}>
                    <AppTextField
                        standard
                        hiddenLabel
                        value = {month}
                        onChange={change_mo}
                        className={classes.row_3}                            
                        inputProps={{style: inputPropsAbout, maxLength: 2}}
                    />
                </div>
                <div style={labelStyle}> {"month (1-12)"} </div>
            </Stack>

            <Stack> 
                <div style={{width:'8vw'}}>
                    <AppTextField
                        standard
                        hiddenLabel
                        value = {day}
                        onChange={change_day}
                        className={classes.row_3}                            
                        inputProps={{style: inputPropsAbout, maxLength: 2}}
                    />
                </div>
                <div style={labelStyle}> {"day (1-31)"} </div>
            </Stack>                                  

            { has_hour ? 
                <Stack> 
                    <div style={{width:'8vw'}}>
                        <AppTextField
                            standard
                            hiddenLabel
                            value = {hour}
                            onChange={change_hr}
                            className={classes.row_3}                            
                            inputProps={{style: inputPropsAbout, maxLength: 2}}
                        />
                    </div>
                    <div style={labelStyle}> {"hour (1-23)"} </div>
                </Stack>                                  
                : <div/>
            }

            { has_min ? 
                <Stack> 
                    <div style={{width:'8vw'}}>
                        <AppTextField
                            standard
                            hiddenLabel
                            value = {min}
                            onChange={change_min}
                            className={classes.row_3}                            
                            inputProps={{style: inputPropsAbout, maxLength: 2}}
                        />
                    </div>
                    <div style={labelStyle}> {"minute (0-59)"} </div>
                </Stack>                                  
                : <div/>
            }

        </div>     
    )
}

/******************************************************
    @view: comopnents
******************************************************/


/**
 *
 * @use: blue pill/red pill button
 *
 **/
function BluePillButton(props){

    const { onClick, style, h1, h2, tip } = props;
    const isOnMobile   = useCheckMobileScreen(1000);
    const applyClasses = useApplyStyles(isOnMobile)();
    const classes      = useStyles(isOnMobile, true, cube1)();    

    return (
        <Button onClick={onClick}>
            <Tippy content={tip ?? ""} disabled={false}>
            <div className={applyClasses.metamask_button} style={style}>
                <div className={classes.row_4_lft_1}> {h1} </div>
                <div className={classes.row_4_lft_2}> {h2.toUpperCase()} </div>
            </div>
            </Tippy>
        </Button>

    )
}




/**
 *
 * @Use: input social attribute
 *
 *
 **/
function SocialAttribute(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, true, '')();    

    const {
        opensea ,
        foundation,
        twitter   ,
        instagram       ,
        change_os,
        change_foundation,
        change_tw ,
        change_instagram,
    } = props;

    const inputPropsAbout = {
        color: 'white',
        fontFamily: 'NeueMachina-Bold',
        fontSize: '13px',        
    }    

    return (

        <div className = {classes.row_3} style={{marginLeft:'20px'}}>
            <div> Social </div>

            <Box sx={{ flexGrow: 1 }} />

            <Stack> 
                <div style={{width:'9vw'}}>
                    <AppTextField
                        standard
                        hiddenLabel
                        value = {opensea}
                        onChange={change_os}
                        className={classes.row_3}                            
                        inputProps={{style: inputPropsAbout}}
                        id="filled-hidden-label-name"                            
                    />
                </div>
                <div style={labelStyle}> {"OpenSea"} </div>
            </Stack>

            <Stack> 
                <div style={{width:'9vw'}}>
                    <AppTextField
                        standard
                        hiddenLabel
                        value = {instagram}
                        onChange={change_instagram}
                        className={classes.row_3}                            
                        inputProps={{style: inputPropsAbout}}
                        id="filled-hidden-label-name"                            
                    />
                </div>
                <div style={labelStyle}> {"Foundation"} </div>
            </Stack>                                              

            <Stack> 
                <div style={{width:'9vw'}}>
                    <AppTextField
                        standard
                        hiddenLabel
                        value = {foundation}
                        onChange={change_foundation}
                        className={classes.row_3}                            
                        inputProps={{style: inputPropsAbout}}
                        id="filled-hidden-label-name"                            
                    />
                </div>
                <div style={labelStyle}> {"Twitter"} </div>
            </Stack>                                  

            <Stack> 
                <div style={{width:'9vw'}}>
                    <AppTextField
                        standard
                        hiddenLabel
                        value = {twitter}
                        onChange={change_tw}
                        className={classes.row_3}                            
                        inputProps={{style: inputPropsAbout}}
                        id="filled-hidden-label-name"                            
                    />
                </div>
                <div style={labelStyle}> {"instagram"} </div>
            </Stack>                                  

        </div>     
    )
}

/******************************************************
    @view: accessory footer
******************************************************/


/**
 *
 * @use: footer instruction
 *
 **/
function FooterInstruction(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile,props.editable, '')();    
    const { 
        footer_left, 
        footer_top, 
        footer_right, 
        footer_bot ,
        footer_top_style,
        footer_style,
    } = props;

    let _top_style = {
        ...(footer_top_style ?? {}),
        fontSize:'calc(12px+1vw)'
    }

    return (
        <Stack className={classes.row_6} style={ footer_style ?? {} }>

            <Stack direction="row" className={classes.row_bot_header} >
                <CenterVerticalView>
                <h3 style={_top_style}>
                    { footer_top ??  '' }
                </h3>
                </CenterVerticalView>
                <Box sx={{ flexGrow: 1 }} />
                <CenterVerticalView>
                <img className={classes.icon} style={{marginBottom:'0px'}} src={logo} alt="" />
                </CenterVerticalView>
            </Stack >

            <Stack direction="row" className={classes.row_bot_body}>

                <div className={classes.row_bot_body_left} style={{lineHeight:'1.5'}}>
                    { footer_left ?? ''}
                </div>

                <Box sx={{ flexGrow: 1 }} />

                <div className={classes.row_bot_body_right}>    
                    <div style={{textAlign: 'right'}}>
                        {footer_right ?? ''}
                        <br/><br/>
                        { footer_bot ?? ''}
                    </div>
                </div>

            </Stack>


        </Stack>

    )

}


/******************************************************
    @view: exported
******************************************************/

export { 
    FooterInstruction,
    useStyles,
    useApplyStyles,
    useDialogStyles,
    InputAttribute, 
    AboutAttributeSimple, 
    labelStyle,
    DateAttribute, 
    ThreeRowLabel, 
    TwoRowLabel, 
    AboutTextAttribute, 
    AboutAttribute,
    BluePillButton,
  }

