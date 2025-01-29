/**
 * @Package: Header
 * @Date   : Dec 22nd, 2021
 * @Author : Xiao Ling   
 * @Docs:
 *   - chat style: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/App.js
 *   - chat full: https://github.com/Wolox/react-chat-widget
 *   - the console used: https://github.com/linuswillner/react-console-emulator
 *   - other console: https://github.com/webscopeio/react-console
 *   - mui lib: https://mui.com/components/text-fields/
 *
*/


import React, { Component, useState, useEffect} from 'react'
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { BootstrapTooltip } from './../components/UtilViews';

import { COLORS } from './../components/constants'
import PancakeView from './../components/PancakeView'
import AppImageView from './../components/AppImageView'
import { CubeProgressView } from './../components/CubeTable';
import './../components/animation.css'

import useCheckMobileScreen, {useSafari} from './../hoc/useCheckMobileScreen';

import lumologo from './../assets/lumologo_white-small.png';
import metamask from './../assets/lumored.jpeg'
import lumoname_logo_small from './../assets/lumonamewhite-tiny.png'

import {
    illValued,
    trivialProps,
    trivialString,
} from './../model/utils'

import {GLOBAL_STAGING} from './../model/core';

import DialogEditProfile from './../dialogs/DialogEditProfile';
import DialogAuthWithEmail from './../dialogs/DialogAuthWithEmail';
import DialogMinted from './../dialogs/DialogMinted';
import DialogIphone from './../dialogs/DialogIphone';

import withAuth from './../hoc/withAuth';
import withRouter from './../hoc/withRouter';
import { identicon } from 'minidenticons';
import { CenterVerticalView } from './../components/UtilViews'

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

/******************************************************
    @View base
******************************************************/


/***
 *
 * @use: app header with dialog popus, 
 *       delegate for job cache to show when 
 *       a job is active
 *
 **/
class AppHeaderPage extends Component {

    state = {
        open_minted: false, 
        open_email: false,
        open_profile: false,
        open_iphone: false,
        show_job_progress: false,
    }

    // set job-service delegate to this
    async componentDidMount(){
        const { job_cache, web3_job_cache } = this.props;
        if ( !illValued(job_cache) ){
            job_cache.delegate = this;
        } 
        if ( !illValued(web3_job_cache) ){
            web3_job_cache.delegate = this;
        }
    }

    willPushJob = (job) => {
        this.setState({ show_job_progress: true })
    }
    
    didFinishJob = (job) => {
        this.setState({ show_job_progress: false })
    }

    eopen_email = (b) => {
        this.setState({ open_email: b });
    }

    eopen_profile = (b) => {
        this.setState({ open_profile: b })
    }

    eopen_minted = (b) => {
        this.setState({ open_minted : b })
    }

    eopen_iphone = (b) => {
        this.setState({ open_iphone: b })
    }

    render(){
        return (
            <div>
                <AppHeaderView
                    {...this.props}
                    show_job_progress   = {this.state.show_job_progress}
                    open_email_auth = {() => { this.eopen_email(true) }}
                    open_profile    = {() => {  this.eopen_profile(true) }}
                    open_minted     = {() => { this.eopen_minted(true) }}
                    open_iphone     = {() => { this.eopen_iphone(true) }}
                />
                <DialogEditProfile
                    {...this.props}
                    open={this.state.open_profile}
                    handleClose={() => { this.eopen_profile(false) }}
                />           
                { this.state.open_iphone
                    ?
                    <DialogIphone
                        {...this.props}
                        open    = {this.state.open_iphone}
                        handleClose={() => { this.eopen_iphone(false) }}
                    />
                    :
                    <div/>
                }
                <DialogMinted
                    {...this.props}
                    open    = {this.state.open_minted}
                    handleClose={() => { this.eopen_minted(false) }}
                />
                <DialogAuthWithEmail
                    {...this.props}
                    open    = {this.state.open_email}
                    handleClose={() => { this.eopen_email(false) }}
                />
            </div>            
        )
    }
}


/**
 *
 * @Use: app header
 * @Doc: https://mui.com/components/app-bar/ 
 *
 */
function AppHeaderView(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();

    const { 

        simple,
        showLeft,
        userid,
        show_job_progress,
        header_gradient,
        didSyncAuthState,

        user_cache,

        open_profile,
        open_email_auth,
        open_minted,
        open_iphone,

        tellUser,
        reauthenticate,
        _hoc_sign_up_with_metamask,
        _hoc_does_user_have_account,
        navigate,

    } = props;

    
    // vew states
    const [ _user, euser ] = useState("");
    const [ profile_url, setProfileURL ] = useState("");
    const [ has_metamask, ehas_metamask] = useState(false);
    const [ _show_progress, e_show_progress ] = useState(show_job_progress);

    useEffect(async () => {
        await mount_user();
    },[userid]);

    // on user synced auth state, determine 
    // whether user has metamask
    useEffect(async () => {
        const { ethereum } = window;
        ehas_metamask( !illValued(ethereum) );        
    }, [didSyncAuthState]);

    // add/remove progress indicator
    useEffect(() => {
        e_show_progress(show_job_progress)
    },[show_job_progress])


    // mount user 
    async function mount_user(){
        if ( trivialProps(user_cache, 'getAdminUser') ){
            return;
        }
        let user = await user_cache.getAdminUser();
        euser(user);
        if ( !trivialProps(user,'profile_image_preview_url') ){
            setProfileURL( user.profile_image_preview_url )
        }        
    }

    // @use: global sign up entry point
    async function onSignUp(){
        if ( has_metamask ){
            e_show_progress(true)
            await _hoc_sign_up_with_metamask({ then: async ({ success, message }) => {
                e_show_progress(false);
                if ( !success ){
                    _tellUser(message);
                } else {
                    await reauthenticate();
                }
            }});
        } else {
            open_email_auth();
        }
    }

    function navToSlate(){
        navigate('/slate')
    }

    function seed_str(){
        if ( trivialProps(_user,'sprite_str_default') ){
            return ""
        } else {
            return _user.sprite_str_default();
        }
    }

    function _tellUser(str){
        if (typeof tellUser === 'function'){
            tellUser(str)
        }
    }


    const [ loading, eloading ] = useState(true);
    useEffect(() => {
        setTimeout(() => {
            eloading(false);
        },1500)
    },[])


    // do nothing for now
    function onClickLogo(){
        return;
    }    

    return (
        <AppBar 
            elevation={0}  
            position="static"
            color="transparent"
            className={classes.header}
            style={{...header_gradient, height:'74px', paddingBottom: showLeft ? '65px' : '0px' }}
        >
            <Toolbar>

                { showLeft 
                    ?
                    <LumoLogoWithText onClickLogo={onClickLogo} {...props}/>
                    : 
                    <div/>
                }

                <Box sx={{ flexGrow: 1 }} />

                <Stack direction='row' style={{}}>

                    <CenterVerticalView>
                    {
                        (trivialString(userid) || simple) || !didSyncAuthState
                        ? 
                        <div/>
                        :
                        GLOBAL_STAGING
                        ?
                        <IconButton
                            size="large"
                            onClick={open_iphone}
                            style={{
                                marginRight:'8px', 
                                width:'34px', 
                                height:'34px',
                            }}
                        >                               
                            <BootstrapTooltip title='Link with iphone app'>
                                <PhoneIphoneIcon style={{color:COLORS.text}}/>
                            </BootstrapTooltip>
                        </IconButton>
                        :
                        <div/>
                    }
                    </CenterVerticalView>


                    <CenterVerticalView>
                    {
                        trivialString(userid) || simple || !didSyncAuthState
                        ?
                        <div/>
                        :
                        <PancakeView underlay_style={{filter:'blur(5px)'}} show_top >
                            <IconButton
                                size="large"
                                onClick={open_minted}
                                style={{
                                    transform:'rotate(45deg)', 
                                    marginRight:'8px', 
                                    width:'34px', 
                                    height:'34px',
                                    background: _show_progress ? 'black' : 'transparent'    
                                }}
                            >   
                                <BootstrapTooltip title='All your passes are here'>
                                    { _show_progress
                                        ?
                                        <CubeProgressView/>
                                        :                                    
                                        <QrCodeScannerIcon style={{ color: COLORS.text }}/>
                                    }
                                </BootstrapTooltip>
                            </IconButton>
                        </PancakeView>
                    }
                    </CenterVerticalView>

                    <CenterVerticalView>
                    {   simple
                        ? 
                        <div/>
                        : 
                        trivialString(userid)
                        ?
                        <Button onClick={onSignUp}>
                            {
                                didSyncAuthState
                                ?
                                <div className={classes.metamask_button} style={{marginTop:'-4px'}}>
                                    { ( has_metamask
                                        ? (isOnMobile ? 'metamask' : 'connect metamask')
                                        : ('Sign up')
                                        ).toUpperCase()
                                    }
                                </div>
                                :
                                <div/>
                            }

                        </Button>  
                        :
                        <IconButton
                            size="large"
                            onClick={open_profile}
                            className={classes.iconButton}
                        >                                                          
                            <div style={{
                                width: '40px', 
                                height:'40px', 
                            }}>
                            {
                                loading
                                ?
                                <div style={{marginTop:'4px'}}>
                                    <CubeProgressView/>
                                </div>
                                :
                                trivialString(profile_url)
                                ?
                                <identicon-svg 
                                    username={seed_str()}
                                    saturation="95"
                                    lightness="60"
                                />
                                :
                                <div style={{marginTop:'5px'}}>
                                    <AppImageView 
                                        showStatic
                                        corner = {'5px'}
                                        width  = {'30px'}
                                        height = {'30px'}
                                        preview_url  = { profile_url ?? metamask}
                                        imgSrc       = { profile_url ?? metamask}
                                        imgStyle  = {{}}
                                    />    
                                </div>                                    
                            }                                     
                            </div>
                        </IconButton>
                        }
                        </CenterVerticalView>
                </Stack>  
            </Toolbar>  
            { showLeft ? <div className={classes.headerLine}/> : <div/> }
        </AppBar>
    );
}






/******************************************************
    @View components
******************************************************/


/**
 *
 * @Use: Lumo logo with lineage text
 * @ALT: <><>Hou<span id={span_name}>se&nbsp;</span>of</> {token_lineage}</>
 *
 **/
function LumoLogoWithText(props){

    const isSafari = useSafari();
    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile, isSafari)();    
    const { onClickHome, name, simple, story_view, at_home, house_view } = props;

    const [ span_name, set_span_name ] = useState('offset')

    useEffect(() => {
        setTimeout(() => {
            set_span_name('animate-done')
        },3500)
    },[])


    let _name = typeof name === 'string' ? (name ?? "") : ""
    let name_frag_1 = _name.slice(0,3)
    let name_frag_2 = _name.slice(3,5)
    let name_frag_3 = _name.slice(5, _name.length)
    let name_frag_mobile = _name.slice(0,10)


    return (
        <PancakeView underlay_style={{filter:'blur(5px)'}} show_top >
            <Stack direction='row'>
                <img src={lumologo} alt="" className={classes.logoDiagram} onClick={onClickHome}/>
                <BootstrapTooltip title={'You are backstage, this is where you organize your project'}>
                <div className={classes.lineage_text}>       
                    { false //simple || at_home
                        ?
                        <img src={lumoname_logo_small} alt="" className={classes.logo}/>        
                        : story_view
                        ?  <>Sto<span id={span_name}>ri</span>es</>
                        : house_view
                        ? <>HOU<span id={span_name}>S</span>ES</>
                        : isOnMobile
                        ? <>{name_frag_mobile}</>
                        : <>{name_frag_1}<span id={span_name}>{name_frag_2}</span>{name_frag_3}</>
                    }
                </div>
                </BootstrapTooltip>
            </Stack>
        </PancakeView>                    
    )
}



/**
 *
 * @Use:logo for lumo, either text or logo png
 *
 **/
function LumoLogo(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();    

    return (
        <img src={lumologo} alt="" className={classes.logoDiagram}/>        
    )
}



const useStyles = (isOnMobile, isSafari) => makeStyles((theme) => createStyles({

    header: {
        paddingLeft  : theme.spacing(2),
        paddingRight : theme.spacing(2),
        paddingTop   : theme.spacing(2),
        background   : COLORS.offBlack,
        // maxHeight: isOnMobile ? '50px' : '80px',
    },    


    headerLine: {
        borderBottom: `0.8px solid ${COLORS.translucent}`,
        marginLeft:theme.spacing(3)*-1,
        marginRight:theme.spacing(3)*-1,
    },    

    logoDiagram: {
        height: '50px',
        opacity: 0.9,
        paddingBottom: theme.spacing(1),
        filter: COLORS.offwhite_filter,
        // cursor: 'pointer',              
    },

    logo : {
        height: '35px',
        marginTop: '-10px',
        paddingBottom: theme.spacing(1),        
        filter: COLORS.offwhite_filter,
    },
   
    // logo with text container
    lineage_text: {
        fontSize  : '25px',     
        fontFamily: 'NeueMachina-Bold',
        letterSpacing: '1px',
        color     : COLORS.text3,
        paddingLeft: theme.spacing(1.5),
        marginLeft : theme.spacing(1.5),
        marginTop  : theme.spacing(1.2),
        height     : '35px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeft: `1px solid ${COLORS.translucent2}`,        
        filter: isSafari ? "" : COLORS.offwhite_filter,
    },

    header_link : {
        cursor      : 'pointer',
        color       : COLORS.text2,
        fontSize    : '14px',
        fontFamily  : 'NeueMachina-Medium',
        marginTop   : theme.spacing(3),
        paddingRight: theme.spacing(3),
    },

    flicker : {
        animation: 'text-flicker 3s linear infinite',        
    },

    // text
    statsText : {
        color: 'white',
        fontFamily: 'NeueMachina-Light',        
        fontSize: '15px',
        filter: COLORS.offwhite_filter,        
        paddingTop: theme.spacing(2),
    },

    iconButton: {
    },

    // header menu
    menuContainer: {
        "& .MuiPaper-root": {
            backgroundColor: COLORS.offBlack,
            color: 'white',
        }
    },

    menuItem: {
        "& .MuiPaper-root": {
            fontFamily: 'NeueMachina-Light',        
            fontSize: '13px',                    
        }
    },


    metamask_button : {
        fontSize    : '12px',
        color       : 'white',                
        fontFamily  : 'NeueMachina-Black',
        textAlign   : 'left',        
        // border      : `1px solid ${COLORS.green_1}`,
        textShadow  : `var(--green-glow)`,
        borderRadius: '6px',
        padding     : theme.spacing(2),
    },    
}));



/******************************************************
    @export
******************************************************/ 

export default withAuth(withRouter(AppHeaderPage));
export { LumoLogo }



