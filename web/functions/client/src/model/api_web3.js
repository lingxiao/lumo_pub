
/**
 * 
 * @Module: web3 deployment and sign tx fns are here
 * @Author: Xiao Ling
 * @Date  : 6/5/2022
 * @DOC   : for read only API
 *          - https://docs.opensea.io/reference/retrieving-a-single-asset
 *          - https://docs.metamask.io/guide/ethereum-provider.html#basic-usage
 *          - https://github.com/ProjectOpenSea/opensea-js
 *
 * @DOC for web3 compabilitlty with react, you need to use alternate build system, see `README.md` or docs below:
 *   - https://ethereum.stackexchange.com/questions/123530/module-not-found-error-cant-resolve-stream-in-react-project-including-web3
 *   - https://stackoverflow.com/questions/57161839/module-not-found-error-cant-resolve-fs-in
 *   - https://ethereum.stackexchange.com/questions/111716/make-offer-to-opensea-asset-through-opensea-js
 * 
 * @DOC: for web3 provider for opensea:
 *  - https://ethereum.stackexchange.com/questions/111716/make-offer-to-opensea-asset-through-opensea-js
 * 
 * @TODO  : see escrow contract: https://docs.replit.com/tutorials/33-escrow-contract-with-solidity 
 * 
 * 
*/

import detectEthereumProvider from '@metamask/detect-provider';
import { ethers, ContractFactory } from "ethers";

import { 
    illValued,
    trivialString,  
    trivialProps,
    trivialNum,
    eth_to_wei_in_hex,
    removeAllSpaces,
}  from './utils'


import {
      POST_ENDPOINTS
    , generate_tok_id
    , ETH_ADMIN_ADDRESS
    , default_fn_response   
    , go_axios_post_preset
 } from './core';


const { BigNumber } = require("ethers");


/******************************************************
    @constants
******************************************************/ 

const eth_to_wei = 1000000000000000000;
const LEGACY_COLLECTION_ID = "d29b807f-037f-481b-81b8-b8529afe3e0a"



const ERC721_ABI = [
    "function initializeERC721LumoV2(address witness_, address feeTargetAddress_,address splitterAddress_,address[] memory payees_,uint256[] memory shares_,string memory _name,string memory _symbol,string memory uri_, uint256 price_) public",
    "function delegateInit( string memory _name, string memory _symbol, string memory uri_, uint256 price_, address witness_ ) public",

    "function uri(uint256 tokid) public view returns (string memory)",
    "function getPrice() public view returns (uint256)",
    "function getTokenIdsList() public view returns (uint256[] memory)",
    "function ownerOfToken(uint256 tokenId) public view returns (address)",
    "function balanceOf(address owner) public view returns (uint256)",                        
    "function getERC721Owner() public view returns (address)",

    "function setIsMinting(bool isPaused) public",
    "function isPaused() public view returns (bool)",

    "function setPrice(uint256 price_) public",
    "function mint( address[] memory pks, uint256[] memory ids, address witness_ ) public payable",
    "function getLatestTokId() public view returns (uint256)",

    "function createReward(bytes32 _merkleRoot, uint256 pricePerItem) public" ,
    "function getRecentRewardId() public view returns (uint256)",
    "function getReward(uint256 _id) public view returns (uint256, uint256)",
    "function claimReward( uint256 _rewardId, bytes32[] calldata merkleProof, uint256 preset_tok_id ) public payable",

    "function name() public view returns (string memory)",
    "function symbol() public view returns (string memory)",
    "function transferFrom(address from, address to, uint256 tokenId) public",
]

const SPLITTER_ABI = [
    "function setPaymentSplitterInitValue(address witness, address[] memory payees, uint256[] memory shares_) public",
    "function windowIndex() public view returns (uint256)",
    "function splitterBalance() public view returns (uint256)",
    "function getPaymentOwner() public view returns (address)",
    "function getSplitterOwner() public view returns (address)",

    "function setCarry( uint new_carry ) public",
    "function getCarry() public view returns (uint)",

    "function updatePayoutWindow(address[] memory payees, uint256[] memory shares_ ) public",
    "function releaseCurrentWindow() external",
    "function hardWithdrawlEth( address witness_ ) public",
    "function totalSharesAtWindow( uint256 idx_ ) public view returns (uint256)",
    "function totalReleasedAtWindow( uint256 idx_ ) public view returns (uint256)",
    "function sharesAtWindow( uint256 idx_, address account ) public view returns (uint256)",
    "function releasedAtWindow( uint256 idx_, address account) public view returns (uint256)",
    "function payeeAt(uint256 idx_, uint256 index) public view returns (address)",
    "function releasableAt( uint256 idx_, address account) public view returns (uint256)",
    "function maybeReleaseAt( uint256 idx_, address payable account) public",
    "function getAuctionIdx() public view returns (uint256)",
    "function getPastOwners() public view returns (address[] memory)",

    "function startContractAuction( uint256 _price,  bool is_short) public",
    "function bidForContract() public payable",
    "function cancelBidForContract() public",    
    "function endContractAuction() public",
    "function getHighestBid() public view returns (address, uint256, uint, bool)",
    "function getBidAtRoundFor(uint256 idx, address bidder) public view returns (address, uint256, uint, bool)",
    "function getAuctionState() public view returns (bool,uint)",
    "function getWinningAuction( uint256 idx_ ) public view returns (address, uint256, uint, uint, uint256, uint256)",
]

const ABI_erc721SplitterV2 = SPLITTER_ABI.concat(ERC721_ABI).concat([
    "function setImplementation(address impl, address witness_) public",
    "function getImplementation() public view returns (address)",
    "function initializeERC721SplitterProxy(address witness_,address feeTargetAddress_,address erc721SplitterAddress_,address splitterAddress_,address[] memory payees_,uint256[] memory shares_,string memory _name,string memory _symbol,string memory uri_, uint256 price_) public",
])

/******************************************************
    @basic metamask transactions
******************************************************/ 


/***
 *
 * @Use: query metamask for user's public key
 *
**/
async function queryMetaMask({ then }){

    var res = default_fn_response({ pk: "", chainId: "" });

    if (illValued(then)){
        res['message'] = 'no continuity fn'
        return res;
    }
    
    try {

        const provider = await detectEthereumProvider();

        if ( trivialProps(provider,'request') ) {

            res['message'] = `error detecting chain provider, metamask not connected or installed`
            return then(res);

        } else {

            await provider
                .request({ method: 'eth_chainId' })
                .then( async (chainId) => {

                    res['chainId'] = chainId ?? "";

                    // request access to user's account using provider client
                    provider
                    .request({ method: 'eth_requestAccounts' })
                    .then( async (acct) => {

                        if ( trivialProps(acct,'length') || acct.length === 0  ){
                            res['chainId'] = chainId;
                            res['message'] = 'provider account length is zero';
                            return then(res);
                        } else if ( trivialString(acct[0]) ){
                            res['chainId'] = chainId;
                            res['message'] = 'provider account pk is trival string'
                            return then(res);
                        } else {
                            res['chainId'] = chainId;
                            res['success'] = true;
                            res['message'] = 'found pk';
                            res['pk'] = acct[0];
                            return then(res);
                        }
                    })
                    .catch((error) => {
                        res['chainId'] = chainId;
                        res['message'] = `error requesting account: ${error.code}, ${error.message}`;
                        return then(res);
                    });

                })
                .catch((error) => {
                    res['message'] = `error requesting account: ${error.code}, ${error.message}`;
                    return then(res);
                });  
        }

    } catch (error) {

        res['message'] = `error requesting account: ${error.code}, ${error.message}`;
        return then(res);
    }

}


/***
 * 
 * @use: get albance of ether 
 * 
 * 
 **/
async function getBalanceOfEther({ then }){

    var res = default_fn_response({ balance: 0, pk: "", chainId: "" });

    if ( trivialProps(window,'ethereum') ){
        res['message'] = 'ethereum is not installed'
        return then(res);
    }

    const { ethereum } = window;
    const provider     = new ethers.providers.Web3Provider(ethereum);

    await queryMetaMask({ then : async ({ pk, chainId }) => {

        await provider.getBalance(pk)
            .then((balance) => {
                // convert a currency unit from wei to ether
                const balanceInEth = ethers.utils.formatEther(balance)
                res['success'] = true;
                res['message'] = `balance: ${balanceInEth} ETH`;
                res['balance'] = balanceInEth;
                res['pk'] = pk;
                res['chainId'] = chainId;
                then(res);
            })    

    }})
}

/**
 * 
 * @use: use user's metamask wallet to send eth from to amt
 * @Doc; https://docs.metamask.io/guide/sending-transactions.html#example
 * 
 **/ 
async function sendEthFromMetamaskAccount({ to_addr, amt_in_eth, userID, then }){

    var res = { success: false, message: 'provider account length is zero', hash: '' };

    if ( [to_addr, userID].map(trivialString).includes(true) ){
        res['message'] = 'please specify inputs'
        return then(res)
    }

    // convert to wei and hex format
    const { wei, hex } = eth_to_wei_in_hex(amt_in_eth);

    if ( trivialNum(wei) || trivialString(hex) ){
        res['message'] = 'improper valued eth';
        return then(res);
    }

    const provider = await detectEthereumProvider()

    if ( !trivialProps(provider,'request') ) {
     
        provider
            .request({ method: 'eth_requestAccounts' })
            .then( async (acct) => {

                if ( trivialProps(acct,'length') || acct.length === 0 || trivialString(acct[0])  ){

                    return then({ success: false, message: 'no metamask public key found',  hash: '' });

                } else {

                    let pk = acct[0];

                    const transactionParameters = {
                        from    : pk, // ethereum.selectedAddress, // must match user's active address.
                        to      : to_addr, // Required except during contract publications.
                        value   : hex, // Only required to send ether to the recipient from the initiating external account.
                        // chainId : ETH_NETWORK(), // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask
                    };

                    // txHash is a hex string
                    // As with any RPC call, it may throw an error
                    await provider.request({
                        method: 'eth_sendTransaction',
                        params: [transactionParameters],
                    })
                    .then(async (txHash) => {

                        if ( trivialString(txHash) ){
                            return then({ success: false, message: 'txHash not sent', hash: '' });
                        } else {
                            return then({ success: true, message: "sent!", hash: txHash })
                        }
                    })
                    .catch((error) => {
                        return then({ success: false, message: error.message, hash: ''  })
                    })

                }

            })
            .catch((error) => {
                then({ success: false, message: `error requesting account: ${error.message}`, hash: '' });
            });

    } else {
     
        // if the provider is not detected, detectEthereumProvider resolves to null
        then({ success: false, message: `error detecting chain provider, metamask not installed`, hash: '' });
        
    }
}



/******************************************************
    @compile contract txs
******************************************************/ 


/**
 * @Use: deploy Erc721LumoV1
 * 
 **/
// deployERC721LumoV2();    
// contracturl: https://etherscan.io/address/0xc9f8e4d728a12e0428692089f69b12d102ce2bde
async function deployERC721LumoV2(){
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return await go_axios_post_preset({
        fn_name: "get_erc721LumoV2",
        params: {},
        then: async ({ success, data }) => {
            const abi = data.abi; 
            const bytecode = data.bytecode;    
            const factory = new ContractFactory(abi, bytecode, signer);
            const deployed_tx = await factory.deploy();
            const raw_data = deployed_tx.deployTransaction;
            const { hash, gasPrice, from } = raw_data;
            console.log(deployed_tx, hash)
        }
    });
}


// deployPaymetSplitterV2();
// contract url: https://etherscan.io/address/0xb8c172b485e12717dde764fcfe55b61ad2d551c6
async function deployPaymetSplitterV2(){
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return await go_axios_post_preset({
        fn_name: "get_PaymetSplitterV2",
        params: {},
        then: async ({ success, data }) => {
            const abi = data.abi; 
            const bytecode = data.bytecode;    
            const factory = new ContractFactory(abi, bytecode, signer);
            const deployed_tx = await factory.deploy();
            const raw_data = deployed_tx.deployTransaction;
            const { hash, gasPrice, from } = raw_data;
            console.log(deployed_tx, hash)
        }
    });
}



/***
 * 
 * @use: deploy contact of `kind` from the client side signer 
 * @Doc: https://ethereum.stackexchange.com/questions/84637/deploy-contract-with-ether-js
 * @Doc: https://docs.ethers.io/v5/api/contract/contract/
 * @Doc: https://stackoverflow.com/questions/60785630/how-to-connect-ethers-js-with-metamask
 * 
 **/
async function deployContract({  contract, name, sym, price_in_eth, then }){

    let symbol = (removeAllSpaces(sym ?? "")).toLowerCase();

    if ( trivialString(symbol) ){
        return then({ success: false, message: 'contract symbol is not specified', data: {}, raw_data: {} })        
    }

    if (  trivialProps(contract, 'abi') || trivialProps(contract,'bytecode') ){
        return then({ success: false, message: 'contract abi not specified', data: {}, raw_data: {} })
    }

    if ( trivialProps(window,'ethereum') ){
        return then({ success: false, message: 'You do not have metamask installed', data: {}, raw_data: {} })                
    }

    await queryMetaMask({ then: async({ success, message, pk }) => {

        if ( trivialString(pk) ){
            return then({ success: false, message: `we cannot locate your metamask account`, hash: '', data: {}, raw_data: {} })
        }

        // 1. construct signer instance
        try {

            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();

            // create contract factoryand deploy
            try {

                const abi = contract.abi; 
                const bytecode = contract.bytecode;    

                const factory = new ContractFactory(abi, bytecode, signer)

                // deploy erc721splitterProxy
                try {

                    // calling this fn will result in metamask 
                    // popup, asking for a signature to continue;
                    // note because you're deploying a proxy, the contract is not initialized
                    const deployed_tx = await factory.deploy();

                    if ( !trivialProps(deployed_tx, 'deployTransaction') && !trivialProps(deployed_tx.deployTransaction, 'hash') ){

                        const raw_data = deployed_tx.deployTransaction;
                        const { hash, gasPrice, data, from } = raw_data;
                        const res_data = {
                            hash    : hash,
                            gasPrice: gasPrice,
                            from    : from,            
                        }
                        then({ success: true, message: `deployed!`, hash: hash, data: res_data, raw_data: raw_data });

                    } else {

                        then({ success: true, message: `deployed!`, hash: "", data: {}, raw_data: {} });

                    }

                } catch (e) {
                    then({ success: false, message: e.message ?? "", hash: '', data: {}, raw_data: {} })
                }

            } catch (e) {

                then({ success: false, message: e.message ?? "", hash: '', data: {}, raw_data: {} })                
            }

        } catch (e) {
            
            then({ success: false, message: e.message ?? "", hash: '', data: {}, raw_data: {} })
        }

    }});
}



/***
 * 
 * @use: monitoer deploye contract for its progress
 * @Doc: https://docs.ethers.io/v5/single-page/#/v5/api/contract/
 * 
 **/
async function monitorDeployedContract({ 
    hash, 
    current_iter,
    max_depth, 
    timeout, 
    name, sym, price_in_eth, witness_pk,
    erc721_address, paymentSplitter_address,
    then, 
    then_deploy_progress 
}){

    var res = { success: false, message: 'contract hash is not specified', data: {}, address: "" };

    if ( trivialString(hash) ){
        return then(res);
    }

    if ( trivialProps(window,'ethereum') ){
        res['message'] = 'You do not have metamask installed'
        return res;
    }


    // 1. construct signer instance
    try {

        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        try {

            let data = await provider.getTransactionReceipt(hash);

            if ( !trivialProps(data,'contractAddress') && !trivialString(data.contractAddress) ){

                let symbol = (removeAllSpaces(sym ?? "")).toLowerCase();
                let _name   = trivialString(name)   ? "lumo_contract" : name.substring(0,20);
                let _symbol = trivialString(symbol) ? 'LMO' : symbol.toUpperCase().substring(0,3);
                let uri = POST_ENDPOINTS.contract_uri(symbol);
                let eth_price = BigNumber.from(`${price_in_eth * eth_to_wei}`);

                // set logic layer address;
                const contractInstance = new ethers.Contract(data.contractAddress, ABI_erc721SplitterV2, signer);

                // initialize contract;
                await queryMetaMask({ then: async ({ success, message, pk }) => {
                    
                    await contractInstance.initializeERC721SplitterProxy(
                        witness_pk,
                        ETH_ADMIN_ADDRESS(),// 10% take rate
                        erc721_address,
                        paymentSplitter_address,
                        [pk],
                        [10000],
                        _name,
                        _symbol,
                        uri,
                        eth_price,
                        { gasLimit: 1000000}
                    )

                    return then({
                        success: true,
                        message: 'Initiated contract',
                        data: data,
                        address: data.contractAddress
                    });
                }});

            } else if ( current_iter > max_depth ){

                res['message'] = 'The chain is congested, but the contract has been deployed. Please check later to open mint';
                return then(res);

            } else {    

                if (typeof then_deploy_progress === 'function'){
                    then_deploy_progress(current_iter + 1);                
                }
                setTimeout(async () => {
                    await monitorDeployedContract({
                        hash,
                        max_depth,
                        timeout,
                        current_iter: current_iter + 1,
                        name, sym, price_in_eth, witness_pk,
                        erc721_address, paymentSplitter_address,
                        then_deploy_progress,
                        then,
                    });

                }, timeout)

            }

        } catch (e) {

            then({ success: false, message: e.message ?? "", hash: '', data: {}, address: "", });
        }


    } catch (e) {
        
        then({ success: false, message: e.message ?? "", hash: '', data: {}, address: "", });
    }
}


/******************************************************
    @erc721TradablePayable.sol #mint
******************************************************/ 


/***
 * 
 * @use: mint `itemID` with `abi` deployed to `contract_address`
 * @Doc: https://ethereum.stackexchange.com/questions/84637/deploy-contract-with-ether-js
 * @Doc: https://docs.ethers.io/v5/api/contract/contract/
 * @Doc: https://stackoverflow.com/questions/60785630/how-to-connect-ethers-js-with-metamask
 * 
 **/
async function mintToken({ itemID, contract_address, contract_kind, collection_id, abi, bytecode, price_in_eth, then_minting, then }){

    if ( [contract_kind,contract_address,bytecode].map(trivialString).includes(true)  ){
        return then({ success: false, message: 'contract abi not specified', pk: "", tok_id: "", hash: "", data: {}, raw_data: {} })
    }

    if ( trivialProps(window,'ethereum') ){
        return then({ success: false, message: 'Metamask is not installed', pk: "", tok_id: "", hash: "", data: {}, raw_data: {} })
    }

    await queryMetaMask({ then: async({ success, message, pk }) => {

        if ( trivialString(pk) ){
            return then({ success: false, message: `we cannot locate your metamask account`, tok_id: "", hash: '', data: {}, raw_data: {} })
        }

        // 1. construct signer instance
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        try {

            // 2. create contract instance
            let _abi = LEGACY_COLLECTION_ID === collection_id ? abi : ABI_erc721SplitterV2;
            const contractInstance = new ethers.Contract(contract_address, _abi, signer)

            if ( trivialProps(contractInstance, 'mint') ){
                return then({ success: false, message: 'malformed contract', pk: "", tok_id: "", hash: '', data: {}, raw_data: {} })
            }

            // get on chain price and use the higher of the two
            let price = await contractInstance.getPrice();
            let onchain_price_in_wei = Number(price._hex);
            let price_in_wei  = price_in_eth * eth_to_wei;
            let final_price = (price_in_wei > onchain_price_in_wei ? price_in_wei : onchain_price_in_wei)/eth_to_wei;

            try {

                if ( typeof then_minting === 'function' ){
                    then_minting();
                }

                // 3. run `mint` function by gen. token-id first
                let tok_id = generate_tok_id(); 
                var mint_res = {}

                // mint on 1155
                if ( LEGACY_COLLECTION_ID === collection_id ){
                    mint_res = await contractInstance.mint(pk, tok_id, 1, pk, '0x'); 
                } else {
                    const options = {value: ethers.utils.parseEther(`${final_price}`)};
                    mint_res = await contractInstance.mint([pk], [tok_id], pk, options)
                }
                const { hash, gasPrice, from } = mint_res;
                const res_data = { hash: hash, gasPrice: gasPrice, from: from };
                then({ success: true, message: `minting!`, pk: pk, tok_id: tok_id, hash: hash, data: res_data, raw_data: mint_res });

            } catch (e){
                then({ success: false, message: e.message ?? "", pk: "", tok_id: "", hash: '', data: {}, raw_data: {} });
            }

        } catch (e) {

            then({ success: false, message: e.message ?? "", pk: "", tok_id: "", hash: '', data: {}, raw_data: {} })
        }

    }});
}

/**
 * @Use: get minted token id for address
 * 
 **/
async function getMintedTokenId({ pk, contract_address, bytecode, minter_address, then }){

    var res = default_fn_response({ tok_id: "" });

    if ( [contract_address,bytecode].map(trivialString).includes(true)  ){
        res['message'] = 'contract abi not specified'
        return then(res);
    }

    // 1. construct signer instance
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    try {

        // 2. create contract factory
        const contractInstance = new ethers.Contract(contract_address, ABI_erc721SplitterV2, signer);

        if ( trivialProps(contractInstance, 'getLatestTokId') ){
            res['message'] = 'malformed getLatestTokId';
            return then(res);
        }

        try { 

            let highest_id = await contractInstance.getLatestTokId();

        } catch (e){
            res['message'] = e.message ?? "";
            return then(res);
        }

    } catch (e) {

        res['message'] = e.message ?? "";
        return then(res);
    }
}

/**
 * 
 * @Use: get all splits for erc1155
 * 
 **/
async function toggleContractMintStatus({  contract_address, bytecode, should_pause, then }){

    var res = default_fn_response({});

    if ( [contract_address,bytecode].map(trivialString).includes(true)  ){
        res['message'] = 'contract abi not specified'
        return then(res);
    }

    await queryMetaMask({ then: async({ success, message, pk }) => {

        if ( trivialString(pk) ){
            res['message'] = 'we cannot locate metamask account';
            return then(res);
        }

        // 1. construct signer instance
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        try {

            // 2. create contract factory
            const contractInstance = new ethers.Contract(contract_address, ABI_erc721SplitterV2, signer);

            if ( trivialProps(contractInstance, 'setIsMinting') ){
                res['message'] = 'malformed contract';
                return then(res);
            }

            try { 
                // try read splits

                if ( should_pause ){
                    await contractInstance.setIsMinting(false);
                } else {
                    await contractInstance.setIsMinting(true);                    
                }

                res['success'] = true;
                res['message'] = 'executing tx'
                return then(res);

            } catch (e){
                res['message'] = e.message ?? "";
                return then(res);
            }

        } catch (e) {

            res['message'] = e.message ?? "";
            return then(res);
        }

    }});
}


/******************************************************
    @ERC721Splitter
        #maybeReleaseFunds 
        #fundsOwed
        #shares
******************************************************/ 


/**
 * 
 * @Use: ask `contract_address` to release funds owed to addresses,
 * 
 **/
async function releaseCurrentWindow({  contract_address, abi, bytecode, then }){

    if ( [contract_address,bytecode].map(trivialString).includes(true)  ){
        return then({ success: false, message: 'contract abi not specified', data: {}, balanceIsZero: false });
    }

    await queryMetaMask({ then: async({ success, message, pk }) => {

        if ( trivialString(pk) ){
            return then({ success: false, message: `we cannot locate your metamask account`, data: {}, balanceIsZero: false });
        }

        // get all payable parties
        await readSplits({ contract_address, abi, bytecode, then: async ({ accounts }) => {

            let pks = (accounts ?? []).map(m => m.pk ?? "").filter(s => !trivialString(s));

            // 1. construct signer instance
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();

            try {

                // 2. create contract factory and deploy
                const contractInstance = new ethers.Contract(contract_address, ABI_erc721SplitterV2, signer)

                if ( trivialProps(contractInstance, 'releaseCurrentWindow') ){
                    return then({ success: false, message: 'contract does not have method #releaseCurrentWindow', data: {}, balanceIsZero: false });
                }

                try { // try releasing funds

                    let balance_raw = await contractInstance.splitterBalance();
                    let balance_wei = Number(balance_raw._hex);
                    let balance_eth = balance_wei/eth_to_wei

                    if ( balance_eth === 0 ){
                        return then({ success: false, message: "Balance is zero", data: {}, balanceIsZero: true })
                    } else {
                        let release_tx = await contractInstance.releaseCurrentWindow()
                        return then({ success: true, message: `funds releasing!`, data: release_tx });
                    }

                } catch (e){

                    then({ success: false, message: e.message ?? "",  data: {}, balanceIsZero: false });

                }

            } catch (e) {
                then({ success: false, message: e.message ?? "",  data: {}, balanceIsZero: false });
            }

        }});            

    }});

}


/**
 * 
 * @Use: get all splits for erc1155
 * 
 **/
async function readSplits({  contract_address, abi, bytecode, then }){

    var res = default_fn_response({ accounts: [] });


    if ( [contract_address,bytecode].map(trivialString).includes(true)  ){
        res['message'] = 'contract abi not specified'
        return then(res);
    }

    await queryMetaMask({ then: async({ success, message, pk }) => {

        if ( trivialString(pk) ){
            res['message'] = 'we cannot locate metamask account';
            return then(res);
        }

        // 1. construct signer instance
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        try {

            // 2. create contract factory
            const contractInstance = new ethers.Contract(contract_address, ABI_erc721SplitterV2, signer);

            if ( trivialProps(contractInstance, 'windowIndex') ){
                res['message'] = 'malformed contract';
                return then(res);
            }

            try { 
                // try read splits

                let payment_window = await contractInstance.windowIndex();

                await _rec_read_split({ 
                    contractInstance,
                    max_depth: 100, 
                    idx: 0, 
                    accounts: [], 
                    windowIdx: Number(payment_window),
                    then: (splits) => {

                        let denominator = splits.map(m => m.share).reduce((a,b) => a+b,0);
                        let _splits = splits.map(s => {
                            let t = { ...s, share_in_percent: s.share/denominator, denominator: denominator };
                            return t;
                        })
                        res['success'] = true;
                        res['message'] = `found ${splits}.length accounts`;
                        res['accounts'] = _splits;
                        res['denominator'] = denominator;
                        return then(res);
                }});

            } catch (e){
                res['message'] = e.message ?? "";
                return then(res);
            }

        } catch (e) {

            res['message'] = e.message ?? "";
            return then(res);
        }

    }});

}

// @Use: recursively check if there is a `idx`th payee, if not, then stop early
//       read up to 100 accounts
async function _rec_read_split({ max_depth, contractInstance, idx, accounts, windowIdx, then }){

    if ( idx > max_depth || trivialNum(windowIdx) ){
        return then(accounts)
    } else {

        try {

            let payee_k_pk = await contractInstance.payeeAt( windowIdx, idx);

            try {

                let share_k = await contractInstance.sharesAtWindow( windowIdx, payee_k_pk);
                let share   = Number(share_k._hex);
                let owed    = await contractInstance.releasableAt(windowIdx, payee_k_pk);
                let owed_in_eth = Math.round(Number(owed/eth_to_wei*100))/100;

                var _accounts = accounts.concat({ 
                    pk      : payee_k_pk, 
                    share   : share, 
                    owed    : Number(owed),
                    owed_bn : owed,
                    owed_in_eth: owed_in_eth,
                    share_bn: share_k 
                });

                return _rec_read_split({
                    max_depth,
                    contractInstance,
                    idx: idx + 1,
                    accounts: _accounts, 
                    windowIdx,
                    then
                });
            } catch {
                return then(accounts);
            }
        } catch {
            return then(accounts)
        }

    }
}



/**
 * 
 * @Use: adjsut splits on chain
 * 
 **/
async function updatePayoutWindow({  contract_address, bytecode, pks, shares, then }){

    if ( [contract_address,bytecode].map(trivialString).includes(true)  ){
        return then({ success: false, message: 'contract bytecode not specified', data: {} });
    }

    if ( pks.length !== shares.length ){

        return then({ success: false, message: 'pks and shares length are not equal', data: {} });
    }

    if ( pks.length < 2 ){

        return then({ success: false, message: 'Please split at least once', data: {} });
    }

    await queryMetaMask({ then: async({ success, message, pk }) => {

        if ( trivialString(pk) ){
            return then({ success: false, message: `we cannot locate your metamask account`, data: {} });
        }

        // 1. construct signer instance
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        try {

            // 2. create contract instance
            const contractInstance = new ethers.Contract(contract_address, ABI_erc721SplitterV2, signer)

            if ( trivialProps(contractInstance, 'updatePayoutWindow') ){
                return then({ success: false, message: 'contract does not have method #updatePayoutWindow', data: {} });
            }

            try { // try split

                let release_tx = await contractInstance.updatePayoutWindow(pks, shares)
                then({ success: true, message: `Adjusting shares...`, data: release_tx });


            } catch (e){
                then({ success: false, message: e.message ?? "",  data: {} });
            }

        } catch (e) {
            then({ success: false, message: e.message ?? "",  data: {} });
        }

    }});

}

/**
 * 
 * @Use: send all eth back to contract deployer
 * 
 **/
async function hardWithdrawlEth({  contract_address, abi, bytecode, witness_pk, then }){
    then({ success: false, message: 'this option is not allowed in production', data: {} })
}




/******************************************************
    read pause status 
******************************************************/ 

/**
 * 
 * @Use: get all splits for erc1155
 * 
 **/
async function readMintIsPaused({  contract_address, abi, bytecode, then }){

    var res = default_fn_response({ isPaused: false });

    if ( [contract_address,bytecode].map(trivialString).includes(true)  ){
        res['message'] = 'contract abi not specified'
        return then(res);
    }

    await queryMetaMask({ then: async({ success, message, pk }) => {

        if ( trivialString(pk) ){
            res['message'] = 'we cannot locate metamask account';
            return then(res);
        }

        // 1. construct signer instance
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        try {

            // 2. create contract factory
            const contractInstance = new ethers.Contract(contract_address, ABI_erc721SplitterV2, signer);

            if ( trivialProps(contractInstance, 'isPaused') ){
                res['message'] = 'malformed contract';
                return then(res);
            }

            try { 

                let is_paused = await contractInstance.isPaused();
                res['success'] = true;
                res['message'] = `isPaused: ${is_paused}`
                res['isPaused'] = is_paused;
                return then(res);
                
            } catch (e){
                res['message'] = e.message ?? "";
                return then(res);
            }

        } catch (e) {

            res['message'] = e.message ?? "";
            return then(res);
        }

    }});

}



/******************************************************
    @utils
******************************************************/ 



async function changeItemPrice({ collection_id, contract_address, bytecode, price_in_eth, then }){

    if ( collection_id === LEGACY_COLLECTION_ID ){
        return then({ success: true, message: "set" })
    }

    if ( [contract_address,bytecode].map(trivialString).includes(true)  ){
        return then({ success: false, message: 'contract not specified', });
    }

    if ( trivialProps(window,'ethereum') ){
        return then({ success: false, message: 'Metamask is not installed', });
    }


    await queryMetaMask({ then: async({ success, message, pk }) => {

        if ( trivialString(pk) ){
            return then({ success: false, message: `we cannot locate your metamask account`, hash: '', data: {}, raw_data: {} })
        }

        // 1. construct signer instance
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        try {

            // 2. create contract instance
            const contractInstance = new ethers.Contract(contract_address, ABI_erc721SplitterV2, signer)

            if ( trivialProps(contractInstance, 'setPrice') ){
                return then({ success: false, message: 'malformed contract', hash: '', data: {}, raw_data: {} })
            }

            try {

                const eth_price = ethers.utils.parseEther(`${price_in_eth}`);
                await contractInstance.setPrice(eth_price);
                then({ success: true, message: `price set!`, });

            } catch (e){

                then({ success: false, message: e.message ?? "", });

            }

        } catch (e) {

            then({ success: false, message: e.message ?? "", });
        }

    }});
}


/***
 * 
 * @use: monitoer deploye contract for its progress
 * @Doc: https://docs.ethers.io/v5/single-page/#/v5/api/contract/
 * 
 **/
async function monitorTxOnChain({ 
    hash, 
    current_iter,
    max_depth, 
    timeout, 
    then, 
    then_monitor_progress 
}){

    var res = { success: false, message: 'hash is not specified', data: {} };

    if ( trivialString(hash) ){
        return then(res);
    }

    if ( trivialProps(window,'ethereum') ){
        res['message'] = 'You do not have metamask installed'
        return res;
    }

    // 1. construct signer instance
    try {

        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        try {

            let data = await provider.getTransactionReceipt(hash);

            if ( !trivialProps(data,'to') && !trivialString(data.to) ){

                return then({
                    success: true,
                    message: 'Balance released!',
                    data: {},
                });

            } else if ( current_iter > max_depth ){

                res['message'] = 'The chain is congested, But your tx has been executed, please check your metamask for updates';
                return then(res);

            } else {    

                if (typeof then_monitor_progress === 'function'){
                    then_monitor_progress(current_iter + 1);                
                }
                setTimeout(async () => {
                    await monitorTxOnChain({
                        hash,
                        max_depth,
                        timeout,
                        current_iter: current_iter + 1,
                        then_monitor_progress,
                        then,
                    });

                }, timeout)

            }

        } catch (e) {

            then({ success: false, message: e.message ?? "", hash: '', data: {}, address: "", });
        }


    } catch (e) {
        
        then({ success: false, message: e.message ?? "", hash: '', data: {}, address: "", });
    }
}


/******************************************************
    @export
******************************************************/ 



export {
    queryMetaMask,
    sendEthFromMetamaskAccount,
    deployContract,
    monitorDeployedContract,
    mintToken,
    getBalanceOfEther,
    releaseCurrentWindow,
    updatePayoutWindow,
    changeItemPrice,
    readSplits,
    hardWithdrawlEth,
    readMintIsPaused,
    toggleContractMintStatus,
    monitorTxOnChain,
    getMintedTokenId,
}






