/** *
 * @Package: DialogImportCollection
 * @Date   : 6/12/2022
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
import { AppTextField } from './../components/ChatTextInput'

import {UploadByDragAndSave} from './../components/CubeTableFileUpload'
import { CenterHorizontalView } from './../components/UtilViews'

import { AboutAttributeSimple } from './DialogUtils';
import { ActionProgressWithProgress } from './../components/ButtonViews';

import { 
    trivialString,
    trivialProps,
}  from './../model/utils';


import DialogParent, { useStyles, useDialogStyles } from './DialogUtils';
import { COLORS } from './../components/constants';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';


/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogImportCollection(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const dclasses   = useDialogStyles(isOnMobile)();    
    const classes    = useStyles(isOnMobile, true, false)();    

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        user_cache,
        job_cache,
        storyboard,
    } = props;
        
    /******************************************************
        @mount
    ******************************************************/    

    const [ opensea, eopensea ] = useState(dopensea);
    const [ footer_left, efooter_left ] = useState("")

    const [ showProgress, eshowProgress ] = useState(false)
    const [ progress_text, eprogress_text ] = useState('')
    const [ btn, ebtn ] = useState("import")

    useState(() => {
        setTimeout(() => {
            setFooter()
        },1000)
    },[open])

    function set_str(fn, dbvalue, dfaultvalue){
        if (trivialString(dbvalue)){
            fn(dfaultvalue)
        } else {
            fn(dbvalue)
        }
    }

    // load data if is editing
    useEffect(async () => {


    },[open]);

    /******************************************************
        @main POST responder
    ******************************************************/    

    // save profile
    async function onPressActionButton(){

        if ( btn === 'done!' ){

            return goHandleClose("");

        } else {

            await job_cache.import_collection({ 

                storyboard: storyboard,

                then_fetching: (str) => { 
                    eshowProgress(true);
                    eprogress_text(str);
                },
                then_fetched_success: (str) => { 
                    eshowProgress(true);
                    eprogress_text(str);
                },
                then_fetched_fail: (str) => { 
                    eshowProgress(true);
                    eprogress_text(str);
                },
                then_migrating: (str) => { 
                    eshowProgress(true);
                    eprogress_text(str);
                },
                then_did_migrate_succ: ({ message, storyboardID }) => { 
                    eprogress_text(message);                
                    setTimeout(() => {
                        eshowProgress(false);
                        ebtn('done!')
                        goHandleClose(storyboardID ?? "")
                    },2000)
                },
                then_did_migrate_fail: (str) => { 
                    eshowProgress(false);
                    tellUser(str);
                    ebtn('Try again')
                },
            })
        }
    }


    /******************************************************
        @view
    ******************************************************/    


    function reset(){
        eopensea(dopensea);
    }

    function goHandleClose(saved){
        reset();
        handleClose(saved);
        setFooter();
        tellUser("");
        ebtn("import")
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
    }

    // propagate snack msg mode thru
    const [ snack, setSnack ] = useState({ show: false, str: "" })

    function tellUser(str){
        setSnack({ show: true, str: str })
        setTimeout(() => {
            if ( snack.str === str ){
                setSnack({ show: false, str: "" })
            }
        },3000)
    }

    return (
        <DialogParent 
            {...props}        
            fullWidth
            open={open}
            onClose={goHandleClose}
            snack={snack}
            title={'Import collection'}
            footer_top={'Import collection from opensea'}
            footer_left={footer_left}
        >
            <div>
                <Stack direction='column' style={{width:'100%', marginTop:'24px', marginBottom: '-90px'}}>
                    <CenterHorizontalView>                                
                        <AppTextField
                            disabled
                            standard
                            hiddenLabel
                            value = {opensea}
                            onChange={(e) => { eopensea(e.target.value ?? "") }}
                            className={classes.row_2}                            
                            inputProps={{style: inputPropsLink }}
                            style={{width:'90%'}}
                        />        
                    </CenterHorizontalView>    
                </Stack>
                <ActionProgressWithProgress
                    showProgress={showProgress}
                    onClick = {onPressActionButton}
                    label={btn}
                    progress_text={progress_text}
                />
             </div>
        </DialogParent>

    )

}

/******************************************************
    @style
******************************************************/


const inputPropsLink = {
    fontSize: `4vh`,
    fontFamily: 'NeueMachina-Bold',    
    color     : COLORS.text,
}

const dopensea = 'Import Ash Valley'


/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogImportCollection))






