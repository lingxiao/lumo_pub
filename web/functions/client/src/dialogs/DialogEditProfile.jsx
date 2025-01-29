/** *
 * @Package: DialogEditProfile
 * @Date   : 8/7/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { 
    trivialProps,    
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

import AppImageView from './../components/AppImageView';
import { CenterHorizontalView, CenterVerticalView } from './../components/UtilViews'
import {UploadByDragAndSave} from './../components/CubeTableFileUpload'

import {CubeTableWithSprite} from './../components/CubeTable';
import { DarkButton } from './../components/ButtonViews';

import { TicketHolderTitle } from './../pages/AppStoryboardRare';
import { AboutAttributeSimple } from './DialogUtils';


// @source: https://github.com/laurentpayot/minidenticons
import { identicon } from 'minidenticons';

/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogEditProfile(props) {

    const isOnMobile = useCheckMobileScreen(1000);

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        user_cache,
    } = props;
        
    /******************************************************/
    // @mount

    // state
    const [ _user, euser ]  = useState({});
    const [ name, ename ]   = useState("");
    const [ _about, eabout ] = useState("");

    const [ showProgress, eshowProgress ] = useState(false)
    const [ btn, ebtn ] = useState("save updates")

    // profile sprite or image
    const [ show_sprite, eshow_sprite  ] = useState(true);
    const [ posterfile , setposterfile ] = useState(false);
    const [ _poster_url, eposter_url   ] = useState('');
    const [ aux_btn, e_auxbtn ]  = useState("do not use sprite")

    useEffect(async () => {
        await mount();        
        setTimeout(async () => {
            await mount();
        },3000)
    },[open]);

    async function mount(){
        if ( trivialProps(user_cache,'getAdminUser') ){
            return;
        }
        let user = await user_cache.getAdminUser();
        if ( !trivialProps(user,'userID') ){
            const { name, image_url, about } = user.view;
            ename(name ?? "");
            eposter_url( image_url ?? "");
            euser(user);
            eabout(about ?? "");
        }
    }

    /******************************************************/
    // @responders

    function sprite_str(){
        if ( trivialProps(_user,'sprite_str') ){
            return "" 
        } else {
            return _user.sprite_str(name);
        }
    }

    function toggleSprite(){
        if ( show_sprite ){
            eshow_sprite(false);
            e_auxbtn('use sprite')
        } else {
            eshow_sprite(true);
            e_auxbtn('use .jpg')            
        }
    }

    // save profile
    async function onPressActionButton(){
        eshowProgress(true);
        ebtn("saving")
        await user_cache.updateAdminUser({
            name : name ?? "",
            about: _about ?? "",
            image_file: posterfile,
            then_saving: (str) => {
                tellUser(str)
            },
            then: async ({ success, message }) => {
                eshowProgress(false);
                if ( !success ){
                    tellUser(message)
                } else {
                    tellUser('Saved!')
                    goHandleClose();
                }
            }
        });
    }


    /******************************************************/
    // @view

    function goHandleClose(b){
        handleClose();
        tellUser("");
        ebtn("save updates")
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
                onClose={() => {goHandleClose(false)}}
                snack={snack}
                title={'Profile'}
                footer_top={`Edit Profile`}
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
                                right={"** This is your profile"}
                                style_left={{fontSize:'4vw'}}
                                style_right={{fontSize:'3vw'}}
                            />
                        </div>
                        <CenterHorizontalView>
                            <AppTextField
                                standard
                                autoFocus
                                hiddenLabel
                                value = { name }
                                onChange={(e) => { 
                                    ename(e.target.value ?? "")
                                }}
                                inputProps={{style: inputPropsLink}}
                                style={{width:'80%', margin: '2vw', marginTop:'2vh'}}
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
                title={'Profile'}
                footer_top={`Edit Profile`}
                footer_left={''}
            >
                <Stack direction='row' style={{marginTop:'3vh', marginBottom:'3vh', width: '100%'}}>
                    <CenterVerticalView style={{ width:'40vw', marginTop:'3vh', marginLeft:'0vw'}}>
                        <CenterHorizontalView style={{width:'45vw', zIndex:100}}>
                            <Stack direction='column'>
                            {
                                show_sprite
                                ?
                                <CubeTableWithSprite
                                    seed={sprite_str()}
                                />
                                :
                                <UploadByDragAndSave 
                                    bordered 
                                    default_url={_poster_url}
                                    handle_did_drop={setposterfile}
                                />           
                            }
                            <DarkButton onClick={toggleSprite} sx={bstyle2}>
                                {aux_btn}
                            </DarkButton>                 
                            </Stack>       
                        </CenterHorizontalView>
                    </CenterVerticalView>
                    <Stack direction={'column'} 
                        style={{ 
                            padding: '2vw',
                            marginLeft:'-1vw',
                            width  : isOnMobile ? '100%' : '50vw',
                        }}
                    >
                        <Box sx={{flexGrow:1}}/>
                        <div style={{marginBottom: '2vh', marginTop:'2vh', marginLeft:'0vw'}}>
                            <Text_H1 
                                left={'0xparc'} 
                                right={"** this is your profile"}
                                style_left={{fontSize:'4vw',color:COLORS.surface3}}
                                style_right={{fontSize:'3vw', color:COLORS.surface3}}
                            />
                        </div>
                        <AppTextField
                            standard
                            autoFocus
                            hiddenLabel
                            label="Change your name to update the your sprite"
                            value = { name }
                            onChange={(e) => { 
                                ename(e.target.value ?? "")
                            }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'80%', margin: '2vw', marginTop:'2vh'}}
                        />   


                        <div style={{width:'85%', margin: '2vw', marginTop:'-12px'}}>
                            <TicketHolderTitle
                                title='About me'
                                container_style={{marginLeft:'0px'}}
                            />
                            <div style = {{marginTop:'-45px', marginBottom:'36px'}}>
                                <AboutAttributeSimple
                                    numLines = {5}
                                    value    = {_about}
                                    onChange = {e => { eabout(e.target.value ?? "") }}
                                    style    = {{width:'90%', marginTop:'28px', marginLeft:'-4px', height:'fit-content', borderRadius:'0px'}}
                                />   
                            </div>
                        </div>

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

const bstyle2 = {
    marginTop:'12px',
    fontSize: '13px',       
    fontFamily: 'NeueMachina-Regular',
    border: `0px solid transparent`,
    color: COLORS.text3,
    background: 'transparent',
}
const inputPropsLink = {
    fontSize: '24px',
    fontFamily: 'NeueMachina-Medium',    
    color     : COLORS.text,
}


/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogEditProfile))






