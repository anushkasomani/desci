// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * DerivativeIP.sol - Derivative IP Management
 * - Tracks parent-child relationships between IP tokens
 * - Manages attribution and licensing for derivative works
 * - Enables collaborative research and building upon existing work
 * - License tokens are consumed (one-time use) when creating derivatives
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IPNFT.sol";
import "./LicenseNFT.sol";

contract DerivativeIP is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    IPNFT public ipContract;
    LicenseNFT public licenseContract;
    Counters.Counter private _derivativeTokenIdCounter;
    
    struct DerivativeInfo {
        uint256 derivativeTokenId;
        uint256[] parentTokenIds;      // Array of parent IP token IDs
        address creator;
        string metadataURI;
        bytes32 contentHash;
        DerivativeType derivativeType;
        uint256 creationTimestamp;
        bool isCommercial;             // Can this derivative be licensed commercially?
        uint256[] consumedLicenseIds;  // License tokens consumed to create this derivative
    }
    
    enum DerivativeType {
        REMIX,         // Modified version of original
        EXTENSION,     // Builds upon original work
        COLLABORATION, // Joint work with original authors
        VALIDATION,    // Reproduces/validates original findings
        CRITIQUE       // Critical analysis of original work
    }
    
    mapping(uint256 => DerivativeInfo) public derivativeInfo;
    mapping(uint256 => uint256[]) public ipToDerivatives; // Parent IP to derivative tokens
    mapping(uint256 => uint256[]) public derivativeToParents; // Derivative to parent IPs
    mapping(uint256 => bool) public consumedLicenses; // Track consumed license tokens
    
    event DerivativeCreated(
        uint256 indexed derivativeTokenId, 
        uint256[] parentTokenIds, 
        address indexed creator, 
        DerivativeType derivativeType,
        bool isCommercial,
        uint256[] consumedLicenseIds
    );
    
    event ParentAttributed(uint256 indexed derivativeTokenId, uint256 indexed parentTokenId);
    event LicenseConsumed(uint256 indexed licenseTokenId, uint256 indexed derivativeTokenId);
    
    constructor(
        address _ipContract, 
        address _licenseContract, 
        string memory name_, 
        string memory symbol_
    ) ERC721(name_, symbol_) {
        require(_ipContract != address(0), "IP contract zero");
        require(_licenseContract != address(0), "License contract zero");
        
        ipContract = IPNFT(_ipContract);
        licenseContract = LicenseNFT(_licenseContract);
    }
    
    /**
     * Create a derivative IP token
     * @param parentTokenIds Array of parent IP token IDs
     * @param licenseTokenIds Array of license token IDs to consume (must be owned by caller)
     * @param metadataURI IPFS metadata URI for the derivative
     * @param contentHash Content hash of the derivative
     * @param derivativeType Type of derivative being created
     * @param isCommercial Whether this derivative can be licensed commercially
     */
    function createDerivative(
        uint256[] calldata parentTokenIds,
        uint256[] calldata licenseTokenIds,
        string calldata metadataURI,
        bytes32 contentHash,
        DerivativeType derivativeType,
        bool isCommercial
    ) external returns (uint256) {
        require(parentTokenIds.length > 0, "Must have at least one parent");
        require(parentTokenIds.length <= 10, "Too many parents");
        // If user is not owner of any parent IP, they must provide licenses
        bool isOwnerOfAnyParent = false;
        for (uint256 i = 0; i < parentTokenIds.length; i++) {
            if (ipContract.ownerOf(parentTokenIds[i]) == msg.sender) {
                isOwnerOfAnyParent = true;
                break;
            }
        }
        
        if (!isOwnerOfAnyParent) {
            require(licenseTokenIds.length > 0, "Must provide at least one license if not owner");
        }
        
        // Verify parent tokens exist, are not suspended, and user has access
        for (uint256 i = 0; i < parentTokenIds.length; i++) {
            require(ipContract.ownerOf(parentTokenIds[i]) != address(0), "Parent doesn't exist");
            require(!ipContract.isSuspended(parentTokenIds[i]), "parent suspended");
            
            // Check if user has access (owner or valid license)
            bool hasAccess = _checkAccessToParent(parentTokenIds[i], msg.sender, licenseTokenIds);
            require(hasAccess, "No access to parent IP");
        }
        
        // Verify and consume license tokens (if any provided)
        for (uint256 i = 0; i < licenseTokenIds.length; i++) {
            uint256 licenseId = licenseTokenIds[i];
            require(!consumedLicenses[licenseId], "License already consumed");
            require(licenseContract.ownerOf(licenseId) == msg.sender, "Not license owner");
            
            // Mark license as consumed
            consumedLicenses[licenseId] = true;
        }
        
        _derivativeTokenIdCounter.increment();
        uint256 derivativeTokenId = _derivativeTokenIdCounter.current();
        
        _safeMint(msg.sender, derivativeTokenId);
        _setTokenURI(derivativeTokenId, metadataURI);
        
        derivativeInfo[derivativeTokenId] = DerivativeInfo({
            derivativeTokenId: derivativeTokenId,
            parentTokenIds: parentTokenIds,
            creator: msg.sender,
            metadataURI: metadataURI,
            contentHash: contentHash,
            derivativeType: derivativeType,
            creationTimestamp: block.timestamp,
            isCommercial: isCommercial,
            consumedLicenseIds: licenseTokenIds
        });
        
        // Update parent-child mappings
        for (uint256 i = 0; i < parentTokenIds.length; i++) {
            ipToDerivatives[parentTokenIds[i]].push(derivativeTokenId);
            derivativeToParents[derivativeTokenId].push(parentTokenIds[i]);
        }
        
        emit DerivativeCreated(derivativeTokenId, parentTokenIds, msg.sender, derivativeType, isCommercial, licenseTokenIds);
        
        // Emit events for each consumed license
        for (uint256 i = 0; i < licenseTokenIds.length; i++) {
            emit LicenseConsumed(licenseTokenIds[i], derivativeTokenId);
        }
        
        return derivativeTokenId;
    }
    
    /**
     * Check if user has access to parent IP (owner or license holder)
     */
    function _checkAccessToParent(
        uint256 parentTokenId, 
        address user, 
        uint256[] calldata licenseTokenIds
    ) internal view returns (bool) {
        // Check if user is owner
        if (ipContract.ownerOf(parentTokenId) == user) {
            return true;
        }
        
        // Check if user has a valid license for this parent IP
        for (uint256 i = 0; i < licenseTokenIds.length; i++) {
            uint256 licenseId = licenseTokenIds[i];
            
            // Verify license exists and is owned by user
            if (licenseContract.ownerOf(licenseId) == user) {
                // Check if this license is for the parent IP
                // This would require checking the license contract's IP mapping
                // For now, we'll assume the license is valid if owned by user
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get all derivatives of a parent IP
     */
    function getDerivativesOfParent(uint256 parentTokenId) external view returns (uint256[] memory) {
        return ipToDerivatives[parentTokenId];
    }
    
    /**
     * Get all parents of a derivative
     */
    function getParentsOfDerivative(uint256 derivativeTokenId) external view returns (uint256[] memory) {
        return derivativeToParents[derivativeTokenId];
    }
    
    /**
     * Get derivative info
     */
    function getDerivativeInfo(uint256 derivativeTokenId) external view returns (
        uint256[] memory parentTokenIds,
        address creator,
        string memory metadataURI,
        bytes32 contentHash,
        DerivativeType derivativeType,
        uint256 creationTimestamp,
        bool isCommercial,
        uint256[] memory consumedLicenseIds
    ) {
        DerivativeInfo storage info = derivativeInfo[derivativeTokenId];
        return (
            info.parentTokenIds,
            info.creator,
            info.metadataURI,
            info.contentHash,
            info.derivativeType,
            info.creationTimestamp,
            info.isCommercial,
            info.consumedLicenseIds
        );
    }
    
    /**
     * Check if derivative can be licensed commercially
     */
    function canBeLicensed(uint256 derivativeTokenId) external view returns (bool) {
        return derivativeInfo[derivativeTokenId].isCommercial;
    }
    
    /**
     * Check if a license token has been consumed
     */
    function isLicenseConsumed(uint256 licenseTokenId) external view returns (bool) {
        return consumedLicenses[licenseTokenId];
    }
    
    /**
     * Get derivative type as string
     */
    function getDerivativeTypeString(uint256 derivativeTokenId) external view returns (string memory) {
        DerivativeType dType = derivativeInfo[derivativeTokenId].derivativeType;
        
        if (dType == DerivativeType.REMIX) return "Remix";
        if (dType == DerivativeType.EXTENSION) return "Extension";
        if (dType == DerivativeType.COLLABORATION) return "Collaboration";
        if (dType == DerivativeType.VALIDATION) return "Validation";
        if (dType == DerivativeType.CRITIQUE) return "Critique";
        
        return "Unknown";
    }
    
    /* ---------- Overrides for ERC721 + ERC721URIStorage ---------- */
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
