const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');
const logger = require('../utils/logger');

async function uploadMetadataToIPFS(metadata) {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  try {
    const response = await axios.post(url, metadata, {
      headers: {
        pinata_api_key: config.ipfs.pinataApiKey,
        pinata_secret_api_key: config.ipfs.pinataSecretApiKey,
      },
    });
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    logger.info(`Metadata uploaded to IPFS: ${ipfsUrl}`);
    return ipfsUrl;
  } catch (error) {
    logger.error(`IPFS metadata upload error: ${error.message}`);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

async function uploadFileToIPFS(fileBuffer, filename) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();
  formData.append('file', fileBuffer, filename);
  try {
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: config.ipfs.pinataApiKey,
        pinata_secret_api_key: config.ipfs.pinataSecretApiKey,
      },
    });
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    logger.info(`File uploaded to IPFS: ${ipfsUrl}`);
    return ipfsUrl;
  } catch (error) {
    logger.error(`IPFS file upload error: ${error.message}`);
    throw new Error('Failed to upload file to IPFS');
  }
}

module.exports = { uploadMetadataToIPFS, uploadFileToIPFS };