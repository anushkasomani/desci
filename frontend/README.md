# ScienceIP Frontend

## Setup Requirements

### Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```bash
# IPNFT Contract Address
NEXT_PUBLIC_IPNFT_ADDRESS=0x...

# License NFT Contract Address  
NEXT_PUBLIC_LICENSE_CONTRACT_ADDRESS=0x...

# Pinata JWT (for IPFS uploads)
PINATA_JWT=your_pinata_jwt_here
```

### Getting Pinata JWT

1. Go to [Pinata](https://app.pinata.cloud/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key with the following permissions:
   - `pinFileToIPFS` - for uploading files
   - `pinJSONToIPFS` - for uploading metadata
5. Copy the JWT token to your `.env.local` file

### Features

- **IP Type Selection**: Choose from research paper, patent, invention, software, algorithm, dataset, methodology, formula, design, or other
- **Authors Management**: Add multiple authors with ORCID, affiliation, and wallet addresses
- **Ownership & Rights**: Configure ownership type and rights
- **License Management**: Select from various license types with default terms
- **IPFS Integration**: Automatic file and metadata upload to IPFS via Pinata
- **Blockchain Minting**: Mint IP NFTs on the blockchain
- **License NFT**: Automatic license NFT minting when configured

### Metadata Structure

The metadata follows this structure:
```json
{
  "title": "Research Title",
  "description": "Research Description", 
  "authors": [...],
  "ip_type": "research_paper|patent|invention|...",
  "ownership": {
    "type": "individual|joint|institutional|...",
    "owners": [...]
  },
  "rights": "All rights reserved|Some rights reserved|...",
  "license": {
    "type": "Creative Commons Attribution 4.0 International|...",
    "terms": "License terms..."
  },
  "permanent_content_reference": {
    "uri": "https://gateway.pinata.cloud/ipfs/CID",
    "content_hash": "0x..."
  }
}
```

### API Endpoints

- `/api/pin-file` - Upload files to IPFS
- `/api/pin-json` - Upload metadata JSON to IPFS

Both endpoints use Pinata for IPFS pinning with JWT authentication.
