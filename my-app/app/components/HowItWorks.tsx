'use client'

import { motion } from 'framer-motion'
import { DocumentTextIcon, CpuChipIcon, ScaleIcon } from '@heroicons/react/24/outline'

const steps = [
  {
    icon: DocumentTextIcon,
    title: "1. Submit & Analyze",
    description: "Upload your work. Our AI instantly extracts key data, verifies novelty against millions of sources, and suggests optimal, market-aware license terms.",
  },
  {
    icon: CpuChipIcon,
    title: "2. Secure & Tokenize",
    description: "Choose public or private on-chain storage. We hash, timestamp, and mint your work as a secure IP-NFT, giving you undeniable proof of ownership.",
  },
  {
    icon: ScaleIcon,
    title: "3. License & Govern",
    description: "Mint license tokens based on your terms for derivatives or data access. Participate in the validator network to resolve disputes and govern the platform.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white">Three Steps to Ownership</h2>
          <p className="mt-4 text-lg text-gray-400">Our process is simple, secure, and incredibly fast.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="p-8 bg-gray-900 border border-indigo-500/10 rounded-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                <step.icon className="w-8 h-8 text-cyan-300" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks;