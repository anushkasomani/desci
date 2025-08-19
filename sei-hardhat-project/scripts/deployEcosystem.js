const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy IPNFT contract
  console.log("Deploying IPNFT...");
  const IPNFT = await ethers.getContractFactory("IPNFT");
  const ipnft = await IPNFT.deploy("IP NFT", "IPNFT");
  await ipnft.waitForDeployment();
  console.log("IPNFT deployed to:", await ipnft.getAddress());

  // Deploy LicenseNFT contract
  console.log("Deploying LicenseNFT...");
  const LicenseNFT = await ethers.getContractFactory("LicenseNFT");
  const licenseNFT = await LicenseNFT.deploy(await ipnft.getAddress(), "License NFT", "LICENSE");
  await licenseNFT.waitForDeployment();
  console.log("LicenseNFT deployed to:", await licenseNFT.getAddress());

  // Deploy DerivativeIP contract
  console.log("Deploying DerivativeIP...");
  const DerivativeIP = await ethers.getContractFactory("DerivativeIP");
  const derivativeIP = await DerivativeIP.deploy(
    await ipnft.getAddress(),
    await licenseNFT.getAddress(),
    "Derivative IP",
    "DERIV"
  );
  await derivativeIP.waitForDeployment();
  console.log("DerivativeIP deployed to:", await derivativeIP.getAddress());

  // Deploy Desci governance token
  console.log("Deploying Desci governance token...");
  const Desci = await ethers.getContractFactory("Desci");
  const desci = await Desci.deploy();
  await desci.waitForDeployment();
  console.log("Desci deployed to:", await desci.getAddress());

  // Set up initial configuration
  console.log("Setting up initial configuration...");
  // Wire governance to IPNFT so disputes can suspend/unsuspend IPs
  const desciAddr = await desci.getAddress();
  await (await ipnft.setGovernance(desciAddr)).wait();
  await (await desci.setIPNFT(await ipnft.getAddress())).wait();
  
  console.log("Ecosystem deployment complete!");
  console.log("\nDeployed contracts:");
  console.log("IPNFT:", await ipnft.getAddress());
  console.log("LicenseNFT:", await licenseNFT.getAddress());
  console.log("DerivativeIP:", await derivativeIP.getAddress());
  console.log("Desci:", await desci.getAddress());
  
  console.log("\nNext steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Set up frontend integration");
  console.log("3. Configure AI verification service");
  console.log("4. Test governance token minting");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
