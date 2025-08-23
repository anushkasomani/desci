# File Decryption System for Private IP Assets

## Overview

This system provides a secure way for users to access encrypted files after purchasing license tokens. Since Lit Protocol doesn't support Sei network, we've implemented a custom solution that stores decryption keys within the license metadata.

## How It Works

### 1. File Encryption (During Minting)

When a user mints an IP asset in private mode:

1. **File Encryption**: The file is encrypted using AES-GCM with a 256-bit key
2. **Key Generation**: A random encryption key and initialization vector (IV) are generated
3. **Storage**: The encrypted file is uploaded to IPFS
4. **Key Storage**: The decryption key is stored in the license metadata (not on-chain)

### 2. License Creation

When creating license offers for private files:

1. **Metadata Enhancement**: The license metadata includes a `decryption` object containing:
   - `key`: Base64-encoded decryption key
   - `algorithm`: Encryption algorithm (AES-GCM)
   - `iv`: Base64-encoded initialization vector
   - `contentCid`: IPFS CID of the encrypted file

2. **IPFS Storage**: The enhanced license metadata is stored on IPFS
3. **Smart Contract**: The license offer is created on-chain with the IPFS URI

### 3. File Access (After License Purchase)

When a user purchases a license token:

1. **Token Ownership**: The user receives an ERC721 license token
2. **Metadata Retrieval**: The license token's metadata is fetched from IPFS
3. **Decryption**: The user can decrypt the file using the stored key and IV
4. **Download**: The decrypted file can be downloaded locally

## Security Considerations

### ✅ What's Secure
- **Encryption**: Files are encrypted with strong AES-GCM encryption
- **Key Isolation**: Decryption keys are only accessible to license holders
- **On-chain Verification**: License ownership is verified on-chain before decryption

### ⚠️ Current Limitations
- **Key Storage**: Decryption keys are stored in IPFS metadata (not end-to-end encrypted)
- **No Time-based Access**: Keys don't expire automatically
- **No Revocation**: Once a license is sold, the key cannot be revoked

## Future Improvements

### 1. Enhanced Key Management
- Implement time-based key expiration
- Add key revocation mechanisms
- Use hierarchical key derivation

### 2. Alternative Access Control
- Implement threshold encryption (require multiple keys)
- Add watermarking to decrypted files
- Implement usage tracking and analytics

### 3. Cross-chain Solutions
- Wait for Lit Protocol to support Sei network
- Implement custom access control conditions
- Use other decentralized access control protocols

## Usage

### For IP Creators
1. Upload your file and select "Private" mode
2. The system will automatically encrypt your file
3. Create license offers with appropriate pricing
4. The decryption key is automatically included in license metadata

### For License Holders
1. Purchase a license token for the IP asset
2. Navigate to "My Licenses" page
3. Click "Decrypt File" for your license
4. Download the decrypted file

## Technical Implementation

### Components
- `useDecryption` hook: Handles file decryption logic
- `FileDecryptor` component: UI for decrypting files
- `MyLicensesPage`: Page to view and manage license tokens

### Encryption Details
- **Algorithm**: AES-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **IV Size**: 12 bytes (96 bits)
- **Format**: Base64 encoded for storage

### File Flow
```
Original File → AES-GCM Encryption → IPFS Storage
     ↓
Decryption Key → License Metadata → IPFS Storage
     ↓
License Token → On-chain Ownership → Access Control
     ↓
User Purchase → Metadata Retrieval → File Decryption
```

## Troubleshooting

### Common Issues
1. **Decryption Fails**: Check if the license token is owned by the current wallet
2. **File Not Found**: Verify the IPFS gateway is accessible
3. **Key Error**: Ensure the license metadata contains valid decryption information

### Debug Steps
1. Check browser console for error messages
2. Verify license token ownership on-chain
3. Confirm IPFS metadata is accessible
4. Validate decryption key and IV format

## Conclusion

This system provides a practical solution for private file access control on Sei network while maintaining security through strong encryption. The decryption keys are securely distributed only to legitimate license holders, ensuring that private IP assets remain protected until properly licensed.
