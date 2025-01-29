/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social chain tests
 * @Date   : 9/21/2022
 * @Important: must set env. variable for public and private key of admin on local first. 
        >> see: https://medium.com/firelayer/deploying-environment-variables-with-firebase-cloud-functions-680779413484
        ```
            firebase functions:config:set eth.public = "" eth.private = ""
            firebase functions:config:get
        ```
 * @test : firebase serve
 *
 *
*/


const referralCodes = require("referral-codes");

const {
    firestore,
    fetch_many,
    fetch_one,
    fetch_all,
    write_to_db,
    update_db,
    remove_from_db,
} = require('./../fire');

const { 
    cap,
    trivialProps, 
    trivialNum, 
    trivialString,
    swiftNow,    
    getMultipleRandom,
    generateRandom,
} = require('./../utils');


const { 
    createUserStub,
    getUserByVendorID, 
} = require('./accounts');


const {
    DbPaths, 
    GLOBAL_PRODUCTION,
    default_fn_response,
    lumo_decimals,
    lumo_price_in_cents,
    default_db_blob,
    admin_eth_keys,
    lumo_dispensary,
    mk_expire_timestamp,
} = require('./../core');


const {
    polygon_mint_lumo_to,
} = require("./../eth/lumoToken");

const {
    offchain_balance_of_lumo
} = require("./../eth/lumoOffChain");


const {
    charge_customer_and_confirm_charge,
} = require('./../stripe/userPayment');

const {
    fetch_chain,
    create_chain,
} = require('./SocialChain');

const {
    sign_manifesto,
    nominate_leader,
    accept_nomination,
    gift_lumo_to_nominee,
} = require('./SocialChain+app.js')

const {
    get_twitter_graph,    
} = require('./SocialChain+twitter');



/******************************************************
    @create tests
******************************************************/

const twitter_id = '161339777';
const authed_user_id = 'XlgxjoBGRAWOIGA2uK41VWNXRru2';

/**
 * 
 * @use: creating staging test data:
 *    1. create user 
 *    2. pick out subset of 10 users and create burn event
 *    3. pick out subset of 100 users, and nominate burn leaders
 *    
 * 
 **/
// main();
async function main(){  

    if ( GLOBAL_PRODUCTION === false ){

        // console.log("\n\n running adhoc tests \n\n ")
        // await create_chain({ userID: authed_user_id, name: "hello", about:"world", symbol:"HLO", then: console.log })

        let all_chains = await fetch_all({  path: DbPaths.social_chain_root });
        let all_chain_ids = all_chains.map(ch => { return ch.ID });
        console.log(all_chain_ids);


        // await createUsers();
        // await rewardUsers();

        // await createBurns({ numBurns: 3 });
        // await nominateAuthedUser({ authed_user_id });

        // sign manifesto
        // await Promise.all( 
        //     await all_chain_ids.map(async id => {
        //         console.log(`singing chain:`, id)
        //         console.log( await sign_manifestos({ chain_id: id, num_signers: 22 }) );
        //     })
        // )

        // await Promise.all( 
        //     await all_chain_ids.map(async id => {
        //         console.log( await createNominationsFor({ chain_id: id, num_nominees: 12 }) );
        //     })
        // )
        // await Promise.all(  
        //     await all_chain_ids.map(async id => {
        //         console.log( await gift_users({ chain_id: id }) );
        //     })
        // )    

        // console.log( await gift_users({ chain_id }) );
        // async function strip_down(){
            // console.log('----deleting burns+users----')
            // await deleteUsers();
            // await deleteBurns();
        // }
        // strip_down()
    }
}


/******************************************************
    @Use: burn staging test utils
******************************************************/


/**
 *
 * @use: nominate authed user 
 * 
 **/
async function nominateAuthedUser({ authed_user_id }){

    // if ( GLOBAL_PRODUCTION === false ){
        // return 
    // }

    console.log(`\n\n creating nomation authed user`)

    let all_chains = await fetch_all({  path: DbPaths.social_chain_root });
    const users = await fetch_all({ path: DbPaths.users });
    var srcs = [];

    let get_all_endowed_users = await users.map(async user => {
        const { balance } = await offchain_balance_of_lumo({ userID: user.userID });
        if (balance > 0){
            srcs = srcs.concat([user])
        }
    });
    await Promise.all(get_all_endowed_users);

    let nominated_all = await all_chains.map(async (chain) => {

        let block_id  = await get_latest_block_id({ chain_id: chain.ID })
        
        let src_users = getMultipleRandom(srcs, generateRandom(10));
        let src_user  = src_users[0];

        if ( !trivialProps(src_user,'userID') ){
            console.log( 
                src_user.userID,   
                chain.ID,
                block_id,         
                await nominate_leader({
                    userID   : src_user.userID,
                    chain_id : chain.ID,
                    block_id : block_id,
                    clientInviteCode: "",
                    tgtUserID: authed_user_id,
                    tgtTwitterName: "ling_xiao_ling",
                    tgtTwitterUserID: '161339777',
                    isGeneral:false,             
            }))        
        }
    });
    await Promise.all(nominated_all)
}


/**
 * 
 * @use: create burn events
 * 
 **/
async function createBurns({ numBurns }){    

    const uniques = Object.values( await fetch_twitter_users() );
    const subset  = getMultipleRandom(uniques,numBurns);

    let length = lorem.length
    let _start = generateRandom(length);
    let _end   = generateRandom(length);
    let start  = Math.min(_start,_end);
    let end    = Math.max(_start,_end);

    console.log('creating burns:', subset)

    let mk_all = await ( subset ).map( async (m) => {
        let {ID, twitterUserName} = m;
        await create_chain({
            userID : ID,
            name   : `A manifesto by: ${twitterUserName}!`,
            about  : lorem,
            then   : console.log
        });
    });
    await Promise.all(mk_all);

}


/**
 * 
 * @use: pick out subset of users w/ lumo token, 
 *       and create nominations for tgts
 *       tgts then agree to nomination
 * 
**/
async function createNominationsFor({ chain_id, num_nominees }){


    if ( GLOBAL_PRODUCTION === false ){
        return 
    }

    console.log(`\n\n creating nomation for ${chain_id}`)

    let block_id = await get_latest_block_id({ chain_id });

    const users = await fetch_all({ path: DbPaths.users });
    var srcs = [];
    let get_all_endowed_users = await users.map(async user => {
        const { balance } = await offchain_balance_of_lumo({ userID: user.userID });
        if (balance > 0){
            srcs = srcs.concat([user])
        }
    })
    await Promise.all(get_all_endowed_users)
    let tgts = getMultipleRandom(srcs, num_nominees ?? 10);

    console.log(`found ${srcs.length} endowed users to nominate candidates, nominating ${tgts.length} targets`)

    // randome src nomiate all tgts
    let nominate_all_and_accept = await tgts.map(async (tgt) => {
        let _srcs = getMultipleRandom(srcs, 1)
        let src = _srcs[0];
        let { data, balance } = await nominate_leader({
            userID: src.ID, 
            chain_id: chain_id,
            block_id: block_id,
            clientInviteCode: "",
            tgtUserID: tgt.ID, 
            tgtTwitterName: tgt.twitterUserName, 
            tgtTwitterUserID: tgt.ID,
            isGeneral:false,             
        });
        console.log("nomination: ", data.inviteCode, tgt.userID, balance, "<-")
        if ( !trivialProps(data,'inviteCode') ){
            console.log( 
                'accept_nomination:',
                await accept_nomination({
                    userID: tgt.userID,
                    inviteCode: data.inviteCode
            }));

        }
    });
    await Promise.all(nominate_all_and_accept);
}

async function sign_manifestos({ chain_id, num_signers }){

    if ( GLOBAL_PRODUCTION === false ){

        console.log(`\n\n signing burn: ${chain_id}`)


        const users = await fetch_all({ path: DbPaths.users });
        let signing_users = getMultipleRandom(users, num_signers ?? 10);

        console.log(`found ${signing_users.length} users to sign`);

        // randome src nomiate all tgts
        let sign_manifetos = await signing_users.map(async (tgt) => {
            await sign_manifesto({
                userID: tgt.userID,
                chain_id: chain_id,
                then: console.log
            });
        });
        await Promise.all(sign_manifetos);    
    }
}

/**
 * 
 * @use: get all items submitted to chain-id, and gift users
 * 
 **/
async function gift_users({ chain_id }){


    if ( GLOBAL_PRODUCTION === false ){
        return 
    }



    var srcs = [];
    const users = await fetch_all({ path: DbPaths.users });
    let get_all_endowed_users = await users.map(async user => {
        const { balance } = await offchain_balance_of_lumo({ userID: user.userID });
        if (balance > 0){
            srcs = srcs.concat([user])
        }
    })
    await Promise.all(get_all_endowed_users);

    let items = await fetch_many({ path: DbPaths.social_chain_users, field: "chain_id", value: chain_id });

    console.log(`gifting ${items.length} items`)

    let gift_each_item = await items.map(async (item) => {
        await gift_each(item);
    })
    await Promise.all(gift_each_item);

    async function gift_each(item){
        let gifters = getMultipleRandom(srcs, generateRandom(10));
        console.log(`found ${gifters.length} gifters`)
        let gift_all = await gifters.map(async (user) => {
            await gift_lumo_to_nominee({
                itemID: item.ID,
                userID: user.userID
            })
        })
        await Promise.all(gift_all);
    }
}

async function get_latest_block_id({ chain_id }){
    let { blocks } = await fetch_chain({ chain_id: chain_id ?? "", full: true })
    let sorted_blocks = blocks.sort((a,b) => {
        return b.timeStampCreated - a.timeStampCreated;
    });
    if (sorted_blocks.length > 0 ){
        let pending_block = sorted_blocks[0];        
        return pending_block.ID;
    } else {
        return `${chain_id}_0`;
    }
}

/******************************************************
    @Use: user utils
******************************************************/


/**
 * @use: create users from twitter, airdrop one lumo token to each user's address
 * 
 **/
async function createUsers(){    
    const uniques = await fetch_twitter_users();
    let mk_all = await ( Object.values(uniques) ).map(async (m) => {
        if ( m.ID !== twitter_id ){
            await go_create(m);
        }
    });
    async function go_create({ ID, name, about, profile_image, twitterUserName }){
        await createUserStub({
            userID: ID,
            vendorID: "5Q3xiVEj8WXEOdCtvvLcaSQ2EBt2", 
            name: twitterUserName,
            email: `${twitterUserName}@gmail.com`,
            twitterUserName: twitterUserName ?? "",
            password: "",
            network: 'flow_testnet',
            then: async (res) => { 
                console.log(res) 
            }
        })
    }
}

// @use: give all users lumo tokens
async function rewardUsers(){
    let users = await fetch_all({  path: DbPaths.users })
    let lists = await users.map(async (u) => {
        let ID = u.userID
        await polygon_mint_lumo_to({
            userID: u.userID,
            amt_in_lumo: 5, 
            offchain: true,
            then: console.log, 
            then_watching : console.log
        });
    });
    await Promise.all(lists);
}


async function deleteUsers(){

    if ( GLOBAL_PRODUCTION === false ){
        return 
    }

    const uniques = await fetch_twitter_users();
    let rmv_all = await ( Object.values(uniques) ).map(async (m) => {
        await remove_from_db({ path: DbPaths.users, ID: m.ID });
    });    
}


async function fetch_twitter_users(){

    let { following, followers } = await get_twitter_graph({ userID: authed_user_id });
    var unique = {};
    following.map(m => {
        unique[m.ID] = m;
        return true;
    })
    followers.map(m => {
        unique[m.ID] = m;
        return true;
    })    
    return unique;
}



/******************************************************
    @Use: strip down test data
******************************************************/



// async function delete_nominations(){
    // let noms = await fetch_all({  path: DbPaths.social_chain_nominations })
    // await remove_list({ path: DbPaths.social_chain_nominations, list: noms });
// }


// @use: delete burn events created in testing
async function deleteBurns(){

    const paths = [
        DbPaths.social_chain_root,
        DbPaths.social_chain_block,
        DbPaths.social_chain_users,
        DbPaths.social_chain_drop_root,
        DbPaths.social_chain_eth_metadata,
        DbPaths.social_chain_send_lumo,
        DbPaths.social_chain_nominations,
        DbPaths.lumo_accounts_payable,
        DbPaths.social_chain_send_lumo,
        DbPaths.social_chain_reward_lumo,
        DbPaths.users_stripe,
        DbPaths.users_stripe_charges,
        DbPaths.users_stripe_refunds,
    ]

    let rmv_all = await ( paths ).map(async (p) => {
        let items = await fetch_all({ path: p });
        await remove_list({ path: p, list: items })
    })
    await Promise.all(rmv_all);
}


// @use: rmv all items in list at path
async function remove_list({ path, list }){
    let xs = await ( list ?? [] ).map(async (m) => {
        await remove_from_db({ path:path, ID: m.ID });                                    
    });
    await Promise.all(xs)
}






const lorem = ''
`