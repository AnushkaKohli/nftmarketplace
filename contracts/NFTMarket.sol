// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTMarketplace is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // total number of items minted (created)
    Counters.Counter private _tokenSold; // total number of items sold

    uint listingPrice = 0.001 ether; // price to list the nft
    address payable owner; // owner of the contract

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    mapping(uint256 => MarketItem) private idToMarketItem; // mapping from token id to market item

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    event MarketItemCreated(
        uint indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    // Returns the listing price of the market
    function getListingPrice() public view returns (uint) {
        return listingPrice;
    }

    // Update the listing price of the market
    function updateListingPrice(uint _listingPrice) public payable {
        require(
            msg.sender == owner,
            "Only marketplace owneer can update the listing price"
        );
        listingPrice = _listingPrice;
    }

    function createMarketItem(uint tokenId, uint price) private {
        require(price > 0, "Price must be greater than 0");
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );

        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender), // seller
            payable(address(this)), // owner
            price,
            false
        );

        // _transfer function comes from openzeppelin library (ERC721 contract)
        _transfer(msg.sender, address(this), tokenId); // transfer the token from msg.sender to the marketplace (this smart contract)
        emit MarketItemCreated(
            tokenId,
            msg.sender,
            address(this),
            price,
            false
        );
    }

    // Mint a token and list it in the marketplace
    // tokenURI: metadata of the token (image URI)
    function createToken(
        string memory tokenURI,
        uint price
    ) public payable returns (uint) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // mint the token tokenId to msg.sender - _mint function comes from openzeppelin library (ERC721 contract)
        // first the token is minted to the msg.sender and then it is transferred to the marketplace (this smart contract). That is how the token is listed in the marketplace
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        // list the token in the marketplace
        createMarketItem(tokenId, price);
        return newTokenId;
    }

    // Creating the sale of a token. Transferring ownership of the token as well as funds between parties
    function createMarketSale(uint tokenId) public {
        uint price = idToMarketItem[tokenId].price;
        address seller = idToMarketItem[tokenId].seller;
        require(
            msg.value == price,
            "Please submit the asking price of NFT in order to complete the purchase"
        );

        // update the owner of the token in the marketplace
        idToMarketItem[tokenId].owner = payable(msg.sender);
        // update the sold status of the token
        idToMarketItem[tokenId].sold = true;
        // update the seller of the token to address(0) - address(0) is the burn address ie noone is the seller as the token is sold
        idToMarketItem[tokenId].seller = payable(address(0));
        // increment the number of tokens sold
        _tokenSold.increment();
        // transfer the token from the contract address to the buyer (msg.sender)
        _transfer(address(this), msg.sender, tokenId);
        // transfer the listingPrice to the owner
        payable(owner).transfer(listingPrice);
        payable(seller).transfer(msg.value);
    }

    // Returns all the unsold market items - items listed on homepage as they are still available for sale
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _tokenIds.current();
        uint unsoldItemCount = _tokenIds.current() - _tokenSold.current();
        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint i = 0; i < itemCount; i++) {
            // if the item has not been sold, the owner of the item is the marketplace contract address
            if (idToMarketItem[i + 1].owner == address(this)) {
                // uint currentId = i + 1;
                uint currentId = idToMarketItem[i + 1].tokenId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }

    // Returns only the items that a user has purchased
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        for (uint i = 0; i < totalItemCount; i++) {
            // fetch the total number of items that a user has purchased
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                // uint currentId = i + 1;
                uint currentId = idToMarketItem[i + 1].tokenId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // Returns only the items that a user has listed
    function fetchItemsListed() public view returns (MarketItem[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        for (uint i = 0; i < totalItemCount; i++) {
            // fetch the total number of items that a user is selling
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                // uint currentId = i + 1;
                uint currentId = idToMarketItem[i + 1].tokenId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // Allows users to resell a purchased token
    function resellToken(uint tokenId, uint price) public payable {
        require(
            idToMarketItem[tokenId].owner == msg.sender,
            "You are not the owner of this token, so you cannot resell it"
        );
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );
        idToMarketItem[tokenId].sold = false;
        idToMarketItem[tokenId].price = price;
        idToMarketItem[tokenId].seller = payable(msg.sender);
        idToMarketItem[tokenId].owner = payable(address(this));
        _itemSold.decrement();
        _transfer(msg.sender, address(this), tokenId);
    }

    // Allows users to cancel a sale
    function cancelItemListing(uint tokenId) public {
        require(
            idToMarketItem[tokenId].seller == msg.sender,
            "You are not the seller of this token, so you cannot cancel the sale"
        );
        require(
            idToMarketItem[tokenId].sold == false,
            "Only cancel unsold items"
        );
        idToMarketItem[tokenId].owner = payable(msg.sender);
        // No one will be the seller - address(0) is the burn address
        idToMarketItem[tokenId].seller = payable(address(0));
        // the item is sold to the user who is the owner of the token as he has already paid the listing price
        idToMarketItem[tokenId].sold = true;
        _itemSold.increment();
        // the listing price is refunded to the seller
        payable(msg.sender).transfer(listingPrice);
        _transfer(address(this), msg.sender, tokenId);
    }
}
