# Steps for creating the project

Step 1:
`npm init -y`

Step2:
`npm install --save-dev hardhat`

Step 3:
`npx hardhat init`

Step 4:
Go to *hardhat.config.js* file and add the following to add the network:

```js
module.exports = {
    solidity: "0.8.19",
    networks: {
        sepolia: {
        url: process.env.INFURA_URL,
        accounts: [process.env.WALLET_PRIVATE_KEY],
        }
    }
};
```

Step 5:

a) Add dotenv package to store sensitive information -

`npm i dotenv`

b) Add openzeppelin library which is a library of modular, reusable, secure smart contracts for the ethereum network written in solidity. It allows to leverage standard, tested and community reviewed contracts -

`npm i openzeppelin/contracts`

Step 6:
Modify *NFTMarket.sol*

Step 7:
Create the test file.

Run test using `npx hardhat test`

Step 8:
Add the deployment script.

Run the deployment script using `npx hardhat run scripts/deploy.js --network sepolia`

## Note

1. Use `const auctionPrice = ethers.parseUnits('100', 'ether');`

    instead of `const auctionPrice = ethers.utils.parseUnits('100', 'ether');`
2. Use `await nftMarket.getDeployedCode();`

    instead of `await nftMarket.deployed();`
3. Use `nftMarketAddress = nftMarket.target;`

    instead of `nftMarketAddress = nftMarket.address;`
4. Use `const tokenID = receipt.logs[0].args.tokenId;`

    instead of `const tokenID = receipt.events[0].args.tokenId;`
5. Hardhat uses Mocha testing framework for uint testing.
