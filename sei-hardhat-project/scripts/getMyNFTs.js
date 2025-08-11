// get my nfts script of the IPNFT contract
const hre = require("hardhat");
const ipNftContractAddress = "0x494594a8Ff1bb8D1b5EE5656B002CA809C1475d5";

async function main() {
    console.log("🔍 Finding Your NFTs...\n");

    // Get signers
    const signers = await hre.ethers.getSigners();
    const user = signers[0]; // Your account
    
    console.log("👤 Your address:", user.address);
    console.log("");

    // Get contract instance
    const IPNFT = await hre.ethers.getContractFactory("IPNFT");
    const ipNftContract = await hre.ethers.getContractAt("IPNFT", ipNftContractAddress);
    
    console.log("📋 Contract address:", await ipNftContract.getAddress());
    console.log("");

    // Method 1: Get total supply and check ownership
    console.log("🔢 Method 1: Checking by Token ID Range");
    try {
        // Get the next token ID (this tells us how many tokens exist)
        const nextTokenId = await ipNftContract._nextTokenId();
        console.log("Next token ID (total tokens):", nextTokenId.toString());
        
        const yourNFTs = [];
        
        // Check each token ID from 1 to nextTokenId-1
        for (let i = 1; i < nextTokenId; i++) {
            try {
                const owner = await ipNftContract.ownerOf(i);
                if (owner.toLowerCase() === user.address.toLowerCase()) {
                    yourNFTs.push(i);
                }
            } catch (error) {
                // Token doesn't exist or has been burned
                continue;
            }
        }
        
        if (yourNFTs.length > 0) {
            console.log("✅ Your NFTs found:");
            for (const tokenId of yourNFTs) {
                console.log(`   🎨 Token ID: ${tokenId}`);
                
                // Get additional info for each token
                try {
                    const tokenURI = await ipNftContract.tokenURI(tokenId);
                    const paymentSplitter = await ipNftContract.getPaymentSplitter(tokenId);
                    console.log(`      📄 URI: ${tokenURI}`);
                    console.log(`      💰 Payment Splitter: ${paymentSplitter}`);
                } catch (error) {
                    console.log(`      ⚠️  Could not get additional info: ${error.message}`);
                }
                console.log("");
            }
        } else {
            console.log("❌ No NFTs found for your address");
        }
        
    } catch (error) {
        console.log("❌ Error checking token range:", error.message);
    }
    
    console.log("");

    // Method 2: Check recent transactions (if you know you just minted)
    console.log("📜 Method 2: Recent Mint Events");
    try {
        // Get recent blocks to check for mint events
        const currentBlock = await hre.ethers.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000); // Check last 1000 blocks
        
        console.log(`Checking blocks ${fromBlock} to ${currentBlock}...`);
        
        const filter = ipNftContract.filters.IPMinted(null, user.address, null, null, null);
        const events = await ipNftContract.queryFilter(filter, fromBlock, currentBlock);
        
        if (events.length > 0) {
            console.log("✅ Recent mint events found:");
            for (const event of events) {
                const tokenId = event.args[0];
                const author = event.args[1];
                const metadataURI = event.args[2];
                const contentHash = event.args[3];
                const splitter = event.args[4];
                
                console.log(`   🎨 Token ID: ${tokenId.toString()}`);
                console.log(`   👤 Author: ${author}`);
                console.log(`   📄 Metadata: ${metadataURI}`);
                console.log(`   🔗 Content Hash: ${contentHash}`);
                console.log(`   💰 Splitter: ${splitter}`);
                console.log(`   📅 Block: ${event.blockNumber}`);
                console.log("");
            }
        } else {
            console.log("❌ No recent mint events found for your address");
        }
        
    } catch (error) {
        console.log("❌ Error checking recent events:", error.message);
    }

    // Method 3: Get all transfer events to your address
    console.log("🔄 Method 3: Transfer Events to Your Address");
    try {
        const currentBlock = await hre.ethers.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000);
        
        // Check for Transfer events where you are the recipient
        const transferFilter = ipNftContract.filters.Transfer(null, user.address, null);
        const transferEvents = await ipNftContract.queryFilter(transferFilter, fromBlock, currentBlock);
        
        if (transferEvents.length > 0) {
            console.log("✅ Transfer events to your address:");
            for (const event of transferEvents) {
                const from = event.args[0];
                const to = event.args[1];
                const tokenId = event.args[2];
                
                console.log(`   🎨 Token ID: ${tokenId.toString()}`);
                console.log(`   📤 From: ${from}`);
                console.log(`   📥 To: ${to}`);
                console.log(`   📅 Block: ${event.blockNumber}`);
                console.log("");
            }
        } else {
            console.log("❌ No transfer events found to your address");
        }
        
    } catch (error) {
        console.log("❌ Error checking transfer events:", error.message);
    }

    console.log("🎯 NFT Discovery Complete!");
    console.log("\n💡 Tips:");
    console.log("- Use Method 1 for a complete list of your NFTs");
    console.log("- Use Method 2 if you recently minted");
    console.log("- Use Method 3 to see how you acquired your NFTs");
    console.log("- You can also check block explorers like SeiScan for your address");
}

// Execute the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
