import React, { useState, useEffect, useContext } from 'react';
import NavBar from '../components/NavBar.js';
import AssetCard from '../components/AssetCard.js';
import { marketplaceContract, getSigner } from '../services/blockchain.js';
import { ethers } from 'ethers';
import { UserContext } from '../context/kycContext';

export default function Home() {
  const { user } = useContext(UserContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchListings() {
    setLoading(true);
    try {
      const total = await marketplaceContract.tokenCounter();
      const assets = [];

      for (let tokenId = 0; tokenId < total; tokenId++) {
        try {
          const listing = await marketplaceContract.listings(tokenId);
          if (listing.isActive) {
            const tokenURI = await marketplaceContract.tokenContract.uri(tokenId);
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            assets.push({
              tokenId,
              price: ethers.formatEther(listing.price),
              seller: listing.seller,
              metadata,
            });
          }
        } catch (err) {
          console.error(`Error fetching listing for tokenId ${tokenId}:`, err);
        }
      }

      setListings(assets);
    } catch (err) {
      alert('Failed to fetch listings: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function buyAsset(tokenId, price) {
    try {
      const signer = await getSigner();
      const contractWithSigner = marketplaceContract.connect(signer);
      const tx = await contractWithSigner.buyToken(tokenId, {
        value: ethers.parseEther(price.toString()),
      });
      await tx.wait();
      alert('Asset bought successfully!');
      fetchListings();
    } catch (err) {
      throw new Error('Transaction failed: ' + err.message);
    }
  }

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Available Assets</h1>
        {user?.isKYCVerified ? (
          <>
            {loading ? (
              <p>Loading listings...</p>
            ) : listings.length === 0 ? (
              <p>No active listings.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {listings.map((asset) => (
                  <AssetCard key={asset.tokenId} asset={asset} onBuy={buyAsset} isKYCVerified={user.isKYCVerified} />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-red-600">Please complete KYC verification to buy assets.</p>
        )}
      </div>
    </div>
  );
}