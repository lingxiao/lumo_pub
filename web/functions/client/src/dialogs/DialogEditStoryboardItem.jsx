/** *
 * @Package: DialogEditStoryboardItem 
 * @Date   : 5/31/2022
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

import AppSnackbar from './../components/AppSnackbar';
import { ActionProgressWithProgress } from './../components/ButtonViews';
import { AboutAttributeSimple } from './DialogUtils';
import { AppTextField } from './../components/ChatTextInput'
import { CenterHorizontalView } from './../components/UtilViews';

import { 
    trivialString,
    trivialProps,
}  from './../model/utils';

import { FooterInstruction, useStyles, useDialogStyles } from './DialogUtils';
import { COLORS } from './../components/constants';
import { HeaderAndAboutField } from './../components/UtilViews';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';



/******************************************************
    @view: exported
******************************************************/

const dabout = 'about this item'


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogEditStoryboardItem(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const dclasses   = useDialogStyles(isOnMobile)();    
    const classes    = useStyles(isOnMobile, true, false)();    

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        snackMessage, 
        showSnack, 
        job_cache, 
        user_cache,
        storyboard,
        storyboard_item_id,
    } = props;
        
    const [ showProgress, eshowProgress ] = useState(false)
    const [ title, etitle ] = useState('Create collection')

    // basics
    const [ about, eabout ] = useState(dabout)

    // navigation + footer data
    const [ footer_left, efooter_left ] = useState("")
    const [ footer_right, efooter_right ] = useState("")
    const [ footer_bottom, efooter_bottom ] = useState("")

    /******************************************************
        @mount
    ******************************************************/    

    // load data if is editing
    useEffect(async () => {

        setTimeout(() => {
            setFooter()
        },1000)

        if ( trivialProps(storyboard,'get_item') ){
            return;
        }

        let item = await storyboard.get_item(storyboard_item_id)
        if ( !trivialProps(item,'text') ){
            eabout(item.text ?? "")
        }

    },[open]);


    /******************************************************
        @main POST responder
    ******************************************************/    

    function goHandleClose(){
        handleClose();
        setFooter();
        tellUser("");
    }

    // save profile
    async function onPressActionButton({ then }){

        if ( trivialString(about) || about === dabout ){
            tellUser('Please tell us a little more about this item')
        } else {

            await job_cache.edit_storyboard_item({
                text: about,
                storyboard: storyboard,
                storyboardItemId: storyboard_item_id,
                then_posting: () => {
                    eshowProgress(true)
                    tellUser('saving...')
                },
                then: ({ success, message }) => {
                    eshowProgress(false)
                    if ( !success ){
                        tellUser(message)
                    } else {
                        tellUser('')
                        goHandleClose();
                    }
                }
            })
        }
    }

    /******************************************************
        @view
    ******************************************************/    

    async function setFooter(){
        let user = await user_cache.getAdminUser()
        if ( trivialProps(user,'userID') ){
            efooter_left('not authenticated')
        } else {
            efooter_left(`${user.metamask_pk ?? "***"}`)
        }
        efooter_right('Edit Item')
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


    return (
        <Dialog fullWidth maxWidth={'md'} open={open} onClose={goHandleClose}>
            <DialogContent className={dclasses.container}>
                <Box className={classes.container}>
                    <div className={classes.textBorderContainer}>                        
                        <div className = {classes.row_1} style={{color:COLORS.text3}}>
                            <div> {title.toUpperCase()} </div>
                            <Box sx={{ flexGrow: 1 }} />
                        </div>
                        <div style={{width:'100%', marginTop:'36px', marginBottom: '36px', }}>
                            <HeaderAndAboutField
                                hideCheckMark
                                hideHeader
                                label="About this collection"
                                value={{ about: about, done: false }}
                                evalue={(str) => eabout(str) }
                                on_click = {() => {return}}
                                style={{marginTop:'112px'}}
                            />
                        </div>
                        <ActionProgressWithProgress
                            showProgress={showProgress}
                            onClick = {onPressActionButton}
                            label={'Save'}
                            subtext={`Editing an item's story does not change its media`}
                        />
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



/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogEditStoryboardItem))






