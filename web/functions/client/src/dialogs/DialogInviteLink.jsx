/** *
 * @Package: DialogInviteLink 
 * @Date   : 5/25/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { CenterHorizontalView } from './../components/UtilViews'

import { 
    trivialString,
    trivialProps,
    contractMetamaskAddress,
}  from './../model/utils';

import {
    home_page_url
} from './../model/core';


import DialogParent, { useStyles } from './DialogUtils';
import { COLORS } from './../components/constants';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/******************************************************
    @style
******************************************************/

const inputPropsTitle = {
    fontSize: `3vh`,
    fontFamily: 'NeueMachina-Black',    
    color     : COLORS.text,
    cursor: 'pointer'
}


/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogInviteLink(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useStyles(isOnMobile, true, false)();    

    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        snackMessage, 
        showSnack, 
        user_cache,
        storyboard,
        invite_data,
        board_id,
        is_private,
    } = props;
        
    // basics
    const [ title, etitle ] = useState("Share Invite Link")
    const [ link, elink ] = useState("")
    const [ slink, eslink ] = useState('')

    // navigation + footer data
    const [ footer_left, efooter_left ] = useState("")

    /******************************************************
        @mount
    ******************************************************/    

    // set page kind
    useState(() => {
        setFooter();
        setTimeout(() => {
            setFooter()
        },1000)
    },[open])

    useEffect(async () => {

        if ( !trivialProps(invite_data, 'url') ){

            etitle(invite_data.title ?? "");
            elink(invite_data.url);
            eslink( contractMetamaskAddress({ pk: invite_data.url, m: 5, n: 30 }) );

        } else if ( !trivialString(board_id) && typeof board_id === 'string' ){

            var _link = ""
            if ( typeof is_private === 'boolean' && is_private ){
                _link = `${home_page_url()}/whitelist/${storyboard.eth_address}/${board_id}`
                etitle("Share whitelist Link")
            } else {
                _link = `${home_page_url()}/house/${storyboard.eth_address}?=${board_id}`
                etitle("Share Buy Link")
            }
            elink(_link);
            eslink(contractMetamaskAddress({ pk: _link, m: 5, n: 30 }))

        } else if ( !trivialProps(storyboard, 'get_invite_link') ){

            await storyboard.get_invite_link({ then: (str, name, _tok) => {
                elink(str)
                eslink(contractMetamaskAddress({ pk: str, m: 5, n: 30 }))
                etitle("Share Invite Link")
            }})
        }

    },[open, board_id, invite_data]);

    /******************************************************
        @main POST responder
    ******************************************************/    


    function goHandleClose(saved){
        handleClose(saved);
        setFooter();
        tellUser("");
    }

    function copy(){
        navigator.clipboard.writeText(link)
        tellUser('copied')
    }    

    /******************************************************
        @view
    ******************************************************/    

    async function setFooter(){
        efooter_left(`${storyboard.eth_address ?? "***"}`)
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
        <DialogParent 
            {...props}        
            fullWidth
            open={open}
            onClose={goHandleClose}
            snack={snack}
            title={title}
            footer_top={title}
            footer_left={footer_left}
        >

            <div style={{width:'100%', marginTop:'70px', marginBottom:'24px'}} onClick={copy}>
                <CenterHorizontalView>
                    <ContentCopyIcon style={{ color: COLORS.text }}/>
                    <div style={inputPropsTitle}>
                        {` ${slink}`}
                    </div>
                </CenterHorizontalView>                                       
            </div>
        </DialogParent>

    )

}


/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogInviteLink))






