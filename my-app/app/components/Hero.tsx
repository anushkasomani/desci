'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

const AnimatedTokenCard = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
    transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
    className="relative w-full max-w-md h-80 rounded-3xl p-6 bg-gray-900/50 backdrop-blur-xl border border-indigo-500/20 shadow-2xl shadow-indigo-500/10"
    style={{ transformStyle: 'preserve-3d' }}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(119,82,254,0.15),rgba(0,0,0,0))]"></div>
    <div className="flex flex-col justify-between h-full relative z-10">
      <div>
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold text-cyan-400">IP-NFT ASSET</p>
          <p className="text-xs text-gray-500">#00742</p>
        </div>
        <h3 className="text-2xl font-bold text-white mt-2">Quantum Encryption Algorithm</h3>
      </div>
      <div>
        <p className="text-xs text-gray-400">OWNER</p>
        <p className="font-mono text-sm text-gray-200">0x8a...f42d</p>
      </div>
    </div>
    <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-white/10 to-transparent opacity-50 -skew-x-12"></div>
  </motion.div>
)

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950 px-4">
      <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.1)_0%,rgba(167,139,250,0)_50%)]"></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        <div className="text-center lg:text-left">
          <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold text-white leading-tight">
            Own Your Innovation.
            <span className="block bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-6 text-lg text-gray-400 max-w-xl mx-auto lg:mx-0">
            For corporations and researchers alike, GENOME uses AI to seamlessly analyze, verify, and tokenize your research into secure, licensable IP assets in seconds.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/tokenize" className="group flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-transform hover:scale-105">
              Tokenize Your IP <ChevronRightIcon className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#how-it-works" className="px-8 py-4 text-lg font-bold text-gray-300 hover:text-white transition-colors">
              How It Works
            </Link>
          </motion.div>
        </div>
        <div className="flex items-center justify-center">
          <AnimatedTokenCard />
        </div>
      </motion.div>
    </div>
  )
}

export default Hero;