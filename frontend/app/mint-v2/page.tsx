'use client'

import { useEffect } from 'react'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { useMintWizard } from '../hooks/useMintWizard'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/solid'
// import { UploadStep } from './components/UploadStep'
// import UploadStep from './components/UploadStep'
import { DetailsForm } from './components/DetailsForm'
import { LicenseStep } from './components/LicenseStep'
import { PrivacyStep } from './components/PrivacyStep'
import { MintStep } from './components/MintStep'
import {ChooseType} from './components/ChooseType'
import { IpType } from "../types/mint"
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid"

const MintWizardHeader = ({ steps, currentStepIndex }: { steps: {id: string, name: string}[], currentStepIndex: number }) => (
    <div className="w-full mb-12">
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                    <li key={step.name} className="relative flex-1">
                        {stepIdx < steps.length - 1 && (
                            <div className="absolute inset-0 top-4 -ml-px h-0.5 w-full bg-gray-700" aria-hidden="true" />
                        )}
                        <div className="relative flex items-start justify-center flex-col">
                            <span className="h-9 flex items-center">
                                {stepIdx < currentStepIndex ? (
                                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
                                        <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                    </span>
                                ) : stepIdx === currentStepIndex ? (
                                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-500 bg-gray-900">
                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                    </span>
                                ) : (
                                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-700 bg-gray-900" />
                                )}
                            </span>
                            <span className="text-sm font-medium text-gray-400 mt-2">{step.name}</span>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    </div>
)

export default function MintPage() {
    const wizard = useMintWizard()

    useEffect(() => {
        if (wizard.step === 'licenses') {
            wizard.fetchLicenseSuggestions();
        }
    }, [wizard.step, wizard.fetchLicenseSuggestions]);

    const renderStep = () => {
        switch (wizard.step) {
            case 'chooseType':
                return <ChooseType onSelect={wizard.selectIpType} />
            case 'upload':
                return <UploadStep ipType={wizard.ipType} onUpload={wizard.handleFileUpload} isLoading={wizard.isLoading} loadingMessage={wizard.loadingMessage} onBack={() => wizard.goToStep('chooseType')} />
            case 'details':
                 return <DetailsForm initialData={wizard.form} onSubmit={wizard.submitDetails} onBack={() => wizard.goToStep('upload')} />
            case 'licenses':
                 return <LicenseStep 
                            suggestions={wizard.licenseSuggestions}
                            selectedIds={wizard.selectedLicenses}
                            onToggle={wizard.toggleLicenseSelection}
                            onSubmit={wizard.submitLicenses} 
                            onBack={() => wizard.goToStep('details')}
                            isLoading={wizard.isLoading}
                            loadingMessage={wizard.loadingMessage}
                        />
            case 'privacy':
                return <PrivacyStep onSelect={wizard.selectPrivacy} onBack={() => wizard.goToStep('licenses')} />
            case 'mint':
                return <MintStep onMint={wizard.mint} onBack={() => wizard.goToStep('privacy')} isLoading={wizard.isLoading} loadingMessage={wizard.loadingMessage} error={wizard.error} />
            default:
                return <div>Unknown Step</div>
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-950">
            <Navigation />
            <main className="pt-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <MintWizardHeader steps={wizard.steps} currentStepIndex={wizard.currentStepIndex} />
                    <div className="p-8 bg-gray-900 border border-indigo-500/10 rounded-2xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={wizard.step}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                {renderStep()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

type Props = { ipType: IpType | null; onUpload: (file: File) => void; isLoading: boolean; loadingMessage: string; onBack: () => void }
export function UploadStep({ ipType, onUpload, isLoading, loadingMessage, onBack }: Props) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Upload Your Work</h2>
            <p className="text-gray-400 mb-8">Upload the primary file for your <span className="font-semibold text-cyan-400">{ipType?.replace('_', ' ')}</span>. The AI will analyze it to pre-fill details.</p>
            {isLoading ? (
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
                    <p className="mt-4 text-gray-300">{loadingMessage}</p>
                </div>
            ) : (
                <div className="text-center border-2 border-dashed border-gray-700 rounded-lg p-12">
                     <input type="file" id="file-upload" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]) }} />
                     <label htmlFor="file-upload" className="cursor-pointer">
                        <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-gray-500" />
                        <p className="mt-4 text-lg font-semibold text-white">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500 mt-1">PDF, CSV, JSON, PNG, etc.</p>
                     </label>
                </div>
            )}
            <div className="mt-8 flex justify-between">
                <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Back</button>
            </div>
        </div>
    )
}