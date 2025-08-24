'use client'

import { motion } from 'framer-motion'
import { CpuChipIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline'

const featureList = [
    {
      icon: CpuChipIcon,
      title: "AI-Assisted Licensing",
      description: "Our AI analyzes your work and current market data to recommend intelligent license terms, from upfront fees to revenue sharing."
    },
    {
      icon: ShieldCheckIcon,
      title: "Dual-Storage Protocol",
      description: "Store your IP publicly or keep it private with encryption. Our 'Pay-to-Mint' system grants data access by issuing decryption keys upon license minting."
    },
    {
      icon: UsersIcon,
      title: "Decentralized Governance",
      description: "A robust dispute resolution layer powered by token-holding validators ensures community-led moderation and platform integrity."
    }
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <p className="text-base text-indigo-400 font-semibold tracking-wide uppercase">Why GENOME?</p>
          <h2 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
            A New Paradigm for Intellectual Property
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-400 lg:mx-auto">
            We leverage cutting-edge tech to solve the age-old problems of IP management: security, verification, and liquidity.
          </p>
        </div>

        <div className="mt-20">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {featureList.map((feature) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-white">{feature.title}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-400">{feature.description}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export default Features;