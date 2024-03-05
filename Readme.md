# Steps for creating the project

Step 1:
`npm init -y`

Step2:
`npm install --save-dev hardhat`

Step 3:
`npx hardhat init`

Step 4:
Go to `hardhat.config.js` file and add the following to add the network:

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
Modify `NFTMarket.sol`

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

## Steps for creating frontend in next.js

1. Create a nextjs project : `npx create-next-app@latest client`
2. Copy the ABI from `artifacts/contracts/NFTMarket.sol/NFTMarketplace.json` to `client/abi/NFTMarketplace.json`.
3. Create `config.js` inside the client folder. Edit it by creating a new `.env` file inside `client` folder and by installing the `dotenv` dependency inside `client`.
4. Setup tailwindcss (optional)
5. Install few more dependencies :

    ```sh
    cd .\client\
    npm i web3modal axios ethers
    ```

    web3modal - allows to connect your app to many walllet providers such as metamask, coinbase and wallet connect.

    axios - makes it easy to run asynchronous http request. Used to fetch data to the pinnata api

6. Run the application using `npm run dev`

## Note in frontend:-

1. We know there are two types of functions in solidity, one that doesn't change the state(or read-only functions) and others that do change the state of the contract.

    ```js
    // This doesn't change the state - Read only functions
    function getBikes() public view returns (Bike[] memory){
        return bikes;
    }

    // This do change the state
    function changeAvailability() public {
        bikes[1].isAvailable=false;
    }
    ```

    >For the read-only functions, we need to use the provider.

    ```js
    const contract = new ethers.Contract(contractAddress, ABI, provider);
    ````
    >
    >For state-changing transactions or functions we need to use the signer.

    ```js
    const signer = await provider.getSigner()
    const contract = new ethers.Contract(contractAddress, ABI, signer)
    ```
