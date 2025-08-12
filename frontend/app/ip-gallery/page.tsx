'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { IPNFT_ADDRESS, IPNFT_ABI } from '../config/contracts'
import { ethers } from 'ethers'

interface IPMetadata {
  title: string
  description: string
  authors: Array<{
    name: string
    orcid: string
    affiliation: string
    wallet: string
  }>
  date_of_creation: string
  version: string
  ip_type: string
  keywords: string[]
  permanent_content_reference: {
    uri: string
    content_hash: string
  }
  optional?: {
    peer_review_status?: string
    funding_info?: string
    ai_summary?: string
  }
}

interface IPNFT {
  tokenId: string
  owner: string
  metadata: IPMetadata | null
  metadataUri: string
  contentHash: string
  paymentSplitter: string
}

export default function IPGalleryPage() {
  const [ipnfts, setIpnfts] = useState<IPNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIPNFTs()
  }, [])

  const fetchIPNFTs = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!IPNFT_ADDRESS) {
        throw new Error('IPNFT contract address not configured')
      }

      console.log('Fetching IP NFTs from contract:', IPNFT_ADDRESS)

      const ethereum = (window as any).ethereum
      if (!ethereum) {
        throw new Error('No wallet found. Please install MetaMask')
      }

      const provider = new ethers.BrowserProvider(ethereum)
      const ipnftContract = new ethers.Contract(IPNFT_ADDRESS, IPNFT_ABI, provider)

      // Get recent IPMinted events to find existing tokens
      const currentBlock = await provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 1999) // Exactly 2000 blocks (inclusive)
      
      console.log(`Searching blocks ${fromBlock} to ${currentBlock} (${currentBlock - fromBlock + 1} blocks)`)
      
      const filter = ipnftContract.filters.IPMinted()
      const events = await ipnftContract.queryFilter(filter, fromBlock, currentBlock)
      
      console.log(`Found ${events.length} IPMinted events in recent blocks`)
      
      // Extract token IDs from events
      const tokenIds = events.map(event => {
        try {
          const parsed = ipnftContract.interface.parseLog(event)
          return parsed ? Number(parsed.args[0]) : null
        } catch {
          return null
        }
      }).filter((id): id is number => id !== null).sort((a, b) => a - b)
      
      console.log('Token IDs from recent blocks:', tokenIds)
      
      // If no events found in recent blocks, try a broader search with smaller chunks
      let allTokenIds = tokenIds
      if (tokenIds.length === 0) {
        console.log('No recent mint events found, searching broader range...')
        
        // Try searching in smaller chunks of 1000 blocks to be safe
        const chunks = []
        for (let i = 0; i < 10; i++) { // Search up to 10k blocks in chunks of 1000
          const chunkFrom = Math.max(0, currentBlock - (i + 1) * 1000)
          const chunkTo = Math.max(0, currentBlock - i * 1000)
          if (chunkFrom < chunkTo) {
            chunks.push({ from: chunkFrom, to: chunkTo })
          }
        }
        
        console.log(`Searching ${chunks.length} chunks for older events`)
        
        for (const chunk of chunks) {
          try {
            console.log(`Searching chunk: ${chunk.from} to ${chunk.to}`)
            const chunkEvents = await ipnftContract.queryFilter(filter, chunk.from, chunk.to)
            console.log(`Found ${chunkEvents.length} events in chunk ${chunk.from}-${chunk.to}`)
            const chunkTokenIds = chunkEvents.map(event => {
              try {
                const parsed = ipnftContract.interface.parseLog(event)
                return parsed ? Number(parsed.args[0]) : null
              } catch {
                return null
              }
            }).filter((id): id is number => id !== null)
            allTokenIds.push(...chunkTokenIds)
          } catch (err) {
            console.warn(`Failed to fetch events for block range ${chunk.from}-${chunk.to}:`, err)
            // Continue with next chunk
          }
        }
        
        // Remove duplicates and sort
        allTokenIds = [...new Set(allTokenIds)].sort((a, b) => a - b)
        console.log('All token IDs found:', allTokenIds)
      }
      
      const fetchedIPNFTs: IPNFT[] = []

      // Fetch each token
      for (const tokenId of allTokenIds) {
        try {
          console.log(`Fetching details for token ${tokenId}`)
          const owner = await ipnftContract.ownerOf(tokenId)
          const metadataUri = await ipnftContract.tokenURI(tokenId)
          const paymentSplitter = await ipnftContract.getPaymentSplitter(tokenId)

          console.log(`Token ${tokenId}: owner=${owner}, metadataUri=${metadataUri}`)

          // Fetch metadata from IPFS
          let metadata: IPMetadata | null = null
          if (metadataUri.startsWith('ipfs://')) {
            const ipfsHash = metadataUri.replace('ipfs://', '')
            console.log(`Fetching metadata from IPFS: ${ipfsHash}`)
            const metadataResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)
            if (metadataResponse.ok) {
              metadata = await metadataResponse.json()
              console.log(`Metadata for token ${tokenId}:`, metadata)
            } else {
              console.warn(`Failed to fetch metadata for token ${tokenId}: ${metadataResponse.status}`)
            }
          }

          // Get content hash from metadata or contract
          let contentHash = ''
          if (metadata?.permanent_content_reference?.content_hash) {
            contentHash = metadata.permanent_content_reference.content_hash
          }

          fetchedIPNFTs.push({
            tokenId: tokenId.toString(),
            owner,
            metadata,
            metadataUri,
            contentHash,
            paymentSplitter
          })
        } catch (err) {
          console.warn(`Failed to fetch token ${tokenId}:`, err)
          // Continue with other tokens
        }
      }

      console.log(`Successfully fetched ${fetchedIPNFTs.length} IP NFTs`)
      setIpnfts(fetchedIPNFTs)
    } catch (err: any) {
      console.error('Error fetching IPNFTs:', err)
      setError(err?.message || 'Failed to fetch IP NFTs')
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navigation />
        <div className="pt-16 lg:pt-20 bg-white/30 backdrop-blur-lg border border-white/30 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading IP NFTs...</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <Navigation />
        <div className="pt-16 lg:pt-20 bg-white/30 backdrop-blur-lg border border-white/30 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="text-red-600 text-lg mb-4">Error: {error}</div>
              <button
                onClick={fetchIPNFTs}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Navigation />
      
      <div className="pt-16 lg:pt-20 bg-white/30 backdrop-blur-lg border border-white/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Debug Section */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Info</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>Contract Address: {IPNFT_ADDRESS || 'NOT SET'}</div>
              <div>Environment: {process.env.NODE_ENV}</div>
              <button 
                onClick={async () => {
                  try {
                    const ethereum = (window as any).ethereum
                    if (!ethereum) {
                      alert('No wallet found')
                      return
                    }
                    const provider = new ethers.BrowserProvider(ethereum)
                    const contract = new ethers.Contract(IPNFT_ADDRESS, IPNFT_ABI, provider)
                    
                    // Test basic contract calls
                    console.log('Testing contract connectivity...')
                    const currentBlock = await provider.getBlockNumber()
                    console.log('Current block:', currentBlock)
                    
                    // Try to get total supply or check if contract exists
                    try {
                      const filter = contract.filters.IPMinted()
                      const events = await contract.queryFilter(filter, 0, 'latest')
                      console.log('Total IPMinted events found:', events.length)
                      alert(`Contract is working! Found ${events.length} total IPMinted events`)
                                         } catch (err: any) {
                       console.error('Contract test failed:', err)
                       alert(`Contract test failed: ${err?.message || 'Unknown error'}`)
                     }
                   } catch (err: any) {
                     console.error('Debug test failed:', err)
                     alert(`Debug test failed: ${err?.message || 'Unknown error'}`)
                   }
                }}
                className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
              >
                Test Contract Connection
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              IP NFT Gallery
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore all minted intellectual property NFTs on the platform
            </p>
            <div className="mt-4 text-sm text-gray-500">
              {ipnfts.length} IP NFT{ipnfts.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* IP NFTs Grid */}
          {ipnfts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">No IP NFTs found</div>
              <p className="text-gray-400">Be the first to mint an IP NFT!</p>
              <a href="/mint" className="btn-primary mt-4 inline-block">
                Mint Your First IP
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ipnfts.map((ipnft) => (
                <div key={ipnft.tokenId} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                        {ipnft.metadata?.title || `IP NFT #${ipnft.tokenId}`}
                      </h3>
                      <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                        #{ipnft.tokenId}
                      </span>
                    </div>
                    
                    {ipnft.metadata?.description && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {ipnft.metadata.description}
                      </p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Authors */}
                    {ipnft.metadata?.authors && ipnft.metadata.authors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Authors</h4>
                        <div className="space-y-1">
                          {ipnft.metadata.authors.slice(0, 2).map((author, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              {author.name}
                              {author.affiliation && ` • ${author.affiliation}`}
                            </div>
                          ))}
                          {ipnft.metadata.authors.length > 2 && (
                            <div className="text-sm text-gray-500">
                              +{ipnft.metadata.authors.length - 2} more authors
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Keywords */}
                    {ipnft.metadata?.keywords && ipnft.metadata.keywords.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {ipnft.metadata.keywords.slice(0, 3).map((keyword, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              {keyword}
                            </span>
                          ))}
                          {ipnft.metadata.keywords.length > 3 && (
                            <span className="text-gray-500 text-xs">+{ipnft.metadata.keywords.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      {ipnft.metadata?.date_of_creation && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-700">{formatDate(ipnft.metadata.date_of_creation)}</span>
                        </div>
                      )}
                      {ipnft.metadata?.ip_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span className="text-gray-700 capitalize">{ipnft.metadata.ip_type}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Owner:</span>
                        <span className="text-gray-700 font-mono">{formatAddress(ipnft.owner)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Content Hash: {formatAddress(ipnft.contentHash)}
                      </div>
                      <button
                        onClick={() => window.open(`https://seiscan.app/address/${ipnft.owner}`, '_blank')}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        View on Explorer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center mt-12">
            <button
              onClick={fetchIPNFTs}
              className="btn-secondary"
            >
              Refresh Gallery
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
