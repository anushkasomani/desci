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

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/118776/desci/version/latest'
const SUBGRAPH_HEADERS = { Authorization: 'Bearer 9c42f8dcf2cf487337de6f2b55a971ec' }

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
    <main>
      <Navigation />
      <section className="p-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Validator Disputes</h1>
            <p className="text-gray-600 mt-2">Review open disputes and cast votes. A tag will indicate if a dispute was flagged by AI.</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${refreshing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'}`}
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
          <div className="text-gray-600">Loading disputes...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : disputes.length === 0 ? (
          <div className="text-gray-600">No disputes found.</div>
        ) : (
          <div className="space-y-6">
            {/* Unresolved first */}
            {unresolvedDisputes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Open Disputes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unresolvedDisputes.map((d) => {
                    const created = d.created
                    const isAI = created.reporter === '0x0000000000000000000000000000000000000000'
                    const voted = !!hasVotedByDispute[created.disputeId]
                    const votingBusy = !!isVotingOn[created.disputeId]
                    return (
                      <div key={created.disputeId} className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="font-bold text-lg text-gray-800">Dispute #{created.disputeId}</div>
                          {isAI ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">Flagged by AI</span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">By {formatAddress(created.reporter)}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">IP Token: <span className="font-mono">#{created.ipTokenId}</span></div>
                        <div className="text-sm text-gray-600 mb-4">Reason: {created.reason}</div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => castVote(created.disputeId, true)}
                            disabled={!userAddress || !hasVotingPower || voted || votingBusy}
                            className={`flex-1 px-4 py-2 rounded text-white text-sm ${(!userAddress || !hasVotingPower || voted || votingBusy) ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                          >
                            {votingBusy ? 'Voting...' : 'Vote to Revoke'}
                          </button>
                          <button
                            onClick={() => castVote(created.disputeId, false)}
                            disabled={!userAddress || !hasVotingPower || voted || votingBusy}
                            className={`flex-1 px-4 py-2 rounded text-white text-sm ${(!userAddress || !hasVotingPower || voted || votingBusy) ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
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
                          <div className="text-xs text-blue-600 mt-2">You have already voted on this dispute.</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Resolved */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Resolved Disputes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {disputes.filter(d => !!d.resolved).map((d) => (
                  <div key={d.created.disputeId} className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-bold text-lg text-gray-800">Dispute #{d.created.disputeId}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${d.resolved!.ipRevoked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {d.resolved!.ipRevoked ? 'Revoked' : 'Kept'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">IP Token: <span className="font-mono">#{d.created.ipTokenId}</span></div>
                    <div className="text-sm text-gray-600">Reason: {d.created.reason}</div>
                    <div className="text-xs text-gray-500 mt-3">Total votes: {d.resolved!.totalVotes}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  )
}


