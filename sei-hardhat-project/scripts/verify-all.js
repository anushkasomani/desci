// scripts/verify-all.js
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Option A: hardcode addresses (replace)
  const addresses = {
    ipnft: "0x043FdF7F85030B6cF49124675987A8526d495fd8",
    license: "0x02F13d8505ba549C05D2fa3e32901f8527716616",
    derivative: "0x55Bfdb285664Bf4f52c3d6b36c8623c1E2E02be3",
    desci: "0x62b8847515A1B47336cCE068FE272e5F93F11b4c"
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
