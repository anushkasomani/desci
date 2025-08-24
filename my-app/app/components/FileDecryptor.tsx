'use client'

import { useState, useEffect } from 'react';
import { useDecryption } from '../hooks/useDecryption';

interface FileDecryptorProps {
  licenseTokenId: string;
  licenseMetadataUri: string;
  ipTokenId: string;
  userAddress?: string;
}

interface LicenseMetadata {
  name: string;
  description: string;
}

export default function FileDecryptor({ 
  licenseTokenId, 
  licenseMetadataUri, 
  ipTokenId,
  userAddress
}: FileDecryptorProps) {
  const [licenseMetadata, setLicenseMetadata] = useState<LicenseMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptedFile, setDecryptedFile] = useState<File | null>(null);
  
  const { getDecryptionKey, decryptFile, downloadDecryptedFile, isLoading: isDecrypting } = useDecryption();

  // Fetch license metadata to get decryption info
  useEffect(() => {
    const fetchLicenseMetadata = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Convert IPFS URI to HTTP URL
        const ipfsUrl = licenseMetadataUri.replace('ipfs://', 'https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/');
        
        const response = await fetch(ipfsUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch license metadata');
        }
        
        const metadata = await response.json();
        setLicenseMetadata(metadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch license metadata');
      } finally {
        setIsLoading(false);
      }
    };

    if (licenseMetadataUri) {
      fetchLicenseMetadata();
    }
  }, [licenseMetadataUri]);

  const handleDecrypt = async () => {
    try {
      setError(null);
      
      // Get the decryption key from our private mapping
      const decryptionInfo = await getDecryptionKey(ipTokenId, licenseTokenId, userAddress || '');
      
      if (!decryptionInfo) {
        setError('Decryption key not found. Please ensure you have access to this IP.');
        return;
      }
      
      // Convert IPFS content URI to HTTP URL
      const contentUrl = `https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/${decryptionInfo.contentCid}`;
      
      const result = await decryptFile(contentUrl, decryptionInfo);
      
      if (result.error) {
        setError(result.error);
      } else if (result.decryptedFile) {
        setDecryptedFile(result.decryptedFile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed');
    }
  };

  const handleDownload = () => {
    if (decryptedFile) {
      // Try to extract original filename from the content CID or use a default name
      const filename = `decrypted_ip_${ipTokenId}_${Date.now()}`;
      downloadDecryptedFile(decryptedFile, filename);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="text-red-800">
          <h3 className="font-medium">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }



  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">File Decryption</h3>
        <p className="text-sm text-gray-600">
          License Token #{licenseTokenId} - {licenseMetadata?.name || 'Unknown'}
        </p>
      </div>

      {!decryptedFile ? (
        <button
          onClick={handleDecrypt}
          disabled={isDecrypting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDecrypting ? 'Decrypting...' : 'Decrypt File'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              File decrypted successfully! You can now download it.
            </p>
          </div>
          
          <button
            onClick={handleDownload}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Download Decrypted File
          </button>
          
          <button
            onClick={() => setDecryptedFile(null)}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Decrypt Another File
          </button>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>License: {licenseMetadata?.name || 'Unknown'}</p>
        <p>IP Token: #{ipTokenId}</p>
      </div>
    </div>
  );
}
