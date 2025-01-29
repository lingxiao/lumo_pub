/** 
 * 
 * @Package: deploy
 * @Date   : 3/22/2022
 * @Run    : `npx hardhat run scripts/deploy.js --network rinkeby`
 * @Test   : `npx hardhat test`
 * @Console: `npx hardhat console`
 * @Note    : `npx hardhat node`
 * @Doc: 
 *  - https://hardhat.org/hardhat-network
 *  - https://hardhat.org/guides/create-task
 * 
 * 
*/


/**
 * 
 * @use: main deployment fn
 * @Doc: https://hardhat.org/tutorial/deploying-to-a-live-network.html
 * 
 **/ 
async function main() {

    // await deploy_payment_splitter_rinkeby()
    // await compile721_rinkeby_v1();
    // await deploy_rinkeby_v1();
    // await compile_ERC1155BurnableSupplySplitterAdjustable_polygon();

    // await compile_lumo_token();
    // await compile_lumo_staking_pool("0x7678a973FB6327BDbD054E85A8eD054c6960aa1c");
}


/******************************************************
    @Lumo token deploy 
******************************************************/


/***
 * 
 * @use: deploy parc token to mumbai
 * @command:
 *  `npx hardhat run scripts/deploy.js --network mumbai``
 * @Address-mumbai:
 *   0x7678a973FB6327BDbD054E85A8eD054c6960aa1c
 *  
 * 
 **/
async function compile_lumo_token(){

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const ContractABI = await ethers.getContractFactory("LumoToken");

    if (true){
        const deployed_data = await ContractABI.deploy();
        console.log("LumoToken address:", deployed_data.address, 'deployed from admin address: ', deployer.address);  
    }
}


/**
 * 
 * @Use: deploy parc staking pool contract
 * @Address: 
 * - 0x84114bb645b6BD1C588160fC9AD4BfeC2C0E9A35
 * 
 **/
async function compile_lumo_staking_pool(address){

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const ContractABI = await ethers.getContractFactory("LumoStakingPool");

    if (true){
        const deployed_data = await ContractABI.deploy(address)
        console.log("LumoStakingPool address:", deployed_data.address, 'deployed from admin address: ', deployer.address);  
    }    
}


/******************************************************
    @ERC1155BurnableSupplySplitterAdjustable polygon
******************************************************/

/**
 * 
 * @Use: deploy erec1155splitter to mumbai
 * @command:
 *  `npx hardhat run scripts/deploy.js --network mumbai``
 * @Address-mumbai:
 *   0xCbF37D9546a79B231FAEAE3Fe45516513cb52F8A
 *  
 **/
async function compile_ERC1155BurnableSupplySplitterAdjustable_polygon(){

    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const ContractABI = await ethers.getContractFactory("ERC1155BurnableSupplySplitterAdjustable");

    if (false){
        const deployed_data = await ContractABI.deploy(
            'lumo',
            'LMO',
            'lumo.xyz/api/v1',
            deployer.address,
            [deployer.address],
            [100]
        );    
        console.log("ERC1155BurnableSupplySplitterAdjustable address:", deployed_data.address, 'deployed from admin address: ', deployer.address);  
    }

}


/******************************************************
    @erc721
******************************************************/

/**
 * 
 * @use: compile contract ABI 
 *       note this contract ABI has the URL built in
 *       so if you provision firebase db or IPFS
 *       it needs to be here
 *       this ABI can also be sent to the client side
 *       on question is whether you can run 
 *       python client side on firebase to swap out 
 *       the comment section of the contract
 * 
 *       1. get contractABI.btypecode
 *       2. save to firebase db
 *       3. fetch it on the client side and deploy from client user
 * 
 *  ContractABI methods
 *     - bytecode
 *     - interface
 *     - deploy
 * 
 *  To understand compiled contracts, see:
 *    - https://hardhat.org/guides/compile-contracts
 * 
 **/
async function compile721_rinkeby_v1(){


  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  /**
   * 
   * @use: compile contract ABI 
   *       note this contract ABI has the URL built in
   *       so if you provision firebase db or IPFS
   *       it needs to be here
   *       this ABI can also be sent to the client side
   *       on question is whether you can run 
   *       python client side on firebase to swap out 
   *       the comment section of the contract
   * 
   *       1. get contractABI.btypecode
   *       2. save to firebase db
   *       3. fetch it on the client side and deploy from client user
   * 
   *  ContractABI methods
   *     - bytecode
   *     - interface
   *     - deploy
   * 
   *  To understand compiled contracts, see:
   *    - https://hardhat.org/guides/compile-contracts
   * 
   **/
  const ContractABI_0x4 = await ethers.getContractFactory("ERC721_0x04_v1");
  const ContractABI_0x1 = await ethers.getContractFactory("ERC721_0x01_v1");
  console.log('compiled ', ContractABI_0x4.interface);
  
}

/**
 * 
 * @Use: deploy to localost with
 *  `npx hardhat run scripts/deploy.js --network localhost`
 * @Doc: initalize paymentsplitter like this:
 *  - https://medium.com/codex/how-to-use-openzeppelins-paymentsplitter-8ba8de09dbf
 * 
 * 
 **/
async function deploy_rinkeby_v1(){

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ContractABI = await ethers.getContractFactory("ERC721_0x04_v1");
  const deployed_data = await ContractABI.deploy(deployer.address,[deployer.address],[100]);
  console.log("ERC721_0x04_v1 address:", deployed_data.address, 'deployed from admin address: ', deployer.address);  

}



/******************************************************
    @paymentsplitter
******************************************************/

// @source: https://rinkeby.etherscan.io/token/0xc778417e063141139fce010982780140aa0cd5ab
// @source: https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
const rinkeby_weth_address = ''
const mainnet_weth_address = ''

/**
 * 
 * @Use: compile payments splitters
 * @Source: https://github.com/mirror-xyz/splits/blob/main/test/main.test.ts
 * @Note: for opensea split contract, reference:
 *  - https://github.com/HashLips/solidity_smart_contracts/blob/6cbe6fcca15a2d206f2585c4af8846e698fcc388/contracts/PAYMENTS/PAYMENTS.sol
 * 
 * 
 **/
async function deploy_payment_splitter_rinkeby(){


    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const ContractABI = await ethers.getContractFactory("Splitter");
    const deployed_data = await ContractABI.deploy();
    console.log("Splitter address:", deployed_data.address);

    const FactoryABI = await ethers.getContractFactory('SplitFactory');
    const deployed_factory_data = await FactoryABI.deploy(deployed_data.address, rinkeby_weth_address);
    console.log('SplitFactory address: ', deployed_factory_data.address)
}





/******************************************************
    @read
******************************************************/

/**
 * 
 * @use: read balance at address
 *      serve in conjunction with:
 *          - "https://us-central1-staging-lumo-core.cloudfunctions.net/app/api/v1/lost_souls/token";
 *          - "https://us-central1-staging-lumo-core.cloudfunctions.net/app/api/v1/lost_souls/contract";
 * 
 **/ 
async function read_total_supply({ address, source, then }){

    var res = default_fn_response({ amount: 0 })
    let web3 = alchemyWeb3Instance();

    try {

        const { public, private } = await admin_eth_keys();

        // build contract instance
        let contract = new web3.eth.Contract(source.abi,address);
        const amt = await contract.methods.totalSupply().call();
        console.log("\n\n\namtount of total supply: ", amt);

        res['success'] = true;
        res['message'] = `supply is ${amt}`
        res['data'] = amt;

        return then(res);

    } catch (e) {

        res['message'] = e;
        return then(res);
    }

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
  console.error(error);
    process.exit(1);
  });


 