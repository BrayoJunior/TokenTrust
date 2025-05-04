// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title TokenTrust - Asset Tokenization Smart Contract
/// @notice Tokenizes real-world assets as ERC-1155 tokens, supports KYC and approval workflows
contract AssetToken is ERC1155, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private tokenCounter;
    Counters.Counter private requestCounter;
    Counters.Counter private kycRequestCounter;

    struct KYCData {
        string name;
        string idNumber;
        string ipfsURI; // Encrypted KYC data (name, ID number, ID image)
        bool verified;
        uint256 verifiedAt;
        string provider;
    }

    struct AssetRequest {
        string assetURI; // Metadata: name, description, asset image
        string documentURI; // Ownership proof (e.g., title deed)
        string ownerName; // Name on ownership document
        string ownerIdNumber; // ID number on ownership document
        uint256 amount;
        bool approved;
        address submitter;
    }

    mapping(address => KYCData) public kycData;
    mapping(uint256 => address) public kycRequests;
    mapping(uint256 => AssetRequest) public pendingAssets;
    mapping(uint256 => uint256) public tokenSupplies;
    mapping(uint256 => string) private _tokenURIs;

    event KYCSubmitted(address indexed user, uint256 requestId, string ipfsURI);
    event KYCVerified(address indexed user, uint256 requestId, string provider, uint256 verifiedAt);
    event AssetSubmitted(uint256 indexed requestId, address indexed submitter, string assetURI, string documentURI, uint256 amount);
    event AssetApproved(uint256 indexed tokenId, address indexed owner, string assetURI, uint256 amount);
    event DividendsDistributed(uint256 indexed tokenId, uint256 amount, uint256 perToken);

    constructor() ERC1155("") Ownable(msg.sender) {
        tokenCounter.increment(); // Token IDs start at 1
    }

    // --- KYC Section ---

    function submitKYC(string memory name, string memory idNumber, string memory ipfsURI) external whenNotPaused {
        require(bytes(kycData[msg.sender].ipfsURI).length == 0, "KYC already submitted");
        kycData[msg.sender] = KYCData(name, idNumber, ipfsURI, false, 0, "");
        kycRequests[kycRequestCounter.current()] = msg.sender;
        emit KYCSubmitted(msg.sender, kycRequestCounter.current(), ipfsURI);
        kycRequestCounter.increment();
    }

    function verifyKYC(uint256 requestId, string memory provider) external onlyOwner whenNotPaused {
        address user = kycRequests[requestId];
        require(bytes(kycData[user].ipfsURI).length != 0, "KYC not submitted");
        require(!kycData[user].verified, "KYC already verified");
        kycData[user].verified = true;
        kycData[user].verifiedAt = block.timestamp;
        kycData[user].provider = provider;
        emit KYCVerified(user, requestId, provider, block.timestamp);
    }

    // --- Asset Tokenization Section ---

    function submitAsset(
        string memory assetURI,
        string memory documentURI,
        string memory ownerName,
        string memory ownerIdNumber,
        uint256 amount
    ) external whenNotPaused {
        require(kycData[msg.sender].verified, "Not KYC verified");
        require(amount > 0, "Amount must be > 0");

        pendingAssets[requestCounter.current()] = AssetRequest(
            assetURI,
            documentURI,
            ownerName,
            ownerIdNumber,
            amount,
            false,
            msg.sender
        );
        emit AssetSubmitted(requestCounter.current(), msg.sender, assetURI, documentURI, amount);
        requestCounter.increment();
    }

    function approveAsset(uint256 requestId, address recipient) external onlyOwner whenNotPaused nonReentrant returns (uint256) {
        AssetRequest storage request = pendingAssets[requestId];
        require(!request.approved, "Already approved");
        require(kycData[recipient].verified, "Recipient not KYC verified");

        request.approved = true;
        uint256 tokenId = tokenCounter.current();
        _mint(recipient, tokenId, request.amount, "");
        tokenSupplies[tokenId] = request.amount;
        _setTokenURI(tokenId, request.assetURI);
        tokenCounter.increment();

        emit AssetApproved(tokenId, recipient, request.assetURI, request.amount);
        return tokenId;
    }

    // --- Dividend Distribution Section ---

    function distributeDividends(uint256 tokenId) external payable onlyOwner whenNotPaused nonReentrant {
        require(msg.value > 0, "No dividend sent");
        require(tokenSupplies[tokenId] > 0, "Invalid token");

        uint256 perToken = msg.value / tokenSupplies[tokenId];
        address tokenOwner = idToOwner(tokenId);
        require(tokenOwner != address(0), "No valid owner");

        payable(tokenOwner).transfer(msg.value);

        emit DividendsDistributed(tokenId, msg.value, perToken);
    }

    // --- URI Overrides ---

    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function _setTokenURI(uint256 tokenId, string memory newuri) internal {
        _tokenURIs[tokenId] = newuri;
    }

    // --- Transfer Control (KYC enforced) ---

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override whenNotPaused {
        require(kycData[to].verified, "Recipient must be KYC verified");
        super.safeTransferFrom(from, to, id, amount, data);
    }

    // --- Pause Controls ---

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- Internal Helper ---

    function idToOwner(uint256 tokenId) internal view returns (address) {
        if (balanceOf(msg.sender, tokenId) > 0) {
            return msg.sender;
        }
        return address(0);
    }

    // --- View Functions ---

    function isKYCVerified(address user) external view returns (bool) {
        return kycData[user].verified;
    }
}