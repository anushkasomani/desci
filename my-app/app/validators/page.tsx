'use client'

import { useEffect, useMemo, useState } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { gql, request } from 'graphql-request'
import { ethers } from 'ethers'
import { DESCI_ADDRESS, Desci_ABI } from '../config/contracts'

type DisputeCreated = {
  disputeId: string
  ipTokenId: string
  reason: string
  reporter: string
  transactionHash: string
}

type DisputeResolved = {
  disputeId: string
  ipRevoked: boolean
  totalVotes: string
  transactionHash: string
}

type EnrichedDispute = {
  created: DisputeCreated
  resolved?: DisputeResolved
}

// const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/118776/desci/version/latest'
// const SUBGRAPH_HEADERS = { Authorization: 'Bearer 9c42f8dcf2cf487337de6f2b55a971ec' }
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/118776/subgraph-desci/version/latest'
const SUBGRAPH_HEADERS = {Authorization : 'Bearer 9c42f8dcf2cf487337de6f2b55a971ec'}


const QUERY = gql`
  query MyQuery {
    disputeCreateds {
      disputeId
      ipTokenId
      reason
      reporter
      transactionHash
    }
    disputeResolveds {
      disputeId
      ipRevoked
      totalVotes
      transactionHash
    }
  }
`

export default function ValidatorsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disputes, setDisputes] = useState<EnrichedDispute[]>([])
  const [userAddress, setUserAddress] = useState<string>('')
  const [hasVotingPower, setHasVotingPower] = useState<boolean>(false)
  const [hasVotedByDispute, setHasVotedByDispute] = useState<Record<string, boolean>>({})
  const [isVotingOn, setIsVotingOn] = useState<Record<string, boolean>>({})

  const isValidDesciAddress = !!DESCI_ADDRESS && ethers.isAddress(DESCI_ADDRESS)

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      const data = await request<{ disputeCreateds: DisputeCreated[]; disputeResolveds: DisputeResolved[] }>(
        SUBGRAPH_URL,
        QUERY,
        {},
        SUBGRAPH_HEADERS
      )

      const resolvedMap = new Map<string, DisputeResolved>()
      for (const r of (data.disputeResolveds || [])) {
        resolvedMap.set(String(r.disputeId), r)
      }

      const enriched: EnrichedDispute[] = (data.disputeCreateds || [])
        .map((c) => ({ created: c, resolved: resolvedMap.get(String(c.disputeId)) }))
        .sort((a, b) => Number(b.created.disputeId) - Number(a.created.disputeId))

      setDisputes(enriched)

      // Update hasVoted flags if user connected
      if (userAddress && isValidDesciAddress) {
        const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
        if (ethereum) {
          const provider = new ethers.BrowserProvider(ethereum)
          const contract = new ethers.Contract(DESCI_ADDRESS, Desci_ABI, provider)
          const results: Record<string, boolean> = {}
          await Promise.all(
            enriched.map(async (d) => {
              try {
                const voted: boolean = await contract.hasVoted(d.created.disputeId, userAddress)
                results[d.created.disputeId] = voted
              } catch {
                results[d.created.disputeId] = false
              }
            })
          )
          setHasVotedByDispute(results)
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load disputes')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const getWallet = async () => {
      try {
        const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
        if (!ethereum) return
        const provider = new ethers.BrowserProvider(ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          const addr = accounts[0].address
          setUserAddress(addr)
          if (isValidDesciAddress) {
            const contract = new ethers.Contract(DESCI_ADDRESS, Desci_ABI, provider)
            const bal = await contract.balanceOf(addr)
            setHasVotingPower(bal >= ethers.parseEther('100'))
          }
        }
      } catch {}
    }
    getWallet()
  }, [])

  // Refresh hasVoted when address changes
  useEffect(() => {
    if (!userAddress || !isValidDesciAddress || disputes.length === 0) return
    load(true)
  }, [userAddress])

  const unresolvedDisputes = useMemo(() => disputes.filter(d => !d.resolved), [disputes])

  const formatAddress = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  const castVote = async (disputeId: string, voteForRemoval: boolean) => {
    try {
      if (!userAddress) throw new Error('Connect wallet')
      if (!isValidDesciAddress) throw new Error('Governance contract address missing/invalid')
      if (!hasVotingPower) throw new Error('Insufficient voting power (need ≥ 100 DESCI)')

      setIsVotingOn(prev => ({ ...prev, [disputeId]: true }))
      const ethereum = (typeof window !== 'undefined' ? (window as any).ethereum : undefined)
      if (!ethereum) throw new Error('No wallet found')
      const provider = new ethers.BrowserProvider(ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(DESCI_ADDRESS, Desci_ABI, signer)
      const tx = await contract.voteOnDispute(disputeId, voteForRemoval)
      await tx.wait()
      alert('Vote cast successfully')
      // Refresh
      await load(true)
    } catch (e: any) {
      const m = e?.reason || e?.shortMessage || e?.message || 'Failed to vote'
      alert(m)
    } finally {
      setIsVotingOn(prev => ({ ...prev, [disputeId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <main className="pt-24">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">Validator Disputes</h1>
              <p className="mt-2 text-lg text-gray-400">Review open disputes and cast votes. A tag will indicate if a dispute was flagged by AI.</p>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className={`px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50`}
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-gray-400">Loading disputes...</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : disputes.length === 0 ? (
            <div className="text-gray-500">No disputes found.</div>
          ) : (
            <div className="space-y-12">
              {/* Unresolved first */}
              {unresolvedDisputes.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-indigo-400 mb-6">Open Disputes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {unresolvedDisputes.map((d) => {
                      const created = d.created
                      const isAI = created.reporter === '0x0000000000000000000000000000000000000000'
                      const voted = !!hasVotedByDispute[created.disputeId]
                      const votingBusy = !!isVotingOn[created.disputeId]
                      return (
                        <div key={created.disputeId} className="p-8 border border-indigo-500/10 rounded-2xl shadow-lg bg-gray-900 hover:shadow-xl transition-all duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="font-bold text-lg text-white">Dispute #{created.disputeId}</div>
                            {isAI ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-900 text-purple-200">Flagged by AI</span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-900 text-blue-200">By {formatAddress(created.reporter)}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-300 mb-2">IP Token: <span className="font-mono">#{created.ipTokenId}</span></div>
                          <div className="text-sm text-gray-400 mb-4">Reason: {created.reason}</div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => castVote(created.disputeId, true)}
                              disabled={!userAddress || !hasVotingPower || voted || votingBusy}
                              className={`flex-1 px-4 py-2 rounded text-white text-sm ${(!userAddress || !hasVotingPower || voted || votingBusy) ? 'bg-red-800 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                            >
                              {votingBusy ? 'Voting...' : 'Vote to Revoke'}
                            </button>
                            <button
                              onClick={() => castVote(created.disputeId, false)}
                              disabled={!userAddress || !hasVotingPower || voted || votingBusy}
                              className={`flex-1 px-4 py-2 rounded text-white text-sm ${(!userAddress || !hasVotingPower || voted || votingBusy) ? 'bg-green-800 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
                            >
                              {votingBusy ? 'Voting...' : 'Vote to Keep'}
                            </button>
                          </div>
                          {!userAddress && (
                            <div className="text-xs text-gray-500 mt-2">Connect wallet to vote.</div>
                          )}
                          {userAddress && !hasVotingPower && (
                            <div className="text-xs text-gray-500 mt-2">You need at least 100 DESCI to vote.</div>
                          )}
                          {voted && (
                            <div className="text-xs text-blue-400 mt-2">You have already voted on this dispute.</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resolved */}
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">Resolved Disputes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {disputes.filter(d => !!d.resolved).map((d) => (
                    <div key={d.created.disputeId} className="p-8 border border-cyan-500/10 rounded-2xl shadow-lg bg-gray-900">
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-bold text-lg text-white">Dispute #{d.created.disputeId}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${d.resolved!.ipRevoked ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                          {d.resolved!.ipRevoked ? 'Revoked' : 'Kept'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mb-2">IP Token: <span className="font-mono">#{d.created.ipTokenId}</span></div>
                      <div className="text-sm text-gray-400">Reason: {d.created.reason}</div>
                      <div className="text-xs text-gray-500 mt-3">Total votes: {d.resolved!.totalVotes}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}


