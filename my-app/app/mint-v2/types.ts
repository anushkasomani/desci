export type IpType = 'research_paper' | 'dataset' | 'formula_method' | 'other'

export type WizardStep =
  | 'chooseType'
  | 'aiChoice'
  | 'upload'
  | 'previewForm'
  | 'privacy'
  | 'mint'

export type Author = { name: string; orcid?: string; affiliation?: string; wallet?: string }

export type FormState = {
  title: string
  description: string
  aiSummary: string
  keywords: string
  authors: Author[]
  // License
  licenseType: string
  licenseTerms: string
  // AI License suggestions
  selectedLicenses?: string[]
  licenseSuggestions?: any[]
}

export const DEFAULT_LICENSE_TERMS = 'This work is licensed under Creative Commons Attribution 4.0 International.'

export const prettyType = (t?: IpType | null) =>
  t === 'research_paper' ? 'Research Paper'
  : t === 'dataset' ? 'Dataset'
  : t === 'formula_method' ? 'Formula/Method'
  : t === 'other' ? 'Other' : 'Work'


