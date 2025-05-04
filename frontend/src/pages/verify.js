import React, { useState, useEffect, useContext } from 'react';
import NavBar from '../components/NavBar';
import { uploadKYCData } from '../services/api';
import { getSigner, tokenContract } from '../services/blockchain';
import { encrypt } from '../services/encryptionService';
import { UserContext } from '../context/kycContext';
import { ethers } from 'ethers';

export default function VerifyKYC() {
  const { user, refreshKYCStatus } = useContext(UserContext);
  const [formData, setFormData] = useState({
    userAddress: user?.address || '',
    name: '',
    idNumber: '',
  });
  const [idImage, setIdImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(!!user?.address);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.address) {
      setFormData((prev) => ({ ...prev, userAddress: user.address }));
      setConnected(true);
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!idImage) throw new Error('Please upload an ID image');
      const kycData = {
        name: formData.name,
        idNumber: formData.idNumber,
        idImage: idImage.name,
      };
      const { iv, encryptedData } = await encrypt(kycData);
      const metadata = { encryptedData, iv };
      const { ipfsUrl } = await uploadKYCData(formData, idImage);
      const signer = await getSigner();
      const contractWithSigner = tokenContract.connect(signer);
      console.log('Submitting KYC:', { address: formData.userAddress, name: formData.name, idNumber: formData.idNumber, ipfsUrl });
      const tx = await contractWithSigner.submitKYC(formData.name, formData.idNumber, ipfsUrl, { gasLimit: 300000 });
      const receipt = await tx.wait();
      console.log('KYC Submission Receipt:', receipt);

      // Parse KYCSubmitted event
      const event = receipt.logs.find(log => {
        try {
          return tokenContract.interface.parseLog(log).name === 'KYCSubmitted';
        } catch (e) {
          return false;
        }
      });
      if (event) {
        const { user, requestId, ipfsURI } = tokenContract.interface.parseLog(event).args;
        console.log('KYCSubmitted Event:', { user, requestId: requestId.toString(), ipfsURI });
      } else {
        console.warn('No KYCSubmitted event found. Possible contract mismatch or revert.');
        setError('KYC submission succeeded, but no event emitted. Check contract address and ABI.');
      }

      // Verify contract state
      try {
        const requestCount = await tokenContract.kycRequestCounter();
        console.log('KYC Request Counter:', requestCount.toString());
        const lastRequestId = requestCount - 1n;
        if (lastRequestId >= 0) {
          const requestAddress = await tokenContract.kycRequests(lastRequestId);
          console.log('Last KYC Request Address:', requestAddress);
        }
      } catch (err) {
        console.error('Failed to verify KYC state:', err);
        setError(prev => prev + ' Failed to verify KYC state: ' + err.message);
      }

      alert(`KYC submitted successfully! IPFS: ${ipfsUrl}, Tx: ${receipt.transactionHash}`);
      await refreshKYCStatus(user.address);
      setFormData({ userAddress: formData.userAddress, name: '', idNumber: '' });
      setIdImage(null);
    } catch (error) {
      console.error('KYC submission failed:', error);
      setError(error.message.includes('KYC already submitted') ? 
        'KYC already submitted for this address. Try a new wallet or wait for admin approval.' : 
        `KYC submission failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Submit KYC</h1>
        {user?.isKYCVerified ? (
          <div className="bg-green-100 p-6 rounded shadow text-center">
            <h2 className="text-xl font-semibold text-green-600">You have been verified!</h2>
            <p>Your KYC has been successfully approved.</p>
          </div>
        ) : (
          <>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Wallet Address"
                value={formData.userAddress}
                disabled
                className="w-full p-2 border rounded bg-gray-200"
              />
              <input
                type="text"
                placeholder="Full Name (as on ID/Passport)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="ID/Passport Number"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdImage(e.target.files[0])}
                className="w-full p-2 border rounded"
                required
              />
              <button
                type="submit"
                disabled={loading || !connected}
                className={`w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 ${
                  loading || !connected ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Submitting...' : 'Submit KYC'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}