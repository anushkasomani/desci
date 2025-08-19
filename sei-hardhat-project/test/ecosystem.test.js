const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IP Ecosystem", function () {
  let ipnft, licenseNFT, derivativeIP, desci;
  let owner, user1, user2, user3;
  let ipTokenId, derivativeTokenId, licenseTokenId;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy contracts
    const IPNFT = await ethers.getContractFactory("IPNFT");
    ipnft = await IPNFT.deploy("IP NFT", "IPNFT");

    const LicenseNFT = await ethers.getContractFactory("LicenseNFT");
    licenseNFT = await LicenseNFT.deploy(await ipnft.getAddress(), "License NFT", "LICENSE");

    const DerivativeIP = await ethers.getContractFactory("DerivativeIP");
    derivativeIP = await DerivativeIP.deploy(
      await ipnft.getAddress(),
      await licenseNFT.getAddress(),
      "Derivative IP",
      "DERIV"
    );

    const Desci = await ethers.getContractFactory("Desci");
    desci = await Desci.deploy();
  });

  describe("Governance Token (Desci)", function () {
    it("Should allow users to mint governance tokens for 0.1 SEI", async function () {
      const mintPrice = ethers.parseEther("0.1");
      const initialBalance = await desci.balanceOf(user1.address);
      
      await desci.connect(user1).mintGovernanceTokens({ value: mintPrice });
      
      expect(await desci.balanceOf(user1.address)).to.equal(initialBalance + ethers.parseEther("100"));
    });

    it("Should require exact payment amount", async function () {
      const wrongPrice = ethers.parseEther("0.05");
      
      await expect(
        desci.connect(user1).mintGovernanceTokens({ value: wrongPrice })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should allow token holders to create disputes", async function () {
      // First mint tokens
      await desci.connect(user1).mintGovernanceTokens({ value: ethers.parseEther("0.1") });
      
      // Create a dispute
      await expect(
        desci.connect(user1).createDispute(1, "Potential plagiarism detected")
      ).to.not.be.reverted;
    });
    
    it("Should allow multiple disputes per IP", async function () {
      // First mint tokens
      await desci.connect(user1).mintGovernanceTokens({ value: ethers.parseEther("0.1") });
      await desci.connect(user2).mintGovernanceTokens({ value: ethers.parseEther("0.1") });
      
      // Create first dispute
      await desci.connect(user1).createDispute(1, "First concern");
      
      // Create second dispute for same IP
      await expect(
        desci.connect(user2).createDispute(1, "Second concern")
      ).to.not.be.reverted;
      
      // Check that both disputes exist
      const disputes = await desci.getDisputesForIP(1);
      expect(disputes.length).to.equal(2);
    });
    
    it("Should allow AI service to flag content", async function () {
      // AI service (owner) flags content
      await expect(
        desci.connect(owner).flagContentForReview(1, "AI detected high similarity score")
      ).to.not.be.reverted;
      
      // Check that dispute was created
      const disputes = await desci.getDisputesForIP(1);
      expect(disputes.length).to.equal(1);
      
      // Check that IP has active disputes
      expect(await desci.hasActiveDisputes(1)).to.be.true;
    });
  });

  describe("IP NFT", function () {
    beforeEach(async function () {
      // Mint an IP token
      const payees = [user1.address];
      const shares = [100];
      
      await ipnft.connect(user1).mintIP(
        user1.address,
        "ipfs://metadata1",
        ethers.id("content-123"),
        user1.address,
        500, // 5% royalty
        payees,
        shares
      );
      
      ipTokenId = 1;
    });

    it("Should mint IP token with correct metadata", async function () {
      expect(await ipnft.ownerOf(ipTokenId)).to.equal(user1.address);
      expect(await ipnft.tokenURI(ipTokenId)).to.equal("ipfs://metadata1");
    });
    
  });

  describe("License NFT", function () {
    beforeEach(async function () {
      // Mint an IP token first
      const payees = [user1.address];
      const shares = [100];
      
      await ipnft.connect(user1).mintIP(
        user1.address,
        "ipfs://metadata1",
        ethers.id("content-123"),
        user1.address,
        500,
        payees,
        shares
      );
      
      ipTokenId = 1;
    });

    it("Should create license offer", async function () {
      await licenseNFT.connect(user1).createLicenseOffer(
        ipTokenId,
        ethers.parseEther("0.01"),
        "ipfs://license1",
        0 // no expiry
      );
      
      expect(await licenseNFT.getOfferCount(ipTokenId)).to.equal(1);
    });

    it("Should allow buying license", async function () {
      await licenseNFT.connect(user1).createLicenseOffer(
        ipTokenId,
        ethers.parseEther("0.01"),
        "ipfs://license1",
        0
      );
      
      await licenseNFT.connect(user2).buyLicense(ipTokenId, 0, { value: ethers.parseEther("0.01") });
      
      expect(await licenseNFT.ownerOf(1)).to.equal(user2.address);
    });
  });

  describe("Derivative IP", function () {
    beforeEach(async function () {
      // Mint parent IP token
      const payees = [user1.address];
      const shares = [100];
      
      await ipnft.connect(user1).mintIP(
        user1.address,
        "ipfs://parent",
        ethers.id("parent-123"),
        user1.address,
        500,
        payees,
        shares
      );
      
      ipTokenId = 1;
    });

    it("Should create derivative IP with license consumption", async function () {
      // First create a license offer
      await licenseNFT.connect(user1).createLicenseOffer(
        ipTokenId,
        ethers.parseEther("0.01"),
        "ipfs://license1",
        0
      );
      
      // User2 buys the license
      await licenseNFT.connect(user2).buyLicense(ipTokenId, 0, { value: ethers.parseEther("0.01") });
      
      // User2 creates derivative using the license
      await derivativeIP.connect(user2).createDerivative(
        [ipTokenId],
        [1], // license token ID
        "ipfs://derivative",
        ethers.id("deriv-456"),
        0, // REMIX
        true // commercial
      );
      
      derivativeTokenId = 1;
      expect(await derivativeIP.ownerOf(derivativeTokenId)).to.equal(user2.address);
      
      // Check that license was consumed
      expect(await derivativeIP.isLicenseConsumed(1)).to.be.true;
      
      // Try to create another derivative with the same consumed license - should fail
      await expect(
        derivativeIP.connect(user2).createDerivative(
          [ipTokenId],
          [1], // Same consumed license
          "ipfs://derivative2",
          ethers.id("deriv-789"),
          1, // EXTENSION
          true
        )
      ).to.be.revertedWith("License already consumed");
    });

    it("Should track parent-child relationships", async function () {
      // First create a license offer
      await licenseNFT.connect(user1).createLicenseOffer(
        ipTokenId,
        ethers.parseEther("0.01"),
        "ipfs://license1",
        0
      );
      
      // User2 buys the license
      await licenseNFT.connect(user2).buyLicense(ipTokenId, 0, { value: ethers.parseEther("0.01") });
      
      // User2 creates derivative using the license
      await derivativeIP.connect(user2).createDerivative(
        [ipTokenId],
        [1], // license token ID
        "ipfs://derivative",
        ethers.id("deriv-456-b"),
        0,
        true
      );
      
      derivativeTokenId = 1;
      
      const parents = await derivativeIP.getParentsOfDerivative(derivativeTokenId);
      const derivatives = await derivativeIP.getDerivativesOfParent(ipTokenId);
      
      // expect(parents).to.include(ipTokenId);
      // expect(derivatives).to.include(derivativeTokenId);
      // after getting parents and derivatives
      const parentStrs = parents.map(p => p.toString());
      const derivativeStrs = derivatives.map(d => d.toString());
      expect(parentStrs).to.include(ipTokenId.toString());
      expect(derivativeStrs).to.include(derivativeTokenId.toString());

    });
  });

  describe("Complete Workflow", function () {
    it("Should demonstrate complete IP lifecycle", async function () {
      // 1. User mints governance tokens
      await desci.connect(user1).mintGovernanceTokens({ value: ethers.parseEther("0.1") });
      
      // 2. User mints IP token
      const payees = [user1.address];
      const shares = [100];
      
      await ipnft.connect(user1).mintIP(
        user1.address,
        "ipfs://research_paper",
        ethers.id("paper-123"),
        user1.address,
        500,
        payees,
        shares
      );
      
      // 3. AI service flags content for review
      await desci.connect(owner).flagContentForReview(1, "AI detected high similarity score");
      
      // 4. Governance token holder creates additional dispute
      await desci.connect(user1).createDispute(1, "Additional concerns raised");
      
      // 5. User creates derivative work (as owner, no license needed)
      await derivativeIP.connect(user1).createDerivative(
        [1],
        [], // No license needed for owner
        "ipfs://derivative_work",
        ethers.id("deriv-456-c"),
        1, // EXTENSION
        true
      );
      
      // 6. User creates license offer for derivative
      await licenseNFT.connect(user1).createLicenseOffer(
        1, // derivative token ID
        ethers.parseEther("0.05"),
        "ipfs://derivative_license",
        0
      );
      
      // Verify the ecosystem is working
      expect(await desci.balanceOf(user1.address)).to.be.gt(0);
      expect(await ipnft.ownerOf(1)).to.equal(user1.address);
      expect(await derivativeIP.ownerOf(1)).to.equal(user1.address);
      expect(await licenseNFT.getOfferCount(1)).to.equal(1);
    });
  });
});
