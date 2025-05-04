const hre = require("hardhat");

async function main() {
  const AssetToken = await hre.ethers.getContractFactory("AssetToken");
  const assetToken = await AssetToken.deploy();
  await assetToken.deployed();
  console.log(`AssetToken deployed to: ${assetToken.address}`);

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(assetToken.address);
  await marketplace.deployed();
  console.log(`Marketplace deployed to: ${marketplace.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
