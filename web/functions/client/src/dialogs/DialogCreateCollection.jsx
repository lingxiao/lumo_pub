/** *
 * @Package: DialogCreateCollection 
 * @Date   : 7/17/2022
 * @Author : Xiao Ling   
 *
**/


import React, {useState, useEffect} from "react";
import Stack from '@mui/material/Stack';

import DialogParent, { useStyles } from './DialogUtils';
import { COLORS } from './../components/constants';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import Box from '@mui/material/Box';


import { 
    trivialNum,
    trivialString,
    trivialProps,    
    cap,
    str_to_int,
}  from './../model/utils';

import {
    dname,
    daboutItem,
    CollectionKind,
    urlToFileExtension,
}  from './../model/core';

import {
    useNftvieWstyles,
    FeatureBox,
} from './../pages/AppStoryboardFragments';

import { ActionProgressWithProgress } from './../components/ButtonViews';
import { AppTextFieldNoUnderLine } from './../components/ChatTextInput'
import { CenterHorizontalView, CenterVerticalView } from './../components/UtilViews'
import { AppTextField, AppTextFieldDarkUnderline } from './../components/ChatTextInput'
import { HeaderAndAboutField } from './../components/UtilViews';
import {UploadByDragAndSave} from './../components/CubeTableFileUpload'
import { Text_H1 } from './../pages/AboutSaleView';
import cubetable from './../assets/cubetable.png';
import AppImageView from './../components/AppImageView';


/******************************************************
    @view: exported
******************************************************/


/**
 *
 * @Use: mint token
 *
 **/
function DialogCreateCollection(props) {

    const isOnMobile = useCheckMobileScreen(1000);
    const classes    = useStyles(isOnMobile, true, false)();    
    const tclasses   = useNftvieWstyles(isOnMobile, "")();


    /******************************************************
        @setup
    ******************************************************/    

    const { 
        open, 
        handleClose,
        snackMessage, 
        showSnack, 
        storyboard,
        job_cache,
        new_collection_meta,
    } = props;
 
        
    /******************************************************
        @mount
    ******************************************************/    

    const [ state, estate ] = useState(false)
    const [ btn_label, ebtn_label ] = useState('create collection')
    const [ dialog_title, edialog_title ] = useState("")
    const [ footer_top, efooter_top ] = useState('You are about to create a new collection.')
    const [ showProgress, eshowProgress ] = useState(false)

    // preloaded image
    const [ preloaded_img, epreloaded_img ] = useState("");

    // common col. states
    const [ item_price, eitem_price ] = useState();
    const [ item_price_cents, eitem_price_cents ] = useState();

    // rare states
    const [ rare_title, erare_title ] = useState(dname)
    const [ rare_about, erare_about ] = useState(daboutItem)
    const [ rare_img, erare_img ] = useState({});

    // ticket states
    const [ ticket_title, eticket_title ] = useState("")
    const [ ticket_amt, eticket_amt ] = useState("")
    const [ ticket_about, eticket_about ] = useState(daboutItem)
    const [ ticket_img,   eticket_img ] = useState({});

    // license states
    const [ license_title, elicense_title ] = useState("")
    const [ license_about, elicense_about ] = useState("")
    const [ num_license, enum_license ] = useState("")
    const [ license_img, elicense_img ] = useState({});
    const [ license_percent, elicense_percent ] = useState();
    const [ hide_license_num, ehide_license_num ] = useState(true);

    // simple collection states
    const [ col_title, ecol_title ] = useState("");
    const [ col_about, ecol_about ] = useState("")

    // membersship states
    const [ member_title, emember_title ] = useState("")
    const [ member_amt, emember_amt ] = useState("")
    const [ member_about, emember_about ] = useState("")
    const [ member_img,   emember_img ] = useState({});

    // settings
    const {
        hide_top_row,
        hide_bottom_row,
        license_item,
    } = new_collection_meta       

    /******************************************************
        @mount + states
    ******************************************************/    


    // load mint data
    useEffect(async () => {

         if ( !trivialProps(license_item,'ID') && !trivialProps(license_item,'image_url') ){
            // estate(CollectionKind.membership)// tickets)
            epreloaded_img(license_item.image_url ?? "")
         }

    }, [open])

    // @use: global mint fn entry 
    async function onSelectCollection(data){
        if ( trivialProps(data,'idx') ){
            estate(false)
        }
        let idx = data.idx;
        if (idx === 0){
            estate(CollectionKind.rare)
            edialog_title("Rare 1/1")
            efooter_top("You are creating a rare 1 of 1.")
            ebtn_label("Premint the 1/1")
        } else if ( idx === 1){
            estate(CollectionKind.simple)
            edialog_title("Standard Collection")
            efooter_top("You are creating a standard collection.")
            ebtn_label("Create collection")
        } else if (idx === 2){
            estate(CollectionKind.tickets)                
            edialog_title("Tickets")
            efooter_top("You are creating a set of tickets for a live event.")        
            ebtn_label("Create ticket stub")
        } else if (idx === 3) {
            edialog_title("Create License")
            estate(CollectionKind.license);
            efooter_top("You are licensing a 1 of 1")
            ebtn_label("License")
            ehide_license_num(true);
        } else if ( idx === 4 ){
            estate(CollectionKind.license);
            efooter_top("You are licensing a one of many")
            edialog_title("Create Licenses")
            ebtn_label("License");
            ehide_license_num(false);
        } else if ( idx === 5 ){
            estate(CollectionKind.membership)                
            edialog_title("Membership Token")
            efooter_top("You are creating a set of membership tokens");
            ebtn_label("Create Token")            
        }
    }

    // close and reset all fields
    function goHandleClose(saved){
        epreloaded_img("");
        estate(CollectionKind.base);
        ecol_title(dname);
        erare_title(dname);
        erare_about(daboutItem);
        eticket_about(daboutItem);
        erare_img({});
        eticket_title(dname);
        eticket_img({});
        emember_title('')
        emember_amt('')
        emember_about('')
        emember_img({});
        setFooter();
        tellUser("");          
        ebtn_label("Create collection")
        eshowProgress(false);
        edialog_title("");
        efooter_top("You are creating a new collection");
        handleClose(saved);
    }

    /******************************************************
        @db responders
    ******************************************************/    

    // create different kinds of collection
    async function onPressActionButton(){

        let { well, message } = well_formed();

        if ( !well ){
            return tellUser(message);
        }

        let _price = trivialNum(Number(item_price))
            ? 0
            : Number(item_price);

        let _price_cents = trivialNum(Number(item_price_cents))
            ? 0
            : Number(item_price_cents);

        const params = {
            price_in_eth  : _price,
            price_in_cents: _price_cents*100,
            storyboard    : storyboard
        }

        if ( state === CollectionKind.tickets ){

            ebtn_label("")
            await job_cache.post_rare_item_collection({
                ...params,
                name      : ticket_title,
                about     : "", //ticket_about,
                kind      : state,
                file      : ticket_img,
                is_public : false,
                license_item: license_item,
                num_items : Number(ticket_amt),
                percent_rake: 0,
                then_saving: () => {
                    eshowProgress(true)                    
                    tellUser('Creating collection')   
                }, 
                then_posting: (str) => {
                    eshowProgress(true);
                    tellUser(str)
                },
                then_progress: (str) => {
                    eshowProgress(true);
                    tellUser(str);
                },
                then: ({ success, message, data }) => {
                    if ( !success ){
                        tellUser(message)
                        eshowProgress(false)                    
                    } else {
                        tellUser("Created collection!")
                        setTimeout(() => {
                            eshowProgress(false)                    
                            goHandleClose(data['ID']);
                        },800)
                    }
                }

            })
        } else if ( state === CollectionKind.rare ){
            await job_cache.post_rare_item_collection({
                ...params,
                name : rare_title,
                about: "", //rare_about,
                kind : state,
                num_items: 1, 
                percent_rake: 0,                
                file: rare_img,
                is_public: false,
                then_saving: () => {
                    eshowProgress(true)                    
                    tellUser('Creating collection')   
                }, 
                then_posting: (str) => {
                    eshowProgress(true);
                    tellUser(str)
                },
                then_progress: (str) => {
                    eshowProgress(true);
                    tellUser(str);
                },
                then: ({ success, message, data }) => {
                    if ( !success ){
                        tellUser(message)
                        eshowProgress(false)                    
                    } else {
                        tellUser("Created collection!")
                        setTimeout(() => {
                            eshowProgress(false)                    
                            goHandleClose(data['ID']);
                        },800)
                    }
                }
            })
        } else if ( state === CollectionKind.license ){

            let _num_license = trivialNum(Number(num_license)) 
                ? 1 
                : Number(num_license);

            await job_cache.post_rare_item_collection({
                ...params,
                kind : state,
                name : license_title,
                about: "", //license_about,
                file : license_img,
                num_items   : _num_license,
                percent_rake: Number(license_percent),                
                is_public   : _num_license > 1,
                then_saving: () => {
                    eshowProgress(true)                    
                    tellUser('Creating license')   
                }, 
                then_posting: (str) => {
                    eshowProgress(true);
                    tellUser(str)
                },
                then_progress: (str) => {
                    eshowProgress(true);
                    tellUser(str);
                },
                then: ({ success, message, data }) => {
                    if ( !success ){
                        tellUser(message)
                        eshowProgress(false)                    
                    } else {
                        tellUser("Created license!")
                        setTimeout(() => {
                            eshowProgress(false)                    
                            goHandleClose(data['ID']);
                        },800)
                    }
                }
            })

        } else if ( state === CollectionKind.membership ){

            await job_cache.post_rare_item_collection({
                ...params,
                name      : member_title,
                about     : "",
                kind      : state,
                file      : member_img,
                is_public : true,
                license_item: license_item,
                num_items : Number(member_amt),
                percent_rake: 0,
                then_saving: () => {
                    eshowProgress(true)                    
                    tellUser('Creating membership token collection')   
                }, 
                then_posting: (str) => {
                    eshowProgress(true);
                    tellUser(str)
                },
                then_progress: (str) => {
                    eshowProgress(true);
                    tellUser(str);
                },
                then: ({ success, message, data }) => {
                    if ( !success ){
                        tellUser(message)
                        eshowProgress(false)                    
                    } else {
                        tellUser("Created membership token collection!")
                        setTimeout(() => {
                            eshowProgress(false)                    
                            goHandleClose(data['ID']);
                        },800)
                    }
                }

            })            


        } else if ( state === CollectionKind.simple ) {
            await job_cache.post_create_story_board({
                ...params,
                name: col_title,
                about: "", //col_about,
                kind : CollectionKind.simple,
                is_public: true,    
                percent_rake: license_percent ?? 0,
                then_saving: () => {
                    eshowProgress(true)                    
                    tellUser('Creating collection')   
                }, 
                then: ({ success, message, data }) => {
                    if ( !success ){
                        tellUser(message)
                        eshowProgress(false)                    
                    } else {
                        tellUser("Created collection!")
                        setTimeout(() => {
                            eshowProgress(false)                    
                            goHandleClose(data['ID']);
                        },800)
                    }
                }
            })
        }
    }

    // check to see inputs are well formed
    function well_formed(){
        function bad(str,dstr){
            return trivialString(str) || str === dstr
        }
        if ( !state ){
            return { well: false, message: "" }
        } else if ( state === CollectionKind.rare ){
            if ( bad(rare_title, dname) ){
                return { well: false, message: 'please enter name' }
            } else {
                return { well: true, message: '' }
            } 
        } else if ( state === CollectionKind.simple ){
            if ( bad(col_title, dname) ){
                return { well: false, message: 'please enter name' }
            } else {
                return { well: true, message: '' }
            }
        } else if ( state === CollectionKind.tickets ){
            if ( bad(ticket_title, dname) ){
                return { well: false, message: 'please enter name' }
            } else if ( trivialString(ticket_amt) || trivialNum(Number(ticket_amt)) ){
                return { well: false, message: 'please enter number of tickets' }
            } else if ( Number(ticket_amt) === 0 ){
                return { well: false, message: 'please list at lease one ticket' }
            } else if ( trivialProps(ticket_img, 'type' ) && trivialProps(license_item, 'image_url') ){
                return { well: false, message: 'please upload an image' }                
            } else {
                return { well: true, message: "" }
            }
        } else if ( state === CollectionKind.license ){
            if (  trivialProps(license_img, 'type') ){
                return { well: false, message: 'please upload image or mp4 to be licensed' }
            } else if ( bad(license_title, dname)){
                return { well: false, message: 'please enter name' }
            } else if ( trivialProps(license_img, 'type' ) ){
                return { well: false, message: 'please upload an image' }                
            } else {
                return { well: true, message: "" }
            }
        } else if ( state === CollectionKind.membership ){
            if ( bad(member_title, dname) ){
                return { well: false, message: 'please enter name' }
            } else if ( trivialProps(member_img, 'type' ) && trivialProps(license_item, 'image_url') ){
                return { well: false, message: 'please upload an image' }                
            } else if ( Number(member_amt) === 0 ){
                return { well: false, message: 'please list at lease one member' }
            } else if ( trivialString(member_amt) || trivialNum(Number(member_amt)) ){
                return { well: false, message: 'please enter membership size' }                
            } else {
                return { well: true, message: "" }
            }
        }
    }

    async function handleDropImage(file){
        if ( state === CollectionKind.rare ){
            erare_img(file);
        } else if ( state === CollectionKind.tickets ){
            eticket_img(file);            
        } else if ( state === CollectionKind.license ){
            elicense_img(file);
        } else if ( state === CollectionKind.membership ){
            emember_img(file);
        }
    }

    /******************************************************
        @view
    ******************************************************/    

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
        setSnack({ show: true, str: str })
    }

    return (
        <DialogParent 
            {...props}        
            fullWidth
            maxWidth={'wd'}
            open={open}
            onClose={() => {goHandleClose(false)}}
            snack={snack}
            title={dialog_title}
            footer_top={footer_top}
            footer_left={footer_left}
        >
            <div style={{ width:'100%', marginTop:'24px', marginBottom:'24px' }}>

                { !state
                    ?
                    <HomePage 
                        {...props} 
                        hide_top_row 
                        hide_bottom_row 
                        onSelectCollection={onSelectCollection}
                        no_license = {!trivialProps(license_item,'image_url') || true}
                    />
                    :
                    state === CollectionKind.simple
                    ?
                    <CreateWithImage
                        no_image        
                        lh1 = {'Collection Name'}
                        h1  = {col_title}
                        eh1 = {ecol_title}
                        lp1 = {'Price in ETH'}
                        p1  = {item_price}
                        ep1 = {eitem_price}
                        lp2 = {'Price in USD'}
                        p2  = {item_price_cents}
                        ep2 = {eitem_price_cents}
                        btn_str ={btn_label}
                        onPressActionButton={onPressActionButton} 
                        onDidDropImage={cap}
                        showProgress={showProgress}
                        header={{h1:'0XPARC', h2: 'simple collection'}}
                    />
                    :
                    state === CollectionKind.tickets
                    ?
                    <CreateWithImage
                        lh1 = {'Event Name'}
                        h1  = {ticket_title}
                        eh1 = {eticket_title}
                        lh2 = {'Number of tickets'}
                        h2  = {ticket_amt}
                        eh2 = {eticket_amt}
                        lp1 = {'Price in ETH'}
                        p1  = {item_price}
                        ep1 = {eitem_price}
                        lp2 = {'Price in USD'}
                        p2  = {item_price_cents}
                        ep2 = {eitem_price_cents}
                        onDidDropImage={handleDropImage}
                        btn_str ={btn_label}
                        onPressActionButton={onPressActionButton} 
                        showProgress={showProgress}
                        header={{h1:'0XPARC', h2: 'ticket collection'}}
                        default_url={trivialProps(license_item,'image_url') ? "" : license_item.image_url}
                    />
                    :
                    state === CollectionKind.license
                    ?
                    <CreateWithImage
                        lh1 = {'License Name'}
                        h1  = {license_title}
                        eh1 = {elicense_title}
                        lh2 = {'Number of licenses'}
                        h2  = {num_license}
                        eh2 = {enum_license}
                        lp1 = {'Royalty in % of sales'}
                        p1  = {license_percent}
                        ep1 = {elicense_percent}
                        onDidDropImage={handleDropImage}
                        btn_str ={btn_label}
                        onPressActionButton={onPressActionButton} 
                        showProgress={showProgress}
                        header={{h1:'0XPARC', h2: 'License out original work'}}
                        default_url={trivialProps(license_item,'image_url') ? "" : license_item.image_url}
                    />                    
                    :
                    state === CollectionKind.membership
                    ?
                    <CreateWithImage
                        lh1 = {'Membership Token Name'}
                        h1  = {member_title}
                        eh1 = {emember_title}
                        lh2 = {'Number of tokens'}
                        h2  = {member_amt}
                        eh2 = {emember_amt}
                        lp1 = {'Price in ETH'}
                        p1  = {item_price}
                        ep1 = {eitem_price}
                        lp2 = {'Price in USD'}
                        p2  = {item_price_cents}
                        ep2 = {eitem_price_cents}
                        onDidDropImage={handleDropImage}
                        btn_str ={btn_label}
                        onPressActionButton={onPressActionButton} 
                        showProgress={showProgress}
                        header={{h1:'0XPARC', h2: 'membership collection'}}
                        default_url={trivialProps(license_item,'image_url') ? "" : license_item.image_url}
                    />                    
                    :
                    <div/>
                }
            </div>
        </DialogParent>

    )

}


/******************************************************
    @View components
******************************************************/

/**
 *
 * @use: create collection with image
 *
 **/
function CreateWithImage({ 
    lh1,
    h1, 
    eh1, 
    lh2,
    h2, 
    eh2,
    lp1, 
    p1, 
    ep1, 
    lp2,
    p2, 
    ep2,
    header, 

    btn_str, 
    onPressActionButton, 
    onDidDropImage,
    showProgress,

    no_image,
    default_url,
}){

    const isOnMobile = useCheckMobileScreen(1000);

    let _default_url = !trivialString(default_url)
        ? default_url
        : no_image
            ? cubetable
            : "";

    if ( isOnMobile ){
        return (
            <Stack direction={'column'} style={{ width: '100%'}}>
                <CenterHorizontalView>
                <div style={{ width:'80%', marginBottom:'24px'}}>
                    <Text_H1 
                        left={header.h1}
                        right={`** ${header.h2}`}
                    />
                </div>
                </CenterHorizontalView>
                <CenterHorizontalView>
                    <Stack style={{marginTop:'2vh', marginBottom:'2vh'}}>
                        <AppTextField
                            autoFocus
                            standard
                            hiddenLabel
                            label={lh1}
                            value = { h1 }
                            onChange={(e) => { eh1(e.target.value ?? "") }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'100%'}}
                        />  
                        <AppTextField
                            standard
                            hiddenLabel
                            label={lh2}
                            value = { h2 }
                            onChange={(e) => { eh2(str_to_int(e.target.value ?? "")) }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'100%', marginTop:'2vh'}}
                        />  
                        <AppTextField
                            standard
                            hiddenLabel
                            label={lp1}
                            value = { p1 }
                            onChange={(e) => { ep1(e.target.value ?? "") }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'70vw', marginTop:'2vh'}}
                        />                      
                        { typeof ep2 === 'function' 
                        ?
                        <AppTextField
                            standard
                            hiddenLabel
                            label={lp2}
                            value = { p2 }
                            onChange={(e) => { ep2(str_to_int(e.target.value ?? "")) }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'100%', marginTop:'2vh'}}
                        />           
                        :
                        <div/>
                        }           
                    </Stack>
                </CenterHorizontalView>
                <CenterHorizontalView style={{ marginTop:'5vh' }}>
                    <Stack direction='column'>
                    <UploadByDragAndSave 
                        bordered 
                        handle_did_drop={onDidDropImage}
                        default_url={_default_url}
                    />           
                    <ActionProgressWithProgress                    
                        showProgress={showProgress}
                        onClick = {onPressActionButton}
                        label={btn_str ?? "next"}
                        progress_text={btn_str}
                        sx = {{ width: '130%', marginTop:'3vh'}}
                    />                   
                    </Stack>
                </CenterHorizontalView>
            </Stack>
        )


    } else {
        return (
            <Stack direction={'row'} style={{ paddingTop:'3vh', width: '100%'}}>
                <CenterVerticalView style={{height:'100%', marginTop:'3vh'}}>
                    <CenterHorizontalView style={{width: '45vw'}}>
                        <UploadByDragAndSave 
                            bordered 
                            handle_did_drop={onDidDropImage}
                            default_url={_default_url}
                        />           
                    </CenterHorizontalView>
                    <ActionProgressWithProgress                    
                        showProgress={showProgress}
                        onClick = {onPressActionButton}
                        label={btn_str ?? "next"}
                        progress_text={btn_str}
                        sx = {{ width: '130%', marginTop:'3vh'}}
                    />                   
                </CenterVerticalView>
                <Stack 
                    direction={'column'} 
                    style={{ 
                        width: '50vw',
                        marginLeft:'-1vw',
                    }}
                >
                    <div style={{marginBottom: '2vh', marginTop:'2vh', marginLeft:'0vw'}}>
                        <Text_H1 
                            left={header.h1}
                            right={`** ${header.h2}`}
                            style_left={{fontSize:'3vw', color:COLORS.surface3}}
                            style_right={{fontSize:'2vw', color:COLORS.surface3}} 
                        />
                    </div>
                    <Stack style={{marginTop:'2vh', marginBottom:'2vh'}}>
                        <AppTextField
                            autoFocus
                            standard
                            hiddenLabel
                            label={lh1}
                            value = { h1 }
                            onChange={(e) => { eh1(e.target.value ?? "") }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'80%'}}
                        />  
                        <AppTextField
                            standard
                            hiddenLabel
                            label={lh2}
                            value = { h2 }
                            onChange={(e) => { eh2(str_to_int(e.target.value ?? "")) }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'80%', marginTop:'2vh'}}
                        />  
                        <AppTextField
                            standard
                            hiddenLabel
                            label={lp1}
                            value = { p1 }
                            onChange={(e) => { ep1(e.target.value ?? "") }}
                            inputProps={{style: inputPropsLink}}
                            style={{width:'80%', marginTop:'2vh'}}
                        />         
                        { typeof ep2 === 'function' 
                            ?
                            <AppTextField
                                standard
                                hiddenLabel
                                label={lp2}
                                value = { p2 }
                                onChange={(e) => { ep2(str_to_int(e.target.value ?? "")) }}
                                inputProps={{style: inputPropsLink}}
                                style={{width:'80%', marginTop:'2vh'}}
                            />                      
                            :
                            <div/>
                        }
                    </Stack>
                </Stack>
            </Stack>
        )
    }

}

// @use: collection home page
function HomePage({ no_license, hide_top_row, hide_bottom_row, onSelectCollection }){

    return (
        <div>
            <div style={{marginLeft:'5vw'}}>
                <Text_H1 
                    left={'* grow'} 
                    right={"your community"}
                />
            </div>
            <CenterHorizontalView>
                <Stack direction='column' style={{ marginTop:'36px', width: '90%', marginBottom:'36px' }}>
                    { hide_top_row || true
                        ? 
                        <div/> 
                        : 
                        <FeatureBox 
                            datasource = {featurebox_datasource1}
                            onClick={onSelectCollection}
                            style={ hide_bottom_row ? {} : {borderBottom:'0px'}}                                    
                        />
                    }
                    { hide_bottom_row || true
                        ? <div/> 
                        :
                        <FeatureBox 
                            datasource = { featurebox_datasource2}
                            onClick={onSelectCollection}
                            style={ hide_top_row ? {} : {borderTop:'0px'}}
                        />
                    }                                
                    <FeatureBox 
                        datasource = { featurebox_datasource_simple }
                        onClick={onSelectCollection}
                        style={{}}
                    />
                </Stack>
            </CenterHorizontalView>                     
        </div>

    )

}


function LabelAndText({ label, text, etext, _style }){

    return (
        <Stack direction='row' style={_style ?? {}}>
            <AppTextField
                standard
                hiddenLabel
                name="hello"
                label={label}
                value = { text }
                onChange={(e) => { etext(e.target.value ?? "") }}
                inputProps={{style: inputPropsLink}}
                style={{width:'80%'}}
            />   
        </Stack>
    )

}

/******************************************************
    @View inputs + styles
******************************************************/


// featurebox text
const featurebox_datasource1 = [
    {idx: 0, key: `Rare 1/1`, value: `A rare 1/1 piece to plant a flag in your cultural movement. Mark it obscenely high and offer it in a private sale to the most discerning buyers.`},
    {idx: 1, key: 'Standard Collection' , value: `This is your standard nonfungible token set. Some examples include 10k pfp set to collate community membership, behind the sceens screenshots, or concept art from preproduction.`},
    {idx: 2, key: 'Tickets', value: `Use this option if you're planning a live event, and want to token-gate the venue so that only those holding your nonfungible token ticket can enter. Each ticket will have a unique ID, which will translate to a unique QR code to grant entry for paying guests.`}
]

// featurebox text
const featurebox_datasource2 = [
    {idx: 3, key: `1/1 perpetual License` , value: `An one of one original work to be licensed to one house only, onto perpetuity. When the the license holder sells work derived from this image, you will receive a percentage set by you.`},
    {idx: 4, key: `1/n perpetual License` , value: `An one of many original work to be licensed to as many clients as there are licenses. When license holders sell work derived from this image, you will receive a percentage set by you.`},
]

// featurebox simple
const featurebox_datasource_simple = [
    {idx: 5, key: 'Membership', value: `Use this option if you want to transform your Discord into an endowed community of dedicated individuals, bent on manifesting your collective vision.`},
    {idx: 2, key: 'Tickets'   , value: `Use this option if you're planning a live event, and want to token-gate the venue so that only those holding your nonfungible token ticket can enter. Each ticket will have a unique ID, which will translate to a unique QR code to grant entry for paying guests.`},
    {idx: 4, key: `perpetual License` , value: `An one of any original work to be licensed to as many clients as there are licenses. When license holders sell work derived from this image, you will receive a percentage set by you.`},
]
const featurebox_datasource_simple_no_license = featurebox_datasource_simple.slice(0,2)



const about_collection = `
Tokenize your project to raise funding and and build a community:

Things you can turn into web3 merchanize: 
  * concept art
  * preproduction visualization
  * tickets for live events
  * super rare 1/1 work 

Some possible collections to activate your imagination:
`






const inputPropsLink = {
    fontSize: '24px',
    fontFamily: 'NeueMachina-Medium',    
    color     : COLORS.text,
}

/******************************************************
    @export
******************************************************/


export default withAuth(withRouter(DialogCreateCollection))








