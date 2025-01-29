/** *
 * @Package: DialogEditLicense
 * @Date   : 8/1/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Stack from '@mui/material/Stack';

import DialogParent, { useStyles } from './DialogUtils';
import { COLORS } from './../components/constants';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import Box from '@mui/material/Box';


import { 
    trivialNum,
    trivialString,
    trivialProps,    
}  from './../model/utils';

import { ActionProgressWithProgress } from './../components/ButtonViews';
import { CenterHorizontalView } from './../components/UtilViews'
import { AppTextField } from './../components/ChatTextInput'
import { HeaderAndAboutField } from './../components/UtilViews';
import {UploadByDragAndSave} from './../components/CubeTableFileUpload'

/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogEditLicense(props) {

    const isOnMobile = useCheckMobileScreen(1000);

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        storyboard,
        board_id,
    } = props;
        
    // license states
    const [ license_title, elicense_title ] = useState("");
    const [ license_about, elicense_about ] = useState("");
    const [ license_img, elicense_img ] = useState({});
    const [ showProgress, eshowProgress ] = useState(false)
    const [ btn_label, ebtn_label ] = useState('push update')


    /******************************************************/
    // @mount

    // load data if is editing
    useEffect(async () => {


    },[open]);

    /******************************************************/
    // main POST responder

    // save profile
    async function onPressActionButton(){

        if ( trivialProps(storyboard, 'eth_address') || trivialString(board_id) ){
            return tellUser("Oh no! An error occured!");
        }

        if ( trivialProps(license_img, 'type') ){
            return tellUser("Please upload image");
        }


        eshowProgress(true);
        await storyboard.edit_story_board({
            storyboardID: board_id,
            // name: license_title ?? "",
            // about: license_about ?? "",
            image_file: license_img,
            push_image_update: true,
            then_progress: (str) => {
                tellUser(str)
            },
            then: ({ success, message }) => {
                eshowProgress(false)
                if ( success ){
                    tellUser("Updated! Refresh page to see update")
                } else {
                    tellUser(message)                    
                }
                setTimeout(() => {
                    goHandleClose(true)
                },3000)
            }
        })
    }

    async function handleDropImage(file){
        elicense_img(file);
    }    

    /******************************************************
        @view
    ******************************************************/    



    function goHandleClose(saved){
        elicense_title("");
        elicense_about("");
        elicense_img("");
        handleClose(saved);
        tellUser("");
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
            title={'Edit License Image'}
            footer_top={'Edit License Image'}
            footer_left={""}
        >
            <CenterHorizontalView>
                <Stack direction={'column'} style={{ marginTop: isOnMobile ? "1vh" : '4vh' }}>
 
                    <Stack 
                        direction='column' 
                        style={{ width: isOnMobile ? "100%" :'50%', marginTop: isOnMobile ? '64px' : '4vh'}}
                    >
                        <CenterHorizontalView>
                            <Stack direction='column' style={{height:'100%'}}>
                                <Box sx={{ flexGrow: 1 }} />
                                <UploadByDragAndSave 
                                    bordered 
                                    default_url={''} 
                                    handle_did_drop={handleDropImage}
                                />
                                <ActionProgressWithProgress
                                    showProgress={showProgress}
                                    onClick = {onPressActionButton}
                                    label={btn_label}
                                    progress_text={btn_label}
                                    sx={{width:'120%', marginTop:'24px'}}
                                    subtext='update will push to all license holders'
                                />  
                                <Box sx={{ flexGrow: 1 }} />
                            </Stack>
                        </CenterHorizontalView>
                    </Stack>                
                </Stack>
            </CenterHorizontalView>
        </DialogParent>

    )

}

/*

                   <Stack direction='column' style={{width: isOnMobile ? '100%' : '50%' }}>
                        <AppTextField
                            standard
                            hiddenLabel
                            autoFocus
                            value = { license_title }
                            onChange={(e) => { 
                                    elicense_title(e.target.value ?? "")                                                 
                            }}
                            inputProps={{style: inputPropsTitle}}
                            style={{width:'80%',marginTop: isOnMobile ? '0px' : '-12px', marginLeft: isOnMobile ? "48px" : '64px'}}
                        />                                                      
                        <div style={{height:'136px'}}/>
                        <HeaderAndAboutField
                            hideCheckMark
                            hideHeader
                            numLines = {15}
                            value={{ license_about }}
                            evalue={(str) => elicense_about(str)}
                            on_click = {() => {return}}
                            style={{marginLeft: isOnMobile ? '0px' : '24px', width:'85%'}}
                        />   
                    </Stack>
const inputPropsTitle = {
    fontSize: `3vh`,
    fontFamily: 'NeueMachina-Black',    
    color     : COLORS.text,
    // marginTop: '-32px',
}


const inputPropsAbout = {
    fontSize: '16px',
    fontFamily: 'NeueMachina-Medium',
    color: COLORS.text,
    lineHeight: 1.5,
    textSpacing: '1px',
    whiteSpace: "break-spaces",
}
*/


/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogEditLicense))






