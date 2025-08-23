'use client'

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LICENSE_NFT_ADDRESS, LicenseNFT_ABI } from '../config/contracts';
import FileDecryptor from '../components/FileDecryptor';

interface LicenseToken {
  tokenId: string;
  tokenURI: string;
  ipTokenId: string;
  metadata: any;
}

export default function MyLicensesPage() {
  const [licenseTokens, setLicenseTokens] = useState<LicenseToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    const connectWallet = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.send('eth_accounts', []);
          if (accounts && accounts.length > 0) {
            setUserAddress(accounts[0]);
            await fetchLicenseTokens(accounts[0]);
          }
        }
      } catch (e) {
        console.warn("Could not connect wallet:", e);
      }
    };

    connectWallet();
  }, []);

  const fetchLicenseTokens = async (address: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const licenseContract = new ethers.Contract(LICENSE_NFT_ADDRESS, LicenseNFT_ABI, provider);

      // Get the total number of license tokens
      const totalSupply = await licenseContract._licenseTokenIdCounter();
      
      const userLicenses: LicenseToken[] = [];

      // Check each token to see if the user owns it
      for (let i = 1; i <= totalSupply; i++) {
        try {
          const owner = await licenseContract.ownerOf(i);
          if (owner.toLowerCase() === address.toLowerCase()) {
            const tokenURI = await licenseContract.tokenURI(i);
            
            // Fetch metadata from IPFS
            const ipfsUrl = tokenURI.replace('ipfs://', 'https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/');
            const metadataResponse = await fetch(ipfsUrl);
            const metadata = await metadataResponse.json();

            // Extract IP token ID from metadata or try to get it from the contract
            // This might need to be adjusted based on your actual contract structure
            let ipTokenId = '0'; // Default fallback
            try {
              // You might need to add a function to get IP token ID from license token
              // For now, we'll try to extract it from metadata if available
              if (metadata.ipTokenId) {
                ipTokenId = metadata.ipTokenId;
              }
            } catch (e) {
              console.warn(`Could not get IP token ID for license ${i}:`, e);
            }

            userLicenses.push({
              tokenId: i.toString(),
              tokenURI,
              ipTokenId,
              metadata
            });
          }
        } catch (e) {
          console.warn(`Error checking license token ${i}:`, e);
        }
      }

      setLicenseTokens(userLicenses);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch license tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts && accounts.length > 0) {
          setUserAddress(accounts[0]);
          await fetchLicenseTokens(accounts[0]);
        }
      }
    } catch (e) {
      setError('Failed to connect wallet');
    }
  };

  if (!userAddress) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">My License Tokens</h1>
            <p className="text-gray-600 mb-8">
              Connect your wallet to view and manage your license tokens.
            </p>
            <button
              onClick={connectWallet}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My License Tokens</h1>
          <p className="text-gray-600">
            Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 bg-white rounded-lg border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800">
              <h3 className="font-medium">Error</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : licenseTokens.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No License Tokens Found</h3>
            <p className="text-gray-600">
              You don't have any license tokens yet. Purchase a license to access encrypted content.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {licenseTokens.map((license) => (
              <div key={license.tokenId} className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      License Token #{license.tokenId}
                    </h3>
                    <p className="text-sm text-gray-600">
                      IP Token: #{license.ipTokenId}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>

                {license.metadata && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">License Details</h4>
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Name:</span> {license.metadata.name}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Description:</span> {license.metadata.description}
                      </p>
                      {license.metadata.license_type && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Type:</span> {license.metadata.license_type}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* File Decryptor Component */}
                <FileDecryptor
                  licenseTokenId={license.tokenId}
                  licenseMetadataUri={license.tokenURI}
                  ipTokenId={license.ipTokenId}
                  userAddress={userAddress}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
