const hre = require("hardhat");

const ipNftAddress = "0x494594a8Ff1bb8D1b5EE5656B002CA809C1475d5"; 
const licenseNftAddress = "0x93A637e3DfE4F5AFd3c09e6a7914Aa9ED8127C9A"; 

async function main() {
  const [acc1, acc2] = await hre.ethers.getSigners();
  console.log("Account 1:", acc1.address);
  console.log("Account 2:", acc2.address);

  // Get contract instances
  const IPNFT = await hre.ethers.getContractFactory("IPNFT");
  const LicenseNFT = await hre.ethers.getContractFactory("LicenseNFT");
  const ipNft = await hre.ethers.getContractAt("IPNFT", ipNftAddress);
  const licenseNft = await hre.ethers.getContractAt("LicenseNFT", licenseNftAddress);

  // --- IPNFT Tests ---
  // Mint from acc1
  const mintTx = await ipNft.connect(acc1).mintIP(
    acc1.address,
    "ipfs://metadata1",
    hre.ethers.keccak256(hre.ethers.toUtf8Bytes("content1")),
    acc1.address,
    500,
    [acc1.address, acc2.address],
    [80, 20]
  );

  const mintReceipt = await mintTx.wait();
  const mintEvent = mintReceipt.logs.find(log => {
    try { return ipNft.interface.parseLog(log).name === "IPMinted"; } catch { return false; }
  });
  const tokenId = ipNft.interface.parseLog(mintEvent).args[0];
  console.log("Minted IPNFT Token ID:", tokenId.toString());

// Transfer to acc2
//   await ipNft.connect(acc1).transferFrom(acc1.address, acc2.address, tokenId);
//   console.log("Transferred IPNFT to acc2");

  // Approve acc1 to transfer back
//   await ipNft.connect(acc2).approve(acc1.address, tokenId);
//   console.log("Approved acc1 to transfer IPNFT");

  // --- LicenseNFT Tests ---
  // 1. acc1 creates a license offer for their IPNFT
  const offerTx = await licenseNft.connect(acc1).createLicenseOffer(
    tokenId, // IPNFT tokenId
    hre.ethers.parseEther("0.1"), // price in wei
    "ipfs://license-metadata", // license URI
    0 // expiry (0 = never expires)
  );
  const offerReceipt = await offerTx.wait();
  const offerEvent = offerReceipt.logs.find(log => {
    try { return licenseNft.interface.parseLog(log).name === "LicenseOfferCreated"; } catch { return false; }
  });
  const parsedOffer = licenseNft.interface.parseLog(offerEvent);
  const offerIndex = parsedOffer.args[1];
  console.log("Created License Offer Index:", offerIndex.toString());

  // 2. acc2 buys the license
  const buyTx = await licenseNft.connect(acc2).buyLicense(tokenId, offerIndex, { value: hre.ethers.parseEther("0.1") });
  const buyReceipt = await buyTx.wait();
  const licensePurchasedEvent = buyReceipt.logs.find(log => {
    try { return licenseNft.interface.parseLog(log).name === "LicensePurchased"; } catch { return false; }
  });
  const parsedPurchase = licenseNft.interface.parseLog(licensePurchasedEvent);
  const licenseTokenId = parsedPurchase.args[1];
  console.log("Minted LicenseNFT Token ID:", licenseTokenId.toString());

  // 3. Transfer LicenseNFT to acc1
  await licenseNft.connect(acc2).transferFrom(acc2.address, acc1.address, licenseTokenId);
  console.log("Transferred LicenseNFT to acc1");

  // 4. Approve acc2 to transfer back
  await licenseNft.connect(acc1).approve(acc2.address, licenseTokenId);
  console.log("Approved acc2 to transfer LicenseNFT");

  // Add more tests for royalty, payment splitter, and any custom functions here...

  console.log("✅ All tests completed!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});