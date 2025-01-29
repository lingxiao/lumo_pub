/** 
 * @Package: take credit card and auth
 * @Date   : 9/9/2022
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
}  from './../model/utils';


import { COLORS } from './../components/constants';
import { Text_H1 } from './../pages/AboutSaleView';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { AboutAttributeSimple } from './../dialogs/DialogUtils';
import { CenterHorizontalView } from './../components/UtilViews';

import { CreditCardPanel } from './TicketMachine';

/******************************************************
    @constants
******************************************************/


const inputPropsLink = {
    fontSize: '24px',
    fontFamily: 'NeueMachina-Medium',    
    color     : COLORS.text,
}


/******************************************************
    @view
******************************************************/


function AuthAndCard(props){

	const isOnMobile = useCheckMobileScreen(1000);

    const {
        style,
        promptA,
        promptB,
        promptStyle,
        onWillAuth,    
        onDidAuth,
        onDidSaveCard,
        tellUser,
        should_collect_payment,
        collect_payment_only,
        _hoc_auth_by_email,
        _hoc_auth_by_twitter,
        user_cache,
    } = props;


    const [ btn_label, ebtn ] = useState("sign in"); //sign in with twitter")
    const [ showProgress, eshowProgress ] = useState(false);
    const [ auth_with_email, eauth_with_email ] = useState(true);

    // auth fields
    const [ name, ename ] = useState("");
    const [ email, eemail ] = useState("");
    const [ password, epassword ] = useState("");
    const [ fpass, efpass ] = useState(false)    

    //paymentfields
    const [ showpayment, eshowpayment ] = useState(false);

    useEffect(() => {
        eshowpayment(collect_payment_only ?? false);
    },[collect_payment_only])

    /******************************************************/
    // @responders

    // global auth by twitter fn.
    async function onAuth(){

        eshowProgress(true);
        ebtn('authenticating'.toUpperCase())
        tellUser("");
        onWillAuth();

        /*
        await _hoc_auth_by_twitter({ then: async ({ success, message, data }) => {
            if ( !success ){
                efpass(true)
                eshowProgress(false);
                epassword("");
                ebtn("try again");
                tellUser(message);
            } else {
                tellUser("You have authenticated!")
                if ( !should_collect_payment ){
                    onDidAuth();                    
                } else {
                    let user =  await user_cache.getAdminUser();
                    await user.does_user_have_stripe_customer_id({ then: ({ customerId }) => {
                        let has = !trivialString(customerId)
                        if (has){
                            onDidSaveCard();
                        } else {
                            eshowpayment(true);
                        }
                    }});
                }
            }
        }});
        */
        await onAuthByEmail();
    }

    // global auth by email fn
    async function onAuthByEmail(){

        if ( bad_str(email, "") ){

            tellUser("Please enter valid email")

        } else if ( bad_str(password,"") ){

            tellUser("Please enter valid password")

        } else {

            eshowProgress(true);
            ebtn('authenticating'.toUpperCase())
            tellUser("");
            onWillAuth();

            await _hoc_auth_by_email({ email, password, then: async ({  success, message, data }) => {
                if ( !success ){
                    efpass(true)
                    eshowProgress(false);
                    epassword("");
                    ebtn("try again");
                    tellUser(message);
                } else {
                    tellUser("authenticated!")
                    if ( should_collect_payment ){
                        let user =  await user_cache.getAdminUser();
                        await user.does_user_have_stripe_customer_id({ then: ({ customerId }) => {
                            let has = !trivialString(customerId)
                            if (has){
                                onDidSaveCard();
                            } else {
                                eshowpayment(true);
                            }
                        }})
                    } else {
                        onDidAuth();
                    }
                }
            }})
        }       
    }

    async function onDidSubmitCreditCard(){
        onDidSaveCard()
    }


    function bad_str(str,dstr){
        return trivialString(str) || str === dstr;
    }


    async function checkStripe({ then }){
        if ( user_cache.isAuthed() ){
            let user =  await user_cache.getAdminUser();
            await user.does_user_have_stripe_customer_id({ then: ({ customerId }) => {
                let has = !trivialString(customerId)
                return then(has)
            }});
        } else {
            return then(false)
        }       

    }

    /******************************************************/
    // @view

	return (
		<div>
			{
				showpayment
				?
                <CreditCardPanel 
                    {...props} 
                    onDidSubmitCreditCard={onDidSubmitCreditCard} 
                    style = {{ 
                        marginTop: isOnMobile ? '24px' : '10vh', 
                        padding: isOnMobile ? '12px' : '24px',
                        ...(style ?? {}) 
                    }}
                />
                :
                <Stack direction={'column'} 
                    style={{ 
                        padding: '24px',
                        ...(style ?? {})
                    }}
                >
                    <Box sx={{flexGrow:1}}/>
                    { !trivialString(promptA) || !trivialString(promptB)
                        ?
                        <div style={{marginBottom: '2vh', marginLeft: '10%', marginTop: isOnMobile ? '0px' : '8vh', ...(promptStyle ?? {}) }}>
                            <Text_H1 
                                left       = {promptA}
                                right      = {promptB}
                                style_left = {{fontSize:'3vw'}}
                                style_right= {{fontSize:'2vw'}}
                            />
                        </div>
                        :
                        <div/>
                    }
                    { true 
                        ? 
                        <div/> 
                        :
                        <CenterHorizontalView>
                            <AppTextField
                                standard
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
                    }     
                    {

                        !auth_with_email
                        ?
                        <div style={{fontFamily:"NeueMachina-Black", fontSize:'36px', color:COLORS.text}}/>  
                        :
                        <div>
                            <CenterHorizontalView>
                                <AppTextField
                                    autoFocus
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
                                    autoFocus={fpass}
                                    value = { password }
                                    onChange={(e) => { 
                                        epassword(e.target.value ?? "")
                                    }}
                                    inputProps={{style: inputPropsLink}}
                                    style={{width:'80%',marginTop:'2vh'}}
                                />   
                            </CenterHorizontalView>
                        </div>

                    }
                    <ActionProgressWithProgress                    
                        showProgress={showProgress}
                        onClick = {onAuth}
                        label={btn_label}
                        progress_text={btn_label}
                        subtext={"Please allow browser popups for Twitter login"}
                        sx = {{ width: '100%', marginTop: '24px'}}
                    />                                         
                    <Box sx={{flexGrow:1}}/>
                </Stack>

            }
        </div>
	)
}


/**
 *
 * @use; input about 
 *
 **/
export function AuthAbout({
    about,
    eabout,
    bname,
    ebname,
    showProgress,
    onDidEditAbout,
    btn_label,
}){

    const isOnMobile = useCheckMobileScreen(1000);

    return (
        <Stack direction={'column'} 
            style={{ 
                padding: isOnMobile ? '2vw' : '4vw',
            }}
        >
            <Text_H1 
                left       = {isOnMobile ? "" : '* What are'} 
                right      = {isOnMobile ? "What are you manifesting?" : "you manifesting?"}
                style_left = {{fontSize:'48px'}}
                style_right= {{fontSize:'36px'}}
            />                                  
            <AppTextField
                standard
                autoFocus
                label="Title"                            
                value = { bname}
                onChange={(e) => { 
                    ebname(e.target.value ?? "")
                }}
                inputProps={{style: inputPropsLink}}
                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
            />    
            <AboutAttributeSimple
                numLines = {20}
                value    = {about}
                onChange = {e => { eabout(e.target.value ?? "") }}
                style    = {{
                    marginTop:'28px', 
                    height:'fit-content', 
                    borderRadius:'12px',
                    background:'transparent',
                    border: `1px solid ${COLORS.red_3}`
                }}
            />                
            <ActionProgressWithProgress                    
                showProgress={showProgress}
                onClick = {onDidEditAbout}
                label={btn_label}
                progress_text={btn_label}
                sx = {{ width: '150%', marginTop: '24px'}}
            />                              
        </Stack>        
    )
}



export default withAuth(withRouter(AuthAndCard))






