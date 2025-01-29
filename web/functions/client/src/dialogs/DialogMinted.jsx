/** *
 * @Package: DialogMinted
 * @Date   : 8/4=7/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Stack from '@mui/material/Stack';

import DialogParent, { useStyles } from './DialogUtils';
import { COLORS } from './../components/constants';
import Grid from "@material-ui/core/Grid";

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import Tilt from './../components/Tilt'

import { 
    cap,
    ppSwiftTime,
    trivialNum,
    trivialString,
    trivialProps,    
    contractMetamaskAddress,
}  from './../model/utils';

import {
    erc_721_tok_opensea_url,
} from './../model/core'

import {
    get_all_minted_tok_owned_by,
    get_fiat_minted_tok_owned_by,
} from './../model/api_storyboard';

import { 
    StoryBoardCard,    
} from './../components/NonFungibleTokenCard';

/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: wrap around any children with scroll action
 *
 **/
function DialogMinted(props) {

    const isOnMobile = useCheckMobileScreen(1000);

    const { 
        open, 
        handleClose,
        user_cache,
    } = props;        


    const [ datasource, edatasource ] = useState([])

    // load all my toks
    useEffect(async () => { 

        if ( trivialProps(user_cache,'getAdminUser') ){
            return;
        }

        let user = await user_cache.getAdminUser();
        if ( trivialProps(user,'userID') ){
            return;
        }

        // get minted
        await get_all_minted_tok_owned_by({ userID: user.userID ?? "", then: async ({ success, data }) => {

            if ( !trivialProps(data,'sort') ){
                let sdata = data.sort((a,b) => b.timeStampCreated - a.timeStampCreated)
                edatasource(sdata);
            }

            // get fiat pre-minted
            await get_fiat_minted_tok_owned_by({ userID: user.userID ?? "", then: (res) => {
                if ( !trivialProps(res,'data') && res.data.length > 0 ){
                    let _new_data = datasource
                        .concat( res.data ?? [] )
                        .sort((a,b) => b.timeStampCreated - a.timeStampCreated)
                    edatasource(_new_data);
                }
            }})
        }})

    },[open]);

    /******************************************************/
    // main POST responder

    // save profile
    async function onPressActionButton(){
        return;
    }


    /******************************************************
        @view
    ******************************************************/    

    function goHandleClose(saved){
        handleClose();
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
            maxWidth={ isOnMobile ? 'wd' : 'md'}            
            title={'Minted Passes'}
            footer_top={'A place for all your passes'}
            footer_left={""}
        >
            <Grid container columns={{ xs: 1, sm: 1, md: 1, lg: 1 }}>
                {datasource.map((data,index) => (
                    <Grid item xs={12} sm={12} md={12} lg={12} key={index}>
                        <MintedTokenCard {...props} key={index} tellUser={tellUser} data={data}/>
                    </Grid>
                ))}
            </Grid>  
        </DialogParent>

    )

}


// one minted token card
function MintedTokenCard({ data }){

    // view state
    const [ header_left, eheader_left ] = useState("")
    const [ header_right, eheader_right ] = useState("")
    const [ image_url, eimage_url ] = useState("");
    const [ anime_url, eanime_url ] = useState("");
    const [ _url, eurl ] = useState('');

    useEffect(async () => {

        if ( trivialProps(data,'ID') ){
            return;
        }

        const {
            name,
            tok_id,
            image_url,
            image_original_url,
            contract_address,
            timeStampCreated,
            fiat_payment_id,
        } = data;

        eheader_left(ppSwiftTime({ timeStamp: timeStampCreated, dateOnly: false }));
        eimage_url( image_original_url ?? image_url );

        if ( trivialString(fiat_payment_id) ){
            if ( trivialString(tok_id) ){
                eheader_right('Minting...')
            } else {
                eheader_right(`${contractMetamaskAddress({ pk: contract_address, m: 3, n: 5 })}/${tok_id ?? ""}`);
            }
            const { url } = erc_721_tok_opensea_url(contract_address, tok_id)
            eurl(url)
        } else {
            eheader_right("Preminted Pass");
        }

    }, [data]);

    function on_click_image(){
        if ( !trivialString(_url) ){
            let win1 = window.open(_url, '_blank');
            win1.focus();
        }
    }   

    return (
        <Tilt>
            <StoryBoardCard
                style={{
                    margin:'8px',
                    marginTop:'16px',
                    marginBottom: '16px',
                }}
                full_image
                hide_footer
                hide_twitter_btn 
                data         = {data}
                header_left  = {header_left}
                header_right = {header_right}
                onClickTitle = {on_click_image}
                text         = {''}

                t1_left      = {''}
                t1_right     = {""}
                t5_bottom    = {""}
                onClickEdit  = {cap}            
                on_tweet     = {cap}
                footer_left  = {''}
                footer_right = {""}
                image_url    = {image_url}
                anime_url    = {anime_url}
                table_title  = {''}
                t2          = {""}
                t3_left     = {""}
                t3_right    = {""}
                t4_top      = {''}
                t4_middle   = {""}
                t4_bottom   = {""}
                t5_top      = {"token address"}
                t5_bottom   = {""}
                mint_btn_label = {""}
                mint_btn_style = {{}}
                onClickt3right = {cap}
                table_data_source = {[]}
                onClickUser       = {cap}
            />
        </Tilt>
    )

}

/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogMinted))






