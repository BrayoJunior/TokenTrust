import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import { uploadAsset } from '../services/api';
import { UserContext } from '../context/kycContext';

export default function Sell() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerName: '',
    ownerIdNumber: '',
    userAddress: user?.address || '',
  });
  const [assetImage, setAssetImage] = useState(null);
  const [ownershipDocument, setOwnershipDocument] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.address) {
      setFormData((prev) => ({ ...prev, userAddress: user.address }));
    }
    if (!user?.isKYCVerified && user?.address) {
      router.push('/verify');
    }
  }, [user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!assetImage || !ownershipDocument) throw new Error('Please upload asset image and ownership document');
      const response = await uploadAsset(formData, assetImage, ownershipDocument);
      alert(`Asset submitted successfully! IPFS: ${response.ipfsUrl}`);
      setFormData({ name: '', description: '', ownerName: '', ownerIdNumber: '', userAddress: formData.userAddress });
      setAssetImage(null);
      setOwnershipDocument(null);
    } catch (error) {
      alert('Asset submission failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Submit Your Asset</h1>
        {user?.isKYCVerified ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Asset Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              placeholder="Asset Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Owner Name (as on ownership document)"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Owner ID Number (as on ownership document)"
              value={formData.ownerIdNumber}
              onChange={(e) => setFormData({ ...formData, ownerIdNumber: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAssetImage(e.target.files[0])}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={(e) => setOwnershipDocument(e.target.files[0])}
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Asset'}
            </button>
          </form>
        ) : (
          <p className="text-red-600">Please complete KYC verification.</p>
        )}
      </div>
    </div>
  );
}