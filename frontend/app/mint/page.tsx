'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { IPNFT_ADDRESS, IPNFT_ABI } from '../config/contracts'
import { ethers } from 'ethers'

// Helper for default author
const defaultAuthor = { name: '', orcid: '', affiliation: '', wallet: '' }

export default function MintPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    authors: [ { ...defaultAuthor } ],
    date_of_creation: '',
    version: '',
    ip_type: '',
    category: '',
    inventors: '',
    institution: '',
    ownership_type: '',
    owners: [{ name: '', wallet: '' }],
    rights: '',
    license_type: '',
    license_terms: '',
    permanent_uri: '',
    content_hash: '',
    provenance: '',
    keywords: '',
    identifiers: '',
    attribution: '',
    minting_info: '',
    peer_review_status: '',
    funding_info: '',
    supplementary_media: '',
    ai_summary: '',
    researchPaper: null as File | null,
    additionalFiles: [] as File[],
    contactEmail: '',
    phone: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Similar handlers for owners if needed

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files.length > 0) {
      if (name === 'researchPaper') {
        setFormData(prev => ({ ...prev, researchPaper: files[0] }))
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
      const fileUri = `ipfs://${fileCid}`

      // Owners parsing (simple single owner for now)
      const ownerEntries = formData.owners && formData.owners.length > 0 ? formData.owners : [{ name: '', wallet: '' }]

      // 3) Build metadata JSON
      const metadata = {
        title: formData.title,
        description: formData.description,
        authors: formData.authors,
        date_of_creation: formData.date_of_creation,
        version: formData.version,
        ip_type: formData.ip_type,
        ownership: {
          type: formData.ownership_type,
          owners: ownerEntries
        },
        rights: formData.rights,
        license: {
          type: formData.license_type,
          terms: formData.license_terms
        },
        permanent_content_reference: {
          uri: fileUri,
          content_hash: hashHex
        },
        provenance: formData.provenance,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        identifiers: formData.identifiers,
        attribution: formData.attribution,
        minting_info: formData.minting_info,
        optional: {
          peer_review_status: formData.peer_review_status,
          funding_info: formData.funding_info,
          supplementary_media: formData.supplementary_media,
          ai_summary: formData.ai_summary
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

      alert(`Minted! Tx: ${tx.hash}`)
      console.log('Mint receipt', receipt)
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
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Research Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="">Select category</option>
                      <option value="biotechnology">Biotechnology</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="physics">Physics</option>
                      <option value="engineering">Engineering</option>
                      <option value="computer-science">Computer Science</option>
                      <option value="medicine">Medicine</option>
                      <option value="materials-science">Materials Science</option>
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
