/** *
 * @Package: DialogSetting
 * @Date   : 5/30/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Tippy from "@tippyjs/react";
import Switch from '@mui/material/Switch';

import { CenterHorizontalView } from './../components/UtilViews';

import AppSnackbar from './../components/AppSnackbar';
import { AppTextField } from './../components/ChatTextInput'

import AppImageView from './../components/AppImageView'
import {UploadByDragAndSave} from './../components/CubeTableFileUpload'

import { TwoRowLabel, AboutTextAttribute, AboutAttributeSimple } from './DialogUtils';
import { ActionProgressWithProgress } from './../components/ButtonViews';

import { 
    illValued,
    trivialString,
    trivialProps,
    trivialNum,
}  from './../model/utils';

import { urlToFileExtension } from './../model/core';

import { 
    useStyles, 
    useDialogStyles,
    useApplyStyles, 
    BluePillButton,
    FooterInstruction, 
} from './DialogUtils';

import { COLORS } from './../components/constants';

import withAuth from './../hoc/withAuth';
import withRouter from './../hoc/withRouter';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';


/******************************************************
    @style
******************************************************/

const inputPropsTitle = {
    fontSize: `4vh`,
    fontFamily: 'NeueMachina-Black',    
    color     : COLORS.text,
    marginTop: '-32px',
}

const inputPropsLink = {
    fontSize: `1.8vh`,
    fontFamily: 'NeueMachina-Light',    
    color     : COLORS.text,
}

const inputPropsSetting = {
    fontSize: `2vh`,
    fontFamily: 'NeueMachina-Light',    
    color     : COLORS.text3,
}

const about_style_top = {
    borderTop: '0px solid white',
}

const about_style = {
    borderTop: '0px solid white',
    marginTop: '-32px'
}

const about_style_bot = {
    borderTop: '0px solid white',
    marginBottom: '-32px'
}

const SettingPageKind = {

    about : 'about',
    basic : 'basic',
    logo  : 'logo',
    heroimg: 'heroimg',

    confirm_proposal: 'confirm_proposal',
    edit_master: 'edit_master',

    trailerexplain: 'trailerexplain',
    traileropts: 'traileropts',
    trailermp4 : 'trailermp4',
    trailerlink: 'trailerlink',
    issuetrailertickets: 'issuetrailertickets',
    did_issuetrailertickets: 'did_issuetrailertickets',
    claimwhitelist: 'claimwhitelist',
    did_claimwhitelist: 'did_claimwhitelist'


}

/******************************************************
    @view: exported
******************************************************/

const dname      = 'film name'
const dwebsite   = 'website link'
const ddiscord   = 'discord link'
const dinstagram = 'instagram link'
const dtwitter   = 'twitter link'
const dabout     = 'about this film'
const dlink      = 'youtube link to trailer'
const dnumtix    = 'number of spots'
const dexpdate   = 'ticket expiration date'

/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogSetting(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const dclasses   = useDialogStyles(isOnMobile)();    
    const classes    = useStyles(isOnMobile, true, false)();    
    // const tclasses   = useNftvieWstyles(isOnMobile, "")();

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        slot,
        make_trailer,
        make_claim,
        is_edit,
        handleClose,
        snackMessage, 
        showSnack, 
        job_cache, 
        user_cache,
        storyboard,
        did_succeed_in_posting,
        did_success_whitelist,
    } = props;
        
    const [ pagekind, epagekind ] = useState(SettingPageKind.basic);
    const [ showProgress, eshowProgress ] = useState(false)
    const [ title, etitle ] = useState('Add Block')
    const [ btn_label, ebtn_label ] = useState("Select")

    // basics
    const [ name,  ename  ]         = useState(dname);
    const [ about, eabout ]         = useState(dabout);
    const [ discord, ediscord ]     = useState(ddiscord);
    const [ instagram, einstagram ] = useState(dinstagram);
    const [ website, ewebsite ]     = useState(dwebsite);
    const [ twitter  , etwitter   ] = useState(dtwitter);
    const [ link , elink  ]         = useState(dlink);
    const [ did_propose, edid_propose ] = useState(false);

    // files
    const [ trailerfile, setTrailerFile ] = useState(false);
    const [ logofile   , setLogoFile ]    = useState(false);
    const [ posterfile , setposterfile ]  = useState(false);
    const [ _logo_url, elogo_url ] = useState("");
    const [ _poster_url, eposter_url ] = useState('');

    // tix
    const [ numtix, enumtix ]   = useState(dnumtix)
    const [ expdate, eexpdate ] = useState(dexpdate)

    // navigation + footer data
    const [ forceNext, eforceNext ] = useState(false)
    const [ footer_left, efooter_left ] = useState("")
    const [ footer_right, efooter_right ] = useState("")
    const [ footer_bottom, efooter_bottom ] = useState("")

    /******************************************************
        @mount
    ******************************************************/    

    // set page kind
    useState(() => {
        var st = SettingPageKind.basic;
        if ( make_trailer ){
            st = SettingPageKind.trailerexplain
        } else if ( is_edit ){
            st = SettingPageKind.edit_master
        } else if ( make_claim ){
            st = SettingPageKind.claimwhitelist
        }
        setPageView( st )
        setTimeout(() => {
            setFooter()
        },1000)
    },[open])

    // load data if is editing
    useEffect(async () => {

        if ( !is_edit || trivialProps(storyboard,'root') ){ return }

        const { discord, image_url, logo_url, instagram, twitter, website, about } = storyboard.root;

        ename(storyboard.get_name());
        ediscord(discord ?? ddiscord)
        einstagram(instagram ?? dinstagram);
        etwitter(twitter ?? dtwitter);
        eabout(about ?? "")  ;
        
        eposter_url(image_url ?? "");
        elogo_url(logo_url ?? "");

    },[open])


    /******************************************************
        @main POST responder
    ******************************************************/    

    function goHandleClose(){
        if ( make_trailer ){
            setPageView(SettingPageKind.trailerexplain)
        } else if ( is_edit ){
            setPageView(SettingPageKind.edit_master)
        } else if ( make_claim ){
            setPageView(SettingPageKind.claimwhitelist)
        } else {
            setPageView(SettingPageKind.basic)
            ename(dname)
            eabout(dabout)
            setTrailerFile(false);
            setLogoFile(false);
            setposterfile(false);
            ediscord(ddiscord)
            einstagram(dinstagram)
            ewebsite(dwebsite)
            etwitter(dtwitter)
            elink(dlink)
        }
        handleClose();
        setFooter();
    }


    // sign in if user is not
    async function onPressActionButton(){

        const { user_cache, _hoc_read_metamask, _hoc_sign_up_with_metamask } = props;        

        let is_authed = user_cache.isAuthed();

        if ( is_authed ) {
            increment_dialog_page();
        } else {
            eshowProgress(true)
            await _hoc_read_metamask({ then: async ({success, message, pk}) => {

                if ( trivialString(pk) ){

                    eshowProgress(false);
                    tellUser('Your metamask is not connected, please login to Metamask to continue');

                } else {

                    tellUser(`connecting to ${pk}`)

                    // sign up immediately w/ metamask
                    await _hoc_sign_up_with_metamask({ then: async (res) => {
                        eshowProgress(false);
                        if ( res.success ){
                            tellUser(`we validated your metamask at ${pk}`)
                            increment_dialog_page();
                        } else {
                            tellUser(`Oh no! we cannot authenticate your identity because ${res.message}`)
                        }
                    }});
                }

            }});
        }
    }

    function uploadTrailerLink(){
        setPageView(SettingPageKind.trailerlink)
    }
    function uploadTrailerMp4(){
        setPageView(SettingPageKind.trailermp4)
    }

    function goSetTrailerFile(file){
        if ( trivialProps(file,'type') || file.type !== "video/mp4" ){
            tellUser("please upload an mp4")
        } else {
            setTrailerFile(file)
        }
    }


    /**
     *
     * @use: go to next page or upload film proposal
     *
     **/
    async function increment_dialog_page(){

        const on_trailer = [ SettingPageKind.trailermp4, SettingPageKind.trailerlink ]

        if ( pagekind === SettingPageKind.about ){

            setPageView(SettingPageKind.basic)  

        } else if ( pagekind === SettingPageKind.basic ){

            if ( trivialString(name) || name === dname || trivialString(about) || about === dabout ){
                tellUser("Please enter name and about")
            } else {
                setPageView(SettingPageKind.heroimg)
                // setPageView(SettingPageKind.logo)
            }

        // skipped
        } else if ( pagekind === SettingPageKind.logo ){

            if ( did_propose ){
                setPageView(SettingPageKind.confirm_proposal)                            
            } else if ( forceNext ){
                eforceNext(false)
                setPageView(SettingPageKind.heroimg)            
            } else if ( illValued(logofile) || !logofile ){
                ebtn_label("Proceed anyways")
                eforceNext(true)
                tellUser("Please provide a film logo")
            } else {
                setPageView(SettingPageKind.heroimg)            
            }

        } else if ( pagekind === SettingPageKind.heroimg ){

            if ( did_propose ){

                setPageView(SettingPageKind.confirm_proposal)                            

            } else if ( forceNext ){

                eforceNext(false);
                edid_propose(true);
                setPageView(SettingPageKind.confirm_proposal);            

            } else if ( illValued(posterfile) || !posterfile ){

                eforceNext(true);
                ebtn_label("Proceed anyways");
                tellUser("Please provide a film poster");

            } else { 

                setPageView(SettingPageKind.confirm_proposal)            
                edid_propose(true);
            }            

        } else if ( pagekind === SettingPageKind.confirm_proposal ){

            tellUser("setting up project now")

            // post proposal, set jobCache-recent project to this propsoal
            // redirect to page, if not authed before, then reload, page, and then redirect
            // on redirect to page, on redirect to page, 
            // issue trailer-nfts for airdrop
            eshowProgress(true);

            await job_cache.post_film_proposal({
                slot         : slot,
                name         : name,
                about        : about,
                twitter      : twitter, 
                instagram    : instagram,
                website      : website,
                discord      : discord,
                logo_file    : logofile,
                poster_file  : posterfile,
                trailer_file : trailerfile,
                then_uploading: (str) => { tellUser(str) },
                then_progress: (str) => { tellUser(str) },
                then: async ({ success, message, address }) => {

                    if ( !success || trivialString(address) ){
                        eshowProgress(false);
                        return tellUser(message)
                    } else {
                        tellUser('One more second!')
                        setTimeout(() => {
                            eshowProgress(false);
                            did_succeed_in_posting({ address: address });
                            handleClose();
                        },1000)
                    }
                }
            })

        } else if (  pagekind === SettingPageKind.edit_master ){

            eshowProgress(true);
            await job_cache.edit_film_proposal({
                storyboard: storyboard,
                projectID: storyboard.get_id(),
                about    : about     === dabout ? "" : (about ?? ""),
                twitter  : twitter   === dtwitter ? "" : (twitter ?? ""),
                instagram: instagram === dinstagram ? "" : (instagram ?? ""),
                website  : website   === dwebsite ? "" : (website ?? ""),
                discord  : discord   === ddiscord ? "" : (discord ?? ""),
                then: ({ success, message }) => {
                    eshowProgress(false);
                    tellUser(message)                    
                    handleClose();
                }
            })

        } else if ( pagekind === SettingPageKind.trailerexplain ){

            setPageView(SettingPageKind.traileropts);

        } else if ( on_trailer.includes(pagekind) ){

            setPageView(SettingPageKind.issuetrailertickets)

        } else if ( pagekind === SettingPageKind.issuetrailertickets ){

            let num_tix = Number(numtix)

            if ( trivialNum(num_tix) ){

                return tellUser("Please input a valid number of waitlists")

            } else {

                eshowProgress(true);

                await job_cache.upload_trailer({
                    file          : trailerfile,
                    youtube_url   : link,
                    num_whitelist : num_tix,
                    storyboard    : storyboard,
                    projectID     : trivialProps(storyboard,'get_id') ? '' : storyboard.get_id(),
                    then_uploading: (str) => { tellUser(str) },
                    then: async ({ success, message, data }) => {

                        if ( !success ){
                            tellUser(message);
                            eshowProgress(false);
                        } else {
                            // incremnt to state asking uesr to preview 
                            // trailer, when done, ask user to send out 
                            tellUser('Uploaded!')
                            eshowProgress(false);
                            setPageView( SettingPageKind.did_issuetrailertickets )
                        }
                    }
                });
            }

        } else if ( pagekind === SettingPageKind.did_issuetrailertickets ){

            did_success_whitelist()
            handleClose();

        } else if ( pagekind === SettingPageKind.claimwhitelist ) {

            eshowProgress(true);

            await job_cache.claim_whitelist({
                storyboard : storyboard,
                projectID  : storyboard.get_id(),
                then_auth: () => { tellUser('authenticating...') },
                then       : async ({ success, message, data }) => {
                    eshowProgress(false);
                    if ( !success ){
                        tellUser(message)
                    } else {
                        tellUser('You have been whitelisted!')
                        setPageView(SettingPageKind.did_claimwhitelist);
                    }
                }
            })

        } else if ( pagekind === SettingPageKind.did_claimwhitelist ){

            did_success_whitelist();
            handleClose();
        }

    }

    function setPageView(kind){
        epagekind(kind)
        etitle(kind_to_title(kind)[0]);
        ebtn_label(kind_to_title(kind)[1]);                                
    }

    async function setFooter(){
        if ( trivialProps(user_cache,'getAdminUser') ){
            return;
        }        
        let user = await user_cache.getAdminUser()
        if ( trivialProps(user,'userID') ){
            efooter_left('not authenticated')
        } else {
            efooter_left(`${user.metamask_pk ?? "***"}`)
        }
        if ( make_trailer || is_edit ){
            if ( !trivialProps(storyboard,'eth_address')  ){
                efooter_right(storyboard.eth_address)
            } else {
                efooter_right('***')
            }
        } else {
            efooter_right('New film proposal')
        }
    }

    // propagate snack msg mode thru
    const [ snack, setSnack ] = useState({ show: false, str: "" })
    useEffect(() => {
        setSnack({
            show: true,
            str : snackMessage ?? ""
        })
    }, [showSnack, snackMessage])

    function tellUser(str){
        setSnack({ show: true, str: str })
        setTimeout(() => {
            if ( snack.str === str ){
                setSnack({ show: false, str: "" })
            }
        },3000)
    }


    /******************************************************
        @view
    ******************************************************/

    return (
        <Dialog fullWidth maxWidth={'md'} open={open} onClose={goHandleClose}>
            <DialogContent className={dclasses.container}>
                <Box className={classes.container}>
                    <div className={classes.textBorderContainer}>                        
                        <div className = {classes.row_1} style={{color:COLORS.text3}}>
                            <div> {title.toUpperCase()} </div>
                            <Box sx={{ flexGrow: 1 }} />
                        </div>
                        { pagekind === SettingPageKind.about
                            ? <About {...props}/>
                            : pagekind === SettingPageKind.basic
                            ? <DialogChannelBasic 
                                {...props}
                                name={name}
                                ename={ename}
                                discord={discord}
                                ediscord={ediscord}
                                about={about}
                                eabout={eabout}
                                website={website}
                                ewebsite={ewebsite}
                                instagram={instagram}
                                einstagram={einstagram}
                                twitter={twitter}
                                etwitter={etwitter}
                            />
                            : pagekind === SettingPageKind.logo
                            ? 
                            <div style={{marginBottom:'36px'}}>                            
                                <DialogChannelLogoImg 
                                    {...props}
                                    logofile       = {logofile}
                                    setLogoFile    = {setLogoFile}
                                />
                            </div>
                            : pagekind === SettingPageKind.heroimg
                            ? 
                            <div style={{marginBottom:'36px'}}>                            
                                <DialogChannelHeroImg 
                                    {...props}
                                    posterfile = {posterfile}
                                    setposterfile={setposterfile}
                                />
                            </div>
                            : pagekind === SettingPageKind.traileropts
                            ? <DialogSettingUploadOptions
                                {...props} 
                                uploadTrailerLink = {uploadTrailerLink}
                                uploadTrailerMp4  = {uploadTrailerMp4}
                            />
                            : pagekind === SettingPageKind.trailermp4
                            ? <DialogSettingUploadMp4
                                {...props} 
                                setTrailerFile = {goSetTrailerFile}
                            />
                            : pagekind === SettingPageKind.trailerlink
                            ? <DialogSettingUploadLink
                                {...props} 
                                link  = {link}
                                elink = {elink} 
                            />
                            : pagekind === SettingPageKind.issuetrailertickets
                            ? <AirdropTrailerTickets 
                                {...props} 
                                name={name}
                                numtix={numtix}
                                enumtix={enumtix}
                                expdate={expdate}
                                eexpdate={eexpdate}
                                onPressActionButton={onPressActionButton}
                            />
                            : pagekind === SettingPageKind.did_issuetrailertickets
                            ? <DidIssueTrailerTickets {...props}/>
                            : pagekind === SettingPageKind.confirm_proposal
                              || pagekind === SettingPageKind.edit_master
                            ? <ConfirmProposal
                                {...props}
                                is_edit = {is_edit}
                                storyboard = {storyboard}
                                name={name}
                                ename={ename}
                                discord={discord}
                                ediscord={ediscord}
                                about={about}
                                eabout={eabout}
                                website={website}
                                ewebsite={ewebsite}
                                instagram={instagram}
                                einstagram={einstagram}
                                twitter={twitter}
                                etwitter={etwitter}
                                poster_url={ trivialProps(posterfile,'type') ? '' : URL.createObjectURL(posterfile)}
                                logo_url={ trivialProps(logofile,'type') ? '' : URL.createObjectURL(logofile)}    
                                _logo_url = {_logo_url}
                                _poster_url = {_poster_url}
                                goEditPoster={() => { setPageView(SettingPageKind.heroimg) }}
                                goEditLogo={() => { setPageView(SettingPageKind.logo) }}                                                            
                            />
                            : pagekind === SettingPageKind.trailerexplain
                            ? <TrailerExplain {...props} />
                            : pagekind === SettingPageKind.claimwhitelist                            
                            ? <TrailerClaimWhiteList {...props} />
                            : pagekind === SettingPageKind.did_claimwhitelist
                            ? <DidClaimWhiteList {...props} />
                            : <div/>
                        }
                        { pagekind === SettingPageKind.traileropts
                            ? 
                            <div/>
                            :
                            <ActionProgressWithProgress
                                showProgress={showProgress}
                                onClick = {onPressActionButton}
                                label={btn_label}
                            />                             
                        }
                        <FooterInstruction 
                            {...props}
                            footer_top={'0xparc.xyz'}
                            footer_left={footer_left}
                            footer_right={footer_right}
                            footer_bot = {footer_bottom}
                        />
                        {/* error messge toast*/}
                        <AppSnackbar
                            {...props}
                            showSnack = {snack.show}
                            snackMessage = {snack.str}
                            vertical={"bottom"}
                            horizontal={'center'}
                        />
                    </div>
                </Box>
            </DialogContent>

            {/* footer */}
            <DialogActions className={dclasses.titleBar}>
                <Button onClick={handleClose} className={dclasses.footerText}>
                    <div className={dclasses.footerText} style={{filter:'brightness(0.7)'}}>
                        Close
                    </div>
                </Button>
            </DialogActions>
        </Dialog>

    );
}



/**
 *
 * @use: map itemkind to dialog title
 *   
 **/
function kind_to_title(item_kind){

    if ( item_kind === SettingPageKind.about ){
        return [ "Propose a film", "Start"]
    } else if (item_kind === SettingPageKind.basic){
        return [ "Step 1/3: The Basics" , "Next"]
    } else if (item_kind === SettingPageKind.logo){
        return [ "Step 2/4: Film Logo" , "Upload logo or skip"]
    } else if (item_kind === SettingPageKind.heroimg){
        return [ "Step 2/3: Poster Image" , "Upload poster or skip"]
    } else if (item_kind === SettingPageKind.traileropts){
        return [ "Upload movie Trailer to build whitelist" , "Next"]
    } else if (item_kind === SettingPageKind.trailermp4){
        return [ "Upload mp4 file", "next"]
    } else if (item_kind === SettingPageKind.trailerlink){
        return [ "Upload youtube link" , "next"]
    } else if (item_kind === SettingPageKind.issuetrailertickets){
        return [ `Create whitelist` , "create"]
    } else if (item_kind === SettingPageKind.confirm_proposal){
        return [ `Last Step` , 'Create']
    } else if (item_kind === SettingPageKind.edit_master){
        return [ `About` , 'save changes']
    } else if ( item_kind === SettingPageKind.trailerexplain){
        return [ `Launch your community with your film trailer` , `create a whitelist`]
    } else if ( item_kind === SettingPageKind.claimwhitelist ){
        return [ `put me on the whitelist`, `whitelist me` ]
    } else if ( item_kind === SettingPageKind.did_issuetrailertickets  ){
        return [ `Preview trailer & share`, `preview trailer` ]
    } else if ( item_kind === SettingPageKind.did_claimwhitelist ){
        return [ 'You have been whitelisted!', 'watch trailer' ]
    } else {
        return ["", "next"]
    }
}


/******************************************************
    @view child
******************************************************/

// const how_1 = `Patronize this story and receive a % of the final sales in accordance to the amount you have spent.`

const patron_0 = `Lumo is a massive multiplayer story telling movement. We provide the lego blocks for your community to engage in collective story telling and incubate new brand extensions. Here’s how it works:`
const patron_1 = `1. Upload trailer and mint trailer tokens to whitelist future buyers`
const patron_2 = `2. Create an nft collection of scene tokens from your upcoming movie`
const patron_3 = `3. Keep your fans engaged with daily production diary drop`
const patron_4 = `4. Split the income with your crew`


function About(props){

    return (
        <div style={{paddingRight:'24px', paddingLeft:'24px', paddingTop: '48px'}}>
            <AboutTextAttribute
                h1 = 'Multiplayer story'
                h2 = 'telling'
                style={about_style_top}
                text = {patron_0}
            />                    
            <AboutTextAttribute
                h1 = '1. single player'
                h2 = 'Proposal'
                style={about_style}
                text = {patron_1}
            />                    
            <AboutTextAttribute
                h1 = '2. open'
                h2 = 'Casting'
                style={about_style}
                text = {patron_2}
            />                                 
            <AboutTextAttribute
                h1 = '3. raise'
                h2 = 'endowment'
                style={about_style}
                text = {patron_3}
            />                                 
            <AboutTextAttribute
                h1 = '4. fair'
                h2 = 'splits'
                style={about_style_bot}
                text = {patron_4}
            />                                 
        </div>        
    )
}


function TrailerExplain(props){

    const ht = '110px';

    return (
        <div style={{paddingLeft:'36px', paddingTop: '48px', marginBottom:'-50px'}}>
            <AboutTextAttribute
                h1 = '1. upload movie'
                h2 = 'trailer'
                style={{...about_style_top, height: ht}}
                text = {`Elevate your proposal with a movie trailer to pique your community's interest`}
            />                    
            <AboutTextAttribute
                h1 = '2. share'
                h2 = 'trailer'
                style={{...about_style, height: ht}}
                text = {`Use the Twitter on the bottom right to share your trailer and fill the whitelist`}
            />                    
            <AboutTextAttribute
                h1 = '3. Whitelist'
                h2 = 'fans'
                style={{...about_style, height: ht, marginBottom:'24px'}}
                text = {`When fans watch your movie trailer, they are automatically whitelisted!`}
            />                                 
        </div>        
    )    
}


function TrailerClaimWhiteList(props){

    const { storyboard } = props;
    let name = trivialProps(storyboard,'get_name') ? 'this film' : storyboard.get_name();

    return (
        <div style={{paddingLeft:'36px', paddingTop: '48px', marginBottom:'-50px'}}>
            <AboutTextAttribute
                h1 = 'get on'
                h2 = 'the list'
                style={about_style_top}
                text = {`Drops for ${name} is coming soon, connect metamask and sign your spot on the whitelist now`}
            />                    
        </div>            
    )        
}



function DidIssueTrailerTickets(props){
    return (
        <div style={{paddingLeft:'36px', paddingTop: '48px', marginBottom:'-50px'}}>
            <AboutTextAttribute
                h1 = 'what to do'
                h2 = 'next'
                style={about_style_top}
                text = {`When you close this modal, the trailer to will automatically play. Don't forget to press the twitter button the bottom left to share this project!`}

            />                    
        </div>                
    )
}


function DidClaimWhiteList(Props){
    return (
        <div style={{paddingLeft:'36px', paddingTop: '48px', marginBottom:'-50px'}}>
            <AboutTextAttribute
                h1 = 'You are on the'
                h2 = 'whitelist'
                style={about_style_top}
                text = {`When you close this modal, the trailer to will automatically play. Don't forget to press the twitter button the bottom left to share this project!`}
            />                    
        </div>                
    )    
}

function DialogChannelBasic(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useStyles(isOnMobile, true, false)();    
    const { 
        name, 
        ename,
        about,
        eabout, 
        discord,
        ediscord,
        etwitter,
        twitter, 
        instagram, 
        einstagram,
        website,
        ewebsite 
    } = props;

    return (
        <div style={{width:'100%', marginTop:'36px', marginBottom:'12px'}}>
            <CenterHorizontalView>
            <AppTextField
                standard
                autoFocus
                hiddenLabel
                value = {name}
                onChange={(e) => { ename(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsTitle}}
                style={{width:'87%'}}
            />
            </CenterHorizontalView>
            <CenterHorizontalView>            
            <AppTextField
                standard
                hiddenLabel
                value = {discord}
                onChange={(e) => { ediscord(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'87%',marginTop:'-120px'}}
            />            
            </CenterHorizontalView>            
            <CenterHorizontalView>            
            <AppTextField
                standard
                hiddenLabel
                value = {website}
                onChange={(e) => { ewebsite(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'87%',marginTop:'-120px'}}
            />            
            </CenterHorizontalView>            
            <CenterHorizontalView>            
            <AppTextField
                standard
                hiddenLabel
                value = {instagram}
                onChange={(e) => { einstagram(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'87%',marginTop:'-120px'}}
            />            
            </CenterHorizontalView>            
            <CenterHorizontalView>            
            <AppTextField
                standard
                hiddenLabel
                value = {twitter}
                onChange={(e) => { etwitter(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'87%',marginTop:'-120px'}}
            />            
            </CenterHorizontalView>            
            <CenterHorizontalView>
            <AboutAttributeSimple
                numLines = {20}
                value    = {about}
                onChange = {e => { eabout(e.target.value ?? "") }}
                style    = {{width:'85%',marginTop:'-100px', marginBottom:'24px'}}
            />
            </CenterHorizontalView>            
        </div>
    )
}


function DialogChannelHeroImg({ posterfile, setposterfile }){

    return (
        <Stack direction="row" style={{paddingTop:'48px', paddingBottom:'24px'}}>  
            <Box sx={{ flexGrow: 1 }} />
            <UploadByDragAndSave bordered handle_did_drop={setposterfile}/>           
            <Box sx={{ flexGrow: 1 }} />
        </Stack>
    )
}


function DialogChannelLogoImg({ setLogoFile }){

    return (
        <Stack direction="row" style={{paddingTop:'48px', paddingBottom:'24px'}}>  
            <Box sx={{ flexGrow: 1 }} />
            <UploadByDragAndSave bordered handle_did_drop={setLogoFile}/>           
            <Box sx={{ flexGrow: 1 }} />
        </Stack>
    )

}


function DialogSettingUploadOptions({ uploadTrailerLink, uploadTrailerMp4 }){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useStyles(isOnMobile, true, false)();    
    const applyClasses = useApplyStyles(isOnMobile)();

    return (
        <div style={{width:'100%'}}>
            <Stack direction="row" style={{paddingTop:'48px', paddingBottom: '24px'}}>
                <Box sx={{ flexGrow: 1 }} />                   
                <BluePillButton 
                    onClick={uploadTrailerLink}
                    h1 = {`It's already on`}
                    h2 = {'Youtube'}
                />
                <div 
                    className={applyClasses.or_container} 
                    style={{marginLeft: '60px', marginRight:'60px'}}
                > 
                    or 
                </div>
                <BluePillButton 
                    onClick={uploadTrailerMp4}
                    style={{border: `1px solid ${COLORS.red}`, textShadow  : `var(--red-glow)`}}
                    h1 = {'Upload an'}
                    h2 = {'MP4'}
                />
                <Box sx={{ flexGrow: 1 }} />                                        
            </Stack>  
        </div>
    )
}

function DialogSettingUploadLink({ link, elink }){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useStyles(isOnMobile, true, false)();    

    return (
        <div className={classes.row_2} style={{width:'100%',marginBottom:'-24px'}}>
            <AppTextField
                standard
                autoFocus
                hiddenLabel
                value = {link}
                onChange={(e) => { elink(e.target.value ?? "");  }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'87%'}}
            />
        </div>
    )
}


function DialogSettingUploadMp4({ setTrailerFile }){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useStyles(isOnMobile, true, false)();    

    return (
        <div style={{width:'100%'}}>
            <Stack direction="row" style={{paddingTop:'48px'}}>  
                <Box sx={{ flexGrow: 1 }} />
                <UploadByDragAndSave handle_did_drop={setTrailerFile}/>           
                <Box sx={{ flexGrow: 1 }} />
            </Stack>
        </div>
    )
}


function AirdropTrailerTickets({
    numtix,
    enumtix,
    expdate,
    eexpdate,
}){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useStyles(isOnMobile, true, false)();    

    const first = `Input the number of whitelist spots you'd prefer, we will limit your whitelist to this size.`
    const second= 'When community members connect their Metamask account to claim spot, they will be automatically whitelisted.'

    const about_airdrop = `${first} ${second}`

    return (
        <div style={{ width:'100%', margin:'36px', marginTop:'48px', marginBottom:'12px', height:'25%'}}>

            <AppTextField
                autoFocus
                standard
                hiddenLabel
                value = {numtix}
                onChange={(e) => { enumtix(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsTitle}}
                style={{width:'87%'}}
            />   

            <AboutTextAttribute
                h1 = 'Limit your'
                h2 = 'spots'
                disabled 
                numLines={15}
                style={{...about_style}}
                textFieldStyle={{marginLeft:'-12px'}}
                text = {about_airdrop}
                width = {'40vw'}
                style={{width:'45vw',marginLeft:'12px', borderTop:'0px white', marginTop:'-100px'}}
                onChange = {e => { return }}
            />

        </div>
    )    
}


/**
 *
 * @Use: either confirm proposal or edit film
 *
 *
**/
function ConfirmProposal(props){

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useStyles(isOnMobile, true, false)();    
    const { 
        is_edit,
        storyboard,
        name, 
        ename,
        about,
        eabout, 
        discord,
        ediscord,
        etwitter,
        twitter, 
        instagram, 
        einstagram,
        website,
        ewebsite,
        type,
        poster_url,
        logo_url,
        _logo_url,
        _poster_url,
        goEditPoster,
        goEditLogo,
    } = props;

    return (
        <div style={{marginBottom:'-48px',width:'100%', marginTop:'36px', marginBottom:'36px'}}>

            {
                is_edit 
                ?
                <div/> 
                :
                <div style={{marginBottom:'-24px', marginLeft:'36px'}}>
                <Stack direction="row" style={{paddingTop:'48px'}}>
                    <Tippy content={'Click to edit film poster'} disabled={false}>
                        <div onClick={goEditPoster} style={{cursor:'pointer'}}>
                            <TwoRowLabel
                                h1   = {'Film'}
                                h2   = {'poster'}
                                tip  = {''}
                                style={{marginTop:'0px', paddingLeft: '12px', marginRight:'-24px'}}
                                width={'100px'}
                            />          
                        </div>
                    </Tippy>
                    <div onClick={goEditPoster} style={{cursor:'pointer'}}>
                        <AppImageView 
                            imgSrc      = {trivialString(poster_url) ? _poster_url : poster_url}
                            preview_url = {trivialString(poster_url) ? _poster_url : poster_url}
                            width       = {'90%'}
                            height      = {'90%'}
                            type        = {urlToFileExtension(poster_url)}
                        />
                    </div>
                    <Box sx={{ flexGrow: 1 }} />
                </Stack>

                { true 
                    ? 
                    <div/> 
                    : 
                    <Stack direction="row" style={{paddingTop:'12px'}}>  
                        <Tippy content={'Click to edit film logo'} disabled={false}>
                            <div onClick={goEditLogo} style={{cursor: 'pointer'}}>
                            <TwoRowLabel
                                h1   = {'Film'}
                                h2   = {'logo'}
                                tip  = {''}
                                style={{marginTop:'0px', paddingLeft: '12px', marginRight:'-24px'}}
                                width={'100px'}
                            />          
                            </div>
                        </Tippy>
                        <div onClick={goEditLogo} style={{cursor: 'pointer'}}>
                            <AppImageView 
                                imgSrc      = {trivialString(logo_url) ? _logo_url : logo_url}
                                preview_url = {trivialString(logo_url) ? _logo_url : logo_url}
                                width       = {'90%'}
                                height      = {'90%'}
                                type        = {urlToFileExtension(logo_url)}
                            />
                        </div>
                        <Box sx={{ flexGrow: 1 }} />
                    </Stack>
                }
                </div>
            }

            <CenterHorizontalView>
            <AppTextField
                standard
                hiddenLabel
                disabled={is_edit}
                value = {name}
                onChange={(e) => { ename(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsTitle}}
                style={{width:'88%', paddingTop: trivialString(logo_url) && trivialString(_logo_url) ? '48px' : '-24px'}}
            />   
            </CenterHorizontalView>
            
            <CenterHorizontalView>
            <AppTextField
                standard
                hiddenLabel
                value = {discord}
                onChange={(e) => { ediscord(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'88%',marginTop:'-120px'}}
            />            
            </CenterHorizontalView>

            <CenterHorizontalView>
            <AppTextField
                standard
                hiddenLabel
                value = {website}
                onChange={(e) => { ewebsite(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'88%',marginTop:'-120px'}}
            />            
            </CenterHorizontalView>

            <CenterHorizontalView>
            <AppTextField
                standard
                hiddenLabel
                value = {instagram}
                onChange={(e) => { einstagram(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'88%',marginTop:'-120px'}}
            />            
            </CenterHorizontalView>

            <CenterHorizontalView>
            <AppTextField
                standard
                hiddenLabel
                value = {twitter}
                onChange={(e) => { etwitter(e.target.value ?? "") }}
                className={classes.row_2}                            
                inputProps={{style: inputPropsLink}}
                style={{width:'88%',marginTop:'-120px'}}
            />            
            </CenterHorizontalView>

            {true ? <div/> :
                <PrivacySettingField
                    open 
                    on_click ={() => {alert('change')}}
                    {...props}
                />
            }

            <CenterHorizontalView>
            <AboutAttributeSimple
                numLines = {20}
                value    = {about}
                onChange = {e => { eabout(e.target.value ?? "") }}
                style    = {{marginLeft:'12px', width:'87.5%',marginTop:'-80px'}}
            />
            </CenterHorizontalView>

        </div>
    )
}


/**
 *
 * @use: one item field 
 *
*/
function PrivacySettingField({ style, on_click, label_width, open }){

    const isOnMobile = useCheckMobileScreen(1000);
    const dclasses   = useDialogStyles(isOnMobile)();    
    const classes    = useStyles(isOnMobile, true, false)();    


    const _style = {
        // background:COLORS.black,
        marginTop: '-140px',
        marginBottom: '-20px',
        width: '95%',
        ...(style ?? {}),
    }

    return (
        <CenterHorizontalView>
            <Stack direction='row' style={_style}>
                <div style={{width:'fit-content', marginTop:'50px', marginLeft: '-24px'}}>
                    <Switch color={ 'warning' } defaultChecked={open} />
                </div>
                 <AppTextField
                    standard
                    hiddenLabel
                    disabled
                    value = {`Backstage is private`}
                    onChange={() => {}}
                    className={classes.row_2}
                    inputProps={{style: inputPropsSetting}}
                    style={{width: '85%'}}
                />                            
            </Stack>
        </CenterHorizontalView>
    )    
}


/******************************************************
    @export
******************************************************/

export { SettingPageKind, dwebsite, ddiscord, dinstagram, dtwitter }
export default withRouter(withAuth(DialogSetting));






