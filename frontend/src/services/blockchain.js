import { ethers } from 'ethers';
import AssetTokenABI from '../artifacts/AssetToken.json';
import MarketplaceABI from '../artifacts/Marketplace.json';
import { ASSET_TOKEN_ADDRESS, MARKETPLACE_ADDRESS } from '../../config';

let tokenContract, marketplaceContract;

export async function initializeContracts() {
  try {
    if (!window.ethereum) throw new Error('MetaMask not installed');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    tokenContract = new ethers.Contract(ASSET_TOKEN_ADDRESS, AssetTokenABI.abi, signer);
    marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceABI.abi, signer);
    console.log('Contracts initialized:', { tokenContractAddress: ASSET_TOKEN_ADDRESS, marketplaceContractAddress: MARKETPLACE_ADDRESS });
    // Verify contract functions
    await tokenContract.isKYCVerified(ethers.ZeroAddress);
    await tokenContract.kycRequestCounter();
    console.log('Contract functions verified');
  } catch (error) {
    console.error('Failed to initialize contracts:', error);
    throw error;
  }
}

export async function getSigner() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
}

export async function isKYCVerified(address) {
  if (!tokenContract) {
    await initializeContracts();
  }
  try {
    const verified = await tokenContract.isKYCVerified(address);
    console.log(`KYC Status for ${address}:`, verified);
    return verified;
  } catch (error) {
    console.error('Failed to check KYC status:', error);
    return false;
  }
}

export { tokenContract, marketplaceContract };