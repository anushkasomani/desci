// deploy script of the IPNFT contract
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const ContractFactory = await hre.ethers.getContractFactory("IPNFT"); // contract name
  const contract = await ContractFactory.deploy(
    "My IPNFT", // name
    "IPN",      // symbol
  );

  await contract.waitForDeployment();
  console.log("IPNFT deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
