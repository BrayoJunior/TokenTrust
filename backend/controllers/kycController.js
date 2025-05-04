const { verifyKYC } = require('../services/blockchainService');
const { uploadFileToIPFS, uploadMetadataToIPFS } = require('../services/ipfsService');
const logger = require('../utils/logger');

async function submitKYCData(req, res) {
  try {
    const { name, idNumber, userAddress } = req.body;
    const idImage = req.files?.idImage;

    if (!name || !idNumber || !userAddress || !idImage) {
      throw new Error('Missing required fields');
    }

    const idImageUrl = await uploadFileToIPFS(idImage.data, idImage.name);
    const kycData = { name, idNumber, idImage: idImageUrl };
    const ipfsUrl = await uploadMetadataToIPFS(kycData); // No encryption in backend
    res.json({ success: true, ipfsUrl });
  } catch (error) {
    logger.error(`KYC submission failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function verifyUserKYC(req, res) {
  try {
    const { requestId } = req.body;
    const txHash = await verifyKYC(requestId);
    res.json({ success: true, txHash });
  } catch (error) {
    logger.error(`KYC verification failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { submitKYCData, verifyUserKYC };