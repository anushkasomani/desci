'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { IPNFT_ADDRESS, IPNFT_ABI, LicenseNFT_ABI } from '../config/contracts'
import { ethers } from 'ethers'
import { uploadMetadataFile } from '../hooks/extract-metadata'

// Helper for default author
const defaultAuthor = { name: '', orcid: '', affiliation: '', wallet: '' }

// Default license terms
const DEFAULT_LICENSE_TERMS = {
  type: 'Creative Commons Attribution 4.0 International',
  terms: 'This work is licensed under the Creative Commons Attribution 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.'
}

export default function MintPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    authors: [ { ...defaultAuthor } ],
    date_of_creation: '',
    version: '1.0.0',
    ip_type: '',
    category: '',
    inventors: '',
    institution: '',
    ownership_type: 'individual',
    owners: [{ name: '', wallet: '' }],
    rights: 'All rights reserved',
    license_type: 'Creative Commons Attribution 4.0 International',
    license_terms: DEFAULT_LICENSE_TERMS.terms,
    permanent_uri: '',
    content_hash: '',
    provenance: 'Minted via ScienceIP Platform',
    keywords: '',
    identifiers: '',
    attribution: '',
    minting_info: 'IP NFT minted on blockchain',
    peer_review_status: 'Not peer reviewed',
    funding_info: '',
    supplementary_media: '',
    ai_summary: '',
    researchPaper: null as File | null,
    additionalFiles: [] as File[],
    contactEmail: '',
    phone: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metadataStatus, setMetadataStatus] = useState<{
    isExtracting: boolean;
    result: any;
    error: string | null;
  }>({
    isExtracting: false,
    result: null,
    error: null
  })

  // Handlers for dynamic fields (authors, owners)
  const handleAuthorChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const authors = [...prev.authors]
      authors[idx] = { ...authors[idx], [name]: value }
      return { ...prev, authors }
    })
  }
  const addAuthor = () => setFormData(prev => ({ ...prev, authors: [...prev.authors, { ...defaultAuthor }] }))
  const removeAuthor = (idx: number) => setFormData(prev => ({ ...prev, authors: prev.authors.filter((_, i) => i !== idx) }))

  // Handle owner changes
  const handleOwnerChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const owners = [...prev.owners]
      owners[idx] = { ...owners[idx], [name]: value }
      return { ...prev, owners }
    })
  }
  const addOwner = () => setFormData(prev => ({ ...prev, owners: [...prev.owners, { name: '', wallet: '' }] }))
  const removeOwner = (idx: number) => setFormData(prev => ({ ...prev, owners: prev.owners.filter((_, i) => i !== idx) }))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files.length > 0) {
      if (name === 'researchPaper') {
        const file = files[0]
        setFormData(prev => ({ ...prev, researchPaper: file }))
        
        // Automatically call metadata API when research paper is uploaded
        console.log('Research paper uploaded, calling metadata API...')
        setMetadataStatus(prev => ({ ...prev, isExtracting: true, error: null, result: null }))
        
        try {
          const result = await uploadMetadataFile(file)
          if (result.success) {
            console.log('✅ Metadata extraction successful:', result.data)
            setMetadataStatus(prev => ({ ...prev, isExtracting: false, result: result.data, error: null }))
          } else {
            console.error('❌ Metadata extraction failed:', result.error)
            setMetadataStatus(prev => ({ ...prev, isExtracting: false, error: result.error || 'Unknown error', result: null }))
          }
        } catch (error) {
          console.error('❌ Error calling metadata API:', error)
          setMetadataStatus(prev => ({ ...prev, isExtracting: false, error: 'Network error occurred', result: null }))
        }
      } else if (name === 'additionalFiles') {
        setFormData(prev => ({ ...prev, additionalFiles: Array.from(files) }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (!formData.researchPaper) throw new Error('Research paper file is required')

      // 1) Compute SHA-256 of research paper
      const buffer = await formData.researchPaper.arrayBuffer()
      const digest = await crypto.subtle.digest('SHA-256', buffer)
      const hashHex = '0x' + Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')

      // 2) Upload file to IPFS via Pinata
      const fileForm = new FormData()
      fileForm.append('file', formData.researchPaper)
      const pinFileRes = await fetch('/api/pin-file', { method: 'POST', body: fileForm })
      if (!pinFileRes.ok) {
        const errorData = await pinFileRes.json().catch(() => ({}))
        throw new Error(`Failed to pin file to IPFS: ${errorData.error || pinFileRes.statusText}`)
      }
      const { cid: fileCid } = await pinFileRes.json()
      
      // Use gateway URL format instead of ipfs://
      const gatewayUrl = `https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/${fileCid}`
      const fileUri = `ipfs://${fileCid}`

      // 3) Build metadata JSON with proper values
      const metadata = {
        title: formData.title || 'Untitled Research',
        description: formData.description || 'Research description not provided',
        authors: formData.authors.filter(author => author.name.trim()),
        date_of_creation: formData.date_of_creation || new Date().toISOString(),
        version: formData.version || "1.0.0",
        ip_type: formData.ip_type || 'research_paper',
        ownership: {
          type: formData.ownership_type || 'individual',
          owners: formData.owners.filter(owner => owner.name.trim() || owner.wallet.trim())
        },
        rights: formData.rights || 'All rights reserved',
        license: {
          type: formData.license_type || 'Creative Commons Attribution 4.0 International',
          terms: formData.license_terms || DEFAULT_LICENSE_TERMS.terms
        },
        permanent_content_reference: {
          uri: gatewayUrl, // Use gateway URL here
          content_hash: hashHex
        },
        provenance: formData.provenance || 'Minted via ScienceIP Platform',
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        identifiers: formData.identifiers || '',
        attribution: formData.attribution || formData.authors[0]?.name || 'Unknown',
        minting_info: formData.minting_info || 'IP NFT minted on blockchain',
        optional: {
          peer_review_status: formData.peer_review_status || 'Not peer reviewed',
          funding_info: formData.funding_info || '',
          supplementary_media: formData.supplementary_media || '',
          ai_summary: formData.ai_summary || ''
        }
      }

      // 4) Upload metadata JSON
      const pinJsonRes = await fetch('/api/pin-json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata) })
      if (!pinJsonRes.ok) {
        const errorData = await pinJsonRes.json().catch(() => ({}))
        throw new Error(`Failed to pin metadata to IPFS: ${errorData.error || pinJsonRes.statusText}`)
      }
      const { cid: metadataCid } = await pinJsonRes.json()
      const metadataUri = `ipfs://${metadataCid}`

      // 5) Call IPNFT.mintIP
      if (!IPNFT_ADDRESS) throw new Error('IPNFT contract address not configured')
      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error('No wallet found. Please install MetaMask')
      const provider = new ethers.BrowserProvider(ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()
      const ipnft = new ethers.Contract(IPNFT_ADDRESS, IPNFT_ABI, signer)

      const royaltyRecipient = userAddress
      const royaltyBps = 500 // 5%
      const payees = [userAddress]
      const shares = [100]

      const tx = await ipnft.mintIP(
        userAddress,
        metadataUri,
        hashHex,
        royaltyRecipient,
        royaltyBps,
        payees,
        shares
              )
        const receipt = await tx.wait()
        
        // Parse logs to find IPMinted event
        let ipTokenId: string | null = null
        for (const log of receipt.logs) {
          try {
            const parsed = ipnft.interface.parseLog(log);
            if (parsed && parsed.name === "IPMinted") {
              console.log("IPMinted args:", parsed.args);
              ipTokenId = parsed.args.tokenId
              break
            }
          } catch (err) {
            // Log not from this contract, ignore
          }
        }
        
        if (!ipTokenId) {
          throw new Error('Could not find IPMinted event in transaction receipt')
        }
        
        console.log("IP Token ID extracted:", ipTokenId)
      // 6) Mint license NFT if license contract is configured
      const licenseContractAddress = process.env.NEXT_PUBLIC_LICENSE_CONTRACT_ADDRESS
      console.log('License contract address:', licenseContractAddress)
      
      if (licenseContractAddress) {
        try {
          console.log('Starting license creation process...')
          console.log('IP Token ID:', ipTokenId)
          console.log('User address:', userAddress)
          
          const licenseContract = new ethers.Contract(licenseContractAddress, LicenseNFT_ABI, signer)
          console.log('License contract instance created')
          
          // Create license metadata JSON
          const licenseMetadata = {
            name: `License for ${formData.title}`,
            description: `License NFT for intellectual property: ${formData.title}`,
            licenseType: formData.license_type,
            licenseTerms: formData.license_terms,
            ipNFTId: ipTokenId.toString(),
            owner: userAddress,
            createdAt: new Date().toISOString(),
            price: "0.001 ETH"
          }
          console.log('License metadata created:', licenseMetadata)

          // Upload license metadata to IPFS
          console.log('Uploading license metadata to IPFS...')
          const licensePinRes = await fetch('/api/pin-json', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(licenseMetadata) 
          })
          console.log('License pin response status:', licensePinRes.status)
          
          if (!licensePinRes.ok) {
            const errorText = await licensePinRes.text()
            console.error('License pin error response:', errorText)
            throw new Error(`Failed to pin license metadata to IPFS: ${licensePinRes.status} - ${errorText}`)
          }
          
          const licensePinData = await licensePinRes.json()
          console.log('License pin response data:', licensePinData)
          
          const { cid: licenseCid } = licensePinData
          const licenseUri = `ipfs://${licenseCid}`
          console.log('License URI:', licenseUri)

          // Create license offer with all required parameters
          const priceInWei = ethers.parseEther("0.001")
          const expiry = 0 // 0 means never expires
          console.log('Creating license offer with params:', {
            ipTokenId: ipTokenId.toString(),
            priceWei: priceInWei.toString(),
            licenseUri,
            expiry
          })
          
          const licenseTx = await licenseContract.createLicenseOffer(
            ipTokenId, 
            priceInWei, 
            licenseUri, 
            expiry
          )
          console.log('License transaction sent:', licenseTx.hash)
          
          console.log('Waiting for license transaction confirmation...')
          const licenseReceipt = await licenseTx.wait()
          console.log('License transaction confirmed:', licenseReceipt)
          
          // Look for the LicenseOfferCreated event
          const licenseEvent = licenseReceipt.events?.find((e: any) => e.event === "LicenseOfferCreated")
          if (licenseEvent) {
            console.log('LicenseOfferCreated event found:', licenseEvent.args)
          } else {
            console.log('No LicenseOfferCreated event found in receipt')
          }
          
          console.log('License term created successfully!')
        } catch (licenseErr: any) {
          console.error('Failed to create license term:', licenseErr)
          console.error('Error details:', {
            message: licenseErr.message,
            code: licenseErr.code,
            data: licenseErr.data,
            stack: licenseErr.stack
          })
          
          // Show user-friendly error message
          if (licenseErr.code === 'ACTION_REJECTED') {
            alert('License creation was rejected by user')
          } else if (licenseErr.code === 'INSUFFICIENT_FUNDS') {
            alert('Insufficient funds for license creation')
          } else {
            alert(`License creation failed: ${licenseErr.message || 'Unknown error'}`)
          }
        }
      } else {
        console.log('No license contract address configured, skipping license creation')
      }

      console.log('IP NFT minted successfully!')
      console.log('Transaction hash:', tx.hash)
      console.log('Mint receipt:', receipt)
      
      // Show success message
      alert(`IP NFT Minted Successfully!\n\nTransaction: ${tx.hash}\nToken ID: ${ipTokenId}\n\nLicense creation will be attempted next...`)
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Failed to mint')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen">
      <Navigation />
      
      <div className="pt-16 lg:pt-20 bg-white/30 backdrop-blur-lg border border-white/30 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Mint Your Intellectual Property
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your research discoveries into valuable intellectual property assets. 
              Our AI-powered platform will analyze your work and help you file patents.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Research Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Research Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter your research title"
                    />
                  </div>

                  <div>
                    <label htmlFor="ip_type" className="block text-sm font-medium text-gray-700 mb-2">
                      IP Type *
                    </label>
                    <select
                      id="ip_type"
                      name="ip_type"
                      required
                      value={formData.ip_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="">Select IP type</option>
                      <option value="research_paper">Research Paper</option>
                      <option value="patent">Patent</option>
                      <option value="invention">Invention</option>
                      <option value="software">Software</option>
                      <option value="algorithm">Algorithm</option>
                      <option value="dataset">Dataset</option>
                      <option value="methodology">Methodology</option>
                      <option value="formula">Formula</option>
                      <option value="design">Design</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Research Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Describe your research, key findings, and potential applications..."
                  />
                </div>

                <div className="mt-6">
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="keywords"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="AI, machine learning, research, innovation..."
                  />
                </div>
              </div>

              {/* Authors Section */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Authors & Contributors</h2>
                
                {formData.authors.map((author, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author {idx + 1} Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={author.name}
                        onChange={(e) => handleAuthorChange(idx, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ORCID ID
                      </label>
                      <input
                        type="text"
                        name="orcid"
                        value={author.orcid}
                        onChange={(e) => handleAuthorChange(idx, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0000-0000-0000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Affiliation
                      </label>
                      <input
                        type="text"
                        name="affiliation"
                        value={author.affiliation}
                        onChange={(e) => handleAuthorChange(idx, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Institution/Organization"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        name="wallet"
                        value={author.wallet}
                        onChange={(e) => handleAuthorChange(idx, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0x..."
                      />
                    </div>
                    {formData.authors.length > 1 && (
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() => removeAuthor(idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove Author
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addAuthor}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  + Add Another Author
                </button>
              </div>

              {/* Ownership Section */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ownership & Rights</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="ownership_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Ownership Type *
                    </label>
                    <select
                      id="ownership_type"
                      name="ownership_type"
                      required
                      value={formData.ownership_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="individual">Individual</option>
                      <option value="joint">Joint Ownership</option>
                      <option value="institutional">Institutional</option>
                      <option value="corporate">Corporate</option>
                      <option value="government">Government</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="rights" className="block text-sm font-medium text-gray-700 mb-2">
                      Rights *
                    </label>
                    <select
                      id="rights"
                      name="rights"
                      required
                      value={formData.rights}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="All rights reserved">All rights reserved</option>
                      <option value="Some rights reserved">Some rights reserved</option>
                      <option value="Public domain">Public domain</option>
                      <option value="Creative Commons">Creative Commons</option>
                    </select>
                  </div>
                </div>

                {/* Owners */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owners *
                  </label>
                  {formData.owners.map((owner, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        name="name"
                        placeholder="Owner name"
                        value={owner.name}
                        onChange={(e) => handleOwnerChange(idx, e)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <input
                        type="text"
                        name="wallet"
                        placeholder="Wallet address (0x...)"
                        value={owner.wallet}
                        onChange={(e) => handleOwnerChange(idx, e)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOwner}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    + Add Another Owner
                  </button>
                </div>
              </div>

              {/* License Section */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">License Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="license_type" className="block text-sm font-medium text-gray-700 mb-2">
                      License Type *
                    </label>
                    <select
                      id="license_type"
                      name="license_type"
                      required
                      value={formData.license_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="Creative Commons Attribution 4.0 International">Creative Commons Attribution 4.0 International</option>
                      <option value="Creative Commons Attribution-ShareAlike 4.0 International">Creative Commons Attribution-ShareAlike 4.0 International</option>
                      <option value="Creative Commons Attribution-NonCommercial 4.0 International">Creative Commons Attribution-NonCommercial 4.0 International</option>
                      <option value="MIT License">MIT License</option>
                      <option value="Apache License 2.0">Apache License 2.0</option>
                      <option value="GNU General Public License v3.0">GNU General Public License v3.0</option>
                      <option value="All rights reserved">All rights reserved</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="license_terms" className="block text-sm font-medium text-gray-700 mb-2">
                    License Terms *
                  </label>
                  <textarea
                    id="license_terms"
                    name="license_terms"
                    required
                    rows={4}
                    value={formData.license_terms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="License terms and conditions..."
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Research Documents</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="researchPaper" className="block text-sm font-medium text-gray-700 mb-2">
                      Research Paper/Manuscript *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                      <input
                        type="file"
                        id="researchPaper"
                        name="researchPaper"
                        required
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="researchPaper" className="cursor-pointer">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium text-primary-600 hover:text-primary-500">
                            Click to upload
                          </span>{' '}
                          or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-gray-500">PDF, DOC, or DOCX (max 10MB)</p>
                      </label>
                    </div>
                    {formData.researchPaper && (
                      <p className="mt-2 text-sm text-gray-600">✓ {formData.researchPaper.name}</p>
                    )}
                    
                    {/* Metadata Extraction Status */}
                    {formData.researchPaper && (
                      <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">AI Metadata Extraction</h4>
                        
                        {metadataStatus.isExtracting && (
                          <div className="flex items-center text-blue-600">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm">Extracting metadata...</span>
                          </div>
                        )}
                        
                        {metadataStatus.error && (
                          <div className="text-red-600 text-sm">
                            ❌ Error: {metadataStatus.error}
                          </div>
                        )}
                        
                        {metadataStatus.result && (
                          <div className="text-green-600 text-sm">
                            ✅ Metadata extracted successfully!
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View extracted data</summary>
                              <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-auto max-h-32">
                                {JSON.stringify(metadataStatus.result, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                        
                        {/* Manual re-extract button */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (formData.researchPaper) {
                              setMetadataStatus(prev => ({ ...prev, isExtracting: true, error: null, result: null }))
                              try {
                                const result = await uploadMetadataFile(formData.researchPaper)
                                if (result.success) {
                                  console.log('✅ Metadata re-extraction successful:', result.data)
                                  setMetadataStatus(prev => ({ ...prev, isExtracting: false, result: result.data, error: null }))
                                } else {
                                  console.error('❌ Metadata re-extraction failed:', result.error)
                                  setMetadataStatus(prev => ({ ...prev, isExtracting: false, error: result.error || 'Unknown error', result: null }))
                                }
                              } catch (error) {
                                console.error('❌ Error calling metadata API:', error)
                                setMetadataStatus(prev => ({ ...prev, isExtracting: false, error: 'Network error occurred', result: null }))
                              }
                            }
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                          disabled={metadataStatus.isExtracting}
                        >
                          🔄 Re-extract metadata
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="additionalFiles" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Files (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                      <input
                        type="file"
                        id="additionalFiles"
                        name="additionalFiles"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="additionalFiles" className="cursor-pointer">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium text-primary-600 hover:text-primary-500">
                            Click to upload
                          </span>{' '}
                          additional files
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Supporting documents, images, etc.</p>
                      </label>
                    </div>
                    {formData.additionalFiles.length > 0 && (
                      <div className="mt-2">
                        {formData.additionalFiles.map((file, index) => (
                          <p key={index} className="text-sm text-gray-600">✓ {file.name}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      required
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="your.email@institution.edu"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    'Mint IP NFT'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
