
===========================================================
* Instructions
===========================================================

0. Firebase CLI commands:	
	* https://firebase.google.com/docs/cli
		firebase init
		firebase serve
		firebase projects : list
		firebase use --add
		firebase use production		
		firebase deploy		

1. To start this project, read alchemy + hardhat docs:
	- https://docs.alchemyapi.io/alchemy/tutorials/hello-world-smart-contract
	- https://hardhat.org/tutorial/creating-a-new-hardhat-project.html

	make sure your hardhat config is of form:

	```
		/**
		* @type import('hardhat/config').HardhatUserConfig
		*/
		require('dotenv').config();
		require("@nomiclabs/hardhat-ethers");
		require("@nomiclabs/hardhat-etherscan");
		const { ETHERSCAN_API_KEY, API_URL, PRIVATE_KEY } = process.env;
		module.exports = {
		   solidity: "0.7.3",
		   defaultNetwork: "ropsten",
		   networks: {
		      hardhat: {},
		      ropsten: {
		         url: API_URL,
		         accounts: [`0x${PRIVATE_KEY}`]
		      }
		   },
		  etherscan: {
		    // Your API key for Etherscan
		    // Obtain one at https://etherscan.io/
		    apiKey: ETHERSCAN_API_KEY
		  }   
		}	
	```

	and your .env file is of form:
		```
			API_URL = "https://eth-ropsten.alchemyapi.io/v2/[KEY]"
			MNEMONIC = "risk .."
			PUBLIC_KEY = "0x..""
			PRIVATE_KEY = "34..""
			ETHERSCAN_API_KEY = "..""

		```



2. Read doc for local deployment:
	@Doc: https://docs.openzeppelin.com/learn/deploying-and-interacting

	@run commands:
		-  run local chain:
			```npx hardhat node```
			
		- compile code: 
			```npx hardhat compile```

		- deploy to local chain:
			```npx hardhat run scripts/deploy.js --network localhost```

		- start console on the same local chain:
			```npx hardhat console --network localhost```


3. make test directory, must be named test
	- read: https://docs.openzeppelin.com/learn/writing-automated-tests
			```$ npm install --save-dev chai```
			```mkdir test```
			```npx hardhat test```

4. Deploy to testnet			
	@Doc: https://docs.openzeppelin.com/learn/connecting-to-public-test-networks

	@run commands:
		```
			npx hardhat console --network ropsten
			accounts = await ethers.provider.listAccounts()

		```

5. OpenZeppelin contracts:
	* test enviornment
		`npm install --save-dev @openzeppelin/test-environment`

	* updgradable contracts
		- https://docs.openzeppelin.com/contracts/3.x/upgradeable
		- https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable


===========================================================
* DOCS 
===========================================================

OpenZeppelin docs:
	- persmissions: https://docs.openzeppelin.com/contracts/3.x/access-control	
	- deploy: https://docs.openzeppelin.com/learn/deploying-and-interacting
	- building dapp + hotloading: 
		* https://docs.openzeppelin.com/learn/building-a-dapp
		* https://blog.openzeppelin.com/solidity-hot-reloading-using-zepkit/



Metamask link generator:
	- https://metamask.github.io/metamask-deeplinks/#


.sol references:
	- airdrop token: https://ethereum.stackexchange.com/questions/58146/erc20-transfer-reverts-when-called-from-one-smart-contract

gas free networks
	- https://docs.opengsn.org/#the-problem
	- https://docs.openzeppelin.com/learn/sending-gasless-transactions
	- 

EIP-1155 docs:
	- https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol
	- https://eips.ethereum.org/EIPS/eip-1155#metadata
	- https://github.com/0xsequence/erc-1155/blob/master/SPECIFICATIONS.md
	- https://eips.ethereum.org/EIPS/eip-1155
		

Hardhat Docs on editing contracts:
	- https://docs.openzeppelin.com/learn/upgrading-smart-contracts

connecting client side dapp with contract:
	- https://www.dappuniversity.com/articles/blockchain-programming#part1

access control: 
	 - https://docs.openzeppelin.com/contracts/3.x/api/access#AccessControl


======================================================================================


FLOW:


* Documentation

	FLOW CLI:
		- https://docs.onflow.org/flow-cli/
			```brew install flow-cli```
	
	language constructs:

		- accounts: 
			* https://docs.onflow.org/cadence/language/accounts/
			* https://docs.onflow.org/flow-go-sdk/creating-accounts/

		- resource: https://docs.onflow.org/cadence/language/resources/

		- transactions: https://docs.onflow.org/cadence/language/transactions/

		- nft: https://docs.onflow.org/cadence/tutorial/04-non-fungible-tokens/

		- optionals: https://docs.onflow.org/cadence/language/values-and-types/#optionals

	middleware
		- fcl: https://github.com/onflow/fcl-js

	exmaple contracts:
		- locked tokens: https://github.com/onflow/flow-core-contracts/blob/bfb115869bd9f815cde1fe64ab6d91ca95c0938e/contracts/LockedTokens.cdc#L527
		- erc20 lock tokens: https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#TokenTimelock

	misc
		- apply to be a partner in flow: 
			https://www.onflow.org/feat

		https://hustlefund.typeform.com/to/UGTnIt
		https://www.january.ventures/
		https://human.capital/fellowship-application
		https://launchaccelerator.co/			



1. rewrite ERC20 w/ lockin, and deploy onto ropsten
	- https://eips.ethereum.org/EIPS/eip-1132
	- https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/utils/TokenTimelock.sol
	- https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC20
2. exhaustively test ERC20, write middleware.
3. Deploy onto mainnet





































