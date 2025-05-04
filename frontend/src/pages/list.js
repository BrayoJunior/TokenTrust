import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import { ethers } from 'ethers';
import { listToken } from '../services/api';
import { getSigner, tokenContract } from '../services/blockchain';
import { UserContext } from '../context/kycContext';

export default function ListAsset() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [approvedAssets, setApprovedAssets] = useState([]);
  const [formData, setFormData] = useState({ tokenId: '', price: '', amount: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.isKYCVerified && user?.address) {
      router.push('/verify');
    } else if (user?.isKYCVerified) {
      fetchApprovedAssets();
    }
  }, [user, router]);

  async function fetchApprovedAssets() {
    try {
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      const requestCount = await tokenContract.requestCounter();
      const assets = [];
      for (let i = 0; i < requestCount; i++) {
        const asset = await tokenContract.pendingAssets(i);
        if (asset.approved && asset.submitter.toLowerCase() === userAddress.toLowerCase()) {
          const res = await fetch(asset.assetURI);
          const metadata = await res.json();
          assets.push({ requestId: i, metadata });
        }
      }
      setApprovedAssets(assets);
    } catch (error) {
      console.error('Failed to fetch approved assets:', error);
    }
  }

  async function handleListAsset() {
    setLoading(true);
    try {
      if (!formData.tokenId || !formData.price || !formData.amount) {
        throw new Error('All fields are required');
      }
      const response = await listToken({
        tokenId: formData.tokenId,
        price: ethers.parseEther(formData.price).toString(),
        amount: formData.amount,
        userAddress: user.address,
      });
      alert('Asset listed successfully! Tx: ' + response.txHash);
      setFormData({ tokenId: '', price: '', amount: '' });
    } catch (error) {
      alert('Listing failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">List Your Approved Assets</h1>
        {user?.isKYCVerified ? (
          <>
            {approvedAssets.length === 0 ? (
              <p>No approved assets available to list.</p>
            ) : (
              <div className="space-y-4 mb-8">
                {approvedAssets.map((asset) => (
                  <div key={asset.requestId} className="bg-white p-4 rounded shadow">
                    <img
                      src={asset.metadata.image}
                      alt={asset.metadata.name}
                      className="h-48 w-full object-cover mb-4"
                    />
                    <h2 className="text-lg font-semibold">{asset.metadata.name}</h2>
                    <p className="text-sm text-gray-600">{asset.metadata.description}</p>
                    <p>Token ID: {asset.requestId}</p>
                  </div>
                ))}
              </div>
            )}
            <h2 className="text-xl font-semibold mb-4">List New Asset</h2>
            <input
              type="number"
              placeholder="Token ID (from approved assets)"
              value={formData.tokenId}
              onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
              className="w-full p-2 border rounded mb-4"
              required
            />
            <input
              type="number"
              placeholder="Price in ETH"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full p-2 border rounded mb-4"
              step="0.01"
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border rounded mb-4"
              required
            />
            <button
              onClick={handleListAsset}
              disabled={loading}
              className={`w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Listing...' : 'List Asset'}
            </button>
          </>
        ) : (
          <p className="text-red-600">Please complete KYC verification.</p>
        )}
      </div>
    </div>
  );
}