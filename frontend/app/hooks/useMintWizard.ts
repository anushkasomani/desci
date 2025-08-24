
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { IPNFT_ADDRESS, IPNFT_ABI, LICENSE_NFT_ADDRESS, LicenseNFT_ABI } from '../config/contracts';
import type { IpType, WizardStepId, FormState, Author, LicenseSuggestion } from '../types/mint';

type MetadataResponse = { success: boolean; data?: any; error?: string };

const API_BASE_METADATA = "https://sei-agents-metadata.onrender.com";
const API_BASE_LICENSE = "https://sei-licence.onrender.com";

// --- API Fetcher Functions ---
async function fetchPaperExtraction(file: File): Promise<MetadataResponse> {
    const fd = new FormData();
    fd.append("file", file);
    const [mRes, sRes] = await Promise.all([
        fetch(`${API_BASE_METADATA}/paper/metadata`, { method: "POST", body: fd }),
        fetch(`${API_BASE_METADATA}/paper/summary`, { method: "POST", body: fd })
    ]);
    if (!mRes.ok || !sRes.ok) throw new Error(`AI API failed. Statuses: ${mRes.status}, ${sRes.status}`);
    const [mJson, sJson] = await Promise.all([mRes.json(), sRes.json()]);
    return { success: true, data: { ...mJson, ai_summary: sJson, raw: { metadata: mJson, summary: sJson } } };
}

async function fetchDatasetExtraction(file: File, description: string): Promise<MetadataResponse> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("description", description || "");
    const [mRes, sRes] = await Promise.all([
        fetch(`${API_BASE_METADATA}/dataset/metadata`, { method: "POST", body: fd }),
        fetch(`${API_BASE_METADATA}/dataset/summary`, { method: "POST", body: fd })
    ]);
    if (!mRes.ok || !sRes.ok) throw new Error(`AI API failed. Statuses: ${mRes.status}, ${sRes.status}`);
    const [mJson, sJson] = await Promise.all([mRes.json(), sRes.json()]);
    return { success: true, data: { ...mJson, ai_summary: sJson, raw: { metadata: mJson, summary: sJson } } };
}

async function fetchFormulaExtraction(imageFile: File, userInput: string): Promise<MetadataResponse> {
    const fd = new FormData();
    fd.append("image", imageFile);
    fd.append("user_input", userInput || "");
    const [mRes, sRes] = await Promise.all([
        fetch(`${API_BASE_METADATA}/formula/metadata`, { method: "POST", body: fd }),
        fetch(`${API_BASE_METADATA}/formula/summary`, { method: "POST", body: fd })
    ]);
    if (!mRes.ok || !sRes.ok) throw new Error(`AI API failed. Statuses: ${mRes.status}, ${sRes.status}`);
    const [mJson, sJson] = await Promise.all([mRes.json(), sRes.json()]);
    return { success: true, data: { ...mJson, ai_summary: sJson, raw: { metadata: mJson, summary: sJson } } };
}

async function fetchLicenseSuggestionsFromSummary(summaryJson: any): Promise<LicenseSuggestion[]> {
    const blob = new Blob([JSON.stringify(summaryJson ?? {})], { type: "application/json" });
    const file = new File([blob], "summary.json", { type: "application/json" });
    const fd = new FormData();
    fd.append("file", file);
    const resp = await fetch(`${API_BASE_LICENSE}/generate-licenses/`, { method: "POST", body: fd });
    if (!resp.ok) throw new Error(`License API failed: ${resp.status}`);
    const json = await resp.json();
    return Array.isArray(json) ? json : [];
}

async function encryptFileAesGcm(file: File): Promise<{ encrypted: Blob; keyB64: string; ivB64: string; sha256Hex: string }> {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new Uint8Array(await file.arrayBuffer());
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    const exported = await crypto.subtle.exportKey("raw", key);
    const keyB64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const encrypted = new Blob([ciphertext], { type: "application/octet-stream" });
    const digest = await crypto.subtle.digest("SHA-256", data);
    const hashHex = "0x" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return { encrypted, keyB64, ivB64, sha256Hex: hashHex };
}

export function useMintWizard() {
    const [step, setStep] = useState<WizardStepId>('chooseType');
    const [ipType, setIpType] = useState<IpType | null>(null);
    const [useAI, setUseAI] = useState<boolean>(true);
    const [primaryFile, setPrimaryFile] = useState<File | null>(null);
    const [datasetDescription, setDatasetDescription] = useState("");
    const [formulaNote, setFormulaNote] = useState("");
    const [summaryResponse, setSummaryResponse] = useState<any>(null);
    const [metaResponse, setMetaResponse] = useState<any>(null);
    const [form, setForm] = useState<FormState>({
        title: '', description: '', aiSummary: '', keywords: '',
        authors: [{ name: '' }],
        owners: [{ wallet: '' }]
    });
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
    const [licenseSuggestions, setLicenseSuggestions] = useState<LicenseSuggestion[]>([]);
    const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getSignerAddress = async () => {
            try {
                if (typeof window !== 'undefined' && (window as any).ethereum) {
                    const provider = new ethers.BrowserProvider((window as any).ethereum);
                    const accounts = await provider.send('eth_accounts', []);
                    if (accounts && accounts.length > 0) {
                        setForm(prev => ({ ...prev, owners: [{ wallet: accounts[0] }] }));
                    }
                }
            } catch (e) {
                console.warn("Could not pre-fill owner address:", e);
            }
        };
        getSignerAddress();
    }, []);

    const steps: { id: WizardStepId, name: string }[] = [
        { id: 'chooseType', name: 'Select Type' }, { id: 'upload', name: 'Upload' },
        { id: 'details', name: 'Details' }, { id: 'licenses', name: 'Licensing' },
        { id: 'privacy', name: 'Privacy' }, { id: 'mint', name: 'Mint' },
    ];
    
    const currentStepIndex = useMemo(() => steps.findIndex(s => s.id === step), [step, steps]);

    const selectIpType = (type: IpType) => {
        setIpType(type);
        setStep('upload');
    };

    const populateFormFromExtraction = (type: IpType, data: any) => {
        let derivedFormState: Partial<FormState> = {};
        if (type === 'research_paper') {
            derivedFormState.title = data.title || '';
            derivedFormState.description = data.abstract || data.ai_summary?.abstract || '';
            derivedFormState.keywords = Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords || '';
            const rawAuthors = Array.isArray(data.authors) ? data.authors.map((a: any) => ({ name: a.name || a })) : [];
            derivedFormState.authors = rawAuthors.length > 0 ? rawAuthors : [{ name: '' }];
        } else if (type === 'dataset') {
            derivedFormState.title = data.title || '';
            derivedFormState.description = data.description || '';
            derivedFormState.keywords = Array.isArray(data.columns) ? data.columns.map((c: any) => c.name).join(', ') : '';
        } else if (type === 'formula_method') {
            derivedFormState.title = data.chemical_compound_name || '';
            derivedFormState.description = data.description || '';
            derivedFormState.keywords = Array.isArray(data.field_of_study) ? data.field_of_study.join(', ') : '';
        }
        setForm(prev => ({ ...prev, ...derivedFormState }));
    };

    const handleFileUpload = async () => {
        if (!primaryFile) {
            setError("Please select a file before continuing.");
            return;
        }
        if (!useAI || !ipType) {
            setForm(prev => ({ ...prev, title: primaryFile.name.replace(/\.[^/.]+$/, "") }));
            setStep('details');
            return;
        }
        setIsLoading(true);
        setLoadingMessage('AI is analyzing your document...');
        setError(null);
        try {
            let res: MetadataResponse | null = null;
            if (ipType === 'research_paper') res = await fetchPaperExtraction(primaryFile);
            else if (ipType === 'dataset') res = await fetchDatasetExtraction(primaryFile, datasetDescription);
            else if (ipType === 'formula_method') res = await fetchFormulaExtraction(primaryFile, formulaNote);
            
            if (res && res.success) {
                setMetaResponse(res.data?.raw?.metadata || res.data);
                setSummaryResponse(res.data?.raw?.summary || res.data.ai_summary);
                populateFormFromExtraction(ipType, res.data);
                setStep('details');
            } else {
                throw new Error(res?.error || 'Failed to extract metadata from file.');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const submitDetails = (formData: FormState) => {
        setForm(formData);
        setStep('licenses');
    };

    const fetchLicenseSuggestions = useCallback(async () => {
        if (!useAI || !summaryResponse) return;
        setIsLoading(true);
        setLoadingMessage('Generating license suggestions...');
        setError(null);
        try {
            const suggestions = await fetchLicenseSuggestionsFromSummary(summaryResponse);
            setLicenseSuggestions(suggestions);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [useAI, summaryResponse]);

    const toggleLicenseSelection = (id: string) => {
        setSelectedLicenses(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const submitLicenses = () => setStep('privacy');
    const selectPrivacy = (choice: 'public' | 'private') => {
        setPrivacy(choice);
        setStep('mint');
    };

    const mint = async () => {
        setIsLoading(true);
        setLoadingMessage('Preparing transaction...');
        setError(null);
        try {
            if (!primaryFile || !ipType) throw new Error("Missing file or IP type.");
            if (!form.owners || form.owners.length === 0 || !ethers.isAddress(form.owners[0].wallet)) throw new Error("A valid owner wallet address is required.");
            
            let contentCid = "", contentHashHex = "", encryption: any = { encrypted: false };
            setLoadingMessage('Uploading file to IPFS...');
            if (privacy === "public") {
                const buffer = await primaryFile.arrayBuffer();
                const digest = await crypto.subtle.digest("SHA-256", buffer);
                contentHashHex = "0x" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
                const fd = new FormData();
                fd.append("file", primaryFile);
                const res = await fetch("/api/pin-file", { method: "POST", body: fd });
                if (!res.ok) throw new Error("Failed to upload file to IPFS");
                const { cid } = await res.json();
                contentCid = cid;
            } else {
                const { encrypted, keyB64, ivB64, sha256Hex } = await encryptFileAesGcm(primaryFile);
                contentHashHex = sha256Hex;
                const encFile = new File([encrypted], `${primaryFile.name}.enc`);
                const fd = new FormData();
                fd.append("file", encFile);
                const res = await fetch("/api/pin-file", { method: "POST", body: fd });
                if (!res.ok) throw new Error("Failed to upload encrypted file to IPFS");
                const { cid } = await res.json();
                contentCid = cid;
                encryption = { encrypted: true, algorithm: "AES-GCM", ivB64, keyB64 };
                console.log("DECRYPTION KEY (SAVE THIS!):", keyB64);
            }

            setLoadingMessage('Uploading metadata to IPFS...');
            let metadata: any = {
                title: form.title, description: form.description, authors: form.authors,
                date_of_creation: new Date().toISOString(), version: "1.0.0", ip_type: ipType,
                keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
                permanent_content_reference: { uri: `ipfs://${contentCid}`, content_hash: contentHashHex },
                encryption, optional: {},
                ownership: { type: "individual", owner: form.owners[0].wallet }
            };

            if (ipType === 'research_paper') {
                metadata.optional.doi = metaResponse?.doi;
                metadata.optional.venue = metaResponse?.venue;
                metadata.optional.ai_summary = summaryResponse;
            } else if (ipType === 'dataset') {
                metadata.optional.source = metaResponse?.source;
                metadata.optional.update_frequency = metaResponse?.update_frequency;
                metadata.optional.limitations = metaResponse?.limitations;
                metadata.optional.dataset_schema = { columns: metaResponse?.columns };
                metadata.optional.ai_summary = {
                    ...summaryResponse?.information,
                    concise_summary: summaryResponse?.concise_summary
                };
            } else if (ipType === 'formula_method') {
                metadata.optional.iupac_name = metaResponse?.iupac_name;
                metadata.optional.application = metaResponse?.application;
                metadata.optional.ai_summary = {
                    what_it_is_about: metaResponse?.what_it_is_about,
                    biological_role_notes: summaryResponse?.chemical_compound?.biological_role_notes,
                };
                if (privacy === 'public') {
                    metadata.optional.ai_summary.structure_description = summaryResponse?.chemical_compound?.structure_description;
                    metadata.optional.ai_summary.functional_groups = summaryResponse?.chemical_compound?.functional__groups;
                    metadata.optional.ai_summary.chemical_formula = summaryResponse?.chemical_compound?.chemical_formula;
                }
            }

            const pinJsonRes = await fetch("/api/pin-json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata) });
            if (!pinJsonRes.ok) throw new Error("Failed to upload metadata to IPFS");
            const { cid: metaCid } = await pinJsonRes.json();
            const metadataUri = `ipfs://${metaCid}`;

            setLoadingMessage('Confirm transaction in wallet...');
            const ethereum = (window as any).ethereum;
            if (!ethereum) throw new Error("Wallet not found");
            const provider = new ethers.BrowserProvider(ethereum);
            const signer = await provider.getSigner();
            const userAddr = await signer.getAddress();
            const ipnftContract = new ethers.Contract(IPNFT_ADDRESS, IPNFT_ABI, signer);
            
            const royaltyRecipient = form.owners[0].wallet;
            const validPayees = form.authors.map(a => a.wallet).filter((w): w is string => !!w && ethers.isAddress(w));
            const payees = validPayees.length > 0 ? [...new Set(validPayees)] : [royaltyRecipient];
            const shares = payees.map(() => Math.floor(100 / payees.length));
            if (shares.length > 0) {
                let remainder = 100 % payees.length;
                for (let i = 0; i < remainder; i++) shares[i]++;
            }

            const tx = await ipnftContract.mintIP(userAddr, metadataUri, contentHashHex as any, royaltyRecipient, 500, payees, shares);
            
            setLoadingMessage('Waiting for transaction confirmation...');
            const receipt = await tx.wait();
            const ipMintedEvent = receipt.logs.map((log: any) => ipnftContract.interface.parseLog(log)).find((e: any) => e?.name === 'IPMinted');
            const ipTokenId = ipMintedEvent?.args.tokenId;
            if (!ipTokenId) throw new Error("Could not determine minted Token ID.");

            if (selectedLicenses.length > 0) {
                setLoadingMessage('Creating license offers...');
                const licenseContract = new ethers.Contract(LICENSE_NFT_ADDRESS, LicenseNFT_ABI, signer);
                for (const licenseId of selectedLicenses) {
                    const license = licenseSuggestions.find(l => l.license_id === licenseId);
                    if (license) {
                        // Create license metadata without decryption info
                        const licenseMeta = { 
                            name: license.license_name, 
                            description: `License for IP #${ipTokenId}`, 
                            ...license 
                        };
                        
                        const lRes = await fetch("/api/pin-json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(licenseMeta) });
                        if (!lRes.ok) throw new Error("Failed to pin license metadata.");
                        const { cid: lCid } = await lRes.json();
                        const lUri = `ipfs://${lCid}`;
                        const priceInWei = ethers.parseEther(String(license.royalties.mint_fee));
                        const ltx = await licenseContract.createLicenseOffer(ipTokenId, priceInWei, lUri, 0);
                        await ltx.wait();
                        
                        // Store decryption key in our private mapping for private files
                        if (privacy === 'private' && encryption.encrypted) {
                            const decryptionInfo = {
                                key: encryption.keyB64,
                                algorithm: encryption.algorithm,
                                iv: encryption.ivB64,
                                contentCid: contentCid
                            };
                            
                            // Store the key mapping (this would be done server-side in production)
                            await fetch("/api/store-decryption-key", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    ipTokenId: ipTokenId.toString(),
                                    decryptionInfo
                                })
                            });
                        }
                    }
                }
            }

            // Call vector search API to index the new IP
            try {
                const namespace = ipType === 'research_paper' ? 'paper' : 
                                ipType === 'dataset' ? 'dataset' : 'algo';
                
                const summary = ipType === 'research_paper' ? summaryResponse?.abstract || form.description :
                               ipType === 'dataset' ? summaryResponse?.concise_summary || form.description :
                               summaryResponse?.chemical_compound?.description || form.description;
                
                // Build query parameters for the API
                const params = new URLSearchParams({
                    id: ipTokenId.toString(),
                    summary: summary || form.description,
                    title: form.title,
                    namespace: namespace
                });
                
                console.log('Indexing IP in vector search:', {
                    id: ipTokenId.toString(),
                    summary: summary || form.description,
                    title: form.title,
                    namespace: namespace
                });
                
                const response = await fetch(`https://sei-vectorsearch.onrender.com/insert?${params.toString()}`, {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.warn(`Failed to index IP ${ipTokenId}:`, response.status, errorText);
                } else {
                    const result = await response.json();
                    console.log(`IP ${ipTokenId} indexed successfully:`, result);
                }
            } catch (e) {
                console.warn('Failed to index IP in vector search:', e);
            }
            
            alert("IP Asset Minted Successfully!");
            setStep('chooseType'); setIpType(null); setPrimaryFile(null); setForm({ title: '', description: '', aiSummary: '', keywords: '', authors: [{ name: '' }], owners: [{ wallet: '' }] }); setLicenseSuggestions([]); setSelectedLicenses([]);
        } catch (e: any) {
             setError(e.message || "An unknown error occurred during minting.");
        } finally {
             setIsLoading(false);
             setLoadingMessage('');
        }
    };
    
    const goToStep = (stepId: WizardStepId) => setStep(stepId);
    
    return {
        step, ipType, form, privacy, isLoading, loadingMessage, error, steps,
        currentStepIndex, licenseSuggestions, selectedLicenses, datasetDescription, formulaNote,
        primaryFile, setPrimaryFile,
        selectIpType, handleFileUpload, submitDetails, submitLicenses,
        selectPrivacy, mint, goToStep, fetchLicenseSuggestions, toggleLicenseSelection,
        setDatasetDescription, setFormulaNote
    };
}
