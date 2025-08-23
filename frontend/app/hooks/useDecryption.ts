'use client'

import { useState } from 'react';

interface DecryptionResult {
  decryptedFile: File | null;
  error: string | null;
  isLoading: boolean;
}

interface DecryptionInfo {
  key: string;
  algorithm: string;
  iv: string;
  contentCid: string;
}

export function useDecryption() {
  const [isLoading, setIsLoading] = useState(false);

  const getDecryptionKey = async (
    ipTokenId: string,
    licenseTokenId: string,
    userAddress: string
  ): Promise<DecryptionInfo | null> => {
    try {
      // Call our backend API to get the decryption key
      // This API should verify that the user owns the license token
      const response = await fetch('/api/get-decryption-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipTokenId,
          licenseTokenId,
          userAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get decryption key');
      }

      const data = await response.json();
      return data.decryptionInfo;
    } catch (error) {
      console.error('Error getting decryption key:', error);
      return null;
    }
  };

  const decryptFile = async (
    encryptedFileUrl: string,
    decryptionInfo: DecryptionInfo
  ): Promise<DecryptionResult> => {
    setIsLoading(true);
    
    try {
      // Fetch the encrypted file from IPFS
      const response = await fetch(encryptedFileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch encrypted file');
      }
      
      const encryptedBlob = await response.blob();
      
      // Convert base64 key and IV back to Uint8Array
      const keyBytes = Uint8Array.from(atob(decryptionInfo.key), c => c.charCodeAt(0));
      const ivBytes = Uint8Array.from(atob(decryptionInfo.iv), c => c.charCodeAt(0));
      
      // Import the key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Convert blob to ArrayBuffer
      const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
      
      // Decrypt the file
      const decryptedArrayBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        cryptoKey,
        encryptedArrayBuffer
      );
      
      // Create a new file from the decrypted data
      const decryptedFile = new File(
        [decryptedArrayBuffer],
        'decrypted_file',
        { type: 'application/octet-stream' }
      );
      
      return {
        decryptedFile,
        error: null,
        isLoading: false
      };
      
    } catch (error) {
      return {
        decryptedFile: null,
        error: error instanceof Error ? error.message : 'Decryption failed',
        isLoading: false
      };
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDecryptedFile = (file: File, filename?: string) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    getDecryptionKey,
    decryptFile,
    downloadDecryptedFile,
    isLoading
  };
}
