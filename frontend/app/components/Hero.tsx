'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative overflow-hidden gradient-bg min-h-screen flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-primary-200 to-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-gradient-to-br from-secondary-200 to-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-gradient-to-br from-primary-300 to-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="text-center">
          {/* Badge */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/30 shadow-sm mb-8 animate-fade-in ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">AI-Powered Research to IP Platform</span>
          </div>

          {/* Main heading */}
          <h1 className={`text-3xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight ${mounted ? 'animate-fade-in animation-delay-200' : 'opacity-0'}`}>
            Transform Your
            <span className="text-gradient block mt-2"> Research into IP</span>
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl md:text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed ${mounted ? 'animate-fade-in animation-delay-400' : 'opacity-0'}`}>
            Empowering scientists and researchers to convert their discoveries into valuable intellectual property assets. 
            From breakthrough research to patent-ready innovations.
          </p>
          
          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 ${mounted ? 'animate-fade-in animation-delay-600' : 'opacity-0'}`}>
            <Link href="/mint" className="btn-primary text-lg px-10 py-4 group">
              <span className="flex items-center space-x-3">
                <span>Start Minting IP</span>
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link href="/gallery" className="btn-secondary text-lg px-10 py-4 group">
              <span className="flex items-center space-x-3">
                <span>Explore Gallery</span>
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </Link>
            <Link href="/about" className="btn-secondary text-lg px-10 py-4 group">
              <span className="flex items-center space-x-3">
                <span>Learn More</span>
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className={`flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 ${mounted ? 'animate-fade-in animation-delay-800' : 'opacity-0'}`}>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Trusted by 500+ Researchers</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Patent-Ready Results</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto ${mounted ? 'animate-fade-in animation-delay-1000' : 'opacity-0'}`}>
          <div className="text-center group">
            <div className="relative">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                500+
              </div>
              <div className="text-gray-600 text-lg font-medium">Research Papers Processed</div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"></div>
            </div>
          </div>
          <div className="text-center group">
            <div className="relative">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                200+
              </div>
              <div className="text-gray-600 text-lg font-medium">Patents Filed</div>
              <div className="absolute inset-0 bg-gradient-to-r from-secondary-100 to-primary-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"></div>
            </div>
          </div>
          <div className="text-center group">
            <div className="relative">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient mb-3 group-hover:scale-110 transition-transform duration-300">
                $50M+
              </div>
              <div className="text-gray-600 text-lg font-medium">Value Generated</div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"></div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-1/4 right-10 w-16 h-16 bg-gradient-to-br from-secondary-400 to-primary-400 rounded-full opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-br from-primary-300 to-secondary-300 rounded-full opacity-30 animate-float animation-delay-4000"></div>
      </div>
    </div>
  )
}
