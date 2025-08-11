// deploy script of the LicenseNFT contract
const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying LicenseNFT Contract...\n");

    // Get signers
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer address:", deployer.address);
    console.log("💰 Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("");

    // IPNFT contract address (replace with your deployed address)
    const ipNftContractAddress = "0x494594a8Ff1bb8D1b5EE5656B002CA809C1475d5";
    
    // LicenseNFT constructor parameters
    const licenseName = "IP License NFT";
    const licenseSymbol = "IPL";

    console.log("📋 Deployment Parameters:");
    console.log("- IPNFT Contract Address:", ipNftContractAddress);
    console.log("- License Name:", licenseName);
    console.log("- License Symbol:", licenseSymbol);
    console.log("");

    // Verify IPNFT contract exists
    console.log("🔍 Verifying IPNFT contract exists...");
    try {
        const IPNFT = await hre.ethers.getContractFactory("IPNFT");
        const ipNftContract = await hre.ethers.getContractAt("IPNFT", ipNftContractAddress);
        const name = await ipNftContract.name();
        console.log("✅ IPNFT contract verified - Name:", name);
    } catch (error) {
        console.log("❌ Error verifying IPNFT contract:", error.message);
        console.log("Please make sure the IPNFT contract address is correct and deployed.");
        return;
    }
    console.log("");

    // Deploy LicenseNFT contract
    console.log("🏗️  Deploying LicenseNFT contract...");
    try {
        const LicenseNFT = await hre.ethers.getContractFactory("LicenseNFT");
        const licenseNft = await LicenseNFT.deploy(
            ipNftContractAddress,
            licenseName,
            licenseSymbol
        );

        console.log("⏳ Waiting for deployment transaction to be mined...");
        await licenseNft.waitForDeployment();

        const licenseNftAddress = await licenseNft.getAddress();
        console.log("✅ LicenseNFT deployed successfully!");
        console.log("📋 Contract address:", licenseNftAddress);
        console.log("");

        // Verify deployment
        console.log("🔍 Verifying deployment...");
        const deployedName = await licenseNft.name();
        const deployedSymbol = await licenseNft.symbol();
        const deployedIpContract = await licenseNft.ipContract();
        
        console.log("✅ Deployment verification:");
        console.log("- Name:", deployedName);
        console.log("- Symbol:", deployedSymbol);
        console.log("- IP Contract:", deployedIpContract);
        console.log("");

        // Test basic functionality
        console.log("🧪 Testing basic functionality...");
        try {
            const supportsInterface = await licenseNft.supportsInterface("0x80ac58cd"); // ERC721 interface
            console.log("✅ ERC721 interface supported:", supportsInterface);
        } catch (error) {
            console.log("⚠️  Could not test interface support:", error.message);
        }

        console.log("");
        console.log("🎯 Deployment Summary:");
        console.log("======================");
        console.log("📋 LicenseNFT Address:", licenseNftAddress);
        console.log("🔗 IPNFT Address:", ipNftContractAddress);
        console.log("📄 Name:", licenseName);
        console.log("🏷️  Symbol:", licenseSymbol);
        console.log("👤 Deployer:", deployer.address);
        console.log("");

        console.log("💡 Next Steps:");
        console.log("1. Save the LicenseNFT address for future use");
        console.log("2. Run the full test script to test both contracts together");
        console.log("3. Verify the contract on block explorer (if needed)");
        console.log("4. Update your frontend to use the new contract address");

        // Save deployment info to a file (optional)
        const deploymentInfo = {
            network: hre.network.name,
            licenseNftAddress: licenseNftAddress,
            ipNftAddress: ipNftContractAddress,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            name: licenseName,
            symbol: licenseSymbol
        };

        console.log("");
        console.log("📄 Deployment Info (save this):");
        console.log(JSON.stringify(deploymentInfo, null, 2));

    } catch (error) {
        console.log("❌ Error deploying LicenseNFT:", error.message);
        console.log("Error details:", error);
    }
}

// Execute the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

