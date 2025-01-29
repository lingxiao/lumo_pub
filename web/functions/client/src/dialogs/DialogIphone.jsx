/** *
 * @Package: DialogIphone
 * @Date   : 8/10/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Stack from '@mui/material/Stack';

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
import QRCode from "react-qr-code";


/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogIphone(props) {

    const isOnMobile = useCheckMobileScreen(1000);

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        tellUser,
        user_cache,
    } = props;
        

    /******************************************************/
    // @mount

    const [ seed, eseed ] = useState("");
    

    // @TODO: make user sign w/ metamask 
    // to generate a key hash that get sued as the user's
    // secret phrase, if the user has metamask acct.
    useEffect(async () => {

        if (  trivialProps(user_cache, 'before_auth_on_mobile') ){
            return;
        }
        await user_cache.before_auth_on_mobile({ then: ({ success, message, seed }) => {
            if ( !success ){
                return tellUser(message)
            } else {
                eseed(seed);
            }
        }})

    },[open]);

    /******************************************************/
    // @view

    const img_style = {
        backgroundImage: `url(${burn_img})`,    
        padding: '36px',
    }

    const h1_style = {
        fontSize: `2vh`,
        lineHeight: 1.2,
        fontFamily: 'NeueMachina-Bold',    
        color     : COLORS. text,
        color: COLORS.text,
        textAlign:'center',
        paddingTop: '36px',
        paddingBottom: '24px',        
    }


    const h2_style = {
        opacity:0.80,
        fontSize: `1.5vh`,
        fontFamily: 'NeueMachina-Regular',    
        color: COLORS.text,
        textAlign:'center',
        marginTop:'24px',
    }


    return (
        <DialogParent 
            {...props}
            fullWidth
            is_bare
            open={open}
            onClose={handleClose}
            snack={{ str: '', showSnack: false }}
            title={'Connect your mobile app'}
            footer_top={'Connect your mobile app'}
        >
            <div style={{border: `0.5px solid ${COLORS.surface2}`, marginTop: isOnMobile ? '-68px' : '0px'}}>
                <Stack direction='column' style={img_style}>
                    <CenterHorizontalView>
                        <div style={{...h1_style}}>
                            {`Download the PARC app on the iOS Appstore and scan this code to login on mobile.`}
                        </div>
                    </CenterHorizontalView>                    
                    <CenterHorizontalView>
                        { trivialString(seed)
                            ?
                            <div style={{width:'200px', height:'200px'}}/>
                            :
                            <QRCode
                                size={200}
                                style={{width: '200px', height:'200px'}}
                                value={seed}
                                viewBox={`0 0 200 200`}                        
                            />
                        }
                    </CenterHorizontalView>    
                    <CenterHorizontalView>
                        <div style={{...h2_style}}>
                            {`This step is best done on your desktop app. Currently we're only available on the iOS appstore.`}
                        </div>
                    </CenterHorizontalView>                                        
                </Stack>
            </div>        
        </DialogParent>
    )

}






/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogIphone))


