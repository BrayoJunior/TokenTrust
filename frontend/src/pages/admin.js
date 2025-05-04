import React, { useState, useEffect, useContext } from 'react';
import NavBar from '../components/NavBar';
import { tokenContract, getSigner } from '../services/blockchain';
import { decrypt } from '../services/encryptionService';
import { UserContext } from '../context/kycContext';

export default function Admin() {
  const { user, refreshKYCStatus } = useContext(UserContext);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [pendingAssets, setPendingAssets] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchPendingKYC() {
    try {
      console.log('Fetching KYC requests...');
      const requestCount = await tokenContract.kycRequestCounter();
      console.log('KYC Request Count:', requestCount.toString());
      const kycList = [];
      for (let i = 0; i < requestCount; i++) {
        try {
          const userAddress = await tokenContract.kycRequests(i);
          console.log(`Request ${i}: User Address:`, userAddress);
          const kyc = await tokenContract.kycData(userAddress);
          console.log(`Request ${i}: KYC Data:`, kyc);
          if (!kyc.verified) {
            try {
              const res = await fetch(kyc.ipfsURI);
              const metadata = await res.json();
              console.log(`Request ${i}: IPFS Metadata:`, metadata);
              const decryptedData = decrypt(metadata.encryptedData, metadata.iv);
              kycList.push({
                requestId: i,
                userAddress,
                name: kyc.name,
                idNumber: kyc.idNumber,
                idImage: decryptedData.idImage,
              });
            } catch (fetchErr) {
              console.error(`Request ${i}: Failed to fetch/decrypt IPFS:`, fetchErr);
            }
          }
        } catch (err) {
          console.error(`Error processing KYC request ${i}:`, err);
        }
      }
      console.log('Pending KYC List:', kycList);
      setPendingKYC(kycList);
      if (kycList.length === 0 && requestCount > 0) {
        setError('No pending KYC requests found, but requests exist. Possible verified KYC or contract issue.');
      } else if (requestCount === 0) {
        setError('No KYC requests found in contract. Submit a new KYC request.');
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Failed to fetch pending KYC:', error);
      setError(`Failed to fetch KYC requests: ${error.message}. Check contract address and ABI.`);
    }
  }

  async function fetchPendingAssets() {
    try {
      const requestCount = await tokenContract.requestCounter();
      console.log('Asset Request Count:', requestCount.toString());
      const assets = [];
      for (let i = 0; i < requestCount; i++) {
        try {
          const asset = await tokenContract.pendingAssets(i);
          if (!asset.approved) {
            const res = await fetch(asset.assetURI);
            const metadata = await res.json();
            assets.push({
              requestId: i,
              metadata,
              documentURI: asset.documentURI,
              ownerName: asset.ownerName,
              ownerIdNumber: asset.ownerIdNumber,
              submitter: asset.submitter,
            });
          }
        } catch (err) {
          console.error(`Error processing asset request ${i}:`, err);
        }
      }
      setPendingAssets(assets);
    } catch (error) {
      console.error('Failed to fetch pending assets:', error);
      setError(prev => prev + ` | Failed to fetch assets: ${error.message}. Check contract address and ABI.`);
    }
  }

  async function approveKYC(requestId) {
    setLoading(true);
    try {
      const signer = await getSigner();
      console.log('Approving KYC for requestId:', requestId);
      const tx = await tokenContract.connect(signer).verifyKYC(requestId, 'PinataProvider', { gasLimit: 300000 });
      const receipt = await tx.wait();
      console.log('KYC Approval Receipt:', receipt);
      alert('KYC approved!');
      fetchPendingKYC();
      if (user?.address) {
        await refreshKYCStatus(user.address);
      }
    } catch (error) {
      console.error('KYC approval failed:', error);
      alert('KYC approval failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveAsset(requestId) {
    setLoading(true);
    try {
      const signer = await getSigner();
      if (!recipient) throw new Error('Recipient address required');
      const tx = await tokenContract.connect(signer).approveAsset(requestId, recipient, { gasLimit: 300000 });
      await tx.wait();
      alert('Asset approved!');
      fetchPendingAssets();
      setRecipient('');
    } catch (error) {
      alert('Asset approval failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPendingKYC();
    fetchPendingAssets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Admin - Approve KYC and Assets</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending KYC Requests</h2>
          {loading ? (
            <p>Loading...</p>
          ) : pendingKYC.length === 0 ? (
            <p>No pending KYC requests.</p>
          ) : (
            pendingKYC.map((kyc) => (
              <div key={kyc.requestId} className="border p-4 mb-4">
                <p>Request ID: {kyc.requestId}</p>
                <p>User Address: {kyc.userAddress}</p>
                <p>Name: {kyc.name}</p>
                <p>ID Number: {kyc.idNumber}</p>
                <img src={kyc.idImage} alt="ID Image" className="h-48 w-full object-cover mb-4" />
                <button
                  onClick={() => approveKYC(kyc.requestId)}
                  disabled={loading}
                  className={`bg-blue-500 text-white px-4 py-2 rounded ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                  }`}
                >
                  Approve KYC
                </button>
              </div>
            ))
          )}
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Pending Asset Approvals</h2>
          {loading ? (
            <p>Loading...</p>
          ) : pendingAssets.length === 0 ? (
            <p>No pending assets.</p>
          ) : (
            pendingAssets.map((asset) => (
              <div key={asset.requestId} className="border p-4 mb-4">
                <p>Request ID: {asset.requestId}</p>
                <h3 className="text-lg font-semibold">{asset.metadata.name}</h3>
                <p className="text-sm text-gray-600">{asset.metadata.description}</p>
                <img
                  src={asset.metadata.image}
                  alt={asset.metadata.name}
                  className="h-48 w-full object-cover mb-4"
                />
                <p>
                  Ownership Document:{' '}
                  <a href={asset.documentURI} target="_blank" className="text-blue-500">
                    View
                  </a>
                </p>
                <p>Owner Name: {asset.ownerName}</p>
                <p>Owner ID Number: {asset.ownerIdNumber}</p>
                <p>Submitter: {asset.submitter}</p>
                <input
                  type="text"
                  placeholder="Recipient Address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                />
                <button
                  onClick={() => approveAsset(asset.requestId)}
                  disabled={loading}
                  className={`w-full bg-green-500 text-white px-4 py-2 rounded ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
                  }`}
                >
                  Approve Asset
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}