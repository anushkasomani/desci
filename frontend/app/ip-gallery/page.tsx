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

const DEPLOYMENT_BLOCK = 191142300
const BLOCK_CHUNK_SIZE = 2000

export default function IPGalleryPage() {
  const [ipnfts, setIpnfts] = useState<IPNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIPNFTs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const IPFS_GATEWAYS = [
    'https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ]

  // Fetch JSON from either a full URL, /ipfs/<cid> path or ipfs://<cid>
  async function fetchJsonFromUri(uri: string): Promise<any | null> {
    const tryUrls: string[] = []

    if (!uri) return null

    // Normalize and prepare list of candidate URLs (user's gateway first)
    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace(/^ipfs:\/\//, '')
      for (const gateway of IPFS_GATEWAYS) tryUrls.push(`${gateway}${cid}`)
    } else if (/^https?:\/\//i.test(uri)) {
      // full URL provided (could be pinata subdomain already)
      tryUrls.push(uri)

      // if the URL contains /ipfs/<cid>, also push fallback gateways
      const match = uri.match(/\/ipfs\/([A-Za-z0-9]+)/)
      if (match) {
        const cid = match[1]
        for (const gateway of IPFS_GATEWAYS) {
          const candidate = `${gateway}${cid}`
          if (!tryUrls.includes(candidate)) tryUrls.push(candidate)
        }
      }
    } else if (uri.includes('/ipfs/')) {
      // missing protocol e.g. "moccasin-.../ipfs/<cid>"
      tryUrls.push(`https://${uri}`)
      const match = uri.match(/\/ipfs\/([A-Za-z0-9]+)/)
      if (match) {
        const cid = match[1]
        for (const gateway of IPFS_GATEWAYS) {
          const candidate = `${gateway}${cid}`
          if (!tryUrls.includes(candidate)) tryUrls.push(candidate)
        }
      }
    } else {
      // maybe raw CID or unexpected format — try gateways + https
      for (const gateway of IPFS_GATEWAYS) tryUrls.push(`${gateway}${uri}`)
      tryUrls.push(`https://${uri}`)
    }

    for (const url of tryUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) {
          console.warn(`Metadata fetch returned ${res.status} for ${url}`)
          continue
        }
        // parse JSON; if not JSON, will throw and we move to next
        const json = await res.json()
        return json
      } catch (err: any) {
        // Common reasons: network, CORS, cert issues; try next gateway
        console.warn(`Failed to fetch ${url}: ${err?.message ?? err}`)
        continue
      }
    }

    return null
  }

  const fetchIPNFTs = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!IPNFT_ADDRESS) {
        throw new Error('IPNFT contract address not configured')
      }

      const ethereum = (window as any).ethereum
      if (!ethereum) {
        throw new Error('No wallet found. Please install MetaMask')
      }

      const provider = new ethers.BrowserProvider(ethereum)
      const ipnftContract = new ethers.Contract(IPNFT_ADDRESS, IPNFT_ABI, provider)

      const currentBlock = await provider.getBlockNumber()
      const filter = ipnftContract.filters.IPMinted()

      let allTokenIds: number[] = []

      console.log(`Scanning blocks from ${DEPLOYMENT_BLOCK} to ${currentBlock} in chunks of ${BLOCK_CHUNK_SIZE}...`)

      for (let fromBlock = Math.max(DEPLOYMENT_BLOCK, 0); fromBlock <= currentBlock; fromBlock += BLOCK_CHUNK_SIZE) {
        const toBlock = Math.min(fromBlock + BLOCK_CHUNK_SIZE - 1, currentBlock)
        try {
          console.log(`Querying events ${fromBlock} -> ${toBlock}`)
          const events = await ipnftContract.queryFilter(filter, fromBlock, toBlock)

          if (events && events.length) {
            const chunkIds = events.map((evt: any) => {
              try {
                const parsed = ipnftContract.interface.parseLog(evt)
                if (parsed && parsed.args && parsed.args[0] != null) {
                  const raw = parsed.args[0]
                  return Number(raw.toString())
                }
                return null
              } catch {
                try {
                  const candidate = evt.args ? evt.args[0] : null
                  return candidate != null ? Number(candidate.toString()) : null
                } catch {
                  return null
                }
              }
            }).filter((id: number | null): id is number => id !== null)

            console.log(`Found ${chunkIds.length} minted tokens in chunk`)
            allTokenIds.push(...chunkIds)
          }
        } catch (err: any) {
          console.warn(`Failed query for ${fromBlock}-${toBlock}:`, err?.message ?? err)
        }
      }

      allTokenIds = Array.from(new Set(allTokenIds)).sort((a, b) => a - b)
      console.log('All token ids:', allTokenIds)

      const fetchedIPNFTs: IPNFT[] = []

      for (const tokenId of allTokenIds) {
        try {
          console.log(`Fetching token ${tokenId}`)
          const owner = await ipnftContract.ownerOf(tokenId)
          const metadataUri = await ipnftContract.tokenURI(tokenId)
          const paymentSplitter = await ipnftContract.getPaymentSplitter(tokenId)

          let metadata: IPMetadata | null = null
          if (metadataUri) {
            metadata = await fetchJsonFromUri(String(metadataUri))
            if (!metadata) {
              console.warn(`Could not fetch metadata for token ${tokenId} from ${metadataUri}`)
            }
          }

          let contentHash = ''
          if (metadata?.permanent_content_reference?.content_hash) {
            contentHash = metadata.permanent_content_reference.content_hash
          }

          fetchedIPNFTs.push({
            tokenId: tokenId.toString(),
            owner,
            metadata,
            metadataUri: String(metadataUri || ''),
            contentHash,
            paymentSplitter
          })
        } catch (err) {
          console.warn(`Failed to fetch details for token ${tokenId}:`, err)
        }
      }

      setIpnfts(fetchedIPNFTs)
      console.log(`Fetched ${fetchedIPNFTs.length} IP NFTs`)
    } catch (err: any) {
      console.error('Error fetching IPNFTs:', err)
      setError(err?.message || 'Failed to fetch IP NFTs')
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

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
              <button onClick={fetchIPNFTs} className="btn-primary">Retry</button>
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

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">IP NFT Gallery</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Explore all minted intellectual property NFTs on the platform</p>
            <div className="mt-4 text-sm text-gray-500">{ipnfts.length} IP NFT{ipnfts.length !== 1 ? 's' : ''} found</div>
          </div>

          {/* Grid */}
          {ipnfts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">No IP NFTs found</div>
              <p className="text-gray-400">Be the first to mint an IP NFT!</p>
              <a href="/mint" className="btn-primary mt-4 inline-block">Mint Your First IP</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ipnfts.map((ipnft) => (
                <div key={ipnft.tokenId} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{ipnft.metadata?.title || `IP NFT #${ipnft.tokenId}`}</h3>
                      <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">#{ipnft.tokenId}</span>
                    </div>
                    {ipnft.metadata?.description && <p className="text-gray-600 text-sm line-clamp-3">{ipnft.metadata.description}</p>}
                  </div>

                  <div className="p-6">
                    {ipnft.metadata?.authors && ipnft.metadata.authors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Authors</h4>
                        <div className="space-y-1">
                          {ipnft.metadata.authors.slice(0, 2).map((author, idx) => (
                            <div key={idx} className="text-sm text-gray-600">{author.name}{author.affiliation && ` • ${author.affiliation}`}</div>
                          ))}
                          {ipnft.metadata.authors.length > 2 && <div className="text-sm text-gray-500">+{ipnft.metadata.authors.length - 2} more authors</div>}
                        </div>
                      </div>
                    )}

                    {ipnft.metadata?.keywords && ipnft.metadata.keywords.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {ipnft.metadata.keywords.slice(0, 3).map((keyword, idx) => <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{keyword}</span>)}
                          {ipnft.metadata.keywords.length > 3 && <span className="text-gray-500 text-xs">+{ipnft.metadata.keywords.length - 3} more</span>}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {ipnft.metadata?.date_of_creation && <div className="flex justify-between"><span className="text-gray-500">Created:</span><span className="text-gray-700">{formatDate(ipnft.metadata.date_of_creation)}</span></div>}
                      {ipnft.metadata?.ip_type && <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="text-gray-700 capitalize">{ipnft.metadata.ip_type}</span></div>}
                      <div className="flex justify-between"><span className="text-gray-500">Owner:</span><span className="text-gray-700 font-mono">{formatAddress(ipnft.owner)}</span></div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">Content Hash: {formatAddress(ipnft.contentHash)}</div>
                      <button onClick={() => window.open(`https://testnet.seistream.app/tokens/${IPNFT_ADDRESS}/${ipnft.tokenId}?standart=erc721`, '_blank')} className="text-primary-600 hover:text-primary-800 text-sm font-medium">View on Explorer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refresh */}
          <div className="text-center mt-12">
            <button onClick={fetchIPNFTs} className="btn-secondary">Refresh Gallery</button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
