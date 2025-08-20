'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { DESCI_ADDRESS, Desci_ABI } from '../config/contracts'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userAddress, setUserAddress] = useState<string>('')
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const isValidDesciAddress = !!DESCI_ADDRESS && ethers.isAddress(DESCI_ADDRESS)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    getWalletAddress()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileOpen && !(event.target as Element).closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

  const getWalletAddress = async () => {
    try {
      const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          setUserAddress(accounts[0].address)
          if (isValidDesciAddress) {
            fetchTokenBalance(accounts[0].address)
          }
        }
      }
    } catch (error) {
      console.log('No wallet connected')
    }
  }

  const fetchTokenBalance = async (address: string) => {
    try {
      if (!isValidDesciAddress) return
      
      const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
      if (!ethereum) return

      const provider = new ethers.BrowserProvider(ethereum)
      const contract = new ethers.Contract(DESCI_ADDRESS, Desci_ABI, provider)
      const balance = await contract.balanceOf(address)
      setTokenBalance(ethers.formatEther(balance))
    } catch (error) {
      console.error('Failed to fetch token balance:', error)
    }
  }

  const connectWallet = async () => {
    try {
      const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
      if (!ethereum) {
        alert('Please install MetaMask or a compatible wallet')
        return
      }

      await ethereum.request({ method: 'eth_requestAccounts' })
      await getWalletAddress()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const formatAddress = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg' 
        : 'bg-white/80 backdrop-blur-md border-b border-gray-200/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-gray-700 font-bold text-lg">S</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                  ScienceIP
                </span>
                <span className="text-xs text-gray-500 font-medium">Research to IP</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-primary-50 group"
            >
              <span className="relative z-10">Home</span>
              <div className="absolute inset-0 bg-primary-100 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
            </Link>
            <Link 
              href="/mint" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-primary-50 group"
            >
              <span className="relative z-10">Mint IP</span>
              <div className="absolute inset-0 bg-primary-100 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
            </Link>
            <Link 
              href="/ip-gallery" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-primary-50 group"
            >
              <span className="relative z-10">Gallery</span>
              <div className="absolute inset-0 bg-primary-100 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
            </Link>
            <Link 
              href="/about" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-primary-50 group"
            >
              <span className="relative z-10">About</span>
              <div className="absolute inset-0 bg-primary-100 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
            </Link>
            <Link 
              href="/validators" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-primary-50 group"
            >
              <span className="relative z-10">Validators</span>
              <div className="absolute inset-0 bg-primary-100 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
            </Link>
          </div>

          {/* CTA Button / Profile */}
          <div className="hidden md:block">
            {!userAddress ? (
              <button
                onClick={connectWallet}
                className="btn-primary text-sm px-6 py-2.5 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Connect Wallet</span>
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
              </button>
            ) : (
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-gray-700 rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-700">Balance</div>
                    <div className="text-sm font-semibold text-gray-700">{tokenBalance} DESCI</div>
                  </div>
                  <svg className={`w-4 h-4 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 profile-dropdown">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                          {/* <span className="text-gray-700 font-bold text-lg">
                            {userAddress ? userAddress.slice(2, 4).toUpperCase() : 'U'}
                          </span> */}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Wallet Connected</div>
                          <div className="text-sm text-gray-500 font-mono">{formatAddress(userAddress)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">Governance Tokens</span>
                          <span className="text-2xl font-bold text-primary-600">{tokenBalance}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">DESCI</div>
                        {!isValidDesciAddress && (
                          <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded mt-2 p-2">
                            Set NEXT_PUBLIC_DESCI_CONTRACT_ADDRESS to a valid 0x address to enable balance.
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Link
                          href="/mint"
                          className="flex items-center space-x-3 w-full px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Mint IP</span>
                        </Link>
                        <Link
                          href="/ip-gallery"
                          className="flex items-center space-x-3 w-full px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>IP Gallery</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-2 text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600 transition-colors duration-300"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'
                }`}></span>
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'
                }`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="px-4 pt-2 pb-6 space-y-2 bg-white/95 backdrop-blur-xl border-t border-gray-200/50">
          <Link 
            href="/" 
            className="block px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg text-base font-medium transition-all duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/mint" 
            className="block px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg text-base font-medium transition-all duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Mint IP
          </Link>
          <Link 
            href="/ip-gallery" 
            className="block px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg text-base font-medium transition-all duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Gallery
          </Link>
          <Link 
            href="/validators" 
            className="block px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg text-base font-medium transition-all duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            Validators
          </Link>
          <Link 
            href="/about" 
            className="block px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg text-base font-medium transition-all duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          
         </div>
      </div>
    </nav>
  )
}
