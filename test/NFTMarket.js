const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace", function() {
    let NFTMarket;
    let nftMarket;
    let listingPrice;
    let contractOwner;
    let buyerAddress;
    let nftMarketAddress;

    const auctionPrice = ethers.parseUnits('100', 'ether');

    beforeEach(async () => {
        NFTMarket = await ethers.getContractFactory("NFTMarketplace");
        nftMarket = await NFTMarket.deploy();
        await nftMarket.deployed();
        nftMarketAddress = nftMarket.address;
        [contractOwner, buyerAddress] = await ethers.getSigners();
        listingPrice = await nftMarket.getListingPrice();
        listingPrice = listingPrice.toString();
    });

    const mintAndListNFT = async (tokenURI, auctionPrice) => {
        const transaction = await nftMarket.createToken(tokenURI, auctionPrice, { value: listingPrice });
        const receipt = await transaction.wait();
        console.log(receipt);
        const tokenID = receipt.events[0].args.tokenID;
        return tokenID;
    };
})