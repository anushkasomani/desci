'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  score: number;
  text: string; // This is the actual field name from your API
}

interface SearchAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchAgent({ isOpen, onClose }: SearchAgentProps) {
  const [query, setQuery] = useState('');
  const [namespace, setNamespace] = useState<'paper' | 'dataset' | 'algo'>('paper');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      // Build query parameters with proper encoding
      const top_k = 3;
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `https://sei-vectorsearch.onrender.com/retrieve?top_k=${top_k}&query=${encodedQuery}&namespace=${namespace}`;
      
      console.log('Calling vector search API:', url);

      const response = await fetch(url, {
        method: 'POST'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Search failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Search response:', data); // For debugging
      
      // Handle the response format from your API
      if (data && Array.isArray(data)) {
        setResults(data);
      } else if (data && data.results && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        console.log('Unexpected response format:', data);
        setResults([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Search failed: ${errorMessage}`);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-gray-950/95 backdrop-blur-xl border-l border-indigo-500/20 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-indigo-500/20">
              <h2 className="text-xl font-semibold text-white">AI Search Assistant</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Search Form */}
            <div className="p-6 space-y-4">
              {/* Namespace Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  IP Type
                </label>
                <select
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-indigo-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                >
                  <option value="paper" className="bg-gray-900 text-white">Research Papers</option>
                  <option value="dataset" className="bg-gray-900 text-white">Datasets</option>
                  <option value="algo" className="bg-gray-900 text-white">Algorithms & Formulas</option>
                </select>
              </div>

              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Query
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your search query..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-indigo-500/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <SparklesIcon className="absolute left-3 top-2.5 w-5 h-5 text-indigo-400" />
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSearching ? 'Searching...' : 'Search with AI'}
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Search Results ({results.length})
                  </h3>
                  
                  {results.map((result, index) => (
                    <div
                      key={result.id}
                      className="p-4 border border-indigo-500/20 rounded-lg hover:border-indigo-500/40 transition-colors bg-gray-900/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white line-clamp-2">
                          IP #{result.id}
                        </h4>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          Score: {(result.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 line-clamp-3 mb-3">
                        {result.text}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>ID: {result.id}</span>
                        <span>Relevance: {(result.score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && !error && results.length === 0 && query && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No results found for your query.</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms or IP type.</p>
                </div>
              )}

              {!query && !isSearching && (
                <div className="text-center py-8">
                  <SparklesIcon className="mx-auto w-12 h-12 text-indigo-400 mb-4" />
                  <p className="text-gray-300">Enter a search query to find IP assets</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Search across research papers, datasets, and algorithms
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
