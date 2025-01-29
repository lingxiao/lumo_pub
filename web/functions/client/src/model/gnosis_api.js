/**
 * 
 * @Module: gnosis api
 * @Author: Xiao Ling
 * @Date  : 7/3/2022
 * @DOC: https://www.npmjs.com/package/@gnosis.pm/safe-core-sdk
 * @Doc: https://medium.com/@kyzooghost/four-practical-solidity-patterns-from-gnosis-safe-e8251f90a7ba
 * @Doc: https://github.com/safe-global/safe-contracts/blob/main/contracts/base/OwnerManager.sol
 * 
 * 
*/


import {
    POST_ENDPOINTS,
    go_axios_post,
    make_post_params,
    default_fn_response,
    GLOBAL_STAGING,
} from './core'

import {
    sendEthFromMetamaskAccount,
} from './api_web3';

import { trivialString, illValued, trivialProps,trivialNum, cap } from './utils';

// gnosis safe api
import { ethers }     from 'ethers';
import EthersAdapter  from '@gnosis.pm/safe-ethers-lib'
import SafeServiceClient      from '@gnosis.pm/safe-service-client';
import Safe, { SafeFactory }  from '@gnosis.pm/safe-core-sdk';
// import { SafeAccountConfig }  from '@gnosis.pm/safe-core-sdk';

import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

/******************************************************
    @On Chain job queue
******************************************************/

// mainnet 
const txServiceUrl = GLOBAL_STAGING 
    ? 'https://safe-transaction.rinkeby.gnosis.io'
    : 'https://safe-transaction.gnosis.io';        


/**
 * 
 * @Use: app API for on chain tx
 * @Functions:
 * 
 *  - deploy_contract
 *  - can_deploy_contract
 *  - monitor_deploy_contract
 *  - can_mint_item
 *  - mint_item
 *  - batch_mint_item
 * 
 */ 
export class GnosisSAFE {

    constructor(safe_address, server_metadata, project_address, user_cache){

        this.user_cache      = user_cache;
        this.safe_address    = safe_address;
        this.metadata        = server_metadata;;
        this.project_address = project_address;
        this.proposals       = [];
        this.approvals       = [];
        this.rejects         = [];
        this.approvals_full  = {};

        // safe API
        this.ethAdapter  = {};
        this.safeService = {};
        this.safeSdk     = {};

        // cached
        this.cosigners = [];
    }

    static mzero(){
        return new GnosisSAFE("", {}, {});
    }

    static validAddress(str){
        return ethers.utils.isAddress(str);
    }

    /**
     *
     * @use: on load, sync all minting tokens 
     * 
     **/
    async sync({ then }){

        if ( trivialProps(window,'ethereum') || trivialProps(ethers,'providers') || trivialString(this.safe_address) ){
            return
        }

        const { ethereum } = window;

        try {

            const provider   = new ethers.providers.Web3Provider(ethereum)
            const safeOwner  = provider.getSigner(0)
            const ethAdapter = new EthersAdapter({ ethers, signer: safeOwner });

            this.ethAdapter  = ethAdapter;
            this.safeService = new SafeServiceClient({ txServiceUrl, ethAdapter });

            // init safe
            let safeAddress = this.safe_address;
            const safeSdk   = await Safe.create({ ethAdapter, safeAddress, isL1SafeMasterCopy: !GLOBAL_STAGING });
            this.safeSdk    = safeSdk;

            // get all signed users
            await this._reload({ then });

        } catch (e){

            return then();

        }
    }

    async _reload({ then }){

        // get all signed users
        await this.fetch_signer_users({ then: (users) => {
            this.cosigners = users;
        }})

        // load safe txs from server
        await _get_safe({ 
            safe_address: this.safe_address, 
            then: async ({ success, message, data, proposals, approvals, executes, rejects }) => {

                let r_hashes = rejects.map (p => p['proposal_hash'] ?? "");
                let e_hashes = executes.map(p => p['proposal_hash'] ?? "");

                let non_rejected_proposals = proposals
                    .map(p => {
                        let rejected = r_hashes.includes(p.proposal_hash)
                        let executed = e_hashes.includes(p.proposal_hash)
                        let pending  = !rejected && !executed;
                        return { ...p, pending: pending, rejected: rejected, executed: executed };
                    })
                    .sort((a,b) => b.timeStampCreated - a.timeStampCreated)

                this.proposals = non_rejected_proposals ?? [];
                this.approvals = approvals ?? [];   
                this.rejects   = rejects   ?? [];

                let get_all = await non_rejected_proposals.map(async p => {
                    await this.get_approvals_by({ 
                        proposal_hash: p.proposal_hash, 
                        then: cap,
                    });
                })
                await Promise.all(get_all);

                then();
        }});        

    }

    /******************************************************
        @Gnosis read
    ******************************************************/ 

    /**
     * 
     * @use: read safe balance 
     * 
     **/
    read_balance = async () => {
        if ( trivialProps(this.safeSdk, 'getBalance') ){
            return { wei: 0, eth: 0, ppeth: 0 };
        }
        let num_decimals = 10000;
        const balance   = await this.safeSdk.getBalance()
        const bal_wei   = parseInt(balance._hex)
        const ebal      = bal_wei/1000000000000000000;
        const ppbal     = Math.round(ebal*num_decimals)/num_decimals;
        let blob = { wei: bal_wei, eth: ebal, ppeth: ppbal }
        return blob;
    }

    /**
     *
     * @use: read safe signers 
     * 
     **/
    read_signers = async () => {        
        if ( trivialProps(this.safeSdk, 'getOwners') ){
            return { owners: [], threshold: 0, chainId: "" };
        }
        const owners    = await this.safeSdk.getOwners()
        const threshold = await this.safeSdk.getThreshold()
        const chainId   = await this.safeSdk.getChainId()
        return { owners, threshold, chainId }
    }

    /**
     *
     * @ues: fetch all signers user blob 
     * 
     **/
    fetch_signer_users = async ({ then }) => {

        if ( this.cosigners.length > 0 ){

            return then(this.cosigners);

        } else {

            let { owners } = await this.read_signers();

            var res = [];
            let fetch = await owners.map(async (id) => {
                await this.user_cache.get({ userID: id, then: (user) => {
                    this.cosigners.push(user)
                }})
            });
            await Promise.all(fetch);
            return then(this.cosigners);

        }
    }

    /**
     * 
     * @use: check if i can sign this
     * 
     **/
    can_sign = async () => {

        if ( trivialProps(this.user_cache,'getAdminUser') ){
            return false
        } else {
            let admin = await this.user_cache.getAdminUser();
            let { owners } = await this.read_signers();
            return owners.filter(pk => { return admin.haveAddress(pk) }).length > 0
        }
    }

    /**
     * 
     * @use: get approval tx for propsal, with user model 
     * 
     **/
    get_approvals_by = async ({ proposal_hash, then }) => {

        if ( trivialString(proposal_hash) ){

            return then([]);

        } if ( !trivialProps(this.approvals_full, proposal_hash) ){

            return then(this.approvals_full[proposal_hash]);

        } else {

            var data = [];
            let prps = this.approvals.filter(m => m['proposal_hash'] === proposal_hash);
            let fetch_all = await prps.map(async prp => {
                await this.user_cache.get({ userID: prp.userID ?? "", then: (user) => {
                    let blob = { ...prp, user: user };
                    data.push(blob);
                }})
            });

            await Promise.all(fetch_all);
            this.approvals_full[proposal_hash] = data;
            return then(data);
        }
    }

    /******************************************************
        @Gnosis transactions add signer
    ******************************************************/    

    /**
     *
     * @Use: add signer to wallet
     * 
     **/
    propose_add_signer = async ({ pk, about, then_create, then_approve, then_execute, then }) => {        

        var res = default_fn_response({ data: {} });        

        let safeSdk = this.safeSdk;
        let _target = pk.replace(" ", "")

        let { owners } = await this.read_signers();
        let user = await this.user_cache.getAdminUser();
        let uid = trivialProps(user,'metamask_pk') ? user.userID  : user.metamask_pk;      

        let did_add = owners.map(s=> s.toLowerCase()).filter(pk => pk === _target.toLowerCase())

        if ( did_add.length > 0 ){

            res['message'] = 'already added!'
            return then(res);

        } else if ( !GnosisSAFE.validAddress(_target) ){            
            res['message'] = 'please enter valid ethereum address'
            return then(res);

        } else {

            // add tx w/ simple majority
            let new_len = owners.length + 1
            const threshold  = new_len === 2 ? 2 : Math.ceil(new_len/2);
            const transaction = { ownerAddress: _target, threshold: threshold };

            try {

                then_create("creating proposal")

                const safeTransaction = await safeSdk.getAddOwnerTx(transaction)
                const txHash = await safeSdk.getTransactionHash(safeTransaction)

                then_approve("creating proposal...")

                const txResponse1 = await safeSdk.approveTransactionHash(txHash)
                let approval_rs = await txResponse1.transactionResponse?.wait();
                const approval_tx_hash = approval_rs['transactionHash'] ?? "";

                await _propose_safe_tx({
                    safe_address : this.safe_address, 
                    projectID    : this.project_address, 
                    userID       : uid ?? "",
                    proposal     : transaction, 
                    proposal_hash: txHash, 
                    name         : "Adding cosigners",
                    message      : trivialString(about) ? `Adding ${pk} as a cosigner` : "",
                    kind         : GnosisSAFE.addSigner,
                    then         : async (_res) => {

                        // log proposal approval 
                        await _approve_safe_tx({
                            safe_address : this.safe_address, 
                            projectID    : this.project_address, 
                            userID       : uid ?? "",
                            proposal_hash: txHash, 
                            approval_hash: approval_tx_hash,
                            then         : async (r) => {
                                // update client side, then continue
                                await this._reload({ then: () => {            
                                    then({ success: !trivialString(txHash), message: `proposed`, data: txHash })
                                }});
                            }
                        })                        
                    }
                });

            } catch (e) {

                res['message'] = `${e.message}`;
                then(res)
            }

        }

    }

    /******************************************************
        @Gnosis transactions send eth
    ******************************************************/    

    /**
     * 
     * @use; propose sending `amount` to target
     * 
     **/
    propose_send = async ({ target, amount, about, then_sign, then_approve, then_approving, then }) => {

        var res = default_fn_response({ data: "" });
        let _target = target.replace(" ", "")

        if ( !GnosisSAFE.validAddress(_target) ){
            res['message'] = 'please specify valid address';
            return then(res)
        }

        if ( trivialNum(Number(amount)) ){
            res['message'] = 'please specify valid amount'
            return then(res)
        }

        const { eth } = await this.read_balance();

        if ( amount > eth ){
            res['message'] = 'you cannot send an amount that is larger than your balance';
            return then(res);
        }

        const safeSdk = this.safeSdk;
        const num_ethers = ethers.utils.parseUnits(`${amount}`, 'ether').toHexString();

        const transaction = { data: '0x', to: _target, value: num_ethers }

        // create the tx, sign it, and get the hash
        try {

            const safeTransaction = await safeSdk.createTransaction([transaction])
            const txHash = await safeSdk.getTransactionHash(safeTransaction)

            then_sign('Please sign')

            // sign
            await safeSdk.signTransaction(safeTransaction);        

            then_approve("Please approve");

            try {
                // approve
                const approve_response = await safeSdk.approveTransactionHash(txHash)

                then_approving("Pending confirmation...")

                let approval_rs = await approve_response.transactionResponse?.wait();

                const approval_tx_hash = approval_rs['transactionHash'] ?? "";

                // get usr and log
                let user = await this.user_cache.getAdminUser();
                let uid = trivialProps(user,'metamask_pk') ? user.userID  : user.metamask_pk;      

                // log proposal 
                await _propose_safe_tx({
                    safe_address : this.safe_address, 
                    projectID    : this.project_address, 
                    userID       : uid ?? "",
                    proposal     : transaction, 
                    proposal_hash: txHash, 
                    name         : "",
                    message      : about ?? "",
                    kind         : GnosisSAFE.sendETH,
                    then         : async (_) => {

                        // log proposal approval 
                        await _approve_safe_tx({
                            safe_address : this.safe_address, 
                            projectID    : this.project_address, 
                            userID       : uid ?? "",
                            proposal_hash: txHash, 
                            approval_hash: approval_tx_hash,
                            then         : async (r) => {
                                // update client side, then continue
                                await this._reload({ then: () => {            
                                    then({ success: !trivialString(txHash), message: `proposed`, data: txHash })
                                }});
                            }
                        })
                    }
                });            

            } catch (e) {
                then({ success: false, message: `${e.message}`, data: "" })
            }

        } catch (e) {

            then({ success: false, message:`${e.message}`, data: "" })

        }
    }

    /**
     *
     * @Use:  approve `tx_hash` 
     * 
     **/
    approve_transaction = async ({ 
        proposal_hash, 
        proposal, 
        then_approve, 
        then_approving, 
        then_execute, 
        then 
    }) => {    

        var res = default_fn_response({ data: "" });

        // ensure data is well made for send tx
        if ( illValued(proposal) ){
            res['message'] = 'please specify valid proposal'
            return then(res)
        }        

        const safeSdk = this.safeSdk;
        let user      = await this.user_cache.getAdminUser();
        let uid       = trivialProps(user,'metamask_pk') ? user.userID  : user.metamask_pk;      

        let did_approve = this.approvals
            .filter(m => m['proposal_hash'] === proposal_hash && m['userID'] === uid );

        const { owners } = await this.read_signers();

        if ( did_approve.length > 0 && owners.length > 1 ){
            res['message'] = 'you already approved this proposal';
            return then(res)
        }

        // build tx
        try {

            var safeTransaction;

            // buildthe correct tx: thisis wrong here,
            // there's invalid owner s'address error ...
            if ( !trivialProps(proposal,'ownerAddress') ){
                safeTransaction = await safeSdk.getAddOwnerTx([proposal])
            } else {
                safeTransaction = await safeSdk.createTransaction([proposal])
            }

            await safeSdk.getTransactionHash(safeTransaction)

            then_approve('Creating transaction, you will be asked to sign twice.');

            try {

                const approve_response = await safeSdk.approveTransactionHash(proposal_hash)

                then_approving("Step 1/2 done, now pending confirmation. Please do not navigate away, you will be asked to execute the transaction.")

                let approval_rs = await approve_response.transactionResponse?.wait();
                const approval_tx_hash = approval_rs['transactionHash'] ?? "";

                // log approval tx
                await _approve_safe_tx({
                    safe_address : this.safe_address, 
                    projectID    : this.project_address, 
                    userID       : uid ?? "",
                    proposal_hash: proposal_hash, 
                    approval_hash: approval_tx_hash,
                    then         : cap
                })                

                then_execute('Step 2/2: executing transaction.')

                try {

                    const txResponse_exec = await safeSdk.executeTransaction(safeTransaction)
                    let exec_rs = await txResponse_exec.transactionResponse?.wait()
                    let exec_rs_hash = exec_rs['transactionHash'] ?? "";

                    if ( !trivialString(exec_rs_hash) ){
                        await _execute_safe_tx({
                            safe_address : this.safe_address, 
                            projectID    : this.project_address, 
                            userID       : uid ?? "",
                            proposal_hash: proposal_hash, 
                            execution_hash: exec_rs_hash,                             
                            then : async (_) => {
                                await this._reload({ then: () => {
                                    res['success'] = true;
                                    res['message'] ='transaction approved and executed'
                                    return then(res);
                                }});
                            }
                        })
                    }

                } catch (e) {

                    res['success'] = true;
                    res['message'] = `Step 2/2: failed to execute tx: ${e.message}`
                    return then(res);
                }


            } catch (e) {
                res['message'] = `Step 2/2: failed to approve tx: ${e.message}`
                return then(res)
            }

        } catch (e) {
            res['message'] = `Step 2/2: failed to create tx: ${e.message}`
            return then(res);
        }

    }


    /**
     *
     * @Use: 
     * 
     **/
    reject_tx = async ({ proposal_hash, then }) => {        

        // if there's just one person, then execute the fn
        let user = await this.user_cache.getAdminUser();
        let uid = trivialProps(user,'metamask_pk') ? user.userID  : user.metamask_pk;      

        await _reject_safe_tx({
            userID       : uid ?? "",
            safe_address : this.safe_address, 
            projectID    : this.project_address, 
            proposal_hash: proposal_hash, 
            then         : async (res) => {                
                await this._reload({ then: () => {
                    then(res)
                }})
            }
        });
    }

    /***
     * 
     * deposit 
     * 
     **/
     async deposit({ amt, then }){
    
        let user = await this.user_cache.getAdminUser();
        let uid = trivialProps(user,'metamask_pk') ? user.userID  : user.metamask_pk;      

        await sendEthFromMetamaskAccount({
            to_addr: this.safe_address,
            amt_in_eth: Number(amt),
            userID: uid,
            then: then
        })        
     }
}


/******************************************************
    @API primitives
******************************************************/ 

/**
 * 
 * @use: deploy gnosis safe on client side 
 *       update 0xp server
 * 
 **/
async function deploy_safe({ storyboard, user_pk, userID, then_deployed, then }){

    var res = default_fn_response({ data: {}, safe_address: "" });

    if ( trivialProps(storyboard, 'eth_address') ){
        res['message'] = 'please spec project address'
        return then(res);
    }

    if ( trivialString(user_pk) ){
        res['message'] = 'please specify user pk'
        return then(res);
    }

    const { ethereum } = window
    const provider     = new ethers.providers.Web3Provider(ethereum);

    if ( trivialProps(provider,'getSigner') ){
        res['message'] = 'cannot find web3 provider'
        return then(res)
    }

    const safeOwner = provider.getSigner(0);

    try {

        const ethAdapter   = new EthersAdapter({ ethers, signer: safeOwner });    
        const safeFactory  = await SafeFactory.create({ ethAdapter, isL1SafeMasterCopy: !GLOBAL_STAGING });
        const safeAccountConfig = { owners: [user_pk], threshold: 1 };

        try {

            const safeSdk = await safeFactory.deploySafe({ safeAccountConfig });        

            then_deployed('deploying multisig wallet')

            try {

                const address = safeSdk.getAddress();
                const owners  = await safeSdk.getOwners();

                if ( !trivialString(address) ){
                    await _create_safe({
                        safe_address: address,
                        userID: userID ?? user_pk,
                        projectID: storyboard.eth_address,
                        then: (res) => {
                            var _res = { ...res, safe_address: address }
                            return then(_res);
                        }
                    })
                } else {
                    res['message'] = 'failed to deploy safe'
                    return then(res);
                }

            } catch (e) {
                res['message'] = `${e.message}`
                return then(res);
            }


        } catch (e) {
            res['message'] = `${e.message}`
            return then(res);
        }

    } catch (e) {
        res['message'] = `${e.message}`
        return then(res);
    }
}

export { deploy_safe };


/******************************************************
    @0xParc server API
******************************************************/ 

/**
 * 
 * @Use: create safe
 * 
 */ 
async function _create_safe({ safe_address, userID, projectID, then }){

    let post_params = make_post_params({
        userID   : userID,
        projectID: projectID,
        safe_address: safe_address,        
    });

    return await go_axios_post({
        endpoint: POST_ENDPOINTS.create_safe,
        post_params: post_params,
        then: then
    })  
}

/**
 * 
 * @Use: read safe
 * 
 */ 
async function _get_safe({ safe_address, then }){

    let post_params = make_post_params({
        safe_address: safe_address,
    });

    return await go_axios_post({
        endpoint: POST_ENDPOINTS.get_safe,
        post_params: post_params,
        then: then
    })  
}


/***
 * 
 * @use: record propsal 
 * 
 **/
async function _propose_safe_tx({ safe_address, projectID, userID, proposal_hash, proposal, name, message, kind, then }){

    let post_params = make_post_params({
        safe_address,
        projectID,
        userID,
        proposal_hash,
        name,
        message,
        proposal: JSON.stringify(proposal),
        type: kind,
    });

    return await go_axios_post({
        endpoint: POST_ENDPOINTS.propose_safe_tx,
        post_params: post_params,
        then: then
    })

}

/**
 *
 * @Use: get all propsoal 
 * 
 **/
async function _approve_safe_tx({ safe_address, projectID, userID, proposal_hash, approval_hash, then  }){

    let post_params = make_post_params({
        safe_address,
        projectID,
        userID,
        proposal_hash,
        approval_hash,
    });


    return await go_axios_post({
        endpoint: POST_ENDPOINTS.approve_safe_tx,
        post_params: post_params,
        then: then
    })
}

async function _execute_safe_tx({ safe_address, projectID, userID, proposal_hash, execution_hash, then  }){

    let post_params = make_post_params({
        safe_address,
        projectID,
        userID,
        proposal_hash,
        execution_hash,
    });


    return await go_axios_post({
        endpoint: POST_ENDPOINTS.execute_safe_tx,
        post_params: post_params,
        then: then
    })
}




async function _reject_safe_tx({ safe_address, projectID, userID, proposal_hash, then  }){

    let post_params = make_post_params({
        safe_address,
        projectID,
        userID,
        proposal_hash,
    });

    return await go_axios_post({
        endpoint: POST_ENDPOINTS.reject_safe_tx,
        post_params: post_params,
        then: then
    })
}

/**
 * 
 * @Use: read story board
 * 
 */ 
async function _add_safe_signer({ safe_address, userID, projectID, user_pk, then }){

    let post_params = make_post_params({
        userID: userID,
        user_pk: user_pk,
        projectID: projectID,
        safe_address: safe_address,
    });

    return await go_axios_post({
        endpoint: POST_ENDPOINTS.add_safe_signer,
        post_params: post_params,
        then: then
    })  
}


/**
 * 
 * @Use: read story board
 * 
 */ 
async function _get_all_signers({ safe_address, then }){

    let post_params = make_post_params({
        safe_address: safe_address,
    });

    return await go_axios_post({
        endpoint: POST_ENDPOINTS.get_all_signers,
        post_params: post_params,
        then: then
    })  
}

