// scripts/verify-all.js
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Option A: hardcode addresses (replace)
  const addresses = {
    ipnft: "0x293B992a65c9C6639271aE6452453D0DbE5e4C94",
    license: "0x395ac2187f1C11f81657AAD8A57cAc22152d8eB2",
    derivative: "0x4203c6278092196dF74da89A53b99b827757238d",
    desci: "0x2d3d327020EaCE55d6f09cca3A82BB20677dA52D"
  };

  // Option B: read addresses from deployed.json if your deploy script wrote one
  // const addresses = JSON.parse(fs.readFileSync("deployed.json", "utf8"));

  console.log("Verifying IPNFT...");
  await hre.run("verify:verify", {
    address: addresses.ipnft,
    constructorArguments: ["IP NFT", "IPNFT"]
  });

  console.log("Verifying LicenseNFT...");
  await hre.run("verify:verify", {
    address: addresses.license,
    constructorArguments: [addresses.ipnft, "License NFT", "LICENSE"]
  });

  console.log("Verifying DerivativeIP...");
  await hre.run("verify:verify", {
    address: addresses.derivative,
    constructorArguments: [addresses.ipnft, addresses.license, "Derivative IP", "DERIV"]
  });

  console.log("Verifying Desci...");
  await hre.run("verify:verify", {
    address: addresses.desci,
    constructorArguments: []
  });

  console.log("All done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
