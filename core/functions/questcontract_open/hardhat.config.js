
require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.13",
   defaultNetwork: "hardhat",  // run test as default network
   networks: {
      hardhat: {},
    },
};
