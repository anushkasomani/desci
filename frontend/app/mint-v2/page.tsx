'use client'

import { useMemo, useState } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { ethers } from 'ethers'
import { IPNFT_ADDRESS, IPNFT_ABI, LICENSE_NFT_ADDRESS, LicenseNFT_ABI } from '../config/contracts'
import { saveDecryptionKeyForIP } from '../lib/lit'
import { uploadMetadataFile } from '../hooks/extract-metadata'
import Stepper from './components/Stepper'
import ChooseType from './components/ChooseType'
import AiChoice from './components/AiChoice'
import UploadStep from './components/UploadStep'
import PreviewForm from './components/PreviewForm'
import PrivacyStep from './components/PrivacyStep'
import MintStep from './components/MintStep'

import { Author, DEFAULT_LICENSE_TERMS, FormState, IpType, WizardStep, prettyType } from './types'

export default function MintV2Page() {


  const [step, setStep] = useState<WizardStep>('chooseType')
  const [ipType, setIpType] = useState<IpType | null>(null)
  const [useAI, setUseAI] = useState<boolean | null>(null)
  const [primaryFile, setPrimaryFile] = useState<File | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractedSummary, setExtractedSummary] = useState<any>(null)
  const [summaryResponse, setSummaryResponse] = useState<any>(null)

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    aiSummary: '',
    keywords: '',
    authors: [ { name: '', orcid: '', affiliation: '', wallet: '' } ],
    licenseType: 'CC-BY-4.0',
    licenseTerms: DEFAULT_LICENSE_TERMS,
  })

  const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)


  const canContinueFromType = useMemo(() => !!ipType, [ipType])
  const canContinueFromAiChoice = useMemo(() => useAI !== null, [useAI])
  const canContinueFromUpload = useMemo(() => !!primaryFile, [primaryFile])

  const onPickType = (t: IpType) => {
    setIpType(t)
    if (t === 'research_paper') setStep('aiChoice')
    else setStep('upload')
  }

  const onChooseAI = (choice: boolean) => {
    setUseAI(choice)
    setStep('upload')
  }

  const handleUploadPrimary = async (f: File) => {
    setPrimaryFile(f)
    if (useAI) {
      try {
        setIsExtracting(true)
        setExtractError(null)
        //here 
        const res = await uploadMetadataFile(f)
        if (res.success) {
          const data: any = res.data || {}
          const title = (data.title || '').trim()
          const desc = data.high_level_overview || data.abstract || data.ai_summary?.abstract || ''
          const kw = Array.isArray(data.keywords) ? data.keywords.join(', ') : (typeof data.keywords === 'string' ? data.keywords : '')
          const authors = deriveAuthorsFromExtracted(data)
          setForm(prev => ({
            ...prev,
            title: prev.title || title,
            description: prev.description || desc,
            keywords: prev.keywords || kw,
            aiSummary: prev.aiSummary || (data.ai_summary ? [
              data.ai_summary.problem_statement,
              data.ai_summary.methodology_summary,
              data.ai_summary.results_summary,
              data.ai_summary.conclusion_summary,
            ].filter(Boolean).join('\n\n') : ''),
            authors: (prev.authors.length === 1 && !prev.authors[0].name && authors.length > 0) ? authors : prev.authors,
          }))
          try { 
            setExtractedSummary(data?.raw?.summary || null) 
            setSummaryResponse(data?.raw?.summary || null)
          } catch {}
        } else {
          setExtractError(res.error || 'Failed to extract metadata')
        }
      } catch (e: any) {
        setExtractError(e?.message || 'Failed to extract metadata')
      } finally {
        setIsExtracting(false)
      }
    }
  }

  const deriveAuthorsFromExtracted = (raw: any): Author[] => {
    const toArray = (val: any): string[] => {
      if (!val) return []
      if (Array.isArray(val)) return val.filter(Boolean)
      if (typeof val === 'string') return [val]
      return []
    }
    const rawAuthors = toArray(raw?.authors || raw?.author || raw?.creators)
    const names: string[] = rawAuthors
      .flatMap((s: string) => String(s).split(/\s+and\s+/i))
      .map((s: string) => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    return names.map(n => ({ name: n }))
  }

  const setAuthor = (idx: number, field: keyof Author, value: string) => {
    setForm(prev => {
      const authors = [...prev.authors]
      authors[idx] = { ...authors[idx], [field]: value }
      return { ...prev, authors }
    })
  }

  const addAuthor = () => setForm(prev => ({ ...prev, authors: [...prev.authors, { name: '', orcid: '', affiliation: '', wallet: '' }] }))
  const removeAuthor = (idx: number) => setForm(prev => ({ ...prev, authors: prev.authors.filter((_, i) => i !== idx) }))

  // AES-GCM encryption helpers
  async function encryptFileAesGcm(file: File): Promise<{ encrypted: Blob; keyB64: string; ivB64: string; sha256Hex: string }>
  {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = new Uint8Array(await file.arrayBuffer())
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    const exported = await crypto.subtle.exportKey('raw', key)
    const keyB64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
    const ivB64 = btoa(String.fromCharCode(...iv))
    const encrypted = new Blob([ciphertext], { type: 'application/octet-stream' })

    // compute hash of original for integrity
    const digest = await crypto.subtle.digest('SHA-256', data)
    const hashHex = '0x' + Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
    return { encrypted, keyB64, ivB64, sha256Hex: hashHex }
  }

  const mint = async () => {
    try {
      setIsMinting(true)
      setMintError(null)
      if (!primaryFile) throw new Error('Please upload your content.')
      if (!IPNFT_ADDRESS) throw new Error('IPNFT contract not configured.')

      let contentCid = ''
      let contentGatewayUrl = ''
      let contentHashHex = ''
      let encryption:
        | { encrypted: false }
        | { encrypted: true; algorithm: 'AES-GCM'; ivB64: string; notes?: string } = { encrypted: false }

      if (privacy === 'public') {
        // hash
        const buffer = await primaryFile.arrayBuffer()
        const digest = await crypto.subtle.digest('SHA-256', buffer)
        contentHashHex = '0x' + Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')

        const formData = new FormData()
        formData.append('file', primaryFile)
        const res = await fetch('/api/pin-file', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Failed to upload file to IPFS')
        const { cid } = await res.json()
        contentCid = cid
        contentGatewayUrl = `https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/${cid}`
      } else {
        // private: encrypt first, then upload encrypted blob
        const { encrypted, keyB64, ivB64, sha256Hex } = await encryptFileAesGcm(primaryFile)
        contentHashHex = sha256Hex
        const encFile = new File([encrypted], `${primaryFile.name}.enc`)
        const formData = new FormData()
        formData.append('file', encFile)
        const res = await fetch('/api/pin-file', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Failed to upload encrypted file to IPFS')
        const { cid } = await res.json()
        contentCid = cid
        contentGatewayUrl = `https://moccasin-broad-kiwi-732.mypinata.cloud/ipfs/${cid}`
        encryption = { encrypted: true, algorithm: 'AES-GCM', ivB64, notes: 'Content encrypted client-side. Store key securely. Key distribution is out-of-band.' }
        // Save key to Lit if enabled (gated by LicenseNFT ownership)
        try {
          if (LICENSE_NFT_ADDRESS && process.env.NEXT_PUBLIC_LIT_ENABLED === 'true') {
            await saveDecryptionKeyForIP('pending', keyB64, LICENSE_NFT_ADDRESS)
          }
        } catch {}
      }

      // build metadata
      const metadata = {
        title: form.title || `Untitled ${ipType ? prettyType(ipType) : 'Work'}`,
        description: form.description || 'No description provided',
        authors: form.authors.filter(a => a.name.trim()),
        date_of_creation: new Date().toISOString(),
        version: '1.0.0',
        ip_type: ipType || 'other',
        keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean),
        permanent_content_reference: { uri: contentGatewayUrl, content_hash: contentHashHex },
        license: { type: form.licenseType, terms: form.licenseTerms },
        encryption,
        ownership: {
          type: 'individual',
          owners: form.authors.filter(a => a.wallet).map(a => ({ name: a.name, wallet: a.wallet }))
        },
        rights: form.licenseType.includes('CC') ? 'Some rights reserved' : 'All rights reserved',
        provenance: 'Minted via ScienceIP Platform (v2)',
        optional: { ai_summary: form.aiSummary }
      }

      const pinJsonRes = await fetch('/api/pin-json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata) })
      if (!pinJsonRes.ok) throw new Error('Failed to upload metadata to IPFS')
      const { cid: metaCid } = await pinJsonRes.json()
      const metadataUri = `ipfs://${metaCid}`

      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error('Wallet not found')
      const provider = new ethers.BrowserProvider(ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const userAddr = await signer.getAddress()
      const ipnft = new ethers.Contract(IPNFT_ADDRESS, IPNFT_ABI, signer)

      const royaltyRecipient = userAddr
      const royaltyBps = 500
      const payees = [userAddr]
      const shares = [100]

      const tx = await ipnft.mintIP(
        userAddr,
        metadataUri,
        contentHashHex,
        royaltyRecipient,
        royaltyBps,
        payees,
        shares
      )
      const receipt = await tx.wait()
      // Extract tokenId from event
      let ipTokenId: string | null = null
      for (const log of receipt.logs) {
        try {
          const parsed = ipnft.interface.parseLog(log)
          if (parsed && parsed.name === 'IPMinted') {
            ipTokenId = parsed.args.tokenId
            break
          }
        } catch {}
      }
      alert('IP NFT minted successfully!')
            // 6) Create license offers (AI-selected or default) if license contract is configured
            if (LICENSE_NFT_ADDRESS && ipTokenId) {
              try {
                const licenseContract = new ethers.Contract(LICENSE_NFT_ADDRESS, LicenseNFT_ABI, signer)
                
                const selected = (form.selectedLicenses && form.selectedLicenses.length > 0 && form.licenseSuggestions)
                  ? form.licenseSuggestions.filter((s: any) => form.selectedLicenses!.includes(s.license_id))
                  : [{
                      license_id: 'DEFAULT',
                      license_name: 'Standard License',
                      license_type: form.licenseType,
                      royalties: { model: 'fixed', value: 0, payment_interval_days: 0, mint_fee: 0.001 },
                      restrictions: []
                    }]

                for (const s of selected) {
                  const licenseMetadata = {
                    name: s.license_name || `License for ${form.title || prettyType(ipType || undefined)}`,
                    description: `License for IP token #${String(ipTokenId)} (${s.license_type})`,
                    licenseType: s.license_type || form.licenseType,
                    licenseTerms: form.licenseTerms,
                    ipNFTId: String(ipTokenId),
                    suggestedId: s.license_id,
                    restrictions: s.restrictions || [],
                    royalties: s.royalties || {},
                    createdAt: new Date().toISOString(),
                    price: `${s.royalties?.mint_fee ?? 0.001} SEI`
                  }
                  const licensePinRes = await fetch('/api/pin-json', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(licenseMetadata)
                  })
                  if (!licensePinRes.ok) {
                    const errorText = await licensePinRes.text()
                    throw new Error(`Failed to pin license metadata to IPFS: ${licensePinRes.status} - ${errorText}`)
                  }
                  const { cid: licenseCid } = await licensePinRes.json()
                  const licenseUri = `ipfs://${licenseCid}`
                  const fee = typeof s.royalties?.mint_fee === 'number' ? s.royalties.mint_fee : 0.001
                  const priceInWei = ethers.parseEther(String(fee))
                  const expiry = 0
                  const licenseTx = await licenseContract.createLicenseOffer(ipTokenId, priceInWei, licenseUri, expiry)
                  await licenseTx.wait()
                }
              } catch (licenseErr: any) {
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
      setStep('chooseType')
      setIpType(null)
      setUseAI(null)
      setPrimaryFile(null)
      setAdditionalFiles([])
      setForm({ title: '', description: '', aiSummary: '', keywords: '', authors: [ { name: '', orcid: '', affiliation: '', wallet: '' } ], licenseType: 'CC-BY-4.0', licenseTerms: DEFAULT_LICENSE_TERMS })
    } catch (e: any) {
      setMintError(e?.message || 'Mint failed')
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <main className="min-h-screen">
      <Navigation />

      <div className="pt-24 bg-white/30 backdrop-blur-lg border border-white/30 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mint Your IP (v2)</h1>
            <p className="text-gray-600">A guided flow with optional AI assistance and private encryption.</p>
          </div>

          <Stepper steps={['chooseType','aiChoice','upload','previewForm','privacy','mint']} active={['chooseType','aiChoice','upload','previewForm','privacy','mint'].indexOf(step)} />

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            {step === 'chooseType' && (
              <ChooseType value={ipType} onChange={onPickType} onNext={() => setStep(ipType === 'research_paper' ? 'aiChoice' : 'upload')} />
            )}
            {step === 'aiChoice' && (
              <AiChoice value={useAI} onChange={onChooseAI} onBack={() => setStep('chooseType')} onNext={() => setStep('upload')} />
            )}
            {step === 'upload' && (
              <UploadStep note={useAI ? 'AI will analyze the file and prefill the next step.' : undefined} primaryFileName={primaryFile?.name} onBack={() => setStep(ipType === 'research_paper' ? 'aiChoice' : 'chooseType')} onNext={() => setStep('previewForm')} onUpload={handleUploadPrimary} busy={isExtracting} error={extractError} />
            )}
            {step === 'previewForm' && (
              <PreviewForm 
                form={form} 
                setForm={setForm} 
                summaryResponse={summaryResponse}
                onBack={() => setStep('upload')} 
                onNext={() => setStep('privacy')} 
                onAddAuthor={() => setForm(prev => ({ ...prev, authors: [...prev.authors, { name: '', orcid: '', affiliation: '', wallet: '' }] }))} 
                onRemoveAuthor={(i) => setForm(prev => ({ ...prev, authors: prev.authors.filter((_, idx) => idx !== i) }))} 
                onSetAuthor={(i, k, v) => setForm(prev => { const authors = [...prev.authors]; authors[i] = { ...authors[i], [k]: v }; return { ...prev, authors } })} 
              />
            )}
            {step === 'privacy' && (
              <PrivacyStep value={privacy} onChange={setPrivacy} onBack={() => setStep('previewForm')} onNext={() => setStep('mint')} />
            )}
            {step === 'mint' && (
              <MintStep summary={{ typeLabel: prettyType(ipType || undefined), privacy: privacy === 'public' ? 'Public' : 'Private (Encrypted)' }} error={mintError} busy={isMinting} onBack={() => setStep('privacy')} onMint={mint} />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}


