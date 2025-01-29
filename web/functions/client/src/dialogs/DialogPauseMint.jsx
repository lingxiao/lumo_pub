/** *
 * @Package: DialogPauseMint
 * @Date   : 8/9/2022
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


import burn_img from './../assets/burn1.jpeg';

/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
export default function DialogPauseMint(props) {

    const isOnMobile = useCheckMobileScreen(1000);


    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        tellUser,
        storyboard,
        web3_job_cache,
        showlinearprogress,
        eshowlinearprogress,
    } = props;
    

    const [ btn_label, ebtn_label ] = useState("Syncing...")
    const [ paused_mint, epaused_mint ] = useState(false);
    const [ title, etitle ] = useState("** **")
    const [ str, estr ] = useState("syncing...")


    /******************************************************/
    // @mount

    // load data if is editing
    useEffect(async () => {

        if ( trivialProps(storyboard, 'read_mint_is_paused') ){
            return tellUser(`Error reading ERC-1155 pause status`)
        }

        await storyboard.read_mint_is_paused({ then: ({ success, message, isPaused }) => {
            if ( success ){

                epaused_mint(isPaused);

                if ( isPaused ){
                    ebtn_label('Resume Mint')
                    etitle(`** Mint is Disabled **`);
                    estr(`This means no one can mint from this contract. To resume mint, press the "Resume Mint" button`)
                } else {
                    ebtn_label("Pause Mint")
                    etitle('** Mint is LIVE! **');
                    estr(`This means anyone can mint from this contract provided they pay the mint fee.`);
                }

            } else {
                tellUser(`Error reading ERC-1155 pause status: ${message}`)
            }
        }})


    },[open]);


    /******************************************************/
    // @POST responder

    // save profile
    async function onPressActionButton(){
        tellUser("You will be asked to sign once")
        eshowlinearprogress(true);
        await storyboard.toggle_mint_state({ should_pause: !paused_mint, then: ({ success, message }) => {
            if ( success ){
                tellUser(`Signed! Please wait for the chain to update to reflect your command.`)
            } else {
                tellUser(message);
            }
            setTimeout(() => {
                tellUser("");
                handleClose();
                eshowlinearprogress(false);
            },3000)
        }})
    }


    /******************************************************/
    // @view

    const body_right_style = {
        backgroundImage: `url(${burn_img})`,    
        padding: '36px',
    }

    const inputPropsTitle = {
        fontSize: `4vw`,
        fontFamily: 'NeueMachina-Black',    
        color     : COLORS. text,
    }


    const inputPropsChoice = {
        fontSize: `2vw`,
        fontFamily: 'NeueMachina-Light',    
        color: COLORS.text,
        textAlign:'center',
        paddingTop: '24px',
        paddingBottom: '36px',        
        opacity:0.7,
    }


    return (
        <DialogParent 
            {...props}
            fullWidth
            is_bare
            open={open}
            onClose={handleClose}
            snack={{ str: '', showSnack: false }}
            title={'Contract Mint Status'}
            footer_top={'Pause or unpause mint'}
        >
            <div style={{border: `0.5px solid ${COLORS.surface2}`, marginTop: isOnMobile ? '-68px' : '0px'}}>
                <Stack direction='column' style={body_right_style}>
                    <CenterHorizontalView>
                        <div style={{...inputPropsTitle, margin: '36px', textDecoration:'underline'}}>
                            {title}
                        </div>
                    </CenterHorizontalView>                    
                    <CenterHorizontalView>
                        <div style={{ ...inputPropsChoice}}>
                            {str}
                        </div>
                    </CenterHorizontalView>
                    <CenterHorizontalView style={{}}>
                        <ActionProgressWithProgress                    
                            showProgress={showlinearprogress}
                            onClick = {onPressActionButton}
                            label={btn_label}
                            progress_text={btn_label}
                            sx = {{width: '120%', color: COLORS.surface3, border: `0.01px solid ${COLORS.surface3}`}}
                        />                         
                    </CenterHorizontalView>

                </Stack>
            </div>        
        </DialogParent>
    )

}




