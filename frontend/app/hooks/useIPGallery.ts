// hooks/useIPGallery.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { gql, request } from 'graphql-request'
import { ethers, BrowserProvider, Contract } from 'ethers'
import { LICENSE_NFT_ADDRESS, LicenseNFT_ABI, DERIVATIVE_IP_NFT_ADDRESS, DerivativeIPNFT_ABI, DESCI_ADDRESS, Desci_ABI } from '../config/contracts'
import type { IPNFT, LicenseOffer, IPMetadata, DerivativeFormData } from '../types/gallery' 

const IPFS_GATEWAY = 'https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/'
const GRAPH_URL = 'https://api.studio.thegraph.com/query/118776/desci/version/latest'
const GRAPH_AUTH = 'Bearer 9c42f8dcf2cf487337de6f2b55a971ec'

async function fetchJsonFromUri(uri: string): Promise<any | null> {
    if (!uri) return null
    const cid = uri.replace(/^ipfs:\/\//, '')
    const url = `${IPFS_GATEWAY}${cid}`
    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to fetch from IPFS: ${res.statusText}`)
        return await res.json()
    } catch (e) {
        console.error(`Error fetching from ${url}:`, e)
        return null
    }
}

export function useIPGallery() {
    const [ipnfts, setIpnfts] = useState<IPNFT[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isBuyingLicense, setIsBuyingLicense] = useState(false)
    const [isCreatingDerivative, setIsCreatingDerivative] = useState(false)
    const [isCreatingDispute, setIsCreatingDispute] = useState(false)

    const fetchIPNFTs = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const query = gql`
              query GetGalleryData {
                ipminteds(orderBy: tokenId, orderDirection: desc) {
                  metadataURI, splitter, tokenId, transactionHash
                }
                licenseOfferCreateds {
                  expiry, ipOwner, ipTokenId, licenseURI, offerIndex, priceWei
                }
              }
            `
            const data = await request<{ ipminteds: any[], licenseOfferCreateds: any[] }>(GRAPH_URL, query, {}, { Authorization: GRAPH_AUTH })

            const offersByIp = data.licenseOfferCreateds.reduce((acc, offer) => {
                const ipId = String(offer.ipTokenId)
                if (!acc[ipId]) acc[ipId] = []
                acc[ipId].push({
                    offerIndex: Number(offer.offerIndex),
                    ipTokenId: ipId,
                    ipOwner: offer.ipOwner,
                    licenseURI: offer.licenseURI,
                    priceWei: String(offer.priceWei),
                    expiry: String(offer.expiry),
                })
                return acc
            }, {} as Record<string, LicenseOffer[]>)

            const enrichedNfts = await Promise.all(
                data.ipminteds.map(async (ip): Promise<IPNFT> => {
                    const metadata = await fetchJsonFromUri(ip.metadataURI) as IPMetadata | null
                    const offers = offersByIp[String(ip.tokenId)] || []
                    const enrichedOffers = await Promise.all(
                        offers.map(async (offer) => ({
                            ...offer,
                            licenseMetadata: await fetchJsonFromUri(offer.licenseURI)
                        }))
                    )
                    return {
                        tokenId: ip.tokenId,
                        metadata,
                        metadataUri: ip.metadataURI,
                        contentHash: metadata?.permanent_content_reference?.content_hash || '',
                        transactionHash: ip.transactionHash,
                        offers: enrichedOffers,
                    }
                })
            )
            setIpnfts(enrichedNfts)
        } catch (err: any) {
            console.error(err)
            setError(err?.message || 'Failed to fetch IP gallery data.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchIPNFTs()
    }, [fetchIPNFTs])
    
    const getSigner = async (): Promise<ethers.JsonRpcSigner | null> => {
        try {
            if (typeof window === 'undefined' || !(window as any).ethereum) {
                throw new Error('No wallet found. Please install MetaMask.')
            }
            const provider = new ethers.BrowserProvider((window as any).ethereum)
            await provider.send('eth_requestAccounts', [])
            return await provider.getSigner()
        } catch (e) {
            console.error(e)
            setError((e as Error).message)
            return null
        }
    }

    const handleBuyLicense = useCallback(async (tokenId: string, offerIndex: number, priceWeiString: string) => {
        setIsBuyingLicense(true)
        setError(null)
        try {
            const signer = await getSigner()
            if (!signer) return false

            const licenseContract = new ethers.Contract(LICENSE_NFT_ADDRESS, LicenseNFT_ABI, signer)
            const tx = await licenseContract.buyLicense(BigInt(tokenId), BigInt(offerIndex), { value: BigInt(priceWeiString) })
            await tx.wait()
            
            await fetchIPNFTs()
            return true
        } catch (e: any) {
            console.error('Failed to mint license token:', e)
            setError(e?.reason || e?.message || 'Failed to mint license token')
            return false
        } finally {
            setIsBuyingLicense(false)
        }
    }, [fetchIPNFTs])
    
    const handleCreateDerivative = useCallback(async (ip: IPNFT, formData: DerivativeFormData) => {
        setIsCreatingDerivative(true)
        setError(null)
        try {
            const signer = await getSigner()
            if (!signer) return false
            
            const derivativeMetadata = {
              title: formData.title,
              description: formData.description,
              derivativeType: formData.derivativeType,
              isCommercial: formData.isCommercial,
              parentTokenIds: formData.parentTokenIds,
              parentMetadata: ip.metadata,
              createdAt: new Date().toISOString(),
              creator: await signer.getAddress(),
              type: 'derivative_ip'
            }

            const metadataRes = await fetch('/api/pin-json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(derivativeMetadata)
            })
            if (!metadataRes.ok) throw new Error('Failed to upload derivative metadata to IPFS.')
            const { cid: metadataCid } = await metadataRes.json()
            const metadataURI = `ipfs://${metadataCid}`
            const contentHash = ip.contentHash || ethers.keccak256(ethers.toUtf8Bytes(formData.title))
            
            const parentTokenIds = formData.parentTokenIds.map(id => ethers.toBigInt(id))
            const licenseTokenIds = formData.licenseTokenIds.map(id => ethers.toBigInt(id))
            const derivativeTypeMap = { 'REMIX': 0, 'EXTENSION': 1, 'COLLABORATION': 2, 'VALIDATION': 3, 'CRITIQUE': 4 }

            const derivativeContract = new ethers.Contract(DERIVATIVE_IP_NFT_ADDRESS, DerivativeIPNFT_ABI, signer)
            const tx = await derivativeContract.createDerivative(
                parentTokenIds,
                licenseTokenIds,
                metadataURI,
                contentHash,
                derivativeTypeMap[formData.derivativeType],
                formData.isCommercial
            )
            await tx.wait()

            await fetchIPNFTs()
            return true
        } catch (e: any) {
            console.error('Failed to create derivative:', e)
            setError(e?.reason || e?.message || 'Failed to create derivative')
            return false
        } finally {
            setIsCreatingDerivative(false)
        }
    }, [fetchIPNFTs])

    const handleCreateDispute = useCallback(async (tokenId: string, reason: string) => {
        setIsCreatingDispute(true)
        setError(null)
        try {
            const signer = await getSigner()
            if (!signer) return false
            
            if (!DESCI_ADDRESS) throw new Error('Governance contract not configured')

            const contract = new ethers.Contract(DESCI_ADDRESS, Desci_ABI, signer)
            const tx = await contract.createDispute(BigInt(tokenId), reason)
            await tx.wait()
            
            return true
        } catch (e: any) {
            console.error('Failed to create dispute:', e)
            setError(e?.reason || e?.message || 'Failed to create dispute')
            return false
        } finally {
            setIsCreatingDispute(false)
        }
    }, [])

    return { 
        ipnfts, 
        loading, 
        error, 
        fetchIPNFTs, 
        handleBuyLicense,
        handleCreateDerivative,
        handleCreateDispute,
        isBuyingLicense,
        isCreatingDerivative,
        isCreatingDispute
    }
}