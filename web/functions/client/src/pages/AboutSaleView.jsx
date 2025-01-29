/**
 *
 *
 * @Package: FullScreenAboutView
 * @Date   : Jan 28th, 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useEffect, useState} from "react";

import Box from '@mui/material/Box';
import Grid from "@material-ui/core/Grid";
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { createStyles, makeStyles } from "@material-ui/core/styles";

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import WithChangeOpacity from './../components/WithChangeOpacity';
import AppImageView, {CenterChildView} from './../components/AppImageView'

import { ActionProgressWithProgress } from './../components/ButtonViews'

import { COLORS } from './../components/constants';
import { 
    AppBloggerItem,    
    urlToFileExtension,    
    dwebsite,
    dopensea,
    dinstagram,
    dtwitter,
    dimdb,
    ddiscord,
    to_social_links,
} from './../model/core';

import {
    ppSwiftTime,    
    trivialProps,
    trivialString,
} from './../model/utils'


import lumo_cubes from './../assets/3-1.jpg'

import icon_discord from './../assets/icon_discord.png'
import icon_link    from './../assets/icon_link.png'
import icon_ig      from './../assets/icon_ig.png'
import icon_imdb    from './../assets/icon_imdb.png'
import icon_opensea from './../assets/icon_opensea.png'
import icon_twitter from './../assets/icon_twitter1.png'

import { PlayBackIcon } from './../components/FullScreenCommandView';
import { UploadByDragAndSave } from './../components/CubeTableFileUpload'
import CubeTable from './../components/CubeTable';
import { useStyles } from './../dialogs/DialogUtils';

import { InviteImageBlock } from './AppInvitePage'
import { AboutRareText } from './AppStoryboardRare';
import { AppTextFieldNoUnderLine } from './../components/ChatTextInput'

import {TicketHolderTitle} from './AppStoryboardRare';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { identicon } from 'minidenticons';


import './../assets/index.css';

/******************************************************
    @style
******************************************************/

const useBloggerStyle = (mobile) => makeStyles((theme) => createStyles({

    container: {
        height    : '68vh',
        overflow  : 'hidden',
        overflowY : "scroll",
        background: COLORS.offBlack,
        color: COLORS.white,        
        margin: theme.spacing(4.5),
        marginTop: '-24px',
        textAlign: 'left',
        paddingLeft: theme.spacing(4),
        paddingRight: theme.spacing(4),
        paddingBottom: theme.spacing(4),
        borderRadius: '7px 40px 7px 40px',                
    },

    container_alt: {
        height : '68vh',
        width  : '90vw',
        position: 'absolute',
        top: `${100-68-10}vh`,
        textAlign: 'left',
        color: COLORS.text,
        background: COLORS.offBlack,
        margin: mobile ? '6px' : theme.spacing(4),
        paddingLeft  : theme.spacing(2),
        paddingRight : mobile ? theme.spacing(2) : theme.spacing(4),
        paddingBottom: theme.spacing(4),
        borderRadius: '7px 40px 7px 40px',                
    },

    container_left : {
        width     : mobile ? '100%': '50%',
        height    : '68vh',
        overflow  : 'hidden',
        overflowY : "scroll",
        textAlign: 'left',
    },

    container_right: {
        width     : mobile ? '100%' : '50%',
        height    : '71vh',
        paddingLeft : theme.spacing(2),
        paddingRight: theme.spacing(2),
        marginLeft: mobile ? '0px' : theme.spacing(4),
        borderRadius: mobile ? '0px' : '0px 40px 0px 0px',        
        marginRight: mobile ? "0px" : '-32px',
        background: mobile ? COLORS.offBlack : COLORS.black,
    },

    container_alt_mobile: {
        height : '80vh',
        width  : '100vw',
        position: 'absolute',
        top: `${100-68-10}vh`,
        // textAlign: 'center',
        background: COLORS.offBlack,
        color: COLORS.white,        
        // borderRadius: '7px 40px 7px 40px',                
    },


    container_right_mobile: {
        width     : '100%',
        height    : '71vh',
        background: COLORS.offBlack,
    },


    // blogger style

    //padding
    padding_1: {
        marginLeft : mobile ? '0px' : '10vw',
        marginRight: mobile ? '0px' : '10vw'
    },

    // font
    h1 : {
        // color: COLORS.text,
        fontFamily: 'NeueMachina-Black',
        fontSize:'30px',
        letterSpacing:'1px',
        lineHeight: '1.5em',
    },

    h1_alt : {
        fontFamily: 'NeueMachina-Black',
        fontSize  : mobile ? '3vh' : `5vh`,        
        textAlign : 'left',        
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(1),
    },


    h2 : {
        // color: COLORS.text,
        fontFamily: 'NeueMachina-Bold',
        fontSize:'24px',
        letterSpacing:'1px',
        lineHeight: '1.5em',
    },

    h3 : {
        // color: COLORS.text,
        fontSize:'20px',
        fontFamily: 'NeueMachina-Bold',
    },

    h3_btn: {
        fontSize:'20px',
        fontFamily: 'NeueMachina-Black',
    },

    h3_label : {
        fontSize:'12px',
        fontFamily: 'NeueMachina-Bold',       
        background:COLORS.red_1, 
        padding     : theme.spacing(0.5),
        paddingLeft : theme.spacing(1),
        paddingRight: theme.spacing(1),
        marginLeft  : theme.spacing(2),
        filter: 'brightness(0.7)'
    },

    h4 : {
        fontSize:'14px',
        letterSpacing: '1px',
        lineHeight: '1.7em',
        fontFamily: 'NeueMachina-Medium',       
        // color: COLORS.text,
        filter: `brightness(0.74)`,
    },

    quote: {
        // color: COLORS.text,
        fontSize:'25px',
        fontFamily: 'NeueMachina-UltraLight',
    },  

    // image blocks
    imageBlockleft : {
        marginLeft : mobile ? '0px' : '12vw',
        marginRight: mobile ? '0px' : '12vw'
    },
    
    hero_right: {
        textAlign: 'left',
        paddingLeft: theme.spacing(6),
        marginTop: mobile ? theme.spacing(2) : '15%',
    },

    cube_view: {
        // padding: theme.spacing(6),
        marginTop: theme.spacing(1),
        // marginTop: mobile ? '0px' : '-16px',
    },

    // other style
    activity_banner: {
        width: '100%',
        height: '68px',
        background: COLORS.red,
        // filter: RED_FILTER,
    },


}));

const inputPropsAbout = {
    fontSize : '14px',
    color    : COLORS.text,
    letterSpacing: '1px',
    lineHeight: '1.7em',
    textAlign   : 'left',
    fontFamily  : 'NeueMachina-Medium',
    filter: `brightness(0.74`,
}


/******************************************************
    @sale view
******************************************************/


/**
 *
 * @Use: render about view
 * 
 */
export default function AboutSaleView(props) {

    const isOnMobile = useCheckMobileScreen(800);
    const classes = useBloggerStyle(isOnMobile)();

    const { datasource } = props;

    var _style = {
        width: isOnMobile ? '100vw' : '60vw',
        paddingLeft: isOnMobile ? '12px' : `${4*12}px`
    }

    if ( isOnMobile ){
        _style['paddingRight'] = '12px';
        _style['marginRight']  = '0px';
        _style['marginLeft']   = '0px';
        _style['borderRadius'] = '5px';
    }

    return (
        <Stack direction={'row'} className={ classes.container_alt} style={_style}>
            <div className={classes.container_left} style={{width: isOnMobile ? '95%':'100%'}}>
                <CloseIconBlock {...props} close_style={isOnMobile ? {marginRight:'12px'} : {}} />
                {datasource.map((data) => {
                    return (
                        <Block {...props} data={data}/>
                    )
                })}
            </div>
            <Box sx={{ flexGrow: 1 }} />
        </Stack>
    )
}



/******************************************************
    @Use: text blocks
******************************************************/

/**
 *
 * @use: block
 *
 **/
function Block(props){

    const { data, disable_edit } = props;
    const { blocktype, text, left, right, datasource } = data;

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile, "")();    

    function Child(props){
        if ( blocktype === AppBloggerItem.text_h1 ){
            return (<Text_H1 {...props} {...data} label={text ?? ""}/>)
        } else if ( blocktype === AppBloggerItem.text_h2 ){
            return (<Text_H2 {...props} {...data} label={text ?? ""}/>)
        } else if ( blocktype === AppBloggerItem.text_h3 ){
            return (<Text_H3 {...props} {...data} label={text ?? ""}/>)
        } else if ( blocktype === AppBloggerItem.text_h4 ){
            return (<Text_H4 {...props} {...data} label={text ?? ""}/>)
        } else if ( blocktype === AppBloggerItem.progress ){
            return (<Text_progress {...props} {...data} label={text ?? ""}/>)
        } else if ( blocktype === AppBloggerItem.quote ){
            return (<Text_QUOTE {...props} label={text ?? ""}/>)
        } else if ( blocktype === AppBloggerItem.imageLeft ){
            return (<ImageBlockLeft {...props}/>)
        } else if ( blocktype === AppBloggerItem.youtube ){
            return (<YoutubeBlock {...props}/>)
        } else if ( blocktype === AppBloggerItem.space ){
            return (<br/>)
        } else if ( blocktype === AppBloggerItem.crew ){
            return (<Crewblock {...props} {...data} label={text ?? ""}/>)
        } else if ( blocktype === AppBloggerItem.social ){
            return (<SocialIconBlock {...props} datasource={datasource ?? []} />)
        } else if ( blocktype === AppBloggerItem.user_row  ){
            return (<UserRowBlock {...props} {...data} data={data}/>)
        } else {
            return (<br/>)
        }
    }

    return (<Child {...props} data={data}/>)
}


function CloseIconBlock({ on_close, close_style, flush_left }){
    return (
        <Stack direction='row' style={{marginTop:'24px', ...(close_style ?? {})}}>
            { flush_left ? <div/> :  <Box sx={{flexGrow:1}}/>}
            <WithChangeOpacity onClick={on_close}>
                <CloseIcon style={{cursor: 'pointer'}}/>
            </WithChangeOpacity>
            { !flush_left ? <div/> :  <Box sx={{flexGrow:1}}/>}
        </Stack>
    )    
}

/**
 *
 * @use: social media icon
 *
 **/
function SocialIconBlock({ style, container_style, centered, datasource }){    

    const icon_style = {
        marginLeft: '-18px',
        ...(style ?? {})
    }

    function on_click_icon(url){
        function go(){
            let win = window.open(url, '_blank');
            win.focus();        
        }
        return go;
    }

    function RenderIcon({ kind, link }){
        if ( trivialString(kind) || trivialString(link) ){
            return (<div/>)
        } else {
            if ( kind === dinstagram ){
                return (<PlayBackIcon onClick={on_click_icon(link)} style={icon_style} src={icon_ig}/>)
            } else if ( kind === dtwitter ){                
                return (<PlayBackIcon onClick={on_click_icon(link)} style={icon_style} src={icon_twitter}/>)
            } else if ( kind === dopensea ){                
                return (<PlayBackIcon onClick={on_click_icon(link)} style={icon_style} src={icon_opensea}/>)
            } else if ( kind === dimdb ){                
                return (<PlayBackIcon onClick={on_click_icon(link)} style={icon_style} src={icon_imdb}/>)
            } else if ( kind === ddiscord ){                
                return (<PlayBackIcon onClick={on_click_icon(link)} style={icon_style} src={icon_discord}/>)
            } else if ( kind === dwebsite ){                
                return (<PlayBackIcon onClick={on_click_icon(link)} style={{...icon_style}} src={icon_link}/>)
            } else {
                return (<div/>)
            }
        }
    }

    if ( trivialProps(datasource,'length') || datasource.length === 0 ){
        return <div/>
    } else {
        return (
            <Stack direction='row' style={{ ...(container_style ?? {})  }}>
                { centered ? <Box sx={{ flexGrow: 1 }} /> : <div/> }
                {datasource.map((data,index) => (
                    <RenderIcon {...data} key={index}/>
                ))}
                <Box sx={{ flexGrow: 1 }} />            
            </Stack>        
        )
    }
}


/**
 *
 * @Use: block button
 *
 */
function BlockButton(props){

    const isOnMobile = useCheckMobileScreen(1200);
    const classes = useBloggerStyle(isOnMobile)();
    const profileclasses  = useStyles(isOnMobile, true, false)();    

    return (
        <Button 
            variant="outlined" 
            color="error" 
            sx={ { borderRadius: `30px`, width: isOnMobile ? '40%' : '45%', marginTop: '16px'} }
            onClick = {() => {}}
            className={profileclasses.change_avatar_btn}
        >   
            <div className={ classes.h3_btn }>
                {(props.label ?? '').toUpperCase()}
            </div>
        </Button>              
    )        
}



function Text_H1({ label, left, right, editable, edit_add, on_click, style_left, style_right }){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile, "")();

    return (
        <div className = {bclasses.h1_alt}>
            <Stack direction='row'>
                <Stack direction='column'>
                    <div style={{fontSize:'64px', marginBottom:'12px', ...(style_left ?? {})}}>{(left ?? "").toUpperCase()}</div>
                    <div style={{fontSize:'32px', ...(style_right ?? {})}}>{(right ?? "").toUpperCase()}</div>                          
                </Stack>
                <Box sx={{flexGrow:1}}/>
                <Stack>
                { false && editable && !isOnMobile ?
                    <WithChangeOpacity onClick={on_click}>
                        { edit_add
                            ?                            
                            <AddIcon style={{cursor: 'pointer'}} style={{cursor: 'pointer', color: COLORS.text3}}/>
                            :
                            <EditIcon style={{cursor: 'pointer'}} style={{cursor: 'pointer', color: COLORS.text3}}/>
                        }
                    </WithChangeOpacity>
                    :
                    <div/>
                }
                </Stack>
            </Stack>
        </div>     
    )

}


function Text_H2({ label, left, right }){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile, "")();

    if ( false ){
        return (
            <div className = {bclasses.h1_alt}>
                <Stack direction='row'>
                    <Stack direction='column'>
                        <div style={{fontSize:'32px', marginBottom:'12px'}}>{(left ?? "").toUpperCase()}</div>
                        <div style={{fontSize:'16px'}}>{(right ?? "").toUpperCase()}</div>                          
                    </Stack>
                    <Box sx={{flexGrow:1}}/>
                </Stack>
            </div>     
        )
    } else {
        return (
        <Stack direction='row'>
            <div className={bclasses.h2}>
                {`${label ?? ""}`}
            </div>
        </Stack>
        )
    }
}



function Text_H3({ label }){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile, "")();

    return (
        <div className={bclasses.h3}>
            {label ?? ""}
        </div>
    )
}


function Text_H4({ label }){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile, "")();

    return (
        <AppTextFieldNoUnderLine 
            disabled
            multiline
            value = {label}
            style = {{ width: '100%', marginTop: '12px', height:'fit-content' }}
            inputProps={{style: inputPropsAbout}}
        />    
    )
}

function Text_QUOTE({ label }){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile, "")();

    return (
        <Stack direction='row'>
            <div style={{borderLeft: `1px solid ${COLORS.text3}`, marginRight:'24px'}}/>
            <h3 className={bclasses.quote}>
                {label ?? ""}
            </h3>
        </Stack>
    )
}

/**
 * 
 * @use: progress text
 *
 **/
function Text_progress({ label, left, right, done }){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile, "")();

    return (
        <Stack direction='row'>
            <div className={bclasses.h3}>
                {label ?? ""}
            </div>
            <div className={bclasses.h3_label} style={ done ? {} : {background: COLORS.black}}>
                {done ? 'completed' : 'ongoing' }
            </div>
            <Box/>
        </Stack>
    )    

}


/**
 *
 * @Use: crew block
 *
 **/
function Crewblock(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile)();

    const { user_cache,crewUserID, style, editable, icon_datasource, on_click } = props;

    const [ _img, eimg ] = useState("");
    const [ _about, eabout ] = useState("")
    const [ _name, ename ] = useState("");
    const [ sprite_str, esprite_str ] = useState("");
    const [ social_icons, esocial_icons ] = useState(icon_datasource);

    useEffect( async () => {
        await user_cache.get({ userID: crewUserID ?? "", then: (user) => {
            if ( trivialProps(user,'userID') || trivialString(user.userID) ){
                return 
            }
            eimg( user.profile_image_preview_url );           
            ename( user.name ?? "" );
            eabout(user.bio ?? "")
            esocial_icons(to_social_links(user.view));
            esprite_str( user.sprite_str_default() );

        }});
    }, [ crewUserID ])    

    const sprite_style = { 
        background:'black', 
        height: 'fit-content', 
        width: isOnMobile ? '90vw' : "20vw", 
        marginRight: isOnMobile ? '0px' : '24px' 
    }

    return (
        <Stack direction={ isOnMobile ? 'column' : 'row'} style={style ?? {}}>
            <Stack direction={'column'} style={{marginBottom:'24px'}}>
                { trivialString(_img)  
                    ? 
                    <div style={sprite_style}>
                        <identicon-svg 
                            username={sprite_str}
                            saturation="95"
                            lightness="60"
                        />
                    </div>
                    : 
                    <AppImageView   
                        width  = { isOnMobile ? '90vw' : '20vw'}
                        imageDidLoad = {() => {return}}
                        preview_url  = {_img}
                        imgSrc       = {_img}
                        type         = {urlToFileExtension(_img)}
                    />   
                }
                <SocialIconBlock {...props}  
                    centered 
                    datasource={icon_datasource} 
                    style={ isOnMobile ? {marginTop: '18px'} : { marginTop: '8px'}}
                />
            </Stack>
            <Stack direction='column' style={{marginLeft: isOnMobile || trivialString(_img) ? '0px' : '24px', marginBottom: '24px', width: '100%'}}>            
                <Stack direction='row'>
                    <div className={bclasses.h3} style={{background:COLORS.black,  padding:'12px', width: 'fit-content'}}>
                        {_name ?? ""}
                    </div>
                    <Box sx={{flexGrow:1}}/>
                    { false && editable && !isOnMobile ?
                        <WithChangeOpacity onClick={on_click}>
                            <EditIcon style={{cursor: 'pointer'}}/>
                        </WithChangeOpacity>
                        :
                        <div/>
                    }
                </Stack>
                <div className={bclasses.h4}>
                <br/>
                {_about ?? ""}
                </div>
            </Stack>  
        </Stack>
    )
}


/**
 *
 * @use: one narrow row of users
 *
 **/
function UserRowBlock(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile)();
    const { 
        onClick,
        data, 
        user_cache,
        userID,
        row_style,
        on_click,
        h1_style,
        h1,
        h2,
        h3,
        h4,
        image_right_url, 
    } = props;

    const [ _img, eimg ] = useState("");
    const [ _name, ename ] = useState(h1 ?? "");
    const [ seed_str, eseed_str ] = useState("");

    useEffect( async () => {
        if ( trivialProps(user_cache,'get') ){
            return;
        } else {
            await load_user();
            setTimeout(async () => {
                await load_user()
            },1000)
        }
    }, [])    

    async function load_user(){
        await user_cache.get({ userID: userID ?? "", then: (user) => {
            if ( trivialProps(user,'userID') || trivialString(user.userID) ){
                return 
            }
            eimg( user.profile_image_preview_url );           
            ename( user.name ?? "" );
            eseed_str(user.sprite_str_default());
        }});        
    }

    function _onClick(){
        if ( typeof onClick === 'function' ){
            onClick(data);
        }
    }

    const cell_style_h1 = {
        fontFamily: 'NeueMachina-Bold',
        fontSize: `calc(18px+1vw)`,
        color: COLORS.text2,
        borderBottom: '0px solid transparent',
    };

    const cell_style_h2 = {
        fontFamily: 'NeueMachina-Regular',
        fontSize: `calc(18px+1vw)`,
        color: COLORS.text2,
        borderBottom: '0px solid transparent',
    };    

    const _row_style = {
        ...(row_style ?? {}),
        borderBottom: '0px solid transparent',        
        cursor: typeof onClick === 'function' ? 'pointer' : 'auto',
    }

    return (
        <TableRow style={_row_style} onClick={_onClick}>
            { trivialString(_img) && trivialString(seed_str)
                ?
                <div/>
                :
                trivialString(_img)
                ?
                <div style={{width:'36px', height:'36px', marginLeft:'18px', marginTop:'8px'}}>
                    <identicon-svg 
                        username={seed_str}
                        saturation="95"
                        lightness="60"
                    />                
                </div>
                :
                <TableCell style={cell_style_h1} align={'left'}>
                    <AppImageView   
                        height = {'36px'}
                        width  = {'36px'}
                        imageDidLoad = {() => {return}}
                        preview_url  = {_img}
                        imgSrc       = {_img}
                        type         = {urlToFileExtension(_img)}
                        imgStyle     = {{borderRadius:'6px'}}
                    />   
                </TableCell>
            }
            <TableCell style={cell_style_h1} align="left">{_name}</TableCell>
            <Box sx={{flexGrow:1}}/>
            { trivialString(h2) 
                ? 
                <div/> 
                :
                <TableCell style={cell_style_h2} align="left">{h2 ?? ""}</TableCell>
            }
            {
                trivialString(h3) ? <div/> :
                <TableCell style={cell_style_h2} align="left">{h3 ?? ""}</TableCell>
            }
            {
                trivialString(h4) ? <div/> :
                <TableCell style={cell_style_h2} align="left">{h4 ?? ""}</TableCell>
            }            
            {
                trivialString(image_right_url)
                ?
                <div/>
                :
                <TableCell style={cell_style_h1} align={'right'}>
                    <AppImageView   
                        height = {'36px'}
                        width  = {'36px'}
                        imageDidLoad = {() => {return}}
                        preview_url  = {image_right_url}
                        imgSrc       = {image_right_url}
                        type         = {urlToFileExtension(image_right_url)}
                    />   
                </TableCell>
            }
        </TableRow>        
    )

}


/**
 *
 * @Use: explain hero
 *
 **/
function YoutubeBlock(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile)();

    const { data } = props;
    const { url } = data;
    return (

        <Stack direction='row' className={bclasses.cube_view}>          
        {
            isOnMobile
            ?
            <AppImageView   
                width = {'100vw'}
                imageDidLoad = {() => {return}}
                preview_url  = {url}
                imgSrc       = {url}
                videoSrc     = {url}
                type         = {urlToFileExtension('lumo_cubes')}
            />   
            :               
            <AppImageView   
                height = {'50vh'}
                imageDidLoad = {() => {return}}
                preview_url  = {url}
                imgSrc       = {url}
                videoSrc     = {url}
                type         = {urlToFileExtension('lumo_cubes')}
            />   
        }
        </Stack>        

    )
}



/**
 *
 * @Use: explain hero
 *
**/
function ImageBlockLeft({ style, single_column }){

    const isOnMobile = useCheckMobileScreen(1000);
    const bclasses   = useBloggerStyle(isOnMobile)();


    let img_url = 'https://fringedrifters.com/assets/Grid_02.00d79771.webp'

    if ( single_column ){

        return (
            <Stack direction={'column'}>

                <Stack direction={'row'}>
                    <Box sx={{ flexGrow: 1 }} />
                    <AppImageView   
                        width  = { isOnMobile ? '90vw' : '30vw'}
                        imageDidLoad = {() => {return}}
                        preview_url  = {img_url}
                        imgSrc       = {img_url}
                        type         = {urlToFileExtension(lumo_cubes)}
                    />   
                    <Box sx={{ flexGrow: 1 }} />
                </Stack>

                <Stack direction={'row'}>
                    <Box sx={{ flexGrow: 1 }} />
                    <Stack direction='column' className={bclasses.h4} style={{align:'center'}}>
                        <div style={{background:'black',padding:'8px'}}>
                            {'IN SUCCESS, THE FRINGE AIMS TO TRANSCEND THE CURRENT FRAMEWORK OF IP OWNERSHIP.'}
                        </div>
                        <br/>
                        {'the dream is for the entire cinematic universe of THE FRINGE to be controlled and guided by our community of fans, creators, and artists...the Drifters.'}
                        <br/><br/>
                        {'long term, our ambition is to develop the legal framework for a new way to make films, one in which control is placed in the hands of the people who care most about the world and its characters rather than the whims of a profit-seeking corporation.'} 
                        <br/>
                    </Stack>            
                    <Box sx={{ flexGrow: 1 }} />
                </Stack>
            </Stack>
        )

    } else {
        return (
            <Grid container columns={{xs:1,s:1,md:1,lg: 2}} className={bclasses.imageBlockleft} style={style ?? {}}>

                <Grid item xs={12} sm={12} md={12} lg={6} style={{marginBottom:'24px'}}>
                    <AppImageView   
                        width  = { isOnMobile ? '90vw' : '30vw'}
                        imageDidLoad = {() => {return}}
                        preview_url  = {img_url}
                        imgSrc       = {img_url}
                        type         = {urlToFileExtension(lumo_cubes)}
                    />   
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={6}>

                    <Stack direction='column' className={bclasses.h4} style={{align:'center'}}>
                        <div style={{background:'black',width:'75%', padding:'8px'}}>
                            {'IN SUCCESS, THE FRINGE AIMS TO TRANSCEND THE CURRENT FRAMEWORK OF IP OWNERSHIP.'}
                        </div>
                        <br/>
                        {'the dream is for the entire cinematic universe of THE FRINGE to be controlled and guided by our community of fans, creators, and artists...the Drifters.'}
                        <br/><br/>
                        {'long term, our ambition is to develop the legal framework for a new way to make films, one in which control is placed in the hands of the people who care most about the world and its characters rather than the whims of a profit-seeking corporation.'} 
                        <br/>
                    </Stack>            
                </Grid>                         

            </Grid>
        )
    }
}

export { UserRowBlock, CloseIconBlock, useBloggerStyle, Text_H1, Text_H2, Text_H3, Text_H4 }

