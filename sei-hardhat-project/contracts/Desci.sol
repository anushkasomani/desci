// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Desci.sol - Governance Token for IP Platform
 * - Users pay 0.1 SEI to mint governance tokens
 * - Token holders can vote on disputes and platform decisions
 * - Implements dispute resolution mechanism for content review
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IPNFT.sol";

contract Desci is ERC20, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    uint256 public constant MINT_PRICE = 0.1 ether; // 0.1 SEI
    uint256 public constant MIN_VOTING_POWER = 100 * 10**18; // 100 tokens minimum to vote
    
    Counters.Counter private _disputeIdCounter;
    
    struct Dispute {
        uint256 disputeId;
        uint256 ipTokenId;
        address reporter;
        string reason;
        uint256 timestamp;
        bool resolved;
        uint256 totalVotes;
        uint256 votesForRemoval;
        uint256 votesAgainstRemoval;
        mapping(address => bool) hasVoted;
        mapping(address => bool) votedForRemoval; // true = revoke IP, false = keep IP
    }
    
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256[]) public ipToDisputes; // IP token ID to array of dispute IDs
    mapping(uint256 => bool) public ipRevoked; // final state after dispute resolution
    IPNFT public ipnft;
    event GovernanceTokenMinted(address indexed user, uint256 amount, uint256 cost);
    event DisputeCreated(uint256 indexed disputeId, uint256 indexed ipTokenId, address indexed reporter, string reason);
    event VoteCast(uint256 indexed disputeId, address indexed voter, bool voteForRemoval, uint256 votingPower);
    event DisputeResolved(uint256 indexed disputeId, bool ipRevoked, uint256 totalVotes);
    
    constructor() ERC20("Desci Governance", "DESCI") {}

    function setIPNFT(address ipnftAddress) external onlyOwner {
        require(ipnftAddress != address(0), "ipnft zero");
        ipnft = IPNFT(ipnftAddress);
    }
    
    /**
     * Mint governance tokens by paying 0.1 SEI
     */
    function mintGovernanceTokens() external payable nonReentrant {
        require(msg.value == MINT_PRICE, "Incorrect payment amount");
        require(msg.value > 0, "Payment required");
        
        uint256 tokenAmount = 100 * 10**18; // 100 tokens per mint
        _mint(msg.sender, tokenAmount);
        
        emit GovernanceTokenMinted(msg.sender, tokenAmount, msg.value);
    }
    
    /**
     * Create a dispute for content review
     */
    function createDispute(uint256 ipTokenId, string calldata reason) external returns (uint256) {
        require(balanceOf(msg.sender) >= MIN_VOTING_POWER, "Insufficient voting power");
        
        _disputeIdCounter.increment();
        uint256 disputeId = _disputeIdCounter.current();
        
        disputes[disputeId].disputeId = disputeId;
        disputes[disputeId].ipTokenId = ipTokenId;
        disputes[disputeId].reporter = msg.sender;
        disputes[disputeId].reason = reason;
        disputes[disputeId].timestamp = block.timestamp;
        disputes[disputeId].resolved = false;
        disputes[disputeId].totalVotes = 0;
        disputes[disputeId].votesForRemoval = 0;
        disputes[disputeId].votesAgainstRemoval = 0;
        
        ipToDisputes[ipTokenId].push(disputeId);
        
        emit DisputeCreated(disputeId, ipTokenId, msg.sender, reason);
        return disputeId;
    }
    
    /**
     * AI service can flag content at mint time (called by authorized AI service)
     */
    function flagContentForReview(uint256 ipTokenId, string calldata aiReason) external onlyOwner returns (uint256) {
        _disputeIdCounter.increment();
        uint256 disputeId = _disputeIdCounter.current();
        
        disputes[disputeId].disputeId = disputeId;
        disputes[disputeId].ipTokenId = ipTokenId;
        disputes[disputeId].reporter = address(0); // AI service
        disputes[disputeId].reason = aiReason;
        disputes[disputeId].timestamp = block.timestamp;
        disputes[disputeId].resolved = false;
        disputes[disputeId].totalVotes = 0;
        disputes[disputeId].votesForRemoval = 0;
        disputes[disputeId].votesAgainstRemoval = 0;
        
        ipToDisputes[ipTokenId].push(disputeId);
        
        emit DisputeCreated(disputeId, ipTokenId, address(0), aiReason);
        return disputeId;
    }
    
    /**
     * Vote on a dispute
     */
    function voteOnDispute(uint256 disputeId, bool voteForRemoval) external {
        Dispute storage dispute = disputes[disputeId];
        require(!dispute.resolved, "Dispute already resolved");
        require(!dispute.hasVoted[msg.sender], "Already voted");
        require(balanceOf(msg.sender) >= MIN_VOTING_POWER, "Insufficient voting power");
        
        uint256 votingPower = balanceOf(msg.sender);
        
        dispute.hasVoted[msg.sender] = true;
        dispute.votedForRemoval[msg.sender] = voteForRemoval;
        dispute.totalVotes += votingPower;
        if (voteForRemoval) {
            dispute.votesForRemoval += votingPower;
        } else {
            dispute.votesAgainstRemoval += votingPower;
        }
        
        emit VoteCast(disputeId, msg.sender, voteForRemoval, votingPower);
        
        // Auto-resolve if enough votes (simple majority)
        if (dispute.totalVotes >= totalSupply() / 2) {
            _resolveDispute(disputeId);
        }
    }
    
    /**
     * Resolve dispute manually (owner can force resolve)
     */
    function resolveDispute(uint256 disputeId) external onlyOwner {
        require(!disputes[disputeId].resolved, "Already resolved");
        _resolveDispute(disputeId);
    }
    
    function _resolveDispute(uint256 disputeId) internal {
        Dispute storage dispute = disputes[disputeId];
        dispute.resolved = true;
        
        bool revoke = dispute.votesForRemoval > dispute.votesAgainstRemoval;
        ipRevoked[dispute.ipTokenId] = revoke;
        if (address(ipnft) != address(0)) {
            // Suspend in IPNFT when revoked; unsuspend when kept
            try ipnft.setSuspended(dispute.ipTokenId, revoke) {} catch {}
        }
        emit DisputeResolved(disputeId, revoke, dispute.totalVotes);
    }
    
    /**
     * Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * Get dispute info
     */
    function getDispute(uint256 disputeId) external view returns (
        uint256 ipTokenId,
        address reporter,
        string memory reason,
        uint256 timestamp,
        bool resolved,
        uint256 totalVotes
    ) {
        Dispute storage dispute = disputes[disputeId];
        return (
            dispute.ipTokenId,
            dispute.reporter,
            dispute.reason,
            dispute.timestamp,
            dispute.resolved,
            dispute.totalVotes
        );
    }
    
    /**
     * Check if user has voted on a dispute
     */
    function hasVoted(uint256 disputeId, address user) external view returns (bool) {
        return disputes[disputeId].hasVoted[user];
    }
    
    /**
     * Get user's vote on a dispute
     */
    function getUserVote(uint256 disputeId, address user) external view returns (bool) {
        require(disputes[disputeId].hasVoted[user], "User hasn't voted");
        return disputes[disputeId].votedForRemoval[user];
    }
    
    /**
     * Get all disputes for an IP token
     */
    function getDisputesForIP(uint256 ipTokenId) external view returns (uint256[] memory) {
        return ipToDisputes[ipTokenId];
    }
    
    /**
     * Check if IP has any active disputes
     */
    function hasActiveDisputes(uint256 ipTokenId) external view returns (bool) {
        uint256[] memory disputeIds = ipToDisputes[ipTokenId];
        for (uint256 i = 0; i < disputeIds.length; i++) {
            if (!disputes[disputeIds[i]].resolved) {
                return true;
            }
        }
        return false;
    }
}
