'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { gql, request } from 'graphql-request'

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
  owner?: string
  metadata: IPMetadata | null
  metadataUri: string
  contentHash: string
  paymentSplitter?: string
  transactionHash?: string
}

const IPFS_GATEWAYS = [
  'https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/'
  // 'https://ipfs.io/ipfs/',
  // 'https://cloudflare-ipfs.com/ipfs/',
  // 'https://dweb.link/ipfs/',
  // 'https://gateway.pinata.cloud/ipfs/'
]

// Skeleton loader component
const SkeletonCard = () => (
  <div className="p-4 border rounded-lg shadow-sm bg-white animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
  </div>
)

// Loading skeleton grid
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)

async function fetchJsonFromUri(uri: string): Promise<any | null> {
  const tryUrls: string[] = []
  if (!uri) return null

  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace(/^ipfs:\/\//, '')
    for (const gateway of IPFS_GATEWAYS) tryUrls.push(`${gateway}${cid}`)
  } else if (/^https?:\/\//i.test(uri)) {
    tryUrls.push(uri)
    const match = uri.match(/\/ipfs\/([A-Za-z0-9]+)/)
    if (match) {
      const cid = match[1]
      for (const gateway of IPFS_GATEWAYS) {
        const candidate = `${gateway}${cid}`
        if (!tryUrls.includes(candidate)) tryUrls.push(candidate)
      }
    }
  } else if (uri.includes('/ipfs/')) {
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
    for (const gateway of IPFS_GATEWAYS) tryUrls.push(`${gateway}${uri}`)
    tryUrls.push(`https://${uri}`)
  }

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) continue
      return await res.json()
    } catch {
      continue
    }
  }
  return null
}

export default function IPGalleryPage() {
  const [ipnfts, setIpnfts] = useState<IPNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIPNFTs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const url = 'https://api.studio.thegraph.com/query/118776/ip-sei/version/latest'
      const headers = { Authorization: 'Bearer 9c42f8dcf2cf487337de6f2b55a971ec' }

      const query = gql`
        query MyQuery {
          ipminteds(orderBy: tokenId, orderDirection: asc) {
            metadataURI
            splitter
            tokenId
            transactionHash
          }
        }
      `

      const data = await request<{ ipminteds: any[] }>(url, query, {}, headers)

      const fetched: IPNFT[] = []
      for (const ip of data.ipminteds) {
        let metadata: IPMetadata | null = null
        if (ip.metadataURI) {
          metadata = await fetchJsonFromUri(ip.metadataURI)
        }

        fetched.push({
          tokenId: ip.tokenId,
          metadata,
          metadataUri: ip.metadataURI,
          contentHash: metadata?.permanent_content_reference?.content_hash || '',
          paymentSplitter: ip.splitter,
          transactionHash: ip.transactionHash
        })
      }

      setIpnfts(fetched)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchIPNFTs()
  }, [])

  const formatAddress = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  const formatDate = (dateString: string) => {
    try { return new Date(dateString).toLocaleDateString() } catch { return dateString }
  }

  const handleRefresh = () => {
    fetchIPNFTs(true)
  }

  if (loading) {
    return (
      <main>
        <Navigation />
        <section className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <h1 className="text-2xl font-bold">Loading IP NFT Gallery...</h1>
          </div>
          <LoadingSkeleton />
        </section>
        <Footer />
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <Navigation />
        <section className="p-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={handleRefresh} 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => fetchIPNFTs()} 
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Navigation />
      <section className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">IP NFT Gallery</h1>
            <p className="text-gray-600 mt-2">
              {ipnfts.length === 0 ? 'No IP NFTs found' : `${ipnfts.length} IP NFT${ipnfts.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
              refreshing 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>

        {ipnfts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No IP NFTs Available</h2>
            <p className="text-gray-500">There are currently no IP NFTs in the gallery.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ipnfts.map(ip => (
              <div key={ip.tokenId} className="group p-6 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200 hover:border-blue-300">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                    {ip.metadata?.title || `IP NFT #${ip.tokenId}`}
                  </h3>
                  <span className="text-sm font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    #{ip.tokenId}
                  </span>
                </div>
                
                {ip.metadata?.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {ip.metadata.description}
                  </p>
                )}
                
                <div className="space-y-2 text-xs text-gray-500">
                  {ip.metadata?.date_of_creation && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Created: {formatDate(ip.metadata.date_of_creation)}</span>
                    </div>
                  )}
                  
                  {ip.contentHash && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>Hash: {formatAddress(ip.contentHash)}</span>
                    </div>
                  )}
                  
                  {ip.metadata?.ip_type && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span>Type: {ip.metadata.ip_type}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  )
}
