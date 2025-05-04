const { listToken } = require('../services/blockchainService');
const logger = require('../utils/logger');

async function listTokenHandler(req, res) {
  try {
    const { tokenId, price, amount, userAddress } = req.body;
    const txHash = await listToken(tokenId, price, amount, userAddress);
    res.json({ success: true, txHash });
  } catch (error) {
    logger.error(`List token failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listTokenHandler };