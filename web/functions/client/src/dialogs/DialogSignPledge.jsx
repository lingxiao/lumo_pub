/** *
 * @Package: DialogSignPledge
 * @Date   : 8/9/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { AppTextField } from './../components/ChatTextInput'

import { ActionProgressWithProgress } from './../components/ButtonViews';

import { 
    trivialString,
    trivialProps,
}  from './../model/utils';
import {
    home_page_url,
    app_page_urls,
} from './../model/core';

import DialogParent from './DialogUtils';
import { COLORS } from './../components/constants';

import { Text_H1 } from './../pages/AboutSaleView';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { CenterHorizontalView } from './../components/UtilViews';

import { GiphBackgroundView } from './../components/VideoBackground';
import { InviteImageBlock, TwitterCardHero } from './../pages/AppInvitePage'

import burn_img from './../assets/burn1.jpeg';
const acid5 = require("./../assets/acid5.png")


/******************************************************
    @view: exported
******************************************************/

const inputPropsLink = {
    fontSize: '24px',
    fontFamily: 'NeueMachina-Medium',    
    color     : COLORS.text,
}




/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogSignPledge(props) {

    const isOnMobile = useCheckMobileScreen(1000);


    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        storyboard,
        web3_job_cache,
        showlinearprogress,
        eshowlinearprogress,
    } = props;
    

    const [ btn_label, ebtn_label ] = useState("Sign Pledge")
    const [ showProgress, eshowProgress ] = useState(false);

    // pledge fields
    const [ pledge, epledge ] = useState("");
    const [ invite_text, einvite_text ] = useState({
        img_url: acid5,
        t0: 'This is your pledge',
        t1: 'Sign the pledge',
        t2: 'and you will receive',
        t3: 'one tab to share',
        t4: 'with the community',
        t5: `Chief Burner`,     
    });

    // auth fields
    const [ showauth, eshowauth ] = useState(false)
    const [ name, ename ] = useState("");
    const [ email, eemail ] = useState("");
    const [ password, epassword ] = useState("");
    const [ fpass, efpass ] = useState(false)

    /******************************************************/
    // @mount

    // load data if is editing
    useEffect(async () => {
    },[open]);

    /******************************************************/
    // @POST responder

    // @use: either send acid to user 
    //       show user a sign up modal
    async function onPledge(){
        if (!showauth){
            eshowauth(true)
            ebtn_label("Next")
        }
    }

    function onAuth(){
        eshowauth(false)
        ebtn_label("Sign Pledge")
    }


    async function onNavToExplainTab(){        
        let { acid } = app_page_urls();
        let win = window.open(acid, '_blank');
        win.focus();
    }

    /******************************************************/
    // @view

    // propagate snack msg mode thru
    const [ snack, setSnack ] = useState({ show: false, str: "" });

    function tellUser(str){
        setSnack({ show: true, str: str })
    }


    return (
        <DialogParent 
            {...props}        
            fullWidth
            maxWidth={ showauth && !isOnMobile ? 'sm' : 'wd'}
            open={open}
            onClose={() => {handleClose()}}
            snack={snack}
            container_style={{background:'black'}}
            title={"Sign the pledge and earn a burn tab"}
            footer_top={"Sign and Earn"}
            footer_left={home_page_url()}
        >
            { showauth 
                ?
                <Stack direction={'column'} 
                    style={{ 
                        padding: '2vw',
                        overflowY:'hidden',
                    }}
                >
                    <Box sx={{flexGrow:1}}/>
                    <div style={{marginBottom: '2vh', marginLeft: '10%', marginTop: isOnMobile ? '0px' : '8vh'}}>
                        <Text_H1 
                            left       = {'* Who is'} 
                            right      = {"signing the pledge?"}
                            style_left = {{fontSize:'3vw'}}
                            style_right= {{fontSize:'2vw'}}
                        />
                    </div>
                    <CenterHorizontalView>
                        <AppTextField
                            standard
                            autoFocus
                            hiddenLabel
                            label="name on the tab"
                            value = { name }
                            onChange={(e) => { 
                                ename(e.target.value ?? "")
                            }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'80%',marginTop:'2vh'}}
                        />   
                    </CenterHorizontalView>                    
                    <CenterHorizontalView>
                        <AppTextField
                            standard
                            hiddenLabel
                            label="email"
                            value = { email }
                            onChange={(e) => { 
                                eemail(e.target.value ?? "")
                            }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'80%',marginTop:'2vh'}}
                        />   
                    </CenterHorizontalView>
                    <CenterHorizontalView>
                        <AppTextField
                            standard
                            label="password"                            
                            value = { password }
                            onChange={(e) => { 
                                epassword(e.target.value ?? "")
                            }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'80%',marginTop:'2vh'}}
                        />   
                    </CenterHorizontalView>
                    <ActionProgressWithProgress                    
                        showProgress={showProgress}
                        onClick = {onAuth}
                        label={btn_label}
                        progress_text={btn_label}
                        sx = {{ width: '100%', marginTop: '24px'}}
                    />                                         
                    <Box sx={{flexGrow:1}}/>
                </Stack>      
                :
                <TwitterCardHero 
                    {...props}
                    update   = {false}
                    show_full_image
                    img_url  = {invite_text.img_url}
                    t0   = {invite_text.t0}
                    t1   = {invite_text.t1}
                    t2   = {invite_text.t2}
                    t3   = {invite_text.t3}
                    t4   = {invite_text.t4}
                    tedit= {pledge}
                    onTedit={epledge}
                    name = {invite_text.t5}
                    address  = {"The Burn Tab"}
                    btn_str  = {btn_label}
                    host     = {invite_text.t5}
                    onAccept ={onPledge}
                    showProgress={showProgress}
                    storyboard={{}}
                    progress_text = {'one moment'}              
                    aux_btn_label = {'What is a tab?'}
                    aux_btn_style = {{color:COLORS.text3, marginTop:'-12px', fontSize:'10px'}}
                    onClickAuxBtn = {onNavToExplainTab}
                    footer_style = {{ background: COLORS.offBlack }}
                    style={{marginTop:'36px'}}
                    card_style={{border:`0px solid black`}}
                />      
            }
        </DialogParent>
    )

}



export default withAuth(withRouter(DialogSignPledge))




