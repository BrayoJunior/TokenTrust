require('dotenv').config();

const config = {
  blockchain: {
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
    assetTokenAddress: process.env.ASSET_TOKEN_ADDRESS,
    marketplaceAddress: process.env.MARKETPLACE_ADDRESS,
  },
  ipfs: {
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
  },
  server: {
    port: process.env.PORT || 3000,
  },
};

// Validate environment variables
const requiredEnv = [
  'RPC_URL',
  'PRIVATE_KEY',
  'ASSET_TOKEN_ADDRESS',
  'MARKETPLACE_ADDRESS',
  'PINATA_API_KEY',
  'PINATA_SECRET_API_KEY',
];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = config;