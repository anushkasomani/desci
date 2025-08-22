'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { gql, request } from 'graphql-request'
import { ethers } from 'ethers'
import { LICENSE_NFT_ADDRESS, LicenseNFT_ABI, DERIVATIVE_IP_NFT_ADDRESS, DerivativeIPNFT_ABI, DESCI_ADDRESS, Desci_ABI } from '../config/contracts'
import { getDecryptionKeyForIP } from '../lib/lit'

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
  encryption?: {
    encrypted: boolean
    algorithm?: string
    ivB64?: string
    notes?: string
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
  offers?: LicenseOffer[]
}

interface LicenseOffer {
  offerIndex: number
  ipTokenId: string
  ipOwner: string
  licenseURI: string
  priceWei: string
  expiry: string
  licenseMetadata?: {
    name?: string
    description?: string
    licenseType?: string
    licenseTerms?: string
    createdAt?: string
    owner?: string
    price?: string
  }
}

interface LicensePurchased {
  buyer: string
  ipTokenId: string
  offerIndex: number
  licenseTokenId: string
  priceWei: string
}

interface DerivativeFormData {
  title: string
  description: string
  derivativeType: 'REMIX' | 'EXTENSION' | 'COLLABORATION' | 'VALIDATION' | 'CRITIQUE'
  isCommercial: boolean
  additionalContent: string
  parentTokenIds: string[]
  licenseTokenIds: string[]
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
  const [showDerivativeModal, setShowDerivativeModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showIPDetailsModal, setShowIPDetailsModal] = useState(false)
  const [selectedIP, setSelectedIP] = useState<IPNFT | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [isCreatingDispute, setIsCreatingDispute] = useState(false)
  const [derivativeForm, setDerivativeForm] = useState<DerivativeFormData>({
    title: '',
    description: '',
    derivativeType: 'EXTENSION',
    isCommercial: false,
    additionalContent: '',
    parentTokenIds: [],
    licenseTokenIds: []
  })
  const [userLicenses, setUserLicenses] = useState<LicensePurchased[]>([])
  const [userAddress, setUserAddress] = useState<string>('')
  const [isCreatingDerivative, setIsCreatingDerivative] = useState(false)
  const [decryptionKeys, setDecryptionKeys] = useState<Record<string,string>>({})
  const handleBuyLicense = async (tokenId: string, offerIndex: number) => {
    try {
      console.log('buying license for', { tokenId, offerIndex })
      if (!LICENSE_NFT_ADDRESS) {
        throw new Error('License contract address is not configured')
      }

      const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
      if (!ethereum) {
        throw new Error('No wallet found. Please install MetaMask or a compatible wallet.')
      }

      const provider = new ethers.BrowserProvider(ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()

      const licenseContract = new ethers.Contract(LICENSE_NFT_ADDRESS, LicenseNFT_ABI, signer)

      const ipTokenId = ethers.toBigInt(tokenId)

      const offer = await licenseContract.licenseOffersByIp(ipTokenId, offerIndex)
      if (!offer || !offer.active) {
        throw new Error('Selected license offer is not active')
      }

      const priceWei = offer.priceWei as bigint
      if (!priceWei || priceWei === BigInt(0)) {
        throw new Error('License price is zero or invalid')
      }

      console.log('Buying license with params:', { ipTokenId: tokenId, offerIndex, priceWei: priceWei.toString() })
      const tx = await licenseContract.buyLicense(ipTokenId, offerIndex, { value: priceWei })
      console.log('Transaction sent:', tx.hash)
      const receipt = await tx.wait()
      console.log('License purchased. Receipt:', receipt)
      alert('License NFT minted successfully')
      // try {
      //   if (process.env.NEXT_PUBLIC_LIT_ENABLED === 'true' && LICENSE_NFT_ADDRESS) {
      //     const keyB64 = await getDecryptionKeyForIP(tokenId, LICENSE_NFT_ADDRESS)
      //     setDecryptionKeys(prev => ({ ...prev, [tokenId]: keyB64 }))
      //     console.log(decryptionKeys[tokenId])
      //   }
      // } catch (e) { console.warn('Lit key retrieval skipped/failed:', e) }
    } catch (e: any) {
      console.error('Failed to mint license token:', e)
      setError(e?.message || 'Failed to mint license token')
      alert(e?.message || 'Failed to mint license token')
    }
  }

  const handleCreateDerivative = async () => {
    console.log('handleCreateDerivative called with:', { selectedIP, derivativeForm, DERIVATIVE_IP_NFT_ADDRESS })
    
    if (!selectedIP || !DERIVATIVE_IP_NFT_ADDRESS) {
      console.error('Missing required data:', { selectedIP: !!selectedIP, DERIVATIVE_IP_NFT_ADDRESS: !!DERIVATIVE_IP_NFT_ADDRESS })
      alert('Missing required data for derivative creation')
      return
    }

    try {
      setIsCreatingDerivative(true)
      console.log('Starting derivative creation process...')
      
      const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
      if (!ethereum) {
        throw new Error('No wallet found. Please install MetaMask or a compatible wallet.')
      }

      const provider = new ethers.BrowserProvider(ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const currentAddress = await signer.getAddress()
      setUserAddress(currentAddress)
      console.log('Wallet connected:', currentAddress)

      // Create derivative metadata
      const derivativeMetadata = {
        title: derivativeForm.title,
        description: derivativeForm.description,
        derivativeType: derivativeForm.derivativeType,
        isCommercial: derivativeForm.isCommercial,
        additionalContent: derivativeForm.additionalContent,
        parentTokenIds: derivativeForm.parentTokenIds,
        parentMetadata: selectedIP.metadata,
        createdAt: new Date().toISOString(),
        creator: currentAddress,
        type: 'derivative_ip'
      }
      console.log('Derivative metadata created:', derivativeMetadata)

      // Upload metadata to IPFS
      console.log('Uploading metadata to IPFS...')
      const metadataRes = await fetch('/api/pin-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(derivativeMetadata)
      })
      
      if (!metadataRes.ok) {
        const errorText = await metadataRes.text()
        console.error('IPFS upload failed:', errorText)
        throw new Error(`Failed to upload derivative metadata: ${metadataRes.status} - ${errorText}`)
      }
      
      const { cid: metadataCid } = await metadataRes.json()
      const metadataURI = `ipfs://${metadataCid}`
      console.log('Metadata uploaded to IPFS:', metadataURI)

      // For now, use the same content hash as parent (you can modify this based on your needs)
      const contentHash = selectedIP.contentHash || ethers.keccak256(ethers.toUtf8Bytes(derivativeForm.title))
      console.log('Content hash:', contentHash)

      // Convert string arrays to BigInt arrays for the contract
      const parentTokenIds = derivativeForm.parentTokenIds.map(id => ethers.toBigInt(id))
      const licenseTokenIds = derivativeForm.licenseTokenIds.map(id => ethers.toBigInt(id))
      console.log('Contract parameters:', { parentTokenIds, licenseTokenIds, metadataURI, contentHash })

      // Create derivative on contract
      console.log('Creating derivative on contract...')
      const derivativeContract = new ethers.Contract(DERIVATIVE_IP_NFT_ADDRESS, DerivativeIPNFT_ABI, signer)
      
      const tx = await derivativeContract.createDerivative(
        parentTokenIds,
        licenseTokenIds,
        metadataURI,
        contentHash,
        derivativeForm.derivativeType === 'REMIX' ? 0 : 
        derivativeForm.derivativeType === 'EXTENSION' ? 1 :
        derivativeForm.derivativeType === 'COLLABORATION' ? 2 :
        derivativeForm.derivativeType === 'VALIDATION' ? 3 : 4,
        derivativeForm.isCommercial
      )

      console.log('Transaction sent:', tx.hash)
      const receipt = await tx.wait()
      console.log('Derivative created successfully:', receipt)
      
      alert('Derivative IP created successfully!')
      setShowDerivativeModal(false)
      setDerivativeForm({
        title: '',
        description: '',
        derivativeType: 'EXTENSION',
        isCommercial: false,
        additionalContent: '',
        parentTokenIds: [],
        licenseTokenIds: []
      })
      
    } catch (error: any) {
      console.error('Failed to create derivative:', error)
      alert(error?.message || 'Failed to create derivative')
    } finally {
      setIsCreatingDerivative(false)
    }
  }

  const openDerivativeModal = (ip: IPNFT) => {
    console.log('Opening derivative modal for IP:', ip)
    setSelectedIP(ip)
    setDerivativeForm(prev => ({
      ...prev,
      parentTokenIds: [ip.tokenId], // Default to current IP as parent
      title: `${ip.metadata?.title || `IP #${ip.tokenId}`} - Derivative`,
      description: `Derivative work based on ${ip.metadata?.title || `IP #${ip.tokenId}`}`
    }))
    console.log('Derivative form initialized:', {
      parentTokenIds: [ip.tokenId],
      title: `${ip.metadata?.title || `IP #${ip.tokenId}`} - Derivative`,
      description: `Derivative work based on ${ip.metadata?.title || `IP #${ip.tokenId}`}`
    })
    setShowDerivativeModal(true)
    console.log('Modal state set to true')
  }

  const openDisputeModal = (ip: IPNFT) => {
    setSelectedIP(ip)
    setDisputeReason('')
    setShowDisputeModal(true)
  }

  const openIPDetails = (ip: IPNFT) => {
    setSelectedIP(ip)
    setShowIPDetailsModal(true)
  }

  const handleCreateDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please provide a reason for the dispute')
      return
    }

    try {
      setIsCreatingDispute(true)
      
      const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
      if (!ethereum) {
        throw new Error('No wallet found. Please install MetaMask or a compatible wallet.')
      }

      if (!DESCI_ADDRESS) {
        throw new Error('Governance contract not configured')
      }

      const provider = new ethers.BrowserProvider(ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()

      const contract = new ethers.Contract(DESCI_ADDRESS, Desci_ABI, signer)
      
      const tx = await contract.createDispute(selectedIP!.tokenId, disputeReason)
      await tx.wait()
      
      alert('Dispute created successfully!')
      setShowDisputeModal(false)
      setDisputeReason('')
      
    } catch (error: any) {
      console.error('Failed to create dispute:', error)
      alert(error?.message || 'Failed to create dispute')
    } finally {
      setIsCreatingDispute(false)
    }
  }

  const fetchIPNFTs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const url = 'https://api.studio.thegraph.com/query/118776/desci/version/latest'
      const headers = { Authorization: 'Bearer 9c42f8dcf2cf487337de6f2b55a971ec' }

      const query = gql`
        query MyQuery {
          ipminteds {
            metadataURI
            splitter
            tokenId
            transactionHash
          }
          licenseOfferCreateds {
            expiry
            ipOwner
            ipTokenId
            licenseURI
            offerIndex
            priceWei
          }
          licensePurchaseds {
            buyer
            ipTokenId
            offerIndex
            licenseTokenId
            priceWei
          }
        }
      `

      const data = await request<{ ipminteds: any[]; licenseOfferCreateds: any[]; licensePurchaseds: any[] }>(url, query, {}, headers)

      // Group offers by ipTokenId
      const offersByIp: Record<string, LicenseOffer[]> = {}
      for (const offer of (data.licenseOfferCreateds || [])) {
        const ipId = String(offer.ipTokenId)
        if (!offersByIp[ipId]) offersByIp[ipId] = []
        offersByIp[ipId].push({
          offerIndex: Number(offer.offerIndex),
          ipTokenId: ipId,
          ipOwner: offer.ipOwner,
          licenseURI: offer.licenseURI,
          priceWei: String(offer.priceWei),
          expiry: String(offer.expiry)
        })
      }

      // Enrich offers with license metadata from IPFS
      await Promise.all(Object.keys(offersByIp).map(async (ipId) => {
        const enriched = await Promise.all(offersByIp[ipId].map(async (o) => {
          try {
            const meta = await fetchJsonFromUri(o.licenseURI)
            return { ...o, licenseMetadata: meta || undefined }
          } catch {
            return o
          }
        }))
        offersByIp[ipId] = enriched
      }))

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
          transactionHash: ip.transactionHash,
          offers: offersByIp[String(ip.tokenId)] || []
        })
      }

      setIpnfts(fetched)

      // Process license purchases for current user
      if (userAddress) {
        const userPurchases = (data.licensePurchaseds || []).filter(
          purchase => purchase.buyer.toLowerCase() === userAddress.toLowerCase()
        )
        setUserLicenses(userPurchases)
      }
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
    // Get user's wallet address
    const getWalletAddress = async () => {
      try {
        const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
        if (ethereum) {
          const provider = new ethers.BrowserProvider(ethereum)
          const accounts = await provider.listAccounts()
          if (accounts.length > 0) {
            setUserAddress(accounts[0].address)
          }
        }
      } catch (error) {
        console.log('No wallet connected')
      }
    }
    getWalletAddress()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDerivativeModal && !(event.target as Element).closest('.modal-content')) {
        setShowDerivativeModal(false)
      }
      if (showDisputeModal && !(event.target as Element).closest('.modal-content')) {
        setShowDisputeModal(false)
      }
      if (showIPDetailsModal && !(event.target as Element).closest('.modal-content')) {
        setShowIPDetailsModal(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDerivativeModal, showDisputeModal, showIPDetailsModal])

  // Get user's licenses when address changes
  useEffect(() => {
    if (userAddress) {
      // Refresh data to get user's licenses
      fetchIPNFTs(true)
    }
  }, [userAddress])

  const formatAddress = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  const formatDate = (dateString: string) => {
    try { return new Date(dateString).toLocaleDateString() } catch { return dateString }
  }
  const formatWei = (weiString: string) => {
    try { return ethers.formatEther(weiString) } catch { return weiString }
  }
  const truncate = (text: string, max = 160) => {
    if (!text) return ''
    return text.length > max ? text.slice(0, max) + '…' : text
  }

  // const decryptAndDownload = async (ip: IPNFT) => {
  //   try {
  //     if (!ip.metadata?.encryption?.encrypted) return
  //     const keyB64 = decryptionKeys[ip.tokenId]
  //     if (!keyB64) { alert('No decryption key found. Ensure you hold a license.'); return }
  //     const ivB64 = ip.metadata.encryption.ivB64 || ''
  //     const res = await fetch(ip.metadata.permanent_content_reference.uri)
  //     const encBuf = await res.arrayBuffer()
  //     const keyRaw = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0))
  //     const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))
  //     const cryptoKey = await crypto.subtle.importKey('raw', keyRaw, { name: 'AES-GCM' }, false, ['decrypt'])
  //     const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encBuf)
  //     const blob = new Blob([plainBuf])
  //     const url = URL.createObjectURL(blob)
  //     const a = document.createElement('a')
  //     a.href = url
  //     a.download = `ip_${ip.tokenId}_decrypted`
  //     document.body.appendChild(a)
  //     a.click()
  //     a.remove()
  //     URL.revokeObjectURL(url)
  //   } catch (e) {
  //     alert('Failed to decrypt.')
  //   }
  // }

  const handleRefresh = () => {
    fetchIPNFTs(true)
  }

  if (loading) {
    return (
      <main>
        <Navigation />
        <section className="p-8 pt-24">
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
        <section className="p-8 pt-24">
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
      <section className="p-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">IP NFT Gallery</h1>
            {/* <p className="text-gray-600 mt-2">
              {ipnfts.length === 0 ? 'No IP NFTs found' : `${ipnfts.length} IP NFT${ipnfts.length !== 1 ? 's' : ''} found`}
            </p> */}
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
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => openIPDetails(ip)}>
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

                  {/* Quick Actions */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => openIPDetails(ip)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => openDisputeModal(ip)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>Report</span>
                    </button>
                  </div>

                  {/* License Offers */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">License Offers</span>
                      <span className="text-xs text-gray-500">{ip.offers?.length || 0} offer{(ip.offers?.length || 0) === 1 ? '' : 's'}</span>
                    </div>
                    {ip.offers && ip.offers.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {ip.offers.map((offer) => (
                          <div key={`${ip.tokenId}-${offer.offerIndex}`} className="p-3 border rounded">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-xs text-gray-700 space-y-1 flex-1">
                                <div className="flex flex-wrap gap-3 items-center">
                                  <span className="font-semibold text-gray-800">{offer.licenseMetadata?.licenseType || offer.licenseMetadata?.name || 'License'}</span>
                                  <span className="text-gray-600">{formatWei(offer.priceWei)} ETH</span>
                                  <span className="text-gray-500">{offer.expiry === '0' ? 'No expiry' : `Expires: ${formatDate(new Date(Number(offer.expiry) * 1000).toISOString())}`}</span>
                                </div>
                                {offer.licenseMetadata?.licenseTerms && (
                                  <div className="text-gray-600 mt-1">{truncate(offer.licenseMetadata.licenseTerms, 160)}</div>
                                )}
                                {!offer.licenseMetadata?.licenseTerms && offer.licenseMetadata?.description && (
                                  <div className="text-gray-600 mt-1">{truncate(offer.licenseMetadata.description, 160)}</div>
                                )}
                              </div>
                              <button
                                onClick={() => handleBuyLicense(ip.tokenId, Number(offer.offerIndex))}
                                className="h-8 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                              >
                                Buy
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-500">No offers</div>
                    )}
                  </div>

                  {/* Create Derivative Button */}
                  <div className="mt-4">
                    <button
                      onClick={() => openDerivativeModal(ip)}
                      className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Create Derivative
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Derivative Creation Modal */}
      {showDerivativeModal && selectedIP && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl modal-content">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Derivative IP</h2>
                <button
                  onClick={() => setShowDerivativeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => { 
                e.preventDefault(); 
                console.log('Form submitted, calling handleCreateDerivative');
                
                // Validate form
                if (!derivativeForm.title.trim()) {
                  alert('Please enter a derivative title');
                  return;
                }
                if (!derivativeForm.description.trim()) {
                  alert('Please enter a derivative description');
                  return;
                }
                if (derivativeForm.parentTokenIds.length === 0) {
                  alert('Please select at least one parent IP');
                  return;
                }
                
                console.log('Form validation passed, calling handleCreateDerivative');
                handleCreateDerivative(); 
              }} className="space-y-6">
                {/* Parent IP Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent IP Token IDs *
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={derivativeForm.parentTokenIds.includes(selectedIP.tokenId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDerivativeForm(prev => ({
                              ...prev,
                              parentTokenIds: [...prev.parentTokenIds, selectedIP.tokenId]
                            }))
                          } else {
                            setDerivativeForm(prev => ({
                              ...prev,
                              parentTokenIds: prev.parentTokenIds.filter(id => id !== selectedIP.tokenId)
                            }))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">
                        {selectedIP.metadata?.title || `IP #${selectedIP.tokenId}`} (Current IP)
                      </span>
                    </div>
                    {/* Add more parent IPs here if needed */}
                  </div>
                </div>

                {/* User's Licenses */}
                {userLicenses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Licenses (Optional - for additional parent IPs)
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {userLicenses.map((license, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={derivativeForm.licenseTokenIds.includes(license.licenseTokenId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDerivativeForm(prev => ({
                                  ...prev,
                                  licenseTokenIds: [...prev.licenseTokenIds, license.licenseTokenId]
                                }))
                              } else {
                                setDerivativeForm(prev => ({
                                  ...prev,
                                  licenseTokenIds: prev.licenseTokenIds.filter(id => id !== license.licenseTokenId)
                                }))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">
                            License for IP #{license.ipTokenId}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derivative Title *
                  </label>
                  <input
                    type="text"
                    value={derivativeForm.title}
                    onChange={(e) => setDerivativeForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={derivativeForm.description}
                    onChange={(e) => setDerivativeForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                {/* Derivative Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Derivative Type *
                  </label>
                  <select
                    value={derivativeForm.derivativeType}
                    onChange={(e) => setDerivativeForm(prev => ({ ...prev, derivativeType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="REMIX">Remix - Modified version of original</option>
                    <option value="EXTENSION">Extension - Builds upon original work</option>
                    <option value="COLLABORATION">Collaboration - Joint work with original authors</option>
                    <option value="VALIDATION">Validation - Reproduces/validates original findings</option>
                    <option value="CRITIQUE">Critique - Critical analysis of original work</option>
                  </select>
                </div>

                {/* Commercial Use */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={derivativeForm.isCommercial}
                      onChange={(e) => setDerivativeForm(prev => ({ ...prev, isCommercial: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      This derivative can be licensed commercially
                    </span>
                  </label>
                </div>

                {/* Additional Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Content/Report (Optional)
                  </label>
                  <textarea
                    value={derivativeForm.additionalContent}
                    onChange={(e) => setDerivativeForm(prev => ({ ...prev, additionalContent: e.target.value }))}
                    rows={3}
                    placeholder="Describe any additional content, reports, or modifications..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDerivativeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingDerivative}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isCreatingDerivative ? 'Creating...' : 'Create Derivative'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Creation Modal */}
      {showDisputeModal && selectedIP && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl modal-content">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Report IP Issue</h2>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">IP Details</h3>
                <p className="text-sm text-gray-600">Title: {selectedIP.metadata?.title || `IP #${selectedIP.tokenId}`}</p>
                <p className="text-sm text-gray-500">Token ID: #{selectedIP.tokenId}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Report *
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                  placeholder="Please describe the issue or concern with this IP..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div className="text-xs text-gray-500 mb-6 p-3 bg-yellow-50 rounded-lg">
                <p>⚠️ <strong>Note:</strong> You need at least 100 governance tokens to create a dispute.</p>
                <p>Disputes will be reviewed by the community and may result in IP suspension if valid.</p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDispute}
                  disabled={isCreatingDispute || !disputeReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingDispute ? 'Creating...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IP Details Modal */}
      {showIPDetailsModal && selectedIP && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl modal-content">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">IP Details</h2>
                <button
                  onClick={() => setShowIPDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Token ID:</span>
                        <span className="font-mono text-gray-800">#{selectedIP.tokenId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium text-gray-800">{selectedIP.metadata?.title || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-gray-800">{selectedIP.metadata?.ip_type || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium text-gray-800">{selectedIP.metadata?.date_of_creation ? formatDate(selectedIP.metadata.date_of_creation) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Version:</span>
                        <span className="font-medium text-gray-800">{selectedIP.metadata?.version || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedIP.metadata?.description && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
                      <p className="text-gray-700 text-sm leading-relaxed">{selectedIP.metadata.description}</p>
                    </div>
                  )}

                  {selectedIP.metadata?.keywords && selectedIP.metadata.keywords.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedIP.metadata.keywords.map((keyword, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Technical Details & Actions */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Technical Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Content Hash:</span>
                        <span className="font-mono text-gray-800 text-xs">{formatAddress(selectedIP.contentHash)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Metadata URI:</span>
                        <span className="font-mono text-gray-800 text-xs">{formatAddress(selectedIP.metadataUri)}</span>
                      </div>
                      {selectedIP.transactionHash && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction:</span>
                          <span className="font-mono text-gray-800 text-xs">{formatAddress(selectedIP.transactionHash)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedIP.metadata?.authors && selectedIP.metadata.authors.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">Authors</h3>
                      <div className="space-y-2">
                        {selectedIP.metadata.authors.map((author, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium text-gray-800">{author.name}</div>
                            {author.affiliation && <div className="text-gray-600 text-xs">{author.affiliation}</div>}
                            {author.orcid && <div className="text-gray-500 text-xs">ORCID: {author.orcid}</div>}
                            <div className="text-gray-500 text-xs font-mono">{formatAddress(author.wallet)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setShowIPDetailsModal(false)
                          openDerivativeModal(selectedIP)
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create Derivative</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowIPDetailsModal(false)
                          openDisputeModal(selectedIP)
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Report Issue</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
