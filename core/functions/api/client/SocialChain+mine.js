/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social chain mining logic
 * @Date   : Aug 23rd
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


const BigNumber = require('bignumber.js');

const {
    firestore,
    fetch_many,
    fetch_one,
    write_to_db,
    update_db,
} = require('./../fire');

const { 
    print,
    swiftNow, 
    trivialProps, 
    trivialNum, 
    trivialString,
    ppSwiftTime,
    cap,
} = require('./../utils');


const { 
    getUserByVendorID, 
} = require('./accounts');


const {
    DbPaths, 
    ItemMintState,
    default_fn_response,
    generate_tok_id,
    lumo_decimals,
    BlockState,
    winningInterestRate,
    lumo_price_in_cents,
} = require('./../core');


const {
    fetch_chain,
    create_block,
    fetch_block_item,
    _get_contract_abi,
} = require("./SocialChain");

const {
    go_mint_on_polygon
} = require("./../../ethcontracts/scripts/polygon+mint");

const {
      readRiskFreeRate
    , readTotalStakedVolume
    , readTotalInterestVolume
    , readRiskFreeRateAt
    , readFloatRate
    , readStakingAmount
    , readStakingTimeStamp
    , readLockupPeriod
    , readInterestDue
    , readBalanceDue    

    , setLockupPeriod
    , setFloatRate
    , stake
    , batchUnstakeWithRates
} = require("./../eth/lumoStakingPool");

const {
    balance_of_lumo_on_polygon,    
} = require("./../eth/lumoToken");

const {
    offchain_stake,
    offchain_batchUnstakeWithInterest    
} = require("./../eth/lumoOffChain");


/******************************************************/
// @adhoc tests


// adhoc();
async function adhoc(){
    // let chain_id = `0xb52360316ffcE95c5777e9e2d0cccd1bEA3bC790`
    // mine_block({  chain_id, then: console.log, then_watching: console.log })
    // stake_lumo_into_item({
    //     itemID: '1664025397',
    //     userID: Math.random() > 0.5 ? "MHGe3Dw9Nvc3KbA0bpjPu2WLUW92" : "Sp5DX3SsRJhmLELxBd2i52ueuDy1",
    //     amt_in_lumo: 0.1,
    //     then: console.log,
    //     then_watching: console.log
    // })
}


/******************************************************
    @top level mining routine
******************************************************/

/**
 * 
 * @use: top level fn to mine a new block 
 *       give top staker minted nft as reward + return 95% of 
 *       staked amount as reward
 *       give rest of the winning staker 0xp token as reward
 *       and 95% of dollar staked
 *       return 75% of proceeds to losing stakers, distribute
 *       25% take rate to 0xPARC, chain owner, and winning NFT 
 *       submitter, net of mint fee
 *       give 0xP tokens to losing stakers as reward
 * 
 **/
async function mine_block({ chain_id, then, then_watching }){

    var res = default_fn_response({ data: {}, winning_item: {} });

    if ( trivialString(chain_id) ){
        res['message'] = 'please specify chain';
        return then(res);
    }

    let { root, blocks, staking_txs, items } = await fetch_chain({ chain_id, full: true });

    if (  trivialProps(root,'chain_id') ){
        res['message'] = 'social chain dne';
        return then(res);        
    }    

    if ( trivialString(root.lumo_whitelist_hash) ){
        res['message'] = 'this chain has not been whitelisted on lumo erc20 token instance'
        return then(res);
    }

    let sblocks = blocks        
        .sort((a,b) => b.timeStampCreated - a.timeStampCreated)
        .filter((b) => !trivialProps(b,'ID'))
        .filter((b) => b.state === BlockState.pending);

    if ( sblocks.length === 0 ){
        res['message'] = 'this chain has no pending blocks';
        return then(res);
    }

    // check if latest block can be mined yet.
    // or it's still accepting new submissions
    let block_latest = sblocks[0];
    if ( block_latest.timeStampExpire > swiftNow() ){
        res['message'] = 'the lastest block has not expired yet';
        return then(res);
    }

    let block_txs = (staking_txs ?? [])
        .filter((s) => s.block_id === block_latest.ID && !trivialProps(s,'itemID'))

    if ( block_txs.length === 0 ){
        // 5. update block/txs to `mined` state
        await update_db({
            ID  : block_latest.ID,
            path: DbPaths.social_chain_block,
            blob: { state: BlockState.mined }
        })    
        // 6. create new block
        await create_block({ chain_id });
        res['success'] = true;
        res['message'] = 'no staking txs for the latest block, new block appended'
        return then(res)
    }

    // put block in mining state;
    await update_db({
        ID: block_latest.ID,
        path: DbPaths.social_chain_block,
        blob: { state: BlockState.mining }
    });

    var chunks = {};
    var staking_amts = {};

    block_txs.forEach(tx => {
        let { itemID, amt_in_lumo } = tx;
        let prefix = chunks[itemID] ?? [];
        let suffix = prefix.concat(tx);
        let _amt = staking_amts[itemID] ?? 0;

        chunks[itemID] = suffix;
        staking_amts[itemID] = _amt + ( amt_in_lumo ?? 0);
    });

    // 1. sort items by highest staked, break tie w/ submission FIFO
    let sorted_submissions = Object.entries(staking_amts).sort((a,b) => {
        let [ ida, amta ] = a;
        let [ idb, amtb ] = b;
        return amtb - amta;
    });

    let [ tokid, amt_staked ] = sorted_submissions[0];
    let winning_txs = chunks[tokid];
    let winning_txs_ids = winning_txs.map(m => m.ID);

    if ( winning_txs.length === 0 ){
        res['message'] = 'no winning txs';
        return then(res);
    }

    // 2. set IR for all winning stkers to be 16%, all losing stakers get 2% risk free rate
    var pks   = [];
    var rates = [];
    var uids  = [];

    block_txs.forEach(tx => {
        let { pk, ID, userID } = tx;
        pks.push(pk);
        uids.push(userID ?? "")
        if ( winning_txs_ids.includes(ID) ){
            rates.push(winningInterestRate.t1);
        } else {
            rates.push(winningInterestRate.t4);
        }
    });

    // 3a. unstake offchain
    let rates_in_percent = rates.map(x => x/winningInterestRate.denominator)
    await offchain_batchUnstakeWithInterest({ 
        poolAddress: chain_id, 
        chain_id   : chain_id, 
        block_id   : "", 
        userIDs    : uids, 
        interests  : rates_in_percent,
    });


    // 3b. unstake everyone at defined pks and rates;
    await batchUnstakeWithRates({
        pks: pks,
        rates: rates,
        poolAddress: chain_id,
        then: async (res) => {
            let { success } = res;
            if (!success){
                await create_block({ chain_id });
                return then(res)
            }
        },
        then_watching: async (res) => {

            if ( !res.success ){
                return then_watching(res);
            } else {

                // 4. mint top staked item to highest staker, break staker tie by staking time FIFO
                let highest_staked_tx = winning_txs
                    .filter(a => !trivialProps(a,'userID') && !trivialProps(a,'itemID'))
                    .sort((a,b) => b.amt_in_lumo - a.amt_in_lumo)[0];
                const { itemID, userID } = highest_staked_tx;

                // label winner
                await update_db({
                    ID  : itemID,
                    path: DbPaths.social_chain_users,
                    blob: { 
                        timeStampLatest : swiftNow(),
                        timeStampLatestPP: ppSwiftTime(swiftNow()),
                        mint_state      : ItemMintState.selected_for_mint_await_contract_deployment,
                    }
                });                
                // mint item to winner
                // await mint_item_on_polygon({ 
                //     itemID: itemID, 
                //     targetUserID: userID, 
                //     then: console.log 
                // })

                // 5. update block/txs to `mined` state
                await update_db({
                    ID  : block_latest.ID,
                    path: DbPaths.social_chain_block,
                    blob: { state: BlockState.mined }
                })    

                // 6. create new block
                await create_block({ chain_id });

                // 7. burn the rest of the submissions, including remove video?


                // 8. exit fn.
                then_watching(res);

            }
        }
    });
}



/******************************************************
    @low level stake on chain on custodial account
******************************************************/

/**
 * 
 * @use: stake lumo tokens on the server side with 
 *       users' custodial accounts
 *       fail if user has not tokens left
 * 
 **/
async function stake_lumo_into_item({ itemID, userID, amt_in_lumo, then }){

    var res = default_fn_response({ data: {} })
    if ( trivialString(itemID) || trivialString(userID) ){
        res['message'] = 'ill valued item or user id'
        return then(res)
    }

    if ( trivialNum(amt_in_lumo) ){
        res['message'] = 'ill valued staking amount';
        return then(res);
    }

    let amt = BigNumber(`${amt_in_lumo * lumo_decimals()}`);
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });

    if (  trivialProps(user,'userID') ){
        res['message'] = 'user dne';
        return then(res);
    }    

    let pk = trivialString(user.custodial_ethereum_address)
        ? ( user.metamask_ethereum_address ?? "" )
        : user.custodial_ethereum_address;

    let { balance } = await balance_of_lumo_on_polygon({ userID });

    if ( balance <= amt_in_lumo * lumo_decimals() ){
        res['message'] = `insufficient funds for staking, your balance is: ${balance/lumo_decimals()}, but is staking ${amt_in_lumo}`
        return then(res);
    }

    let item_data = await fetch_block_item({ itemID })
    if ( trivialProps(item_data.data,'ID')  ){
        res['message'] = 'item dne'
        return then(res);
    }

    let item = item_data.data;

    let { chain_id } = item_data.data;
    let { root, blocks } = await fetch_chain({ chain_id, full: true });

    if (  trivialProps(root,'chain_id') ){
        res['message'] = 'social chain dne or no polygon contract deployed for this social chain';
        return then(res);        
    }

    if ( blocks.length === 0 ){
        res['message'] = 'this chain has not blocks';
        return then(res);
    }

    if ( trivialString(root.lumo_whitelist_hash) ){
        res['message'] = 'this contract has not been whitelisted on lumo'
        return then(res);
    }

    let sblocks = blocks        
        .sort((a,b) => b.timeStampCreated - a.timeStampCreated)
        .filter((b) => !trivialProps(b,'ID'));

    let block_latest = sblocks[0];

    if ( block_latest.ID !== item.block_id ){
        res['message'] = 'the item you are staking into was part of a prior block';
        return then(res)
    }

    // off chain stake
    await offchain_stake({ 
        poolAddress: chain_id, 
        chain_id: chain_id, 
        block_id: block_latest.ID,
        userID: userID, 
        amt_in_lumo: amt_in_lumo  // do not use big number here 
    })

    await stake({
        pk,
        amt,
        poolAddress: chain_id,  
        then: async (res) => {

            const { success, hash } = res;

            if ( success && !trivialString(hash) ){
                let _time = swiftNow();
                let stake_blob = {
                    ID: hash,
                    hash,
                    itemID,
                    chain_id,
                    block_id: block_latest.ID,
                    userID,
                    pk,
                    amt_in_lumo, 
                    poolAddress: chain_id,
                    mined : false,
                    timeStampCreated: _time,
                    timeStampLatest: _time,
                    timeStampCreatedPP: ppSwiftTime(_time) ?? "",
                    timeStampLatestPP : ppSwiftTime(_time) ?? "",
                }
                await write_to_db({
                    ID: hash,
                    path: DbPaths.social_chain_stake_lumo,
                    blob: stake_blob,
                })
            } else {
                then(res);
            }

        },
        then_watching : async (res) => {

            let vol = await readTotalStakedVolume();
            let svol = await readStakingAmount({ poolAddress: chain_id, staker: pk })

            const { hash,success } = res;

            // read pool snapshot and log staking action
            if ( success && !trivialString(hash) ){
                let _time = swiftNow();
                let stake_blob = {
                    timeStampLatest: _time,
                    timeStampLatestPP : ppSwiftTime(_time) ?? "",
                    total_staked_volume: vol.totalStakedVolume ?? 0,
                    total_staked_volume_by_staker: svol.stakingAmount ?? 0,
                }
                await update_db({
                    ID: hash,
                    path: DbPaths.social_chain_stake_lumo,
                    blob: stake_blob,
                })
            }
            then(res);
        }
    })
}





/******************************************************
    @mint item on polgyon
******************************************************/

/**
 *
 * @Use: mint NFT @`itemID` on side chain to  `targetUserID`
 *       1. get the application contract abi from the server
 *       2. get contract-address associated with chain-id
 *       3. mint on this chain
 * 
 **/
async function mint_item_on_polygon({ itemID, targetUserID, then }){

    var res = default_fn_response({ data: {}, hash: "" });

    let user = await getUserByVendorID({ userID: targetUserID, vendorID: "", withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne';
        return then(res)
    }

    let tgt_pk = trivialString(user.custodial_ethereum_address)
        ? ( user.metamask_ethereum_address ?? "" )
        : user.custodial_ethereum_address;

    if ( trivialString(tgt_pk) ){
        res['message'] = 'user does not have pk'
        return then(res);
    }

    let item_data = await fetch_block_item({ itemID })
    if ( trivialProps(item_data.data,'ID')  ){
        res['message'] = 'item dne'
        return then(res);
    }

    let item = item_data.data;

    if ( item.mint_state !== ItemMintState.not_minted  ){
        res['message'] = `this item is in state: ${item.mint_state}`;
        return then(res)
    }

    let { tok_id, chain_id } = item_data.data;
    let { root, polygon_contract } = await fetch_chain({ chain_id, full: true });

    if (  trivialProps(root,'chain_id') || trivialProps(polygon_contract,'contract_address') || trivialString(polygon_contract.contract_address) ){
        res['message'] = 'social chain dne or no polygon contract deployed for this social chain';
        return then(res);        
    }

    let contract    = await _get_contract_abi();
    let item_tok_id = tok_id ?? (generate_tok_id());

    if ( trivialProps(contract,'abi') ){
        res['message'] = 'malformed contract abi';
        return then(res)
    }

    // set item in pre state
    let _time = swiftNow();
    await update_db({
        path: DbPaths.social_chain_users,
        ID: itemID,
        blob: {
            timeStampLatest: _time,
            timeStampLatestPP: ppSwiftTime(_time),            
            mint_state: ItemMintState.pre_flight,
        }
    });

    await go_mint_on_polygon({ 
        contract_source: contract, 
        contract_address: polygon_contract.contract_address,
        tok_id: item_tok_id,
        tgt_pk: tgt_pk,
        then: async ({  success, message, hash }) => {
            let _time = swiftNow();
            if ( success ){
                await update_db({
                    path: DbPaths.social_chain_users,
                    ID: itemID,
                    blob: { 
                        mint_hash: hash ?? "",
                        mint_state: ItemMintState.in_flight,
                        timeStampLatest: _time,
                        timeStampLatestPP: ppSwiftTime(_time),
                    }
                });
            } else {
                res['message'] = message;
                then(res);
            }
        },
        then_watching: async ({ success, message, hash }) => {

            let _time = swiftNow();            

            if ( success ){
                await update_db({
                    ID  : itemID,
                    path: DbPaths.social_chain_users,
                    blob: { 
                        mint_hash       : hash ?? "",
                        mint_state      : ItemMintState.minted,
                        timeStampLatest : _time,
                        timeStampLatestPP: ppSwiftTime(_time),
                    }
                });

                res['message'] = message;
                res['success'] = true;

                // create token endpoint for opensea consumption
                // let { data } = await _storyboardItem_to_opensea_metadata({ itemID: itemID });
                // let did = await write_to_db({ path: DbPaths.token_endpoints, ID: tok_id, blob : data });

                then(res)

            } else {

                await update_db({
                    ID  : itemID,
                    path: DbPaths.social_chain_users,
                    blob: { 
                        hash            : hash ?? "",
                        mint_state      : ItemMintState.mint_failed,
                        timeStampLatest : _time,
                        timeStampLatestPP: ppSwiftTime(_time),
                    }
                });
                res['message'] = message;
                return then(res);
            }


        }
    })
}

/******************************************************
    @export
******************************************************/

// exports.mine_block = mine_block;
// exports.stake_lumo_into_item = stake_lumo_into_item;
// exports.mint_item_on_polygon = mint_item_on_polygon;





/******************************************************
    @mine block
******************************************************/


/**
 * 
 * @use: manually mine block using top gifted as metric
 * 
async function mine_block_offchain({ userID, chain_id }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(chain_id) ){
        res['message'] = 'please specify chain';
        return res;
    }

    let { root } = await fetch_chain({ chain_id, full: false });

    if (  trivialProps(root,'chain_id') ){
        res['message'] = 'no burn event found'
        return res;
    }    

    if ( root.userID !== userID ){
        res['message'] = 'only owner can create new burn event'
        return res;
    }

    await mine_all_blocks_offchain({ chain_id });
    res['success'] = true;
    res['message'] = 'clock reset!'
    res['data']    = root;
    return res;
    
}



/**
 * 
 * @use: set mining rate
 * 
async function update_mining_rate({ userID, chain_id, rate_in_minutes }){

    var res = default_fn_response({ data: {} });

    if ( trivialNum(Number(rate_in_minutes)) || Number(rate_in_minutes) <= 0 ){
        res['message'] = 'please specify rate in minutes;'
        return res;
    }

    if ( trivialString(userID) ){
        res['message'] = 'please specify user-id';
        return res;
    }

    // check user exist
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });

    if ( trivialProps(root,'ID') ){
        res['message'] = 'chain not found'
        return res;
    }

    if ( root.userID !== userID ){
        res['message'] = 'only chain owner can update mining rate';
        return res;
    }

    let rate = Number(rate_in_minutes)*60;

    let did = await update_db({
        ID: chain_id, 
        path: DbPaths.social_chain_root,
        blob: { 
            mining_rate: rate,
        }
    });

    return did ? { success: true, message: 'updated' } : { success: false, message: "failed to update" }
}


/**
 * 
 * @use: mine all blocks off chain
 * 

async function mine_all_blocks_offchain(props){

    // get specified chain or getall chains
    var chains = [];

    if ( trivialProps(props,'chain_id') || trivialString(props.chain_id) ){
        chains = await fetch_all({ path: DbPaths.social_chain_root });
    } else {
        const { chain_id } = props
        let { root } = await fetch_chain({ chain_id, full:false });
        if (  !trivialProps(root,'chain_id') ){
            chains = [root];
        }
    }

    await mine_all({ chains, then: console.log });

    async function mine_all({ chains, then }){
        if ( chains.length == 0  ){
            return then(`mined blocks`)
        } else {
            let head = chains[0]            
            let tail = chains.slice(1,);

            // if head chain not expired, then recurse down
            if (head.timeStampLatestBlockExpire > swiftNow() ){
                await mine_all({ chains: tail, then })
            } else {
                await _go_mine_trivial({ chain_id: head.chain_id, then: async (res) => {
                    await mine_all({ chains: tail, then })
                }})
            }
        }        
    }

    // @use: trivial mining that simply renews 
    //       the current block countdown
    //       this saves a lot of db calls.
    async function _go_mine_trivial({ chain_id, then }){

        var res = default_fn_response({ data: {} });
        if ( trivialString(chain_id) ){
            res['message'] = 'please specify chain';
            return then(res);
        }

        let _blocks = await fetch_block_root({ chain_id })
        let blocks = _blocks['data'] ?? []

        let sblocks = blocks        
            .sort((a,b) => b.timeStampCreated - a.timeStampCreated)
            .filter((b) => !trivialProps(b,'ID'))
            // .filter((b) => b.state === BlockState.pending);

        if ( sblocks.length === 0 ){            
            res['message'] = 'this chain has no pending blocks';
            return then(res);
         }

        // check if latest block can be mined yet.
        // or it's still accepting new submissions
        let block_latest = sblocks[0];

        if ( block_latest.timeStampExpire > swiftNow() ){

            res['message'] = 'the lastest block has not expired yet';
            return then(res);
 
        } else {

            // else refresh current block expire date
            let _time_f = swiftNow() + lumo_social_chain_mining_rate();

            let update_block = {
                state: BlockState.pending,
                timeStampExpire   : _time_f,
                timeStampExpirePP : ppSwiftTime(_time_f) ?? "",
            }
            let update_root = {
                latest_block_id: block_latest.ID,
                timeStampLatestBlockExpire: _time_f,
                timeStampLatestBlockExpirePP: ppSwiftTime(_time_f),
            }

            // update chain w/ latest block expire
            await update_db({
                ID: chain_id,
                path: DbPaths.social_chain_root,
                blob: update_root
            })
            await update_db({
                ID: block_latest.ID,
                path: DbPaths.social_chain_block,
                blob: update_block,
            })

        }

        res['success'] = true;
        res['data']    = block_latest;
        res['message'] = 'block mined and new block appended'
        return then(res);
    }  


    // put all blocks in a chain in mined state;
    async function put_all_blocks_in_mined_state({ blocks }){
        const put_all_in_mined = blocks.map(async (block) => {
            await update_db({
                ID: block.ID,
                path: DbPaths.social_chain_block,
                blob: { state: BlockState.mined }
            })
        });
        await Promise.all(put_all_in_mined);        
    }


    async function _go_mine({ chain_id, then }){

        var res = default_fn_response({ data: {} });
        if ( trivialString(chain_id) ){
            res['message'] = 'please specify chain';
            return then(res);
        }

        let { blocks, items } = await fetch_chain({ chain_id, full: true });

        let sblocks = blocks        
            .sort((a,b) => b.timeStampCreated - a.timeStampCreated)
            .filter((b) => !trivialProps(b,'ID'))
            // .filter((b) => b.state === BlockState.pending);

        if ( sblocks.length === 0 ){
            res['message'] = 'this chain has no pending blocks';
            return then(res);
         }

        // check if latest block can be mined yet.
        // or it's still accepting new submissions
        let block_latest = sblocks[0];

        if ( block_latest.timeStampExpire > swiftNow() ){

            res['message'] = 'the lastest block has not expired yet';
            return then(res);
 
        } else {


            // get items for latest block
            let block_items = items.filter(item => {
                return item.block_id == block_latest.ID
            })

            await put_all_blocks_in_mined_state({ blocks })

            // if items submitted, then update block to mined state
            // and then create new block
            if ( block_items.length > 0 ){

                await append_new_block({ chain_id, block_latest })

            } else {

                // else refresh current block expire date
                let _time_f = swiftNow() + lumo_social_chain_mining_rate();

                let update_block = {
                    state: BlockState.pending,
                    timeStampExpire   : _time_f,
                    timeStampExpirePP : ppSwiftTime(_time_f) ?? "",
                }
                let update_root = {
                    timeStampLatestBlockExpire: _time_f,
                    timeStampLatestBlockExpirePP: ppSwiftTime(_time_f),
                    latest_block_id: block_latest.ID,
                }

                // update chain w/ latest block expire
                await update_db({
                    ID: chain_id,
                    path: DbPaths.social_chain_root,
                    blob: update_root
                })
                await update_db({
                    ID: block_latest.ID,
                    path: DbPaths.social_chain_block,
                    blob: update_block,
                })
            }

            res['success'] = true;
            res['data']    = block_latest;
            res['message'] = 'block mined and new block appended'
            return then(res);
 
        }
    }    

    async function append_new_block({ chain_id, block_latest }){

        var res = default_fn_response({ data: {} });    

        let { data, blocks } = await fetch_chain({ chain_id, full: true });

        if ( trivialProps(data,'ID') ){
            res['message'] = 'this chain dne'
        }

        const { ID, symbol, subdomain, mining_rate } = data;
        let sorted_blocks = blocks.sort((a,b) => {
            return b.timeStampCreated - a.timeStampCreated;
        });
        let pending_block = sorted_blocks[0];        

        let id = `${ID}_${blocks.length}`;
        let _time = swiftNow();
        let _time_f = _time + lumo_social_chain_mining_rate();

        let blob = {
            ID       : id,
            chain_id : chain_id,
            block_id : id,
            symbol   : symbol ?? "",
            subdomain: subdomain ?? "",
            about    : trivialProps(block_latest,'about') ? "" : (block_latest.about ?? ""),
            prev_block_id: "",        
            state    : BlockState.pending,
            timeStampCreated  : _time,
            timeStampExpire   : _time_f,
            timeStampLatest   : _time,
            timeStampCreatedPP: ppSwiftTime(_time) ?? "",
            timeStampLatestPP : ppSwiftTime(_time) ?? "",
            timeStampExpirePP : ppSwiftTime(_time_f) ?? "",
        }

        // update chain w/ latest block expire
        await update_db({
            ID: chain_id,
            path: DbPaths.social_chain_root,
            blob: {
                timeStampLatestBlockExpire: _time_f,
                timeStampLatestBlockExpirePP: ppSwiftTime(_time_f),
                latest_block_id: id ?? "",
            },
        })

        let _blob = { ...blob, prev_block_id: pending_block.ID };
        let did = await write_to_db({ path: DbPaths.social_chain_block, ID: id, blob: _blob });
        res['success'] = did;
        res['message'] = did ? 'logged' : 'fail to log block';
        res['data']    = _blob;
        return res;      

    }
}
 **/




/******************************************************
    @write/read block
******************************************************/

/**
 * 
 * @use: create new block *iff* prev block has expired
 * 

async function create_block({ chain_id, force }){

    var res = default_fn_response({ data: {} });    

    let { data, blocks } = await fetch_chain({ chain_id, full: true });

    if ( trivialProps(data,'ID') ){
        res['message'] = 'this chain dne'
    }

    const { ID, symbol, subdomain, mining_rate } = data;
    let sorted_blocks = blocks.sort((a,b) => {
        return b.timeStampCreated - a.timeStampCreated;
    });

    let id = `${ID}_${blocks.length}`;
    let _time = swiftNow();
    let _time_f = _time + lumo_social_chain_mining_rate();

    let blob = {
        ID       : id,
        chain_id : chain_id,
        block_id : id,
        symbol   : symbol ?? "",
        subdomain: subdomain ?? "",
        about    : "",
        prev_block_id: "",        
        state    : BlockState.pending,
        timeStampCreated  : _time,
        timeStampExpire   : _time_f,
        timeStampLatest   : _time,
        timeStampCreatedPP: ppSwiftTime(_time) ?? "",
        timeStampLatestPP : ppSwiftTime(_time) ?? "",
        timeStampExpirePP : ppSwiftTime(_time_f) ?? "",
    }

    // if 1st block then write
    if ( sorted_blocks.length === 0 ){

        let did = await write_to_db({ path: DbPaths.social_chain_block, ID: id, blob: blob });
        res['success'] = did;
        res['message'] = did ? 'logged' : 'fail to log block';
        res['data']    = blob;
        return res;

    } else {

        let pending_block = sorted_blocks[0];

        if ( pending_block.timeStampExpire > _time && !force ){

            res['message'] = `block ${pending_block.ID} has not expired yet`;
            return res;

        } else {

            // update chain w/ latest block expire
            await update_db({
                ID: chain_id,
                path: DbPaths.social_chain_root,
                blob: {
                    timeStampLatestBlockExpire: _time_f,
                    timeStampLatestBlockExpirePP: ppSwiftTime(_time_f),
                    latest_block_id: id ?? "",
                },
            })

            let _blob = { ...blob, prev_block_id: pending_block.ID };
            let did = await write_to_db({ path: DbPaths.social_chain_block, ID: id, blob: _blob });
            res['success'] = did;
            res['message'] = did ? 'logged' : 'fail to log block';
            res['data']    = _blob;
            return res;

        }
    }
}


/**
 * 
 * @use: edit block manifesto
 * 

async function edit_block_manifesto({ userID, chain_id, block_id, about }){

    var res = default_fn_response({ data: {} });    
    if ( trivialString(about) || trivialString(userID) || trivialString(chain_id) ){
        return res;
    }

    // let block = await fetch_one({ 
    //     field: 'ID',
    //     value: block_id,
    //     path: DbPaths.social_chain_block,
    // })

    // if ( trivialProps(block,'ID') ){
    //     res['message'] = 'event dne'
    //     return res;
    // }

    let chain = await fetch_one({ 
        field: 'ID',
        value: chain_id ?? "",
        path: DbPaths.social_chain_root
    })


    if ( trivialProps(chain,'ID') ){
        res['message'] = 'chain dne'
        return res;
    }

    if ( chain.userID !== userID ){
        res['message'] = 'only the owner can edit this burn'
        return res;
    }

    await update_db({
        ID: chain.chain_id,
        path: DbPaths.social_chain_root,
        blob: { about: about ?? "" },
    });
    res['success'] = true;
    res['message'] = 'updated'
    return res;
}


/**
 * 
 * @use: get all blocks by chain-id
 * 

async function fetch_block_root({ chain_id, symbol, subdomain }){

    var res = default_fn_response({ data: [] });    

    if ( trivialString(chain_id) ){
        res['message'] = 'please specify chain_id';
        return res;
    }

    let by_id   = await fetch_many({ path: DbPaths.social_chain_block, field: 'chain_id' , value: chain_id });
    let by_sym  = await fetch_many({ path: DbPaths.social_chain_block, field: 'symbol'   , value: symbol   });
    let by_dom  = await fetch_many({ path: DbPaths.social_chain_block, field: "subdomain", value: subdomain });

    var blocks = {};
    by_id.map(b => {
        if (  trivialProps(blocks, b.ID) ){
            blocks[b.ID] = b
        }
    })
    by_sym.map(b => {
        if (  trivialProps(blocks, b.ID) ){
            blocks[b.ID] = b
        }
    })
    by_dom.map(b => {
        if (  trivialProps(blocks, b.ID) ){
            blocks[b.ID] = b
        }
    })

    blocks = Object.values(blocks).sort((b,a) => {
        return b.timeStampCreated - a.timeStampCreated
    })

    res['success'] = true
    res['message'] = `found ${blocks.length} blocks`
    res['data']    = blocks;
    return res;
}


/**
 * 
 * @use: get all items in block
 * 

async function get_full_block({ block_id }){

    var res = default_fn_response({ data: {}, items: [] });    

    if ( trivialString(block_id) ){
        res['message'] = 'please specify block_id';
        return res;
    }

    let items = await fetch_block_items({ block_id })
    let root = await fetch_one({ path: DbPaths.social_chain_block, field: "ID", value: block_id });

    if (  trivialProps(root,'ID') ){
        res['message'] = 'block dne';
        return res;
    }

    return { success: true, message: 'found block', data: root, items: items.data ?? [] };

}


/**
 * 
 * @use: get all items by block-id
 * 
async function fetch_block_items({ block_id }){

    var res = default_fn_response({ data: [] });    

    if ( trivialString(block_id) ){
        res['message'] = 'please specify block_id';
        return res;
    }

    let items = await fetch_many({ path: DbPaths.social_chain_users, field: 'block_id' , value: block_id });
    res['success'] = true
    res['message'] = `found ${items.length} items`
    res['data']    = items;
    return res;
}



**/

/******************************************************
    @write/read contracts
******************************************************/

/**
 * 
 * @use: deploy sidechain contract for social-chain at `chain-id`
 *       would own this contract and all the associatd fns.
 *       then white-list this contract address as a valid pool address
 *       in `LumoToken is ERC20`
 * 

async function deploy_sidechain_contract_for_chain({  chain_id, then }){

    var res = default_fn_response({ data: {}, hash: "", address: "" })
    let { root, blocks, polygon_contract } = await fetch_chain({ chain_id: chain_id ?? "", full: true });

    if (  trivialProps( root, 'chain_id' ) ){
        res['message'] = 'social chain dne';
        return then(res)
    }

    if ( !trivialProps(polygon_contract,'chain_id') ){
        res['message'] = 'polygon_contract already deployed'
        return then(res);
    }

    // 1. get contract abi
    let contract = await _get_contract_abi();

    if (  trivialProps(contract, 'abi') ){
        res['message'] = 'malformed contract abi';
        return then(res);
    }

    let _time = swiftNow();
    let blob = {
        ...(blocks.length > 0 ? blocks[0] : {}),
        ID      : chain_id,
        chain_id: chain_id,
        hash    : "",
        contract_address: "",
        timeStampCreated: _time,
        timeStampCreated  : _time,
        timeStampLatest   : _time,
        timeStampCreatedPP: ppSwiftTime(_time) ?? "",
        timeStampLatestPP : ppSwiftTime(_time) ?? "",
    }


    /// 2. deploy contract
    await deploy_custodial_contract_on_polygon({
        contract_name: ContractKind.ERC1155_0x04_v1,
        contract_source: contract,
        then_failed: async ({ success, message, }) => {
            res['message'] = message;
            return then(res);
        },
        then_deployed: async({ success, message, hash }) => {
            // 3. save blob w/ hash
            if ( success ){
                let blob2 = { ...blob, hash: hash }
                await write_to_db({
                    path: DbPaths.social_chain_polygon_contract,
                    ID: chain_id,
                    blob: blob2
                })            
            }
        },
        then_watching: async ({ success, message, hash, address }) => {

            if ( !success || trivialString(address) ){

                res['message'] = message;
                return then(res);       

            } else {

                let _time = swiftNow();
                let blob2 = { 
                    ...blob, 
                    hash: hash, 
                    contract_address: address,
                    timeStampLatestPP : ppSwiftTime(_time) ?? "",                     
                    timeStampLatest: _time,
                };
                let did = await write_to_db({
                    path: DbPaths.social_chain_polygon_contract,
                    ID: chain_id,
                    blob: blob2
                });                     

                // 3. add social-chain address to staking pool
                //    with 60 second lockup period
                await addPool({ 
                    lockupPeriod: 60, 
                    poolAddress : chain_id,
                    then: async ({ success, message }) => { 
                        if ( !success ){
                            then({  
                                success: true, 
                                message: `deployed contract at ${address}, but did not add contract to pool: ${message}`, 
                                address: address, 
                                hash: hash, 
                                data: blob2,
                            })       
                        }
                    },
                    then_watching: async ({ success, hash }) => {
                        if ( success && !trivialString(hash) ){
                            await update_db({
                                ID: chain_id, 
                                path: DbPaths.social_chain_root,
                                blob: { 
                                    lumo_whitelist_hash: hash, 
                                }
                            })
                        }
                        then({  success: did, message: `deployed contract at ${address}`, address: address, hash: hash, data: blob2 })       
                    }
                });
            }
        },                
    })
}


/**
 * 
 * @use: fetch contracts associatd with social chain 
 * 
async function fetch_contracts({ chain_id }){

    let polygon_contract = await fetch_one({ 
        field: 'chain_id',
        value: chain_id ?? "",
        path: DbPaths.social_chain_polygon_contract,
    })

    let eth_contract = await fetch_one({ 
        field: 'chain_id',
        value: chain_id ?? "",
        path : DbPaths.social_chain_eth_contract
    })

    return {
        success: true,
        message: 'fetched contracts',
        polygon_contract: polygon_contract ?? {},
        eth_contract    : eth_contract ?? {},
    }
}


/**
 *
 * @use: get contract abi 
 * 
async function _get_contract_abi(){
    let contract = await fetch_one({ 
        path: 'contract_abi', 
        field: 'sourceName', 
        value: ContractKind.abi_sourceName
    })
    return trivialProps(contract, 'abi') ? {} : contract
}

 **/

































