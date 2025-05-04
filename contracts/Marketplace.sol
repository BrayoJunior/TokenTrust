// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AssetToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title TokenTrust Marketplace - For trading tokenized assets
contract Marketplace is Ownable, ReentrancyGuard, Pausable {
    AssetToken public tokenContract;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        uint256 amount;
        bool isActive;
    }

    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 highestBid;
        address highestBidder;
        uint256 amount;
        uint256 endTime;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;

    event TokenListed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 amount);
    event TokenPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price, uint256 amount);
    event ListingCancelled(uint256 indexed tokenId);
    event AuctionStarted(uint256 indexed tokenId, uint256 startPrice, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner);

    constructor(address _tokenContract) Ownable(msg.sender) {
        tokenContract = AssetToken(_tokenContract);
    }

    // --- Listing Functions ---

    function listToken(uint256 tokenId, uint256 price, uint256 amount) external whenNotPaused nonReentrant {
        require(tokenContract.balanceOf(msg.sender, tokenId) >= amount, "Insufficient tokens");
        require(price > 0 && amount > 0, "Price and amount must be > 0");

        listings[tokenId] = Listing(tokenId, msg.sender, price, amount, true);
        tokenContract.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        emit TokenListed(tokenId, msg.sender, price, amount);
    }

    function cancelListing(uint256 tokenId) external whenNotPaused nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        require(listing.seller == msg.sender, "Only seller can cancel");

        listings[tokenId].isActive = false;
        tokenContract.safeTransferFrom(address(this), msg.sender, tokenId, listing.amount, "");

        emit ListingCancelled(tokenId);
    }

    function buyToken(uint256 tokenId) external payable whenNotPaused nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "Token not listed");
        require(msg.value >= listing.price * listing.amount, "Insufficient payment");

        listings[tokenId].isActive = false;
        tokenContract.safeTransferFrom(address(this), msg.sender, tokenId, listing.amount, "");
        payable(listing.seller).transfer(listing.price * listing.amount);

        if (msg.value > listing.price * listing.amount) {
            payable(msg.sender).transfer(msg.value - listing.price * listing.amount); // Refund excess
        }

        emit TokenPurchased(tokenId, msg.sender, listing.price, listing.amount);
    }

    // --- Auction Functions ---

    function startAuction(uint256 tokenId, uint256 startPrice, uint256 amount, uint256 duration) external whenNotPaused nonReentrant {
        require(tokenContract.balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(startPrice > 0 && amount > 0 && duration >= 1 hours, "Invalid params");

        auctions[tokenId] = Auction(
            tokenId,
            msg.sender,
            startPrice,
            address(0),
            amount,
            block.timestamp + duration,
            true
        );

        tokenContract.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        emit AuctionStarted(tokenId, startPrice, block.timestamp + duration);
    }

    function bid(uint256 tokenId) external payable whenNotPaused nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction expired");
        require(msg.value > auction.highestBid, "Bid too low");

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid); // Refund previous
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function endAuction(uint256 tokenId) external whenNotPaused nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended yet");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            tokenContract.safeTransferFrom(address(this), auction.highestBidder, tokenId, auction.amount, "");
            payable(auction.seller).transfer(auction.highestBid);
            emit AuctionEnded(tokenId, auction.highestBidder);
        } else {
            tokenContract.safeTransferFrom(address(this), auction.seller, tokenId, auction.amount, "");
            emit AuctionEnded(tokenId, address(0));
        }
    }

    // --- Pause Controls ---

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
