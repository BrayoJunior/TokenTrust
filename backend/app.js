const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const config = require('./config');
const { uploadAsset } = require('./controllers/assetController');
const { submitKYCData, verifyUserKYC } = require('./controllers/kycController');
const { listTokenHandler } = require('./controllers/marketplaceController');
const { validateAddress, validateAssetUpload, validateKYCSubmission, validateListToken } = require('./middleware/validate');
const rateLimiter = require('./middleware/rateLimit');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(rateLimiter);

// Routes
app.post('/submit-kyc', validateKYCSubmission, submitKYCData);
app.post('/verify-kyc', validateAddress, verifyUserKYC);
app.post('/upload-asset', validateAssetUpload, uploadAsset);
app.post('/list-token', validateListToken, listTokenHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unexpected error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.server.port, () => {
  logger.info(`🚀 TokenTrust backend running on port ${config.server.port}`);
});