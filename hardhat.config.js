require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    pharos: {
      url: "https://devnet.dplabs-internal.com/",
      chainId: 50002,
      accounts: [process.env.PRIVATE_KEY],
    }
  }
};