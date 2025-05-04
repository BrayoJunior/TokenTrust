import { tokenContract } from './blockchain';

export async function debugKYCState() {
  try {
    const requestCount = await tokenContract.kycRequestCounter();
    console.log('KYC Request Count:', requestCount.toString());
    const requests = [];
    for (let i = 0; i < requestCount; i++) {
      const userAddress = await tokenContract.kycRequests(i);
      const kycData = await tokenContract.kycData(userAddress);
      requests.push({ requestId: i, userAddress, kycData });
    }
    console.log('KYC Requests:', requests);
    const verified = await tokenContract.isKYCVerified('0xF6724C4547335F95F51b10dbb9D22091D1B028CD');
    console.log('KYC Verified (0xF672...):', verified);
    return { requestCount, requests, verified };
  } catch (error) {
    console.error('Debug KYC State Failed:', error);
    throw error;
  }
}