// hooks/useMintWizard.ts
'use client'

import { useState, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { IPNFT_ADDRESS, IPNFT_ABI, LICENSE_NFT_ADDRESS, LicenseNFT_ABI } from '../config/contracts';
import type { IpType, WizardStepId, FormState, Author, LicenseSuggestion } from '../types/mint';

type MetadataResponse = { success: boolean; data?: any; error?: string };

// All API and helper functions are now fully implemented inside the hook's scope.
const API_BASE_METADATA = "https://sei-agents-metadata.onrender.com";
const API_BASE_LICENSE = "https://sei-licence.onrender.com";

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
    const [summaryResponse, setSummaryResponse] = useState<any>(null);
    const [metaResponse, setMetaResponse] = useState<any>(null);
    const [form, setForm] = useState<FormState>({
        title: '', description: '', aiSummary: '', keywords: '',
        authors: [{ name: '' }]
    });
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
    const [licenseSuggestions, setLicenseSuggestions] = useState<LicenseSuggestion[]>([]);
    const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const steps: { id: WizardStepId, name: string }[] = [
        { id: 'chooseType', name: 'Select Type' },
        { id: 'upload', name: 'Upload' },
        { id: 'details', name: 'Details' },
        { id: 'licenses', name: 'Licensing' },
        { id: 'privacy', name: 'Privacy' },
        { id: 'mint', name: 'Mint' },
    ];
    
    const currentStepIndex = useMemo(() => steps.findIndex(s => s.id === step), [step, steps]);

    const selectIpType = (type: IpType) => {
        setIpType(type);
        setStep('upload');
    };

    const populateFormFromExtraction = (type: IpType, data: any) => {
        const title = data.title || '';
        const desc = data.high_level_overview || data.abstract || data.ai_summary?.abstract || '';
        const kw = Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords || '';
        const rawAuthors = Array.isArray(data.authors) ? data.authors : [];
        const authors = rawAuthors.map((a: any) => ({ name: typeof a === 'string' ? a : a.name || '' }));
        setForm(prev => ({
            ...prev,
            title: prev.title || title,
            description: prev.description || desc,
            keywords: prev.keywords || kw,
            aiSummary: prev.aiSummary || data.ai_summary?.summary || '',
            authors: authors.length > 0 ? authors : prev.authors,
        }));
    };

    const handleFileUpload = async (file: File) => {
        setPrimaryFile(file);
        if (!useAI || !ipType) {
            setForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
            setStep('details');
            return;
        }
        
        setIsLoading(true);
        setLoadingMessage('AI is analyzing your document...');
        setError(null);
        try {
            let res: MetadataResponse | null = null;
            if (ipType === 'research_paper') {
                res = await fetchPaperExtraction(file);
            }
            // Add other fetch types here (dataset, formula) as needed
            
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
            setStep('upload'); // Stay on upload step if error
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

            // 1. Handle File Upload (Public or Private)
            setLoadingMessage('Uploading file to IPFS...');
            let contentCid = "";
            let contentHashHex = "";
            let encryption: any = { encrypted: false };
            
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
                encryption = { encrypted: true, algorithm: "AES-GCM", ivB64 };
                console.log("DECRYPTION KEY (SAVE THIS!):", keyB64);
            }

            // 2. Build and Upload Metadata
            setLoadingMessage('Uploading metadata to IPFS...');
            const metadata = {
                title: form.title, description: form.description, authors: form.authors,
                date_of_creation: new Date().toISOString(), ip_type: ipType,
                keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
                permanent_content_reference: { uri: `ipfs://${contentCid}`, content_hash: contentHashHex },
                encryption, optional: { ai_summary: form.aiSummary }
            };
            const pinJsonRes = await fetch("/api/pin-json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata) });
            if (!pinJsonRes.ok) throw new Error("Failed to upload metadata to IPFS");
            const { cid: metaCid } = await pinJsonRes.json();
            const metadataUri = `ipfs://${metaCid}`;

            // 3. Mint IP-NFT
            setLoadingMessage('Confirm transaction in wallet...');
            const ethereum = (window as any).ethereum;
            if (!ethereum) throw new Error("Wallet not found");
            const provider = new ethers.BrowserProvider(ethereum);
            const signer = await provider.getSigner();
            const userAddr = await signer.getAddress();
            const ipnftContract = new ethers.Contract(IPNFT_ADDRESS, IPNFT_ABI, signer);
            
            const tx = await ipnftContract.mintIP(userAddr, metadataUri, contentHashHex as any, userAddr, 500, [userAddr], [100]);
            setLoadingMessage('Waiting for transaction confirmation...');
            const receipt = await tx.wait();

            const ipMintedEvent = receipt.logs.map((log: any) => ipnftContract.interface.parseLog(log)).find((e: any) => e?.name === 'IPMinted');
            const ipTokenId = ipMintedEvent?.args.tokenId;
            if (!ipTokenId) throw new Error("Could not determine minted Token ID.");

            // 4. Create License Offers
            if (selectedLicenses.length > 0) {
                setLoadingMessage('Creating license offers...');
                const licenseContract = new ethers.Contract(LICENSE_NFT_ADDRESS, LicenseNFT_ABI, signer);
                for (const licenseId of selectedLicenses) {
                    const license = licenseSuggestions.find(l => l.license_id === licenseId);
                    if (license) {
                        const licenseMeta = { name: license.license_name, description: `License for IP #${ipTokenId}`, ...license };
                        const lRes = await fetch("/api/pin-json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(licenseMeta) });
                        if (!lRes.ok) throw new Error("Failed to pin license metadata.");
                        const { cid: lCid } = await lRes.json();
                        const lUri = `ipfs://${lCid}`;
                        const priceInWei = ethers.parseEther(String(license.royalties.mint_fee));
                        const ltx = await licenseContract.createLicenseOffer(ipTokenId, priceInWei, lUri, 0);
                        await ltx.wait();
                    }
                }
            }

            alert("IP Asset Minted Successfully!");
            // Full Reset
            setStep('chooseType'); setIpType(null); setPrimaryFile(null); setForm({ title: '', description: '', aiSummary: '', keywords: '', authors: [{ name: '' }] }); setLicenseSuggestions([]); setSelectedLicenses([]);
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
        currentStepIndex, licenseSuggestions, selectedLicenses,
        selectIpType, handleFileUpload, submitDetails, submitLicenses,
        selectPrivacy, mint, goToStep, fetchLicenseSuggestions, toggleLicenseSelection
    };
}