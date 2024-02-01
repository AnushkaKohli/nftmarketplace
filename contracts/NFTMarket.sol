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
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        // _transfer function comes from openzeppelin library (ERC721 contract)
        _transfer(msg.sender, address(this), tokenId); // transfer the token to the marketplace
        emit MarketItemCreated(
            tokenId,
            msg.sender,
            address(this),
            price,
            false
        );
    }
}
