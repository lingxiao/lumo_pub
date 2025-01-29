/**
 *
 *
 * @Package: FullScreenAboutView
 * @Date   : Jan 28th, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useEffect, useState} from "react";

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { CenterHorizontalView } from './../components/UtilViews'

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { ActionProgressWithProgress } from './../components/ButtonViews'
import { AppTextField } from './../components/ChatTextInput'

import { COLORS } from './../components/constants';

import {
    swiftNow,
    ppSwiftTime,    
    trivialProps,
    trivialString,
} from './../model/utils'

import { InviteImageBlock } from './AppInvitePage'
import { 
    AboutRareText, 
    TicketHolderTitle
} from   './AppStoryboardRare';

import { 
    Text_H1,
    useBloggerStyle,
    UserRowBlock,
    CloseIconBlock, 
} from './AboutSaleView';

import {
    GLOBAL_STAGING,
    CollectionKind,
    erc_721_tok_opensea_url
} from './../model/core';



/******************************************************
    @ticket machine
******************************************************/


/**
 *
 * @Use: render ticket machine
 * 
 */
export default function TicketMachine(props) {

    const isOnMobile = useCheckMobileScreen(900);
    const classes = useBloggerStyle(isOnMobile)();

    const { 
        storyboard,
        board_root,
        tellUser,

        showlinearprogress,
        eshowlinearprogress,
        user_cache,
        web3_job_cache, 
    } = props;

    // ticket datasource
    const [ name, ename ] = useState("")
    const [ img, eimg   ] = useState("");
    const [ about, eabout ] = useState("");
    const [ price, eprice ] = useState(0);
    const [ price_str, eprice_str ] = useState('');
    const [ num_editions, enum_editions ] = useState(1);

    // board datasoruce
    const [ items, eitems ] = useState([]);
    const [ tix_users, etix_users ] = useState({ datasource: [], idx: 0, chunk_size: 10 });
    const [ _reload_customer_list, e_reload_customer_list ] = useState(false);

    // payment state
    const [ has_metamask, ehas_metamask ] = useState(true)
    const [ has_stripe, ehas_stripe ] = useState(false);
    const [ showpayment, eshowpayment ] = useState(false);

    // label
    const [ key_word, ekey_word ] = useState({ 
        singular: 'pass', 
        plural  : 'passes',
        sold    : 'sold',
        mint    : 'purchased',
    })


    /******************************************************/
    // @load data

    useEffect(async () => {
        await mount_user();
        await mount_board();
    },[]);    

    // @use: check auth status and payment status,
    // set view state accordingly
    async function mount_user(){

        // get user
        let user = await user_cache.getAdminUser();

        // if not logged in, then disable
        if ( trivialProps(user,'userID') || trivialString(user.userID) ){
            tellUser("Please sign in first");
            setTimeout(() => { tellUser("") },3000);
        } else {
            // check if user has metamask installed
            if ( trivialString(user.metamask_pk) ){
                ehas_metamask(false);
                await user.does_user_have_stripe_customer_id({ then: ({ message, customerId }) => {
                    ehas_stripe( !trivialString(customerId) );
                }})
            } else {
                ehas_metamask(true);
                ehas_stripe(false);
                // eshowpayment(false);
            }
        }
    }

    // @use: mount storyboard
    async function mount_board(){

        let board_id = trivialProps(board_root, 'ID') ? "" : board_root.ID;

        if ( trivialProps(storyboard,'get_board_items') || trivialString(board_id) ){
            return;
        }

        // get board root
        let board = await storyboard.get_board({ at: board_id });
        let items = await storyboard.get_board_items({ storyboardID: board_id });

        if ( trivialProps(board,'ID') || items.length === 0 ){
            return;
        }

        // set board values
        const item = items[0]
        eimg(item.image_url ?? "");
        ename(board.name ?? "");
        eabout(board.about ?? "");
        enum_editions( board.num_items ?? 1 );        

        // set ekey_word
        if ( board.kind === CollectionKind.membership ){
            ekey_word({  singular: 'membership', plural: 'memberships', sold: 'reserved', mint: 'reserved' })
            ebtn_label(`Reserve`)
        }

        // set price + mount customer list
        await set_price(board)
        await mount_customer_list(false);  
    }

    // set item price
    async function set_price(board){

        // set price
        let user = await user_cache.getAdminUser();        
        let _p = (board.price_in_cents ?? 0)/100;

        if ( trivialProps(user,'userID') || trivialString(user.userID) ){
            eprice(board.price_in_eth ?? 0);
            eprice_str(`${board.price_in_eth ?? 0} ETH ($${_p} USD)/${key_word.singular}`);
        } else if ( !trivialString(user.metamask_pk) ){
            eprice(board.price_in_eth ?? 0);
            eprice_str(`${board.price_in_eth ?? 0} ETH/${key_word.singular}`)
        } else {
            eprice(_p);
            eprice_str(`$${_p} USD/${key_word.singular}`)
        }

    }

    // get minted items, and sort LIFO
    async function mount_customer_list( resync ){

        if ( resync ){

            storyboard.sync({ reload: true, fast: false, then: async () => {
                await _go_mount();
            }})

        } else {

            await _go_mount();
        }


        async function _go_mount(){

            etix_users({ ...tix_users, datasource: [] });

            let board_id = trivialProps(board_root, 'ID') ? "" : board_root.ID;
            let items = await storyboard.get_board_items({ storyboardID: board_id }) ?? [];        

            // get minted items, and sort LIFO
            var sold_items = items
                .sort((a,b) => a.timeStampCreated - b.timeStampCreated)
                .map(item => {
                    let tt = ppSwiftTime({ timeStamp: item.timeStampCreated, dateOnly: false });
                    let res = { ...item, ppTimeStamp: tt }
                    return res;
                })
            sold_items = sold_items.slice(1,);
            sold_items = sold_items.sort((a,b) => b.timeStampCreated - a.timeStampCreated)
            eitems(sold_items);

            // chunk tickts in batchs for easier rendering
            let tix_users_datasource = sold_items.reduce((all,one,i) => {
                const ch = Math.floor(i/tix_users.chunk_size); 
                all[ch] = [].concat((all[ch]||[]),one); 
                return all
            }, []);

            etix_users({ ...tix_users, datasource: tix_users_datasource})            

        }

    }

    /******************************************************/
    // @nav responder

    // navigate to opensea + etherscan 
    async function onClickMintedUserItem(data){

        if ( trivialProps(data,'ID') || trivialProps(storyboard,'sync') ){

            return tellUser("Please refresh the page")

        } else {

            const { mint_tx_hash, mint_state, itemID } = data;

            if ( mint_state === "fiat_purchased_await_mint" ){

                tellUser("This item was preminted and purchased by cash");
                setTimeout(() => {tellUser("")},3000);

            } else if ( !trivialString(itemID) ){

                await storyboard.fetch_minted_tok({ itemID, then: (tok) => {

                    if ( trivialProps(tok,'tok_id') ){

                        go_to_etherscan(mint_tx_hash);

                    } else {

                        const {  tok_id, contract_address } = tok;
                        let { url } = erc_721_tok_opensea_url(contract_address, tok_id);
                        let win = window.open(url,'_blank');
                        win.focus();
                        go_to_etherscan(mint_tx_hash);

                    }

                }})

            } else {
                go_to_etherscan(mint_tx_hash);
            }
        }

        function go_to_etherscan(mint_tx_hash){
            if ( trivialString(mint_tx_hash) ){
                tellUser("Slow down. You're going too fast!")
            } else {
                let url = storyboard.getEtherscanTxURL(mint_tx_hash);
                let win = window.open(url, '_blank');
                win.focus();
            }
        }
    }


    /******************************************************/
    // @mint responder

    // ticket mint state
    const [ btn_label, ebtn_label ] = useState(`buy ${key_word.singular}`);
    const [ is_minting, eis_minting ] = useState(false);
    const [ minted_ticket,eminted_ticket ] = useState({});


    // @use: global mint fn entry 
    // either mint item or see it on opensea
    async function onGoMint(){

        tellUser("");

        if ( trivialProps(board_root,'ID') ){
            tellUser("Please refresh this page to continue");
            return;
        }

        let ticket_storyboard_id = board_root.ID;
        let user = await user_cache.getAdminUser();

        if ( trivialProps(user,'userID') || trivialString(user.userID) ){

            tellUser("Please sign in first");
            setTimeout(() => { tellUser("") },3000);

        } else if ( !trivialProps(minted_ticket, 'fiat_purchased_by') && !trivialString(minted_ticket.fiat_purchased_by) ){
        // if ticket already purhcased by fiat

            tellUser("Click the QR code on top right next to your profile icon so see your pass. Your pass has been preminted, you can mint it on chain at any time.")

        // if ticket already purchased by eth + minted
        } else if ( !trivialProps(minted_ticket, 'tok_id') ){

            const { contract_address, tok_id } = minted_ticket;                    
            const { url, url_api } = erc_721_tok_opensea_url(contract_address, tok_id)

            tellUser("You will be directed to OpenSea and OpenSea API in four seconds. If the pages say not found, keep refreshing OpenSea until OpenSea finds it!")

            eshowlinearprogress(true);
            ebtn_label("connecting to opensea")

            setTimeout(() => {
                tellUser("")
                eshowlinearprogress(false);
                ebtn_label("Go to opensea");
                let win1 = window.open(url, '_blank');
                let win2 = window.open(url_api, '_blank');
                win1.focus();
                win2.focus();
            },4000);

        } else if ( has_metamask ){

            return await go_mint_item()

        } else if ( has_stripe ) {

            eshowlinearprogress(true);
            ebtn_label("Charging your credit card...");

            await storyboard.fiat_purchase_and_premint({
                storyboardID: ticket_storyboard_id, 
                then_posting: (str) => {
                    tellUser(str)
                },
                then: async ({ success, message, paymentId, paid_in_fiat, pre_minted, data }) => {

                    eshowlinearprogress(false);
                    eminted_ticket(data ?? {});

                    if ( !success ){
                        tellUser(message)
                        ebtn_label('Try again')
                    } else {
                        tellUser(`You have successfully purchased your ${key_word.singular}`)
                        ebtn_label('Show me to the Pass')
                    }

                    // reload user list
                    e_reload_customer_list(true)
                    setTimeout(async () => {
                        await mount_customer_list(true);
                        e_reload_customer_list(false)                
                    },50);


                }})


        } else if ( !has_stripe ){

            eshowpayment(true);

        } else {

            return;
        }
    }


    // mint the item on client side
    // w/ user's metamask
    async function go_mint_item(){

        eshowlinearprogress(true);

        await web3_job_cache.mint_ticket({

            storyboard: storyboard, 
            storyboardID: board_root.ID,

            then_did_premint: (str) => {
                eshowlinearprogress(true);
                ebtn_label(`Step 0/5, ${str}`);
            },

            then_will_mint: (str) => {
                eshowlinearprogress(true);
                ebtn_label(`Step 1/5, ${str}`);
            },

            then_contract_paused_mint: (str) => {
                tellUser(str);
                ebtn_label("_")
                eshowlinearprogress(false);
            },

            then_cannot_mint: ({ success, message }) => {
                tellUser(message)
                ebtn_label("Try again")
                eshowlinearprogress(false);
            },

            then_can_mint: (str) => {
                eshowlinearprogress(true);
                ebtn_label(`Step 2/5, ${str}`);
            },

            then_minting: (str) => {                    
                eshowlinearprogress(true);
                ebtn_label(`Step 3/5, ${str}`);
            },

            then_mint_failed: ({ success, message }) => {
                eshowlinearprogress(false);
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
                setTimeout(async () => {
                    tellUser('Done!')
                    eshowlinearprogress(false);
                    ebtn_label('See token on opensea')

                    // reload user list
                    e_reload_customer_list(true)
                    setTimeout(async () => {
                        await mount_customer_list(true);
                        e_reload_customer_list(false)                
                    },50);

                },2000);
            },          
        })

    }

    // on did save credit card, hide 
    // card input and sell by fiat
    async function onDidSubmitCreditCard(){
        ehas_stripe(true);
        eshowpayment(false);
    }


    /******************************************************/
    // @view

    function get_current_datasource(){
        const { datasource, idx } = tix_users;
        if ( datasource.length === 0 ){
            return []
        } else {
            let _idx = Math.min(datasource.length-1,idx);
            return datasource[_idx];
        }
    }

    function next_page_of_users(){
        const { datasource,  idx } = tix_users;
        let _idx = (idx + 1) > datasource.length - 1 ? 0 : idx + 1;
        etix_users({ ...tix_users, idx: _idx })
    }    

    if (  isOnMobile ){

        return (
            <Stack direction={'column'} className={classes.container_alt_mobile}>
                <div className={classes.container_left} style={{height:'100%', marginBottom:'12px', width:'100%'}}>
                    { showlinearprogress 
                        ? 
                        <div style={{height:'64px'}} /> 
                        :                 
                        <CloseIconBlock {...props} close_style={{marginRight:'36px'}}  />
                    }
                    <AboutRareText 
                        name={name} 
                        about={about} 
                        h1={`${Math.max(0,items.length)}/${num_editions} ${key_word.plural} ${key_word.sold}`}
                        h2={`Price: ${price_str}`}
                    />  
                    {
                        showpayment 
                        ?
                        <Stack direction='row' className={classes.container_right_mobile}>
                            <CreditCardPanel 
                                {...props} 
                                onDidSubmitCreditCard={onDidSubmitCreditCard} 
                            />
                        </Stack>
                        :                    
                        <Stack direction='column' className={classes.container_right_mobile}>
                            <InviteImageBlock
                                show_full_image
                                name={name}
                                address={""}
                                img_url={img}
                                showProgress={showlinearprogress}
                                onAccept={onGoMint}
                                btn_str={btn_label}
                                progress_text={btn_label}
                            />  
                            <br/><br/><br/><br/><br/><br/>
                        </Stack>    
                        }
                </div>
            </Stack>
        )

    } else {

        return (
            <Stack direction={'row'} className={classes.container_alt}>
                <div className={classes.container_left}>
                    { showlinearprogress 
                        ? 
                        <div style={{height:'64px'}} /> 
                        : 
                        <CloseIconBlock {...props} flush_left close_style={{ marginLeft: '20px', marginBottom:'12px', }} />
                    }
                    <AboutRareText 
                        name={name} 
                        about={about} 
                        h1={`${Math.max(0,items.length)}/${num_editions} ${key_word.plural} ${key_word.sold}`}
                        h2={`Price: ${price_str}`}
                    />  
                    <br/>
                    <TicketHolderTitle
                        title={`${key_word.singular} holders`}
                        show_next_btn data={tix_users} 
                        next_page_of_users={next_page_of_users} 
                        title_style={{fontSize:'24px', fontFamily: 'NeueMachina-Medium'}} 
                        btn_style={{marginTop:'10px'}}
                    />                             
                    <div style={{marginLeft:'12px'}} >
                        { _reload_customer_list
                            ?
                            <div/>
                            :
                            (get_current_datasource().slice(0,10)).map((item,index) => {
                                return (
                                    <UserRowBlock 
                                        {...props} 
                                        key={index}
                                        userID={trivialProps(item,'userID') ? '' : item.userID}
                                        h2 = {`${key_word.mint}: ${item.ppTimeStamp ?? ""}`}
                                        row_style={ swiftNow() - (item.timeStampLatest ?? 0) < 60 
                                            ?
                                            {opacity:1.0}
                                            :
                                            {opacity:0.75}
                                        }
                                        onClick = {() => {onClickMintedUserItem(item)}}
                                    />
                                )                   
                            })
                        }                
                    </div>
                </div>
                <Box sx={{ flexGrow: 1 }} />
                {
                    showpayment 
                    ?
                    <Stack direction='row' className={classes.container_right}>
                        <CreditCardPanel 
                            {...props} 
                            onDidSubmitCreditCard={onDidSubmitCreditCard} 
                        />
                    </Stack>
                    :
                    <Stack direction='row' className={classes.container_right}>
                        <Box sx={{ flexGrow: 1 }} />
                        <Stack direction='column'>
                            <Box sx={{ flexGrow: 1 }} />
                            <InviteImageBlock
                                show_full_image
                                name={name}
                                address={""}
                                img_url={img}
                                showProgress={showlinearprogress}
                                onAccept={onGoMint}
                                btn_str={btn_label}
                                progress_text={btn_label}
                            />  
                            <Box sx={{ flexGrow: 1 }} />
                        </Stack>
                        <Box sx={{ flexGrow: 1 }} />
                    </Stack>         
                }
            </Stack>        
        )
    }
}

/******************************************************
    @view: component
******************************************************/

const dcard = GLOBAL_STAGING ? '4242424242424242' : '';
const dcvc = ''
const dmo = ''
const dyr = ''

const inputPropsLink = {
    fontSize: `2vh`,
    color     : COLORS.text2,
    fontFamily: 'NeueMachina-Regular'
}
const inputPropsDate = {
    fontSize: `2vh`,
    color     : COLORS.text2,
    fontFamily: 'NeueMachina-Regular'
}



/**
 *
 * @use: view to accept credit card
 *
 */
function CreditCardPanel({ style, user_cache, tellUser, onDidSubmitCreditCard }){

    const [ number, enumber ] = useState(dcard);
    const [ cvc   , ecvc    ] = useState(dcvc);
    const [ exp_mo, emo     ] = useState(dmo);
    const [ exp_yr, eyr     ] = useState(dyr);
    const [ card_btn_label, ecard_btn_label ] = useState("Submit")
    const [ showProgress, eshowProgress ] = useState(false)

    // credit card
    async function onSubmitCreditCard(){
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
                        onDidSubmitCreditCard();
                    }
                }
            })
        }
    }


    return (

        <Stack direction={'column'} 
            style={{ 
                paddingLeft :'2vw',
                paddingRight:'1vw',
                marginTop   :'2vh',
                marginBottom:'2vh',
                ...(style ?? {})
            }}
        >
            <Box sx={{flexGrow:1}}/>
            <Text_H1 left={''} right={"* input payment to continue"}/>
            <br/>
            <AppTextField
                standard
                autoFocus
                hiddenLabel
                label="Card Number"
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
                    label="CVC"
                    value = { cvc }
                    onChange={(e) => { 
                        let v = e.target.value ?? ""
                        let sv = v.slice(0,3)
                        ecvc(sv)
                    }}
                    inputProps={{style: inputPropsDate}}
                    style={{width:'50%', marginTop: '12px'}}
                />  
                <Box sx={{flexGroƒw:1}}/>
                <AppTextField
                    standard
                    hiddenLabel
                    label="Exp. Mo."
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
                    label="Exp. Yr"
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
    )

}


export { CreditCardPanel }

