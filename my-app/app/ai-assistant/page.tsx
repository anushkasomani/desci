// app/ai-assistant/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, MagnifyingGlassIcon, WalletIcon } from '@heroicons/react/24/solid';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { WalletConnect } from '../components/WalletConnect';
import Link from 'next/link';

interface SearchResult {
  id: string;
  score: number;
  text: string;
}

const ResultCard = ({ result, index }: { result: SearchResult, index: number }) => {
  const scoreColor = result.score > 0.5 ? 'text-green-400' : result.score > 0.25 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <motion.div
      className="p-6 border border-indigo-500/10 rounded-2xl bg-gray-900/50 hover:border-indigo-500/30 transition-colors shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-bold text-white">IP Asset #{result.id}</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-800 ${scoreColor}`}>
          Score: {(result.score * 100).toFixed(1)}%
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-4 h-16 overflow-hidden">{result.text}</p>
      <div className="flex items-center gap-4 mt-auto border-t border-gray-800 pt-4">
        <Link href={`/ip-gallery#${result.id}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View in Gallery</Link>
        <a 
          href={`https://testnet.seistream.app/tokens/0x293B992a65c9C6639271aE6452453D0DbE5e4C94/${result.id}?standart=erc721`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View on Explorer
        </a>
      </div>
    </motion.div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-white">Searching...</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="p-6 border border-indigo-500/10 rounded-2xl bg-gray-900/50 animate-pulse">
          <div className="h-5 bg-gray-800 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6 mb-4"></div>
          <div className="h-px bg-gray-800 w-full my-4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function AiAssistantPage() {
  const [query, setQuery] = useState('');
  const [namespace, setNamespace] = useState<'paper' | 'dataset' | 'algo'>('paper');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Wallet connection state (replace with your actual wallet hook if needed)
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  useEffect(() => {
    // Example: check if wallet is connected (replace with your actual logic)
    if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress) {
      setIsWalletConnected(true);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);

    try {
      const top_k = 3;
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `https://sei-vectorsearch.onrender.com/retrieve?top_k=${top_k}&query=${encodedQuery}&namespace=${namespace}`;
      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) throw new Error(`Search API returned an error: ${response.status}`);
      let data = await response.json();
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (err) {
          setError("Failed to parse API response");
          setResults([]);
          return;
        }
      }
      let rawResults: SearchResult[] = [];
      if (Array.isArray(data)) {
        rawResults = data;
      } else if (data && Array.isArray((data as any).results)) {
        rawResults = (data as any).results;
      } else if (data && typeof data === "object") {
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          rawResults = possibleArrays[0] as SearchResult[];
        }
      }
      const filteredResults = rawResults.filter(r =>
        r &&
        typeof r === 'object' &&
        r.id &&
        typeof r.score === 'number' &&
        r.score >= 0 &&
        r.text
      );
      if (filteredResults.length === 0) {
        setError('No valid results found in the API response. Please try a different search.');
        setResults([]);
      } else {
        setResults(filteredResults);
        setError(null);
      }
    } catch (err) {
      setError('Search failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-white mb-3">AI Discovery Engine</h1>
            <p className="text-lg text-gray-400">Instantly find relevant IP assets using natural language.</p>

            {/* Wallet Section (only show if NOT connected) */}
            {!isWalletConnected && (
              <div className="mt-8 flex justify-center">
                <div className="bg-gray-900/50 border border-indigo-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <WalletIcon className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Connect Your Wallet</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Connect your wallet to access advanced features and manage your IP assets.
                  </p>
                  <WalletConnect />
                </div>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="bg-gray-900 border border-indigo-500/20 rounded-2xl p-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label htmlFor="search-query" className="block text-sm font-medium text-gray-300 mb-2">Search Query</label>
                <div className="relative">
                  <input
                    type="text"
                    id="search-query"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., 'Carbon capture methods using zeolites'"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="namespace" className="block text-sm font-medium text-gray-300 mb-2">IP Type</label>
                <select
                  id="namespace"
                  value={namespace}
                  onChange={e => setNamespace(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="paper">Research Papers</option>
                  <option value="dataset">Datasets</option>
                  <option value="algo">Algorithms</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleSearch} 
                disabled={isSearching || !query.trim()} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                <SparklesIcon className="w-5 h-5" />
                {isSearching ? 'Searching...' : 'Search with AI'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {isSearching && <SkeletonLoader />}

            {!isSearching && error && (
              <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-md text-center">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Debug */}


            {!isSearching && results && results.length > 0 && (
              <div>
                {/* Filter assets with score > 0 */}
                {(() => {
                  const filteredResults = results.filter(r => r.score > 0);
                  return filteredResults.length > 0 ? (
                    <>
                      <h3 className="text-xl font-bold text-white mb-6">
                        Found {filteredResults.length} relevant asset{filteredResults.length > 1 ? 's' : ''}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredResults.map((result, index) => (
                          <ResultCard key={result.id} result={result} index={index} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <MagnifyingGlassIcon className="mx-auto w-12 h-12 text-gray-700 mb-4" />
                      <p className="text-gray-400">No relevant results found.</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms or IP type.</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {!isSearching && results && results.length === 0 && (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="mx-auto w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-400">No relevant results found.</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms or IP type.</p>
              </div>
            )}

            {!results && !isSearching && !error && (
              <div className="text-center py-12">
                <SparklesIcon className="mx-auto w-12 h-12 text-indigo-600 mb-4" />
                <p className="text-gray-300">Your AI-powered search results will appear here.</p>
                <p className="text-sm text-gray-500 mt-1">Enter a query above to begin.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
