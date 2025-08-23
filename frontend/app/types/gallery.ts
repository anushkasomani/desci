// types/gallery.ts

export interface IPMetadata {
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
}

export interface LicenseMetadata {
  name?: string
  description?: string
  licenseType?: string
  licenseTerms?: string
}

export interface LicenseOffer {
  offerIndex: number
  ipTokenId: string
  ipOwner: string
  licenseURI: string
  priceWei: string
  expiry: string
  licenseMetadata?: LicenseMetadata | null
}

export interface IPNFT {
  tokenId: string
  owner?: string
  metadata: IPMetadata | null
  metadataUri: string
  contentHash: string
  transactionHash?: string
  offers?: LicenseOffer[]
}

export interface DerivativeFormData {
  title: string
  description: string
  derivativeType: 'REMIX' | 'EXTENSION' | 'COLLABORATION' | 'VALIDATION' | 'CRITIQUE'
  isCommercial: boolean
  parentTokenIds: string[]
  licenseTokenIds: string[]
}