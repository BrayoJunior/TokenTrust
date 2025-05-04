const validator = require('ethereum-address');

function validateAddress(req, res, next) {
  const { address, userAddress } = req.body;
  if ((address && !validator.isAddress(address)) || (userAddress && !validator.isAddress(userAddress))) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }
  next();
}

function validateAssetUpload(req, res, next) {
  const { name, description, ownerName, ownerIdNumber, userAddress } = req.body;
  const { assetImage, ownershipDocument } = req.files || {};
  if (!name || !description || !ownerName || !ownerIdNumber || !userAddress || !assetImage || !ownershipDocument) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (
    typeof name !== 'string' ||
    typeof description !== 'string' ||
    typeof ownerName !== 'string' ||
    typeof ownerIdNumber !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid field types' });
  }
  next();
}

function validateKYCSubmission(req, res, next) {
  const { name, idNumber, userAddress } = req.body;
  const { idImage } = req.files || {};
  if (!name || !idNumber || !userAddress || !idImage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (typeof name !== 'string' || typeof idNumber !== 'string') {
    return res.status(400).json({ error: 'Invalid field types' });
  }
  next();
}

function validateListToken(req, res, next) {
  const { tokenId, price, amount } = req.body;
  if (!tokenId || !price || !amount) {
    return res.status(400).json({ error: 'Missing required fields: tokenId, price, amount' });
  }
  if (!Number.isInteger(Number(tokenId)) || !Number.isInteger(Number(amount))) {
    return res.status(400).json({ error: 'Invalid field types: tokenId and amount must be integers' });
  }
  if (Number(price) <= 0 || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Price and amount must be positive' });
  }
  next();
}

module.exports = { validateAddress, validateAssetUpload, validateKYCSubmission, validateListToken };