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
        await nftMarket.getDeployedCode();
        nftMarketAddress = nftMarket.target;
        [contractOwner, buyerAddress] = await ethers.getSigners();
        listingPrice = await nftMarket.getListingPrice();
        listingPrice = listingPrice.toString();
    });

    const mintAndListNFT = async (tokenURI, auctionPrice) => {
        const transaction = await nftMarket.createToken(tokenURI, auctionPrice, { value: listingPrice });
        const receipt = await transaction.wait();
        // Accessing the first event with receipt.logs[0].args.tokenId meaning MarketItemCreated event is the first event in the events array.
        const tokenID = receipt.logs[0].args.tokenId;
        return tokenID;
    };

    describe("Mint and list a new NFT token", () => {
        const tokenURI = "https://www.mytoken.com";

        it("Should revert if price is zero", async () => {
            // expect comes from chai
            await expect(mintAndListNFT(tokenURI, 0)).to.be.revertedWith("Price must be greater than 0");
        });

        it("Should revert if listing price is not correct", async() => {
            await expect(nftMarket.createToken(tokenURI, auctionPrice, { value: 0 })).to.be.revertedWith("Price must be equal to listing price");
        });

        it("Should create an NFT with the correct owner and tokenURI", async() => {
            const tokenID = await mintAndListNFT(tokenURI, auctionPrice);
            //tokenURI is a public mapping inside ERC721URIStorage.sol
            const mintedTokenURI = await nftMarket.tokenURI(tokenID);
            //ownerOf is a public function inside ERC721.sol
            const ownerAddress = await nftMarket.ownerOf(tokenID);

            expect(ownerAddress).to.equal(nftMarketAddress);
            expect(mintedTokenURI).to.equal(tokenURI);
        });

        it("Should emit MarketItemCreated event after successful minting and listing", async() => {
            const transaction = await nftMarket.createToken(tokenURI, auctionPrice, { value: listingPrice });
            const receipt = await transaction.wait();
            const tokenID = receipt.logs[0].args.tokenId;
            await expect(transaction).to.emit(nftMarket, "MarketItemCreated").withArgs(tokenID, contractOwner.address, nftMarketAddress, auctionPrice, false);
            // emit MarketItemCreated(
            //     tokenId,
            //     msg.sender, //seller
            //     address(this), //owner
            //     price,
            //     false
            // );
        });
    });

    describe("Execute sale of a listed NFT token", () => {
        const tokenURI = "https://www.mytoken.com";

        it("Should revert if buyer sends less or more than auction price", async() => {
            const newNftTokenId = await mintAndListNFT(tokenURI, auctionPrice);
            await expect(nftMarket.connect(buyerAddress).createMarketSale(newNftTokenId, { value: 20})).to.be.revertedWith("Please submit the asking price of NFT in order to complete the purchase");
        });

        it("Buy a new token and check token address", async() => {
            const newNftTokenId = await mintAndListNFT(tokenURI, auctionPrice);

            const oldOwnerAddress = await nftMarket.ownerOf(newNftTokenId);
            //Here, oldOwnerAddress is the address of the contract itself (marketplace address)
            expect(oldOwnerAddress).to.equal(nftMarketAddress);

            await nftMarket.connect(buyerAddress).createMarketSale(newNftTokenId, { value: auctionPrice });
            const newOwnerAddress = await nftMarket.ownerOf(newNftTokenId);
            expect(newOwnerAddress).to.equal(buyerAddress.address);
        });
    })
})