/**
 * @Package: index.js
 * @Date   : Dec 16th,2021
 * @Author : Xiao Ling   
 * @Read: https://firebase.google.com/docs/hosting/functions
 *        https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *        https://firebase.google.com/docs/functions/write-firebase-functions
 * Stripe payment: ""
 * 
*/

const functions  = require('firebase-functions');
const express    = require('express');
// const request    = require("request");
const bodyParser = require('body-parser');
const cors       = require('cors')({origin: true});

// accounts
const { app_flow_accounts } = require("./endpoints/user_accounts");
const { app_stripe_accounts } = require('./endpoints/user_stripe')

// storyboard
// const { app_story_board } = require('./endpoints/story_board');
// const { app_web3 } = require('./endpoints/web3_api');

// burn event endpoints
const { app_social_chain } = require('./endpoints/social_chain');

const { DbPaths } = require("./api/core");


const { 
    finish_purchase_lumo_tok_on_polygon,
    cancel_all_unclaimed_nominations,
} = require('./api/client/SocialChain+app');

const { 
    airdrop_lumo_reward,
    send_lumo_on_chain,
} = require('./api/client/SocialChain+reward');


/*const { 
    satisify_all_liquidity_provisions,
} = require('./api/client/SocialChain+provision');*/

const { 
    sync_twitter_profile,
    sync_twitter_orphan_profile,
} = require('./api/client/SocialChain+twitter');


/******************************************************
   @API
******************************************************/

/**
 * 
 * @Use:
 * 	- to test  : `firebase serve`
 *  - to deploy: `firebase deploy`
 * 	- to debug :  `firebase functions:log`
 * 
 */ 

/**
 *
 * `app` is global top level web app entry point
 * `appAPI` serves vendor APIs
 * 
*/ 
const app = express();
app.use(cors);
app.use(express.json()); 
app.use(bodyParser.urlencoded({ extended: false }));



/**
 * 
 * @Use: Account API:
 *    createVendorAccount
 *    doesVendorExist
 *    createUserAccount
 *    createUserFlowAddress
 * 
 */ 
app.use('/api/v1/account/', app_flow_accounts );



/**
 * 
 * @Use: stripe
 *	 create_user_stripe_account
 * 	 does_user_have_stripe_customer_id
 *   charge_customer
 * 
 */ 
app.use('/api/v1/stripe/' , app_stripe_accounts );



/**
 * 
 * @Use: storyboard
 *    get_top_project
 *   get_all_projects
 *   get_project
 *   get_story_balance
 *   create_project
 *   create_story_board_item
 *   edit_story_board_item
 *   remove_story_board_item
 *   stake_character
 *   patronizeStoryboardInEth
 * 
 **/ 
// app.use('/api/v1/story_board/', app_story_board);


/**
 * 
 * @Use: slate
 *   create_slate
 *   get_slates
 *   booK_slate
 * 
 **/
// app.use('/api/v1/slate/', app_slate)

/**
 * 
 * @use: nft API suite
 *    mint
 *    read
 *    deploy
 * 
 **/ 
// app.use('/api/v1/web3/', app_web3);


/**
 * 
 * @Use: social chain api for burn events
 * 
 *    - create_chain
 *    - fetch_chain
 *    - submit_block_item
 *    - fetch_block_root
 *    - get_full_block
 * 
 **/
app.use('/api/v1/burn/', app_social_chain)


/**
 *
 * @use: staking pool api 
 * 
 **/
// app.use('/api/v1/staking_pool/', app_staking_pool);


/******************************************************
    @function triggers
******************************************************/

/**
 * 
 * @use: when new user created
 *     - update w/ twitter user-id
 *     - update w/ twitter followers/following
 * @Doc: https://firebase.google.com/docs/functions/firestore-events
 * 
 **/
exports.on_created_user = functions.firestore
    .document(`${DbPaths.users}/{user_id}`)
    .onCreate( async (snap, context) => {
        const newValue = snap.data();
        await sync_twitter_profile(newValue)
});

/**
 * 
 * @use: when new twitter acct synced
 *     - fetch full profile img and save
 * @Doc: https://firebase.google.com/docs/functions/firestore-events
 * 
 **/
exports.on_created_twitter_link = functions.firestore
    .document(`${DbPaths.twitter_accounts}/{acct_id}`)
    .onCreate( async (snap, context) => {
        const newValue = snap.data();
        await sync_twitter_orphan_profile(newValue)
});


/**
 * 
 * @use: when burn chain created
 *     - whitelist chain in staking contract  
 *     - airdrop lumo to creator
 * @Doc: https://firebase.google.com/docs/functions/firestore-events
 * 
exports.on_created_chain = functions.firestore
    .document(`${DbPaths.social_chain_root}/{chain_id}`)
    .onCreate( async (snap, context) => {

        const newValue = snap.data();
        await finish_chain_setup({
            ...newValue,
            then: res => {
                console.log(res)
            }
        });

        // when new chain created, alsos sync twittwre followers/following
});
 **/


/**
 * 
 * @use: when lumo airdrop logged
 *     - mint lumo and send to user on fn
 **/
exports.on_created_reward = functions.firestore
    .document(`${DbPaths.social_chain_reward_lumo}/{reward_id}`)
    .onCreate( async (snap, context) => {
        const newValue = snap.data();
        await airdrop_lumo_reward({
            ...newValue,
            then: res => {
                return;
            }
        })
});

/**
 * 
 * @use: when sending lumo, run txon chain
 *
 **/
exports.on_create_send_tx = functions.firestore
    .document(`${DbPaths.social_chain_send_lumo}/{send_id}`)
    .onCreate( async (snap, context) => {
        const newValue = snap.data();
        await send_lumo_on_chain({
            ...newValue,
            then: res => {
                return;
            }
        })
});    




/**
 * 
 * @use: when lumo purchase logged
 *     - mint lumo and send to user on fn
 * 
 **/
exports.on_buy_lumo = functions.firestore
    .document(`${DbPaths.social_chain_purchase_lumo}/{purchase_id}`)
    .onCreate( async (snap, context) => {
        const newValue = snap.data();
        await finish_purchase_lumo_tok_on_polygon({
            customer_payment: newValue,
            then: res => {
                return;
            }
        });
});


/******************************************************
    @crone jobs
******************************************************/


/**
 *
 * @use: mine blocks for every burn chain
 * 
exports.on_schedule_mine_blocks = functions.pubsub.schedule('every 90 minutes').onRun((ctx) => {
   mine_all_blocks_offchain({ chain_id: "" });
   return true;
});
 **/


/**
 *
 * @use: cancel nomations, return lumo back to holder
 * 
**/
/*exports.on_schedule_cancel_nominations = functions.pubsub.schedule('every 24 hours').onRun((ctx) => {
   cancel_all_unclaimed_nominations();
   return true;
});*/


/**
 *
 * @use: scan etherscan to resolve tx on ropsten network
 * 
 **/
// exports.on_schedule_resolve_tx_0x3 = functions.pubsub.schedule('every 2 hours').onRun((ctx) => {
//    resolveAllTransactionsEth0x3();
//    return true;
// });


/**
 * 
 * @use: update currently minting Lumo.sol nfts
 * 
 **/ 
// exports.on_schedule_resolve_mints = functions.pubsub.schedule('every 60 minutes').onRun((ctx) => {
//    monitor_all_minting_storyboard_item();
//    return true;
// });

/**
 * 
 * @use: backup mainnet endpoint db.
 * 
 **/ 
// exports.on_schedule_backup_db = functions.pubsub.schedule('every 24 hours').onRun((ctx) => {
   // MigrateAll();
   // return true;
// });



/**
 * 
 * @Use: serve API
 * @Doc: https://firebase.google.com/docs/functions/manage-functions#set_timeout_and_memory_allocation
 *       Ensure the function has enough memory and time to process large files
 * 
 * 
 */ 
exports.app = functions
    .runWith({
      timeoutSeconds: 540,
      memory: "1GB",
    })
   .https.onRequest(app)






























