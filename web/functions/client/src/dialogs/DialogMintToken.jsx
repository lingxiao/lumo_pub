/** *
 * @Package: DialogMintToken 
 * @Date   : 6/11/2022
 * @Author : Xiao Ling   
 * @CSS tickets: https://freefrontend.com/css-tickets/
 *               https://medhatdawoud.net/blog/5-different-ways-to-create-a-ticket-layout
 *               https://dev.to/medhatdawoud/5-different-ways-to-create-a-ticket-layout-3024
 *
**/


import React, {useState, useEffect} from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { CenterHorizontalView } from './../components/UtilViews'


import DialogParent, { useStyles } from './DialogUtils';
import { COLORS } from './../components/constants';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import Tilt from './../components/Tilt'
import { NonfungibleTokenCard } from './../components/NonFungibleTokenCard';
import { ActionProgressWithProgress } from './../components/ButtonViews';

import { 
    trivialString,
    trivialProps,
    ppSwiftTime,
    trivialNum,
}  from './../model/utils';

import {
    GLOBAL_STAGING,
    erc_721_tok_opensea_url
} from './../model/core';


import { AppTextField } from './../components/ChatTextInput'
import {useBloggerStyle, MintBlockA, Text_H1 } from './../pages/AboutSaleView';


/******************************************************
    @view: exported
******************************************************/

/// card 
const dcard = GLOBAL_STAGING ? '4242424242424242' : 'credit card number'
const dcvc = 'cvc'
const dmo = 'month'
const dyr = 'year'


/**
 *
 * @Use: mint token if usr is authed
 *       if user is not authed, then either:
 *             - ask for email + password
 *             - or sign up w/ metamask
 *       if sign up with email + password
 *       ask user for credit card when signing up
 *
 **/
function DialogMintToken(props) {

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
        storyboard,

        mint_item,
        ticket_storyboard_id,
        did_mint,

        nft_cache,
        user_cache,
        web3_job_cache,
    } = props;
        
    /******************************************************
        @mount
    ******************************************************/    

    const [ dtitle, edtitle ]     = useState("Buy")
    const [ url, eurl     ]       = useState("");
    const [ left, eleft   ]       = useState("");
    const [ right, eright ]       = useState("");
    const [ btn_label, ebtn_label ] = useState('buy');
    const [ show_btn, eshow_btn ]  = useState(true);
    const [ showProgress, eshowProgress ] = useState(false)

    const [ minted_ticket,eminted_ticket ] = useState({});

    // credit card
    const [ has_metamask, ehas_metamask ] = useState(true)
    const [ showpayment, eshowpayment ] = useState(false);
    const [ number, enumber ] = useState(dcard);
    const [ cvc   , ecvc    ] = useState(dcvc);
    const [ exp_mo, emo     ] = useState(dmo);
    const [ exp_yr, eyr     ] = useState(dyr);
    const [ card_btn_label, ecard_btn_label ] = useState("Submit")

    /*******************************************************/
    // mount fn


    useState(async () => {
        await go_mount();
    },[open]);

    // @use: check auth status and payment status,
    // set view state accordingly
    async function go_mount(){

        // get user
        let user = await user_cache.getAdminUser();

        // if not logged in, then disable
        if ( trivialProps(user,'userID') || trivialString(user.userID) ){

            eshow_btn(false);
            await load_token_data({ metamask_installed: false });
            return tellUser("Please sign in first");

        } else {

            // check if user has metamask installed
            if ( trivialString(user.metamask_pk) ){
                ehas_metamask(false);
                await load_token_data({ metamask_installed: false });            
                await user.does_user_have_stripe_customer_id({ then: ({ message, customerId }) => {
                    eshowpayment(trivialString(customerId));
                }})
            } else {
                ehas_metamask(true);
                eshowpayment(false);
                await load_token_data({ metamask_installed: true });            
            }

        }

    }

    // load data eitehr from ticket storybaord,
    // or load the item directly
    async function load_token_data({ metamask_installed }){

        var item_to_be_minted = {};
        var btn_str_root = "Buy";

        // load collection state
        // and set item to be minted
        if ( !trivialString(ticket_storyboard_id) ){

            let board = await storyboard.get_board({ at: ticket_storyboard_id });
            let items = await storyboard.get_board_items({ storyboardID: ticket_storyboard_id });

            if ( !trivialProps(board,'ID') && items.length > 0 ){

                const { price_in_cents, price_in_eth } = board;

                if ( metamask_installed ){
                    ebtn_label(`${btn_str_root} for ${price_in_eth} ETH`)
                } else {
                    var cents = price_in_cents/100;
                    cents = trivialNum(cents) ? 0 : cents;
                    ebtn_label(`${btn_str_root} for $${cents} USD`)                    
                }

                item_to_be_minted = items[0]    
                if (  items.length - 1 >= board.num_items ){                    
                    edtitle("All passes have sold out")                
                    eshow_btn(false);
                } else {
                    edtitle("Buy Pass")                
                    eshow_btn(true);
                }
            }

        } else {

            eshow_btn(true);
            item_to_be_minted = mint_item;

            let board = await storyboard.get_board_from_item({ itemID: item_to_be_minted.itemID });

            if ( !trivialProps(board,'ID') ){
                const { price_in_cents, price_in_eth } = board;
                if ( metamask_installed ){
                    ebtn_label(`${btn_str_root} for ${price_in_eth} ETH`)
                } else {
                    var cents = price_in_cents/100;
                    cents = trivialNum(cents) ? 0 : cents;
                    ebtn_label(`${btn_str_root} for $${cents} USD`)                    
                    eshow_btn(false);
                }
            }

        }

        // set image        
        const { image_url, itemID } = item_to_be_minted
        eurl(image_url);
    }

    /*******************************************************/
    // responders web3

    // @use: global mint fn entry 
    // either mint item or see it on opensea
    async function onPressActionButton(){

        if ( !trivialString(ticket_storyboard_id) ){

            // if ticket already purhcased by fiat
            if ( !trivialProps(minted_ticket, 'fiat_purchased_by') && !trivialString(minted_ticket.fiat_purchased_by) ){

                alert("set up email")

            // if ticket already purchased + minted
            } else if ( !trivialProps(minted_ticket, 'tok_id') ){

                const { contract_address, tok_id } = minted_ticket;                    
                const { url, url_api } = erc_721_tok_opensea_url(contract_address, tok_id)
                let win1 = window.open(url, '_blank');
                let win2 = window.open(url_api, '_blank');
                win1.focus();
                win2.focus();

            } else {

                if ( has_metamask ){                    

                    return await go_mint_item()

                } else {

                    eshowProgress(true);
                    ebtn_label("Charging your credit card...");

                    await storyboard.fiat_purchase_and_premint({
                        storyboardID: ticket_storyboard_id, 
                        then_posting: (str) => {
                            tellUser(str)
                        },
                        then: async ({ success, message, paymentId, paid_in_fiat, pre_minted, data }) => {
                            if ( !success ){
                                tellUser(message)
                            } else {
                                tellUser("You have successfully purchased your ticket!")
                            }
                            eshowProgress(false);
                            ebtn_label('Email ticket to me')
                            eminted_ticket(data ?? {})
                            await did_mint();
                        }})
                }
            }

        } else {
            await web3_job_cache.can_mint_storyboard_item({
                itemID: mint_item.ID ?? "",
                then: async ({ minted, tok }) => {
                    if ( minted ){
                        const { contract_address, tok_id } = tok;                    
                        const { url, url_api } = erc_721_tok_opensea_url(contract_address, tok_id)
                        let win1 = window.open(url, '_blank');
                        let win2 = window.open(url_api, '_blank');
                        win1.focus();
                        win2.focus();
                    } else {
                        if ( has_metamask ){
                            return await go_mint_item()
                        } else {
                            return tellUser("Please install metamask to purchase this item")
                        }
                    }
                }
            });
        }
    }

    // mint the item
    async function go_mint_item(){

        eshowProgress(true);

        if (  !trivialString(ticket_storyboard_id) ){

            await web3_job_cache.mint_ticket({

                storyboard: storyboard, 
                storyboardID: ticket_storyboard_id,

                then_did_premint: (str) => {
                    eshowProgress(true);
                    ebtn_label(`Step 0/5, ${str}`);
                },

                then_will_mint: (str) => {
                    eshowProgress(true);
                    ebtn_label(`Step 1/5, ${str}`);
                },

                then_cannot_mint: ({ success, message }) => {
                    tellUser(message)
                    ebtn_label("Try again")
                    eshowProgress(false);
                },

                then_can_mint: (str) => {
                    eshowProgress(true);
                    ebtn_label(`Step 2/5, ${str}`);
                },

                then_minting: (str) => {                    
                    eshowProgress(true);
                    ebtn_label(`Step 3/5, ${str}`);
                },

                then_mint_failed: ({ success, message }) => {
                    eshowProgress(false);
                    tellUser(message);
                    ebtn_label('try again');
                },

                then_mint_progress: (str) => {
                    ebtn_label(`Step 4/5, ${str}`);
                },

                then_mint_progress_done : async ({ success, message, tok }) => {
                    if ( success && !trivialProps(tok,'tok_id') ){
                        eminted_ticket(tok);
                    }
                    tellUser('Done!')
                    eshowProgress(false);
                    ebtn_label('See token on opensea')
                },          
            })      


        } else {

            await web3_job_cache.mint_storyboard_item({ 

                storyboard: storyboard, 
                itemID: trivialProps(mint_item,'ID') ? '' : mint_item.ID,

                then_will_mint: (str) => {
                    eshowProgress(true);
                    ebtn_label(`Step 1/5, ${str}`);
                },

                then_cannot_mint: ({ success, message }) => {
                    tellUser(message)
                    eshowProgress(false);
                    setTimeout(() => { tellUser("") },3000);
                },

                then_can_mint: (str) => {
                    eshowProgress(true);
                    ebtn_label(`Step 2/5, ${str}`);
                },

                then_minting: (str) => {
                    eshowProgress(true);
                    ebtn_label(`Step 3/5, ${str}`);
                },

                then_mint_failed: ({ success, message }) => {
                    eshowProgress(false);
                    tellUser(message);
                    ebtn_label('try again');
                },

                then_mint_progress: (str) => {
                    ebtn_label(`Step 4/5, ${str}`);
                },

                then_mint_progress_done : async ({ success, message }) => {
                    tellUser('Done!')
                    eshowProgress(false);
                    ebtn_label('See token on opensea')
                    await did_mint();
                },

            })
        }
    }

    /*******************************************************/
    // responders stripe paymente


    // credit card
    async function onSubmitCreditCard(){
        // eshowpayment(false);
        let user = await user_cache.getAdminUser();
        if ( trivialProps(user,'create_user_stripe_account') ){
            return tellUser("Please sign up first");
        } else {
            eshowProgress(true);
            ecard_btn_label("Saving card")
            tellUser("");
            await user.create_user_stripe_account({
                number,
                cvc,
                exp_mo,
                exp_yr,
                then: ({ success, message, data }) => {
                    eshowProgress(false);
                    if ( !success ){
                        tellUser(message);
                        ecard_btn_label("Try again")
                    } else {
                        tellUser("Card saved!")
                        ecard_btn_label("Next")
                        eshowpayment(false);
                    }
                }
            })
        }
    }


    /******************************************************
        @view
    ******************************************************/    


    function goHandleClose(saved){
        handleClose(saved);
        setFooter();
        tellUser("");
        eshowProgress(false);
        ebtn_label('buy');
        eminted_ticket({});
    }



    // navigation + footer data
    const [ footer_left, efooter_left ] = useState("")

    async function setFooter(){
        efooter_left(`${storyboard.eth_address ?? "***"}`)
    }
    useState(() => {
        setFooter();
        setTimeout(() => {
            setFooter()
        },1000)
    },[open])

    // propagate snack msg mode thru
    const [ snack, setSnack ] = useState({ show: false, str: "" })
    useEffect(() => {
        setSnack({
            show: true,
            str : snackMessage ?? ""
        })
    }, [showSnack, snackMessage]);


    function tellUser(str){
        if ( typeof setSnack === 'function' ){
            setSnack({ show: !trivialString(str), str: str })
        }
    }

    return (
        <DialogParent 
            {...props}        
            fullWidth
            maxWidth={'wd'}
            open={open}
            snack={snack}
            title={dtitle}
            footer_top={dtitle}
            footer_left={footer_left}
            onClose={() => {goHandleClose(false)}}
        >
            {
                showpayment
                ?
                <Stack direction={'column'} 
                    style={{ 
                        paddingLeft :'4vw',
                        paddingRight:'4vw',
                        paddingTop  :'48px',
                    }}
                >
                    <Box sx={{flexGrow:1}}/>
                    <Text_H1 left={'0x-parc'} right={"* input payment to continue"}/>
                    <div style={{height:'4vh'}}/>
                    <AppTextField
                        standard
                        autoFocus
                        hiddenLabel
                        value = { number }
                        onChange={(e) => { 
                            let v = e.target.value ?? ""
                            let sv = v.slice(0,18)
                            enumber(sv)
                        }}
                        inputProps={{style: inputPropsLink}}
                        style={{width:'100%', marginTop: '12px'}}
                    />   
                    <br/>
                    <Stack direction="row" style={{}}>
                        <AppTextField
                            standard
                            hiddenLabel
                            value = { cvc }
                            onChange={(e) => { 
                                let v = e.target.value ?? ""
                                let sv = v.slice(0,3)
                                ecvc(sv)
                            }}
                            inputProps={{style: inputPropsDate}}
                            style={{width:'50%', marginTop: '12px'}}
                        />  
                        <Box sx={{flexGrow:1}}/>
                        <AppTextField
                            standard
                            hiddenLabel
                            value = { exp_mo }
                            onChange={(e) => { 
                                let v = e.target.value ?? ""
                                let sv = v.slice(0,2)
                                emo(sv)
                            }}
                            inputProps={{style: inputPropsDate}}
                            style={{width:'15%', marginTop: '12px'}}
                        />  
                        <AppTextField
                            standard
                            hiddenLabel
                            value = { exp_yr }
                            onChange={(e) => { 
                                let v = e.target.value ?? ""
                                let sv = v.slice(0,4)
                                eyr(sv)
                            }}
                            inputProps={{style: inputPropsDate}}
                            style={{width:'15%', marginLeft:'12px', marginTop: '12px'}}
                        />    
                    </Stack> 
                    <br/><br/>
                    <CenterHorizontalView style={{}}>
                        <ActionProgressWithProgress                    
                            showProgress={showProgress}
                            onClick = {onSubmitCreditCard}
                            label={card_btn_label}
                            progress_text={card_btn_label}
                            sx = {{width: '120%'}}
                        />                         
                    </CenterHorizontalView>
                    <Box sx={{flexGrow:1}}/>
                </Stack>
                :
                <div style={{width:'100%', marginTop:'36px', marginBottom:'-42px'}}>
                    <CenterHorizontalView>
                        <Tilt>
                            <NonfungibleTokenCard
                                style={{
                                    margin:'8px',
                                    marginBottom: '16px',
                                }}
                                full_image   
                                hide_footer
                                data         = {mint_item}
                                image_height = {'50vh'}
                                footer_left  = {left}
                                footer_right = {right}
                                image_url    = {url}
                            />
                        </Tilt>
                    </CenterHorizontalView>   
                    { !show_btn ? <div/> :
                    <ActionProgressWithProgress
                        showProgress={showProgress}
                        onClick = {onPressActionButton}
                        label={btn_label}
                        progress_text={btn_label}
                    />                  
                    }
                </div>
        }
        </DialogParent>

    )

}


const inputPropsLink = {
    fontSize: `4vh`,
    color     : COLORS.text2,
    fontFamily: 'NeueMachina-Regular'
}
const inputPropsDate = {
    fontSize: `3vh`,
    color     : COLORS.text2,
    fontFamily: 'NeueMachina-Regular'
}

/******************************************************
    @export
******************************************************/

export default withAuth(withRouter(DialogMintToken))






