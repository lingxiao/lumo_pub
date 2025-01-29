/** *
 * @Package: DialogPayout
 * @Date   : 6/19/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Stack from '@mui/material/Stack';

import { ActionProgressWithProgress } from './../components/ButtonViews';

import { 
    trivialString,
    trivialProps,
}  from './../model/utils';

import DialogParent from './DialogUtils';
import { COLORS } from './../components/constants';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { CenterHorizontalView } from './../components/UtilViews';

import { 
    useNftvieWstyles,
}  from './../pages/AppStoryboard'


import burn_img from './../assets/burn1.jpeg';

/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogPayout(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const tclasses   = useNftvieWstyles(isOnMobile, "")();


    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        tellUser,
        storyboard,
        web3_job_cache,
    } = props;
        

    const [ showProgress, eshowProgress ] = useState(false);
    const [ amt_owed, eamt_owed ] = useState(0);
    const [ btn_text, ebtn_text ] = useState('Claim your eth');
    const [ progress_text, eprogress_text ] = useState("");

    /******************************************************
        @mount
    ******************************************************/    

    // load data if is editing
    useEffect(async () => {
        if ( trivialProps(storyboard,'eth_address') ){
            return;
        }
        await set_owed();
    },[open]);

    async function set_owed(){
        await web3_job_cache.fund_owed({
            project_address: storyboard.eth_address,
            then_read_funds_fail: (str) => {
                // tellUser(str)
            },
            then_read_funds_success: ({ success, message, balance }) => {
                if ( !success ){
                    // tellUser(message);
                } else {
                    eamt_owed(balance);
                }
            }
        });        
    }

    /******************************************************
        @main POST responder
    ******************************************************/    

    // save profile
    async function onPressActionButton(){
        const address = storyboard.eth_address;
        eshowProgress(true);
        eprogress_text('awaiting signature')
        await web3_job_cache.release_funds({
            project_address: address,
            then_releasing_funds: (str) => {
                eprogress_text(str)
            },
            then_released_funds_fail: (str) => {
                tellUser(str);
                eshowProgress(false);
            },
            then_released_funds_success: async ({ success, message }) => {
                tellUser(message)
                eshowProgress(false);
                if ( success ){
                    // ebtn_text('paid!')                    
                    await set_owed();
                    setTimeout(() => {
                        handleClose();
                    },1000)
                }
            }
        })
    }


    /******************************************************
        @view
    ******************************************************/    

    const body_right_style = {
        backgroundImage: `url(${burn_img})`,    
        padding: '36px',
    }

    const inputPropsTitle = {
        fontSize: `4vh`,
        fontFamily: 'NeueMachina-Black',    
        color     : COLORS. text,
        marginTop: '-32px',
    }


    const inputPropsChoice = {
        fontSize: `5vh`,
        fontFamily: 'NeueMachina-Black',    
        paddingLeft: '36px',
        paddingRight: '36px',        
    }


    return (
        <DialogParent 
            {...props}
            fullWidth
            is_bare
            open={open}
            onClose={handleClose}
            snack={{ str: '', showSnack: false }}
            title={'Claim your fund'}
            footer_top={'Claim your funds'}
        >
            <div style={{border: `0.5px solid ${COLORS.surface2}`, marginTop: isOnMobile ? '-68px' : '0px'}}>
                <Stack direction='column' style={body_right_style}>
                    <CenterHorizontalView>
                        <div style={{...inputPropsTitle, margin: '36px', textDecoration:'underline'}}>
                            {`** You are owed **`}
                        </div>
                    </CenterHorizontalView>                    
                    <CenterHorizontalView>
                        <Stack direction='row' style={{ marginLeft: '36px', marginRight:'36px', marginBottom:'24px' }} >
                            <div direction='column' style={{ padding: '24px', }}>
                                <div style={{ ...inputPropsChoice, color: COLORS.text }}>    
                                    {`${amt_owed} eth`.toUpperCase()}
                                </div>
                            </div>
                        </Stack>
                    </CenterHorizontalView>
                    { amt_owed === 0 || trivialString(amt_owed) ? <div/> :
                    <ActionProgressWithProgress
                        showProgress={showProgress}
                        btn_text_style={{color:COLORS.surface2}}
                        onClick = {onPressActionButton}
                        label={btn_text}
                        progress_text={progress_text}
                    />
                    }
                </Stack>
            </div>        
        </DialogParent>
    )

}






/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogPayout))


