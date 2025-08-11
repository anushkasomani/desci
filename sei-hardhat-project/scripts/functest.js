// test script of the IPNFT contract
const hre = require("hardhat");
const ipNftContractAddress = "0x494594a8Ff1bb8D1b5EE5656B002CA809C1475d5";

async function main() {
    console.log("Starting IPNFT Contract Functionality Test...\n");
    const signers = await hre.ethers.getSigners();
    console.log(`📋 Found ${signers.length} available accounts`);
    
    const deployer = signers[0];
    const author = signers[1] || signers[0]; // Fallback to deployer if only one account
    const user1 = signers[2] || signers[0];  // Fallback to deployer if only two accounts
    const user2 = signers[3] || signers[0];  // Fallback to deployer if only three accounts
    
    console.log("Test Accounts:");
    console.log("Deployer:", deployer.address);
    console.log("Author:", author.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    console.log("");

    // Get contract instance
    const IPNFT = await hre.ethers.getContractFactory("IPNFT");
    const ipNftContract = await hre.ethers.getContractAt("IPNFT", ipNftContractAddress);
    
    console.log("✅ Contract instance created successfully!");
    console.log("Contract address:", await ipNftContract.getAddress());
    console.log("");
    console.log(" Test 1: Reading Contract Information");
    try {
        const name = await ipNftContract.name();
        const symbol = await ipNftContract.symbol();
        console.log(" Token name:", name);
        console.log(" Token symbol:", symbol);
    } catch (error) {
        console.log("❌ Error reading contract info:", error.message);
    }
    console.log("");

    // Test 2: Mint a new IP NFT
    console.log(" Test 2: Minting IP NFT");
    try {
        // Prepare mint parameters
        const metadataURI = "ipfs://DummyMetadataHash";
        const contentHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("test-content"));
        const royaltyRecipient = author.address;
        const royaltyBps = 500; // 5% royalty (500 basis points)
        
        // Set up payees and shares based on available accounts
        let payees, shares;
        
        if (signers.length >= 2) {
            // Use real different accounts
            payees = [author.address, user1.address];
            shares = [80, 20]; // 80% to author, 20% to user1
        } else {
            // Use single payee when only one account available
            payees = [author.address];
            shares = [100]; // 100% to author
            console.log("⚠️  Using single payee since only one account available");
        }

        console.log("Minting parameters:");
        console.log("- Author:", author.address);
        console.log("- Metadata URI:", metadataURI);
        console.log("- Content Hash:", contentHash);
        console.log("- Royalty Recipient:", royaltyRecipient);
        console.log("- Royalty BPS:", royaltyBps);
        console.log("- Payees:", payees);
        console.log("- Shares:", shares);

        // Mint the IP NFT
        const mintTx = await ipNftContract.connect(author).mintIP(
            author.address,
            metadataURI,
            contentHash,
            royaltyRecipient,
            royaltyBps,
            payees,
            shares
        );

        console.log("Waiting for mint transaction to be mined...");
        const mintReceipt = await mintTx.wait();
        console.log("✅ Mint transaction successful!");
        console.log("Transaction hash:", mintTx.hash);
        console.log("Gas used:", mintReceipt.gasUsed.toString());

        // Get the token ID from the event
        const mintEvent = mintReceipt.logs.find(log => {
            try {
                const parsed = ipNftContract.interface.parseLog(log);
                return parsed.name === "IPMinted";
            } catch {
                return false;
            }
        });

        if (mintEvent) {
            const parsedEvent = ipNftContract.interface.parseLog(mintEvent);
            const tokenId = parsedEvent.args[0];
            console.log("🎉 Token ID:", tokenId.toString());
            console.log("");

            // Test 3: Verify token ownership
            console.log("🔍 Test 3: Verifying Token Ownership");
            const owner = await ipNftContract.ownerOf(tokenId);
            console.log("✅ Token owner:", owner);
            console.log("Expected owner:", author.address);
            console.log("");

            // Test 4: Get token URI
            console.log("🔗 Test 4: Getting Token URI");
            const tokenURI = await ipNftContract.tokenURI(tokenId);
            console.log("✅ Token URI:", tokenURI);
            console.log("");

            // Test 5: Get payment splitter address
            console.log("💰 Test 5: Getting Payment Splitter");
            const paymentSplitter = await ipNftContract.getPaymentSplitter(tokenId);
            console.log("✅ Payment Splitter address:", paymentSplitter);
            console.log("");

            // Test 6: Check royalty info
            console.log("👑 Test 6: Checking Royalty Info");
            try {
                const royaltyInfo = await ipNftContract.royaltyInfo(tokenId, hre.ethers.parseEther("1"));
                console.log("✅ Royalty recipient:", royaltyInfo[0]);
                console.log("✅ Royalty amount:", hre.ethers.formatEther(royaltyInfo[1]), "ETH");
            } catch (error) {
                console.log("❌ Error getting royalty info:", error.message);
            }
            console.log("");

            // Test 7: Transfer token (only if we have multiple accounts)
            if (signers.length >= 2) {
                console.log("🔄 Test 7: Testing Token Transfer");
                try {
                    const transferTx = await ipNftContract.connect(author).transferFrom(
                        author.address,
                        user2.address,
                        tokenId
                    );
                    await transferTx.wait();
                    console.log("✅ Token transferred successfully!");
                    
                    const newOwner = await ipNftContract.ownerOf(tokenId);
                    console.log("New owner:", newOwner);
                    console.log("Expected new owner:", user2.address);
                } catch (error) {
                    console.log("❌ Error transferring token:", error.message);
                }
            } else {
                console.log("🔄 Test 7: Skipping Token Transfer (only one account available)");
            }

        } else {
            console.log("❌ Could not find IPMinted event in transaction receipt");
        }

    } catch (error) {
        console.log("❌ Error minting IP NFT:", error.message);
        console.log("Error details:", error);
    }

    console.log("\n🎯 All tests completed!");
}

// Execute the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });