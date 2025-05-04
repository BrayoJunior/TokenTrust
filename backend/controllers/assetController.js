const { submitAsset } = require('../services/blockchainService');
const { uploadFileToIPFS, uploadMetadataToIPFS } = require('../services/ipfsService');
const logger = require('../utils/logger');

async function uploadAsset(req, res) {
  try {
    const { name, description, ownerName, ownerIdNumber, userAddress } = req.body;
    const assetImage = req.files?.assetImage;
    const ownershipDocument = req.files?.ownershipDocument;

    if (!name || !description || !ownerName || !ownerIdNumber || !userAddress || !assetImage || !ownershipDocument) {
      throw new Error('Missing required fields');
    }

    const assetImageUrl = await uploadFileToIPFS(assetImage.data, assetImage.name);
    const documentUrl = await uploadFileToIPFS(ownershipDocument.data, ownershipDocument.name);
    const metadata = { name, description, image: assetImageUrl };
    const assetIpfsUrl = await uploadMetadataToIPFS(metadata);
    const txHash = await submitAsset(assetIpfsUrl, documentUrl, ownerName, ownerIdNumber, 1, userAddress);

    res.json({ success: true, ipfsUrl: assetIpfsUrl, documentUrl, txHash });
  } catch (error) {
    logger.error(`Asset upload failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { uploadAsset };