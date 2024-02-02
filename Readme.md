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