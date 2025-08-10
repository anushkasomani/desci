// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * LicenseNFT.sol
 * - ERC721 License contract that allows IP owners to create license offers for their IP tokens.
 * - On purchase, mints license NFT to buyer and forwards funds to the IP token's PaymentSplitter
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IPNFT.sol";

contract LicenseNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _licenseOfferIdCounter;
    Counters.Counter private _licenseTokenIdCounter;

    IPNFT public ipContract;

    struct LicenseOffer {
        uint256 offerId;
        uint256 ipTokenId;      // token id of the IP this license references
        address ipOwner;        // owner who created the offer
        uint256 priceWei;       // price in wei
        string licenseURI;      // IPFS license JSON (human + machine-readable)
        uint64 expiry;          // unix timestamp after which offer is invalid (0 = never)
        bool active;
    }

    mapping(uint256 => LicenseOffer) public licenseOffers;

    event LicenseOfferCreated(uint256 indexed offerId, uint256 indexed ipTokenId, address indexed ipOwner, uint256 priceWei, string licenseURI, uint64 expiry);
    event LicensePurchased(uint256 indexed offerId, uint256 indexed licenseTokenId, address indexed buyer, uint256 priceWei);

    constructor(address _ipContract, string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        require(_ipContract != address(0), "ip contract zero");
        ipContract = IPNFT(_ipContract);
    }

    function createLicenseOffer(
        uint256 ipTokenId,
        uint256 priceWei,
        string calldata licenseURI,
        uint64 expiry
    ) external returns (uint256) {
        require(ipContract.ownerOf(ipTokenId) == msg.sender, "not ip owner");

        _licenseOfferIdCounter.increment();
        uint256 offerId = _licenseOfferIdCounter.current();

        licenseOffers[offerId] = LicenseOffer({
            offerId: offerId,
            ipTokenId: ipTokenId,
            ipOwner: msg.sender,
            priceWei: priceWei,
            licenseURI: licenseURI,
            expiry: expiry,
            active: true
        });

        emit LicenseOfferCreated(offerId, ipTokenId, msg.sender, priceWei, licenseURI, expiry);
        return offerId;
    }

    function buyLicense(uint256 offerId) external payable nonReentrant returns (uint256) {
        LicenseOffer storage offer = licenseOffers[offerId];
        require(offer.active, "offer inactive");
        require(offer.priceWei > 0, "free? use a request flow");
        require(msg.value >= offer.priceWei, "insufficient payment");
        require(offer.expiry == 0 || block.timestamp <= offer.expiry, "offer expired");

        // Mint license NFT to buyer
        _licenseTokenIdCounter.increment();
        uint256 licenseTokenId = _licenseTokenIdCounter.current();

        _safeMint(msg.sender, licenseTokenId);
        _setTokenURI(licenseTokenId, offer.licenseURI);

        // Forward funds to the PaymentSplitter associated with the IP token
        address splitter = ipContract.getPaymentSplitter(offer.ipTokenId);
        require(splitter != address(0), "no splitter");

        (bool sent, ) = payable(splitter).call{value: offer.priceWei}("");
        require(sent, "failed forward funds");

        if (msg.value > offer.priceWei) {
            (bool refunded, ) = payable(msg.sender).call{value: (msg.value - offer.priceWei)}("");
            require(refunded, "refund failed");
        }

        emit LicensePurchased(offerId, licenseTokenId, msg.sender, offer.priceWei);
        return licenseTokenId;
    }

    function deactivateOffer(uint256 offerId) external {
        LicenseOffer storage offer = licenseOffers[offerId];
        require(offer.offerId != 0, "no offer");
        require(offer.ipOwner == msg.sender, "not creator");
        offer.active = false;
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
