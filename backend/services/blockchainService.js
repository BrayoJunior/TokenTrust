const { ethers } = require('ethers');
const config = require('../config');
const assetTokenABI = require('../abi/AssetToken.json');
const marketplaceABI = require('../abi/Marketplace.json');
const logger = require('../utils/logger');

// Debug ABI content
console.log('AssetToken ABI:', JSON.stringify(assetTokenABI, null, 2));
console.log('Marketplace ABI:', JSON.stringify(marketplaceABI, null, 2));

const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
const wallet = new ethers.Wallet(config.blockchain.privateKey, provider);

// Validate ABIs
if (!assetTokenABI.abi || !Array.isArray(assetTokenABI.abi)) {
  throw new Error('Invalid AssetToken ABI: abi property is missing or not an array');
}
if (!marketplaceABI.abi || !Array.isArray(marketplaceABI.abi)) {
  throw new Error('Invalid Marketplace ABI: abi property is missing or not an array');
}

const assetTokenContract = new ethers.Contract(
  config.blockchain.assetTokenAddress,
  assetTokenABI.abi,
  wallet
);
const marketplaceContract = new ethers.Contract(
  config.blockchain.marketplaceAddress,
  marketplaceABI.abi,
  wallet
);

async function verifyKYC(requestId) {
  try {
    const tx = await assetTokenContract.verifyKYC(requestId, 'PinataProvider');
    const receipt = await tx.wait();
    logger.info(`KYC verified for request ${requestId}: ${tx.hash}`);
    return receipt.transactionHash;
  } catch (error) {
    logger.error(`KYC verification failed: ${error.message}`);
    throw new Error(`Blockchain error: ${error.reason || error.message}`);
  }
}

async function submitAsset(assetURI, documentURI, ownerName, ownerIdNumber, amount, userAddress) {
  try {
    const signer = provider.getSigner(userAddress);
    const contractWithSigner = assetTokenContract.connect(signer);
    const tx = await contractWithSigner.submitAsset(assetURI, documentURI, ownerName, ownerIdNumber, amount);
    const receipt = await tx.wait();
    logger.info(`Asset submitted: ${tx.hash}`);
    return receipt.transactionHash;
  } catch (error) {
    logger.error(`Submit asset failed: ${error.message}`);
    throw new Error(`Blockchain error: ${error.reason || error.message}`);
  }
}

async function listToken(tokenId, price, amount, userAddress) {
  try {
    const signer = provider.getSigner(userAddress);
    const contractWithSigner = marketplaceContract.connect(signer);
    const tx = await contractWithSigner.listToken(tokenId, ethers.parseEther(price.toString()), amount);
    const receipt = await tx.wait();
    logger.info(`Token listed: ${tx.hash}`);
    return receipt.transactionHash;
  } catch (error) {
    logger.error(`List token failed: ${error.message}`);
    throw new Error(`Blockchain error: ${error.reason || error.message}`);
  }
}

module.exports = { verifyKYC, submitAsset, listToken };