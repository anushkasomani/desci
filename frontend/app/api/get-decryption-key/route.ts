import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { LICENSE_NFT_ADDRESS, LicenseNFT_ABI } from '../../config/contracts';

// This would be stored in a secure database in production
// For now, we'll use a simple in-memory mapping
// In production, use a secure database with encryption
const DECRYPTION_KEYS: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const { ipTokenId, licenseTokenId, userAddress } = await request.json();

    if (!ipTokenId || !licenseTokenId || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the user owns the license token
    const provider = new ethers.JsonRpcProvider(process.env.SEI_RPC_URL || 'https://sei-rpc.publicnode.com');
    const licenseContract = new ethers.Contract(LICENSE_NFT_ADDRESS, LicenseNFT_ABI, provider);

    try {
      const licenseOwner = await licenseContract.ownerOf(licenseTokenId);
      
      if (licenseOwner.toLowerCase() !== userAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'User does not own this license token' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid license token' },
        { status: 400 }
      );
    }

    // Get the decryption key for this IP
    const keyId = `${ipTokenId}_${licenseTokenId}`;
    const decryptionInfo = DECRYPTION_KEYS[keyId];

    if (!decryptionInfo) {
      return NextResponse.json(
        { error: 'Decryption key not found for this IP' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      decryptionInfo
    });

  } catch (error) {
    console.error('Error in get-decryption-key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to store decryption keys (called when IP is minted)
export function storeDecryptionKey(ipTokenId: string, licenseTokenId: string, decryptionInfo: any) {
  const keyId = `${ipTokenId}_${licenseTokenId}`;
  DECRYPTION_KEYS[keyId] = decryptionInfo;
}

// Function to get decryption key (for internal use)
export function getDecryptionKey(ipTokenId: string, licenseTokenId: string) {
  const keyId = `${ipTokenId}_${licenseTokenId}`;
  return DECRYPTION_KEYS[keyId];
}
