import axios from 'axios';
import { BACKEND_URL } from '../../config.js';

const api = axios.create({
  baseURL: BACKEND_URL,
});

export async function uploadKYCData(data, idImage) {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('idNumber', data.idNumber);
    formData.append('userAddress', data.userAddress);
    formData.append('idImage', idImage);
    const response = await api.post('/submit-kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // Return { success, ipfsUrl }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload KYC data');
  }
}

export async function verifyKYC(requestId) {
  try {
    const response = await api.post('/verify-kyc', { requestId });
    return response.data; // Return { success, txHash }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to verify KYC');
  }
}

export async function uploadAsset(data, assetImage, ownershipDocument) {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('ownerName', data.ownerName);
    formData.append('ownerIdNumber', data.ownerIdNumber);
    formData.append('userAddress', data.userAddress);
    formData.append('assetImage', assetImage);
    formData.append('ownershipDocument', ownershipDocument);
    const response = await api.post('/upload-asset', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // Return { success, ipfsUrl, txHash }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload asset');
  }
}

export async function listToken(data) {
  try {
    const response = await api.post('/list-token', data);
    return response.data; // Return { success, txHash }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to list token');
  }
}