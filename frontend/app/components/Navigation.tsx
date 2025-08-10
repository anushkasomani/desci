'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
                  <span className="text-white font-bold text-lg">S</span>
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
              href="/about" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-primary-50 group"
            >
              <span className="relative z-10">About</span>
              <div className="absolute inset-0 bg-primary-100 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link 
              href="/mint" 
              className="btn-primary text-sm px-6 py-2.5 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>Get Started</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
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
            href="/about" 
            className="block px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg text-base font-medium transition-all duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <div className="pt-4 px-4">
            <Link 
              href="/mint" 
              className="btn-primary w-full text-center block"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
