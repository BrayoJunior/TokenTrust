import React, { useState } from 'react';

export default function AssetCard({ asset, onBuy, isKYCVerified }) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      await onBuy(asset.tokenId, asset.price);
    } catch (error) {
      alert('Failed to buy asset: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border p-4 rounded shadow-md bg-white flex flex-col">
      <img src={asset.metadata.image} alt={asset.metadata.name} className="h-48 object-cover rounded" />
      <div className="mt-4 flex-1">
        <h3 className="text-lg font-bold">{asset.metadata.name}</h3>
        <p className="text-sm text-gray-500">{asset.metadata.description}</p>
        <p className="mt-2 text-green-600 font-semibold">{asset.price} ETH</p>
        <p className="text-sm text-gray-600">Seller: {asset.seller}</p>
      </div>
      <button
        onClick={handleBuy}
        disabled={loading || !isKYCVerified}
        className={`mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
          loading || !isKYCVerified ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={!isKYCVerified ? 'Complete KYC verification to buy assets' : ''}
      >
        {loading ? 'Processing...' : 'Buy Asset'}
      </button>
    </div>
  );
}