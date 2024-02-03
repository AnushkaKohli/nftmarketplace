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
    const tokenURI = "https://www.mytoken.com";

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
    });

    describe("Resale of a listed NFT token", () => {
        it("Should revert if seller is not the owner of the token or if the listing price is not correct", async() => {
            // The owner is the contract itself currently
            const newNftTokenId = await mintAndListNFT
            (tokenURI, auctionPrice);
            // The owner now is buyerAddress as the buyer has bought the token by paying the auction price
            await nftMarket.connect(buyerAddress).createMarketSale(newNftTokenId, { value: auctionPrice });
            // As no buyerAddress is not connected, ownerAddress is calling the resell function but he is not the owner so he cannot resell the token
            await expect(nftMarket.resellToken(newNftTokenId, auctionPrice, { value: listingPrice })).to.be.revertedWith("You are not the owner of this token, so you cannot resell it");
            // 0 listing price is being sent so it should revert
            await expect(nftMarket.connect(buyerAddress).resellToken(newNftTokenId, auctionPrice, { value: 0 })).to.be.revertedWith("Price must be equal to listing price");
        });

        it("Buy a new token and resell it", async () => {
            const newNftTokenId = await mintAndListNFT(tokenURI, auctionPrice);

            // buyerAddress is buying the token by paying the auction price
            await nftMarket.connect(buyerAddress).createMarketSale(newNftTokenId, { value: auctionPrice });
            const oldOwnerAddress = await nftMarket.ownerOf(newNftTokenId);
            // buyerAddress is the new owner of the token
            expect(oldOwnerAddress).to.equal(buyerAddress.address);

            // buyerAddress is reselling the token by paying the listing price
            await nftMarket.connect(buyerAddress).resellToken(newNftTokenId, auctionPrice, { value: listingPrice });
            const newOwnerAddress = await nftMarket.ownerOf(newNftTokenId);
            // now the marketplace address is the owner of the token
            expect(newOwnerAddress).to.equal(nftMarketAddress);
        });
    });

    describe("Fetch marketplace items", () => {
        it("Should return all the items listed in the marketplace", async () => {
            const newNftTokenId = await mintAndListNFT(tokenURI, auctionPrice);
            const items = await nftMarket.fetchMarketItems();
            expect(items.length).to.equal(1);
            const item = items[0];
            expect(item.tokenId).to.equal(newNftTokenId);
            expect(item.price).to.equal(auctionPrice.toString());
            expect(item.seller).to.equal(contractOwner.address);
            expect(item.owner).to.equal(nftMarketAddress);
            expect(item.sold).to.equal(false);
        });

        it("Should fetch the correct number of unsold items", async() => {
            await mintAndListNFT(tokenURI, auctionPrice);
            await mintAndListNFT(tokenURI, auctionPrice);
            await mintAndListNFT(tokenURI, auctionPrice);

            let unsoldItems = await nftMarket.fetchMarketItems();
            expect(unsoldItems.length).to.equal(3);
        });

        it("Should fetch correct number of items that a user has purchased", async() => {
            // 3 tokens are minted and listed in the marketplace
            let nftTokenId = await mintAndListNFT(tokenURI, auctionPrice);
            await mintAndListNFT(tokenURI, auctionPrice);
            await mintAndListNFT(tokenURI, auctionPrice);

            // buyerAddress is buying the first token
            await nftMarket.connect(buyerAddress).createMarketSale(nftTokenId, { value: auctionPrice });

            // buyerAddress is fetching the items he has purchased
            let purchasedItems = await nftMarket.connect(buyerAddress).fetchMyNFTs();
            expect(purchasedItems.length).to.equal(1);
        });

        it("Should fetch the correct number of items listed by a user", async() => {
            // 3 items are minted and listed in the marketplace - 2 by the contractOwner and 1 by the buyerAddress
            await mintAndListNFT(tokenURI, auctionPrice);
            await mintAndListNFT(tokenURI, auctionPrice);
            await nftMarket.connect(buyerAddress).createToken(tokenURI, auctionPrice, { value: listingPrice });

            let buyerListings = await nftMarket.connect(buyerAddress).fetchItemsListed();
            expect(buyerListings.length).to.equal(1);

            let ownerListings = await nftMarket.fetchItemsListed();
            expect(ownerListings.length).to.equal(2);
        })
    });
});