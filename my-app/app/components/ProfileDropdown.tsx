'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserCircleIcon, BanknotesIcon, UsersIcon } from '@heroicons/react/24/outline'

type ProfileDropdownProps = {
  userAddress: string
  tokenBalance: string
  onGovernanceClick: () => void
}

const formatAddress = (address: string) => `${address.slice(0, 5)}...${address.slice(-4)}`

export function ProfileDropdown({ userAddress, tokenBalance, onGovernanceClick }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full hover:bg-gray-800 transition-colors"
      >
        <UserCircleIcon className="w-6 h-6 text-cyan-400" />
        <span className="text-sm font-mono text-white">{formatAddress(userAddress)}</span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute right-0 mt-3 w-72 origin-top-right bg-gray-900 border border-gray-700 rounded-2xl shadow-lg p-2"
        >
          <div className="border-b border-gray-700 px-3 py-3 mb-1">
            <p className="text-xs text-gray-500">Current Balance</p>
            <p className="text-xl font-bold text-white">{parseFloat(tokenBalance).toFixed(4)} <span className="text-cyan-400">DESCI</span></p>
          </div>
          <div className="p-1">
            <Link href="/dashboard" className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <BanknotesIcon className="w-5 h-5"/> My IP Assets
            </Link>
            {/* <Link href="/my-licenses" className="flex items-center gap-3 w-full text-left px-3 py-2.5 mt-1 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <BanknotesIcon className="w-5 h-5"/> My Licenses
            </Link> */}
            <button onClick={onGovernanceClick} className="flex items-center gap-3 w-full text-left px-3 py-2.5 mt-1 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <UsersIcon className="w-5 h-5"/> Join Governance
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ProfileDropdown;