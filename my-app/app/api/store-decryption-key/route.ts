import { NextRequest, NextResponse } from 'next/server';

// This would be stored in a secure database in production
// For now, we'll use a simple in-memory mapping
// In production, use a secure database with encryption
const DECRYPTION_KEYS: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const { ipTokenId, decryptionInfo } = await request.json();

    if (!ipTokenId || !decryptionInfo) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Store the decryption key for this IP
    // In production, this should be encrypted and stored in a secure database
    DECRYPTION_KEYS[ipTokenId] = decryptionInfo;

    console.log(`Stored decryption key for IP ${ipTokenId}`);

    return NextResponse.json({
      success: true,
      message: 'Decryption key stored successfully'
    });

  } catch (error) {
    console.error('Error in store-decryption-key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to get decryption key (for internal use)
export function getDecryptionKey(ipTokenId: string) {
  return DECRYPTION_KEYS[ipTokenId];
}

// Function to store decryption key (for internal use)
export function storeDecryptionKey(ipTokenId: string, decryptionInfo: any) {
  DECRYPTION_KEYS[ipTokenId] = decryptionInfo;
}
