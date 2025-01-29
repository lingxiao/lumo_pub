/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: account api
 * @Date   : Dec 9th, 2021
 * @Use.   : API hooks for vendors

 * @Important: must set env. variable for public and private key of admin on local first. 
        >> see: https://medium.com/firelayer/deploying-environment-variables-with-firebase-cloud-functions-680779413484
        ```
            firebase functions:config:set eth.public = "" eth.private = ""
            firebase functions:config:get
        ```
 * @test : firebase emulators:start
 *
 *
*/


// import modules
const fire  = require('./../fire')
const functions = require('firebase-functions');
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const uuid = require('uuid');
const crypto = require('crypto');

const { 
    print,
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString,
    ppSwiftTime,    
    contractMetamaskAddress,
} = require('./../utils');

const { 
    DbPaths,
    default_fn_response,
    Networks,
    GLOBAL_PRODUCTION,
    ALCHEMY_PRODUCTION ,
    make_production_web3_account,
    store_keys_in_lumo_core,
    network_flow_to_eth,
    get_keys_from_lumo_core,
    password_from_metamask_pk,
} = require('./../core');



/******************************************************
    @write
******************************************************/


/**
 *
 * @Use: create new user stub
 * @Params:
 *    - vendorToken  :: String
 *    - userID   :: String
 *    - name     :: String optional
 *    - email    :: String optional
 *    - then :: (Bool, String, String) of (succ = yes|no, succ or failure message, public_key)
 *    
 * @Action:
 *    - if `vendorID` dne, then fail
 *    - if other fields are malformed, do nothing
 *    - if `userID` dne, then create new user with
 *         { email, userID, lumoUserID, PublicKey, TimeStamp }
 *
*/
async function createUserStub({
    userID,
    vendorID, 
    name,
    email,
    twitterUserName,
    password,
    metamask_ethereum_address,
    make_flow_account,
    network,
    then 
}){

    if (trivialString(userID) || trivialString(vendorID)){
        return then({ success: false, message: "no vendorID or userID provided", pk: ""})
    }

    let existing_user = await getUserByVendorID({ vendorID: vendorID, userID: userID });

    if ( !trivialProps(existing_user, 'userID') && !trivialString(existing_user.userID) ){

        return then({ success: true, message: `user already exist at ${userID}`, data: existing_user ?? {} });

    } else {

        // create custodial account if user does not have metamask linked
        if ( trivialString(metamask_ethereum_address) ){

            // create custodial address for user, 
            // and save client side password here as well
            const { address, privateKey } = make_production_web3_account();
            let custodial_address = address;

            let key_blob = {
                address    : address,
                privateKey : privateKey,
                network    : network_flow_to_eth(network),
                userID     : userID ?? "",
                email      : email ?? "",
                password   : trivialString(password) ? "" : String(password),
            }            

            await store_keys_in_lumo_core({ post_params: key_blob, then: async ({ success, message }) => {

                if ( !success ){

                    return then({ 
                        success: false, 
                        message: `failed to initiate an eth address ${message}`, 
                        data: {}
                    });

                } else {

                    return await save_user({
                        userID,
                        vendorID,
                        email,
                        metamask_ethereum_address: "",
                        custodial_address,
                        name,
                        twitterUserName,
                        then
                    });
                }

            }});

        } else {

            return await save_user({
                userID,
                vendorID,
                email,
                name,
                twitterUserName,
                metamask_ethereum_address,
                custodial_address: "",
                then
            });
        }

        // save user data in this db
        async function save_user({ userID, vendorID, name, twitterUserName, email,  metamask_ethereum_address, custodial_address, then }){

            let long_str = trivialString(metamask_ethereum_address) ? (custodial_address ?? "") : "";
            let short_pk = contractMetamaskAddress({ pk: long_str, n: 7, m: 5 }) ?? "";
            let pptime = ppSwiftTime(swiftNow()) ?? "";

            var _name = ""
            if ( !trivialString(name) ){
                _name = name
            } else if ( !trivialString(email) ){
                _name = email;
            }

            let user_blob = {

                userID           : userID,
                ID               : userID,
                vendorID         : vendorID,
                email            : email ?? "",
                name             : _name ?? "",
                about            : "",
                profile_image    : "",
                website_url      : "",

                twitterUserID    : "",
                twitterUserName  : twitterUserName ?? "",
                twitter_followers_count: 0,
                twitter_following_count: 0,
                twitter_tweet_count    : 0,
                twitter_verified       : 0,

                // instagram
                instagramUserID  : "",
                instagramUserName: "",                

                amt_lumo_given: 0,

                timeStampCreated : swiftNow(),            
                timeStampLatest  : swiftNow(),           
                timeStampCreatedPP: trivialString(pptime) ? "" : pptime,
                timeStampLatestPP : trivialString(pptime) ? "" : pptime,

                flow_address     : "",
                custodial_ethereum_address: custodial_address,
                metamask_ethereum_address: metamask_ethereum_address ?? "",

                // custodial acct thru firebase auth
                is_email_authed     : trivialString(metamask_ethereum_address),  // if true, then there is a firebase auth record of this user
                is_custodial_account: trivialString(metamask_ethereum_address),

                // if connected iphone acct from metamask desktop acct, use this firebase_uuid
                firebase_user_token : trivialString(metamask_ethereum_address) ? userID : "",
            }


            let did = await fire.firestore
                .collection(DbPaths.users)
                .doc( userID )
                .set( user_blob )
                .then (x => { return true })
                .catch(e => { return false })

            let response = did
                ? { success: true, message: "success", data: user_blob }
                : { success: false, message: "failed to write to server", data: {} }

            then(response)

        }

    }
}


/**
 *
 * @use: incr how much lumo user has gifted 
 * 
 **/
async function incr_amt_lumo_given({ userID,  amt_in_lumo }){


    var res = default_fn_response();

    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return then(res);
    }       

    let base =  trivialProps(user,'amt_lumo_given') ? 0 : (user.amt_lumo_given ?? 0) 
    let change = { 
        amt_lumo_given: base + (amt_in_lumo ?? 0)
    }

    let did = await fire.firestore
        .collection(DbPaths.users)
        .doc(  userID )
        .update( change )
        .then(_ => true)
        .catch(e => false)    

    res['success'] = did;
    res['message'] = did ? 'updated' : `We couldn't update this record for some reason`;
    return res;    
}


/**
 * 
 * @use: edit project
 * 
 **/
async function editUser({
    userID,
    vendorID,
    name,
    about, 
    twitter,
    openSea,
    instagram,
    website,
    discord,
    imdb,
    image_url,
}){

    var res = default_fn_response();

    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return then(res);
    }   

    var change = {};

    if ( !trivialString(name) ){
        change['name'] = name;
    }

    if ( !trivialString(about) ){
        change['about'] = about;
    }

    if (!trivialString(twitter)){
        change['twitter'] = twitter
    }

    if ( !trivialString(instagram) ){
        change['instagram'] = instagram
    }

    if ( !trivialString(website) ){
        change['website'] = website
    }

    if ( !trivialString(discord) ){
        change['discord'] = discord
    }

    if ( !trivialString(imdb) ){
        change['imdb'] = imdb;
    }
    if ( !trivialString(image_url) ){
        change['image_url'] = image_url;
    }

    if ( !trivialString(openSea) ){
        change['openSea'] = openSea;
    }    

    let did = await fire.firestore
        .collection(DbPaths.users)
        .doc( user['userID'] )
        .update( change )
        .then(_ => true)
        .catch(e => false)    

    res['success'] = did;
    res['message'] = did ? 'updated' : `We couldn't update this record for some reason`;
    return res;
}




/**
 *
 * @Use: add metamask public key for `userID`
 * @Params:
 *    - userID   :: String
 *    - metaMaskPk :: String
 *    - then :: (Bool, String, String) of (succ = yes|no, succ or failure message, public_key)
 *    
 * @Action:
 *    - if `vendorID` dne, then fail
 *    - if other fields are malformed, do nothing
 *
*/
const saveMetamaskPublicKey = async({ userID, vendorID, metamaskPk }) => {

    let existing_user = await getUserByVendorID({ vendorID: vendorID, userID: userID });

    if ( trivialProps(existing_user, 'userID') || trivialString(metamaskPk) ){
        return { success: false, message: `User DNE or metamaskPk malformed` }
    }

    let res = await fire.firestore
        .collection(DbPaths.users)
        .doc( userID )
        .update({ metamask_ethereum_address: metamaskPk })
        .then (x => { return true })
        .catch(e => { return false })

    return { success: res,  message: res ? 'Saved metamaskPk' : 'Failed to save to db' }
}

/******************************************************
    @desktop <=> mobile QR seed generation
******************************************************/


/**
 * 
 * @use: associated user at userID/metmask_pk with email
 *      this way multiple users loging in using diff metamsak
 *      acconunt on browser can be associatd with each other
 * 
 *      this happens when user aut on mobile with email+password
 *      and want to assocdiate mobile account with existing metamask 
 *      address created on desktop
 * @Process:
 *      1. ask for QR code on browser with seed
 *      2. on server, gen QR code that is seed ++ randomString `
 *      3. scan qr code on mobile and look-up seed ++ randomString
 *      4. get (email,password) on mobile for auth.
 *     
 **/
async function before_auth_on_mobile({ userID, vendorID, ugc_seed }){

    var res = default_fn_response({ seed: "" });

    let user = await getUserByVendorID({ vendorID: vendorID, userID: userID });

    if ( trivialProps(user, 'userID') ){
        res['message'] = 'user dne';
        return res;
    }

    if ( trivialString(ugc_seed) ){
        res['message'] = 'please provide a secrete phrase';
        return res;
    }

    let seed = `${swiftNow()}${uuid.v4()}`;
    let xs1  = ugc_seed.toLowerCase();
    let xs2  = xs1.split(' ').join('');
    let xs3  = xs2.trim();

    let id = userID;
    let data = { 
        ID: id,
        userID: userID,
        mobile_scanned: 0, 
        ugc_seed: xs3 ?? "",
        qrcode_seed: seed,
        timeStampCreated: swiftNow(),
        timeStampLatest: swiftNow(),
    };

    await _log_seed({ data, id })

    res['success'] = true;
    res['message'] = 'created seed';
    res['seed']    = seed;
    return res;    

    async function _log_seed({ data, id  }){
        await fire.firestore
            .collection(DbPaths.users_qr_seed)
            .doc( id )
            .set( data )
            .then (x => { return true })
            .catch(e => { return false });
    }

}


/**
 * 
 * @use: try retrieveing QR code given seed
 *       if successfully retrieved, then return (email,password)
 *       for mobile auth, and immediately delete the seed blob.
 *       if seed DNE, ask user to verify on desktop w/ seed
 * 
 **/
async function try_auth_on_mobile({ secret, decoded_qr_code, then }){

    var res = default_fn_response({ 
        data: { email: "", password: "", is_email_authed: false } 
    });

    if ( trivialString(decoded_qr_code) ){
        res['message'] = 'This QR code is not valid'
        return then(res);
    }

    let matches = await fire.firestore
            .collection(DbPaths.users_qr_seed) 
            .where('qrcode_seed', '==', decoded_qr_code)
            .get()

    var codes = [];        

    if ( !matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                codes.push(data)
            }
        })
    }

    if ( codes.length === 0 || trivialProps(codes[0], 'userID') ){
        res['message'] = 'Please generate a new QR code on your desktop 0xPARC.xyz app';
        return then(res);
    }

    let { userID, ugc_seed } = codes[0];

    // if ( secret !== ugc_seed ){
    //     res['message'] = 'please type in your client phrase again on the browser 0xPARC.xyz app';
    //     return res;
    // }

    let user = await getUserByVendorID({ vendorID: "", userID: userID });
    if ( trivialProps(user, 'userID') ){
        res['message'] = 'We cannot locate you for some reason.';
        return then(res);
    }

    const { metamask_ethereum_address, custodial_ethereum_address, is_email_authed } = user;

    if ( is_email_authed ){
    // get user's password from db

        let post_param = {
            network: GLOBAL_PRODUCTION ? Networks.mainnet : Networks.ropsten,
            eth_address: custodial_ethereum_address,
            hide_private_key: true
        }

        await get_keys_from_lumo_core({ 
            post_params: post_param,
            then: async ({ success, message, data }) => {
                if ( !success || trivialProps(data,'password') ){
                    res['message'] = 'We cannot locate you, please try again';
                    return then(res);
                } else {
                    await delete_qr_code_seed(codes[0]);
                    var _data = { userID: userID,  ...data }
                    return then({ success: true, message: 'found you!', data: _data });
                }
            }
        });

    } else {
    // generate user's password and email

        await delete_qr_code_seed(codes[0]);

        let email = `${metamask_ethereum_address}@parc.xyz`;
        let password = password_from_metamask_pk(metamask_ethereum_address);
        let data = { email, password, is_email_authed: false, userID: userID };

        return then({ success: true, message: 'found you!', data: data })

    }
}


/**
 * 
 * @use: after authing on mobile, send firebasee uuid here
 * 
 **/
async function did_auth_on_mobile({ userID, firebase_auth_uuid }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(firebase_auth_uuid) || trivialString(userID) ){
        res['message'] = 'please provide a valid firebase auth uid';
        return res
    }

    let user = await getUserByVendorID({ userID, vendorID: "", withPrivateKey: false });

    if (  trivialProps(user,'userID') ){
        res['message'] = 'this user dne';
        return res;
    }

    let pptime = ppSwiftTime(swiftNow()) ?? "";

    let did = await fire.firestore
        .collection(DbPaths.users)
        .doc( userID )
        .update({ 
            firebase_user_token: firebase_auth_uuid,
            timeStampLatest: swiftNow(),
            timeStampLatestPP: pptime,
        })
        .then(_ => true)
        .catch(e => false);

    return did 
        ? { success: true, message: "did log", data: {} } 
        : { success: false, message: 'did not log', data: {} }

}

// @use: delete qr code seed
async function delete_qr_code_seed({ ID }){
    if ( trivialString(ID) ){
        return false;
    } else {
        await fire.firestore.collection(DbPaths.users_qr_seed).doc(ID).delete();
        return true;
    }
}


/******************************************************
    @read
******************************************************/

/**
 * 
 * @use: get user by metamask address
 * 
 * 
*/
async function getUserByMetamask({ metamask }){

    if (trivialString(metamask)){
        return {}
    }

    let matches = await fire.firestore
            .collection(DbPaths.users) 
            .where('metamask_ethereum_address', '==', metamask)
            .get()

    var users = [];        

    if ( !matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                users.push(data)
            }
        })
    }

    return users.length > 0 ? users[0] : {}

}


/**
 *
 * @Use: find user by vendorID/userID, 
 *       if user has cusxtodial account, get its
 *       custodial account
 * @Params:
 *    - vendorToken  :: String
 *    - userID :: String
 *
*/
async function getUserByVendorID({ vendorID, userID, withPrivateKey }){

    if (trivialString(userID)){ 
        return null;
    }   

    var users_uid = [];
    const fetch_with_uid = await fire.firestore
        .collection(DbPaths.users)
        .where('userID', '==', userID)
        .get();

    if (!fetch_with_uid.empty){
        fetch_with_uid.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                users_uid.push(doc.data())
            }
        })
    }        

    // try to see if user's userid is the metamask pk
    var users_match_with_pk = [];
    const fetch_with_pk = await fire.firestore
        .collection(DbPaths.users)
        .where('metamask_ethereum_address', '==', userID)
        .get();

    if (!fetch_with_pk.empty){
        fetch_with_pk.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                users_match_with_pk.push(doc.data())
            }
        })
    }    

    let pk_lower = userID.toLowerCase();
    var users_match_with_pk_lower = [];

    const fetch_with_pk_lower = await fire.firestore
        .collection(DbPaths.users)
        .where('metamask_ethereum_address', '==', pk_lower)
        .get();

    if (!fetch_with_pk_lower.empty){
        fetch_with_pk_lower.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                users_match_with_pk_lower.push(doc.data())
            }
        })
    }     

    // try to get usr by firebase auth token
    var users_match_with_fb_tok = [];
    const fetch_with_fb_tok = await fire.firestore
        .collection(DbPaths.users)
        .where('firebase_user_token', '==', userID)
        .get();

    if (!fetch_with_fb_tok.empty){
        fetch_with_fb_tok.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                users_match_with_fb_tok.push(doc.data())
            }
        })
    }    

    if ( users_uid.length > 0 ){
        return users_uid[0];
    } else if ( users_match_with_pk.length > 0 ) {
        return users_match_with_pk[0];
    } else if ( users_match_with_fb_tok.length > 0 ){
        return users_match_with_fb_tok[0];
    } else if ( users_match_with_pk_lower.length > 0 ){
        return users_match_with_pk_lower[0];
    } else {
        return null;
    }

}



/******************************************************
    @export
******************************************************/

exports.createUserStub = createUserStub;
exports.saveMetamaskPublicKey = saveMetamaskPublicKey;
exports.editUser = editUser;
exports.incr_amt_lumo_given = incr_amt_lumo_given

exports.getUserByVendorID = getUserByVendorID;
exports.getUserByMetamask = getUserByMetamask;


// mobile-auth
exports.before_auth_on_mobile = before_auth_on_mobile
exports.try_auth_on_mobile = try_auth_on_mobile;
exports.did_auth_on_mobile = did_auth_on_mobile;








