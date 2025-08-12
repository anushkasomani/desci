export const IPNFT_ADDRESS = process.env.NEXT_PUBLIC_IPNFT_ADDRESS || ''

export const IPNFT_ABI = [
  'function mintIP(address author, string metadataURI, bytes32 contentHash, address royaltyRecipient, uint96 royaltyBps, address[] payees, uint256[] shares) returns (uint256)',
  'event IPMinted(uint256 indexed tokenId, address indexed author, string metadataURI, bytes32 contentHash, address splitter)'
] as const
