// types/mint.ts

export type IpType = 'research_paper' | 'dataset' | 'formula_method' | 'other';

export type WizardStepId = 'chooseType' | 'upload' | 'details' | 'licenses' | 'privacy' | 'mint';

export type WizardStep = {
    id: WizardStepId;
    name: string;
};

export type Author = { 
    name: string; 
    orcid?: string; 
    affiliation?: string; 
    wallet?: string;
};

export type FormState = {
    title: string;
    description: string;
    aiSummary: string;
    keywords: string;
    authors: Author[];
};

export type LicenseSuggestion = {
    license_id: string;
    license_name: string;
    license_type: string;
    royalties: {
        model: string;
        value: number | string;
        mint_fee: number;
        notes?: string;
    };
    restrictions: string[];
};