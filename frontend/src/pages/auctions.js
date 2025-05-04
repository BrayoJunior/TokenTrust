import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar.js';
import { marketplaceContract, getSigner } from '../services/blockchain.js';
import { ethers } from 'ethers';
import { UserContext } from '../context/kycContext';

export default function Auctions() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [auctions, setAuctions] = useState([]);
  const [tokenId, setTokenId] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.isKYCVerified && user?.address) {
      router.push('/verify');
    } else if (user?.isKYCVerified) {
      fetchAuctions();
    }
  }, [user, router]);

  async function fetchAuctions() {
    setLoading(true);
    try {
      const total = await marketplaceContract.tokenCounter();
      const activeAuctions = [];

      for (let tokenId = 0; tokenId < total; tokenId++) {
        try {
          const auction = await marketplaceContract.auctions(tokenId);
          if (auction.active) {
            const tokenURI = await marketplaceContract.tokenContract.uri(tokenId);
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            activeAuctions.push({
              tokenId,
              startPrice: ethers.formatEther(auction.highestBid || auction.startPrice),
              amount: auction.amount.toNumber(),
              endTime: new Date(auction.endTime * 1000).toLocaleString(),
              highestBidder: auction.highestBidder,
              metadata,
            });
          }
        } catch (err) {
          console.error(`Error fetching auction for tokenId ${tokenId}:`, err);
        }
      }

      setAuctions(activeAuctions);
    } catch (err) {
      alert('Failed to fetch auctions: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startAuction() {
    setLoading(true);
    try {
      if (!Number.isInteger(Number(tokenId)) || Number(tokenId) < 0) {
        throw new Error('Invalid token ID');
      }
      if (isNaN(startPrice) || Number(startPrice) <= 0) {
        throw new Error('Invalid start price');
      }
      if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) {
        throw new Error('Invalid amount');
      }
      if (!Number.isInteger(Number(duration)) || Number(duration) < 3600) {
        throw new Error('Duration must be at least 1 hour');
      }
      const signer = await getSigner();
      const contractWithSigner = marketplaceContract.connect(signer);
      const tx = await contractWithSigner.startAuction(
        tokenId,
        ethers.parseEther(startPrice),
        amount,
        duration
      );
      await tx.wait();
      alert('Auction started successfully!');
      fetchAuctions();
      setTokenId('');
      setStartPrice('');
      setAmount('');
      setDuration('');
    } catch (err) {
      alert('Failed to start auction: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function placeBid(tokenId) {
    setLoading(true);
    try {
      if (isNaN(bidAmount) || Number(bidAmount) <= 0) {
        throw new Error('Invalid bid amount');
      }
      const signer = await getSigner();
      const contractWithSigner = marketplaceContract.connect(signer);
      const tx = await contractWithSigner.bid(tokenId, {
        value: ethers.parseEther(bidAmount),
      });
      await tx.wait();
      alert('Bid placed successfully!');
      fetchAuctions();
      setBidAmount('');
    } catch (err) {
      alert('Failed to place bid: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function endAuction(tokenId) {
    setLoading(true);
    try {
      const signer = await getSigner();
      const contractWithSigner = marketplaceContract.connect(signer);
      const tx = await contractWithSigner.endAuction(tokenId);
      await tx.wait();
      alert('Auction ended successfully!');
      fetchAuctions();
    } catch (err) {
      alert('Failed to end auction: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Auctions</h1>
        {user?.isKYCVerified ? (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Start New Auction</h2>
              <input
                type="number"
                placeholder="Token ID"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              />
              <input
                type="number"
                placeholder="Start Price (ETH)"
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                step="0.01"
              />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              />
              <input
                type="number"
                placeholder="Duration (seconds)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              />
              <button
                onClick={startAuction}
                disabled={loading}
                className={`w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Starting...' : 'Start Auction'}
              </button>
            </div>
            <h2 className="text-xl font-semibold mb-4">Active Auctions</h2>
            {loading ? (
              <p>Loading auctions...</p>
            ) : auctions.length === 0 ? (
              <p>No active auctions.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {auctions.map((auction) => (
                  <div key={auction.tokenId} className="bg-white p-4 rounded shadow">
                    <img
                      src={auction.metadata.image}
                      alt={auction.metadata.name}
                      className="h-48 w-full object-cover mb-4"
                    />
                    <h2 className="text-lg font-semibold">{auction.metadata.name}</h2>
                    <p className="text-sm text-gray-600">{auction.metadata.description}</p>
                    <p className="text-green-600 font-bold">Current Bid: {auction.startPrice} ETH</p>
                    <p className="text-sm">Amount: {auction.amount}</p>
                    <p className="text-sm">Ends: {auction.endTime}</p>
                    <p className="text-sm">Highest Bidder: {auction.highestBidder || 'None'}</p>
                    <input
                      type="number"
                      placeholder="Bid Amount (ETH)"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full p-2 border rounded mt-2 mb-2"
                      step="0.01"
                    />
                    <button
                      onClick={() => placeBid(auction.tokenId)}
                      disabled={loading}
                      className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Bidding...' : 'Place Bid'}
                    </button>
                    <button
                      onClick={() => endAuction(auction.tokenId)}
                      disabled={loading}
                      className={`w-full mt-2 bg-red-600 text-white py-2 rounded hover:bg-red-700 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Ending...' : 'End Auction'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-red-600">Please complete KYC verification.</p>
        )}
      </div>
    </div>
  );
}