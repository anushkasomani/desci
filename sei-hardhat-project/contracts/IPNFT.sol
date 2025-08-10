// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * IPNFT.sol
 * - ERC721 IP token
 * - ERC2981 royalties (OpenZeppelin v4)
 * - Deploys an OpenZeppelin PaymentSplitter per IP at mint time to manage author payouts
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IPNFT is ERC721, ERC721URIStorage, ERC2981, Ownable {
    struct IPInfo {
        string metadataURI;        // IPFS metadata JSON CID (ipfs://...)
        bytes32 contentHash;       // SHA-256 hash of PDF/content (bytes32)
        address paymentSplitter;   // address of PaymentSplitter contract
    }

    mapping(uint256 => IPInfo) public ipInfo;
    uint256 private _nextTokenId = 1;

    event IPMinted(uint256 indexed tokenId, address indexed author, string metadataURI, bytes32 contentHash, address splitter);
    event LicenseLinked(uint256 indexed tokenId, address licenseContract);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /**
     * Mint an IP NFT.
     */
    function mintIP(
        address author,
        string calldata metadataURI,
        bytes32 contentHash,
        address royaltyRecipient,
        uint96 royaltyBps,
        address[] calldata payees,
        uint256[] calldata shares
    ) external returns (uint256) {
        require(author != address(0), "author zero");
        require(payees.length == shares.length && payees.length > 0, "invalid payees/shares");

        uint256 tokenId = _nextTokenId++;
        _safeMint(author, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Deploy a PaymentSplitter for this IP
        PaymentSplitter splitter = new PaymentSplitter(payees, shares);

        ipInfo[tokenId] = IPInfo({
            metadataURI: metadataURI,
            contentHash: contentHash,
            paymentSplitter: address(splitter)
        });

        if (royaltyRecipient != address(0) && royaltyBps > 0) {
            _setTokenRoyalty(tokenId, royaltyRecipient, royaltyBps);
        }

        emit IPMinted(tokenId, author, metadataURI, contentHash, address(splitter));
        return tokenId;
    }

    function getPaymentSplitter(uint256 tokenId) external view returns (address) {
        require(_exists(tokenId), "no token");
        return ipInfo[tokenId].paymentSplitter;
    }

    /* ---------- Overrides required because of multiple inheritance ---------- */

    // ERC721URIStorage and ERC721 both declare tokenURI/_burn; include both in override
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        // Note: we intentionally do not selfdestruct splitter; keep payout history
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // supportsInterface must include all parents that implement it
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
