/** *
 * @Package: DialogAuthWithEmail
 * @Date   : 7/12/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { 
    trivialString,
}  from './../model/utils';

import {
    urlToFileExtension
} from './../model/core';


import { COLORS } from './../components/constants';
import DialogParent from './DialogUtils';
import { AppTextField } from './../components/ChatTextInput'
import { ActionProgressWithProgress } from './../components/ButtonViews';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import { Text_H1 } from './../pages/AboutSaleView';

import cubetable from './../assets/cubetable.png';
import AppImageView from './../components/AppImageView';
import { CenterHorizontalView, CenterVerticalView } from './../components/UtilViews'

/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogAuthWithEmail(props) {

    const isOnMobile = useCheckMobileScreen(1000);

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        _hoc_auth_by_email,
    } = props;
        
    /******************************************************
        @mount
    ******************************************************/    

    const [ email, eemail ] = useState("");
    const [ password, epassword ] = useState("");
    const [ fpass, efpass ] = useState(false)

    const [ showProgress, eshowProgress ] = useState(false)
    const [ btn, ebtn ] = useState("authenticate")


    useEffect(async () => {
    },[open]);

    /******************************************************
        @main POST responder
    ******************************************************/    

    // save profile
    async function onPressActionButton(){

        if ( bad_str(email, "") ){

            tellUser("Please enter valid email")

        } else if ( bad_str(password,"") ){

            tellUser("Please enter valid password")

        } else {

            eshowProgress(true);
            ebtn('authenticating')
            tellUser("");

            await _hoc_auth_by_email({ email, password, then: async ({  success, message, data }) => {
                if ( !success ){
                    efpass(true)
                    eshowProgress(false);
                    epassword("");
                    ebtn("try again");
                    tellUser(message);
                    return;
                } else {
                    // ebtn("A few more seconds")
                    // tellUser("a few more seconds")
                    setTimeout(() => {
                        goHandleClose(true)
                    },3000)
                }
            }})
        }
    }


    function bad_str(str,dstr){
        return trivialString(str) || str === dstr;
    }

    /******************************************************
        @view
    ******************************************************/    


    function reset(){
        eemail("")
    }

    function goHandleClose(b){
        reset();
        handleClose(b);
        tellUser("");
        ebtn("authenticate")
        eemail("")
        epassword("")
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

    if ( isOnMobile ){

        return (
            <DialogParent 
                {...props}        
                fullWidth
                open={open}
                maxWidth={'wd'}
                onClose={() => {goHandleClose(false)}}
                snack={snack}
                title={'authentication'}
                footer_top={`Authenticate with email and password`}
                footer_left={''}
            >
                <Stack direction='row' style={{marginTop:'2vh', width: '100%'}}>
                    <Stack direction={'column'} 
                        style={{ 
                            width  : isOnMobile ? '100%' : '50vw',
                            padding: '2vw',
                            overflowY  :'hidden',
                        }}
                    >
                        <Box sx={{flexGrow:1}}/>
                        <div style={{marginBottom: '2vh', marginLeft:'6vw'}}>
                            <Text_H1 
                                left={'0xparc'} 
                                right={"* sign in to continue"}
                                style_left={{fontSize:'4vw'}}
                                style_right={{fontSize:'3vw'}}
                            />
                        </div>
                        <CenterHorizontalView>
                            <AppTextField
                                standard
                                autoFocus
                                hiddenLabel
                                label="email"
                                value = { email }
                                onChange={(e) => { 
                                    eemail(e.target.value ?? "")
                                }}
                                inputProps={{style: inputPropsLink}}
                                style={{width:'80%', margin: '2vw', marginTop:'2vh'}}
                            />   
                        </CenterHorizontalView>
                        <CenterHorizontalView>
                            <AppTextField
                                standard
                                label="password"                            
                                autoFocus={fpass}
                                value = { password }
                                onChange={(e) => { 
                                    epassword(e.target.value ?? "")
                                }}
                                inputProps={{style: inputPropsLink}}
                                style={{width:'80%', margin: '2vw', marginBottom:'3vh', marginTop:'2vh'}}
                            />   
                        </CenterHorizontalView>
                        <ActionProgressWithProgress                    
                            showProgress={showProgress}
                            onClick = {onPressActionButton}
                            label={btn}
                            progress_text={btn}
                            sx = {{ width: '100%'}}
                        />                     
                        <Box sx={{flexGrow:1}}/>
                    </Stack>
                </Stack>
            </DialogParent>
        )

    } else {

        return (
            <DialogParent 
                {...props}        
                fullWidth
                open={open}
                maxWidth={'wd'}
                onClose={() => {goHandleClose(false)}}
                snack={snack}
                title={'authentication'}
                footer_top={`Authenticate with email and password`}
                footer_left={''}
            >
                <Stack direction='row' style={{marginTop:'2vh', width: '100%'}}>
                    <CenterVerticalView style={{ width:'40vw', marginLeft:'5vw'}}>
                        <CenterHorizontalView style={{width:'45vw', zIndex:100}}>
                            <AppImageView   
                                width  = {'80%'}
                                style  = {{}}
                                imageDidLoad = {() => {return}}
                                preview_url  = {cubetable}
                                imgSrc       = {cubetable}
                                type         = { urlToFileExtension(cubetable)}
                            />   
                        </CenterHorizontalView>
                    </CenterVerticalView>
                    <Stack direction={'column'} 
                        style={{ 
                            padding: '2vw',
                            marginLeft:'-4vw',
                            width  : isOnMobile ? '100%' : '50vw',
                        }}
                    >
                        <Box sx={{flexGrow:1}}/>
                        <div style={{marginBottom: '2vh', marginLeft:'0vw'}}>
                            <Text_H1 
                                left={'0xparc'} 
                                right={"* sign in to continue"}
                                style_left={{fontSize:'4vw'}}
                                style_right={{fontSize:'3vw'}}
                            />
                        </div>
                            <AppTextField
                                standard
                                autoFocus
                                hiddenLabel
                                label="email"                                
                                value = { email }
                                onChange={(e) => { 
                                    eemail(e.target.value ?? "")
                                }}
                                inputProps={{style: inputPropsLink}}
                                style={{width:'80%', margin: '2vw', marginTop:'2vh'}}
                            />   
                            <AppTextField
                                standard
                                hiddenLabel
                                label="password"
                                autoFocus={fpass}
                                value = { password }
                                onChange={(e) => { 
                                    epassword(e.target.value ?? "")
                                }}
                                inputProps={{style: inputPropsLink}}
                                style={{width:'80%', margin: '2vw', marginBottom:'3vh', marginTop:'2vh'}}
                            />   
                        <ActionProgressWithProgress                    
                            showProgress={showProgress}
                            onClick = {onPressActionButton}
                            label={btn}
                            progress_text={btn}
                            sx = {{ width: '100%'}}
                        />                     
                        <Box sx={{flexGrow:1}}/>
                    </Stack>
                </Stack>
            </DialogParent>
        )
    }

}

/******************************************************
    @style
******************************************************/


const inputPropsLink = {
    fontSize: '24px',
    fontFamily: 'NeueMachina-Medium',    
    color     : COLORS.text,
}


/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogAuthWithEmail))






