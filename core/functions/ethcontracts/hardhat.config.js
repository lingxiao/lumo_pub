
require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');

// note we are using admin-ether-acct
// as the private key
const { 
   PRIVATE_KEY, 
   RINKEBY_API_URL,
   ROPSTEN_API_URL,
   ETHERSCAN_API_KEY 
} = process.env;



/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.13",
   defaultNetwork: "hardhat",  // run test as default network
   networks: {
      hardhat: {},
      rinkeby: {
         url: RINKEBY_API_URL,
         accounts: [`0x${PRIVATE_KEY}`]
      },
      mumbai: {
         url: "",
         accounts: [`0x${PRIVATE_KEY}`]
      },
      ropsten: {
         url: ROPSTEN_API_URL,
         accounts: [`0x${PRIVATE_KEY}`]
      },
      mainnet: {
         url: "",
         accounts: [`0x${PRIVATE_KEY}`]
      },
      polygonmain: {
         url: "",
         accounts: [`0x${PRIVATE_KEY}`]
      },       
   },
  etherscan: {
     // Your API key for Etherscan
     // Obtain one at https://etherscan.io/
     apiKey: ETHERSCAN_API_KEY
  }      
};
