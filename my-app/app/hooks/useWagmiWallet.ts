'use client'

import { useAccount, useBalance, useChains } from 'wagmi'
import { switchNetwork } from 'wagmi/actions'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useCallback } from 'react'
import { Desci_ABI, DESCI_ADDRESS } from '../config/contracts'

export function useWagmiWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const chains = useChains()
  // switchNetwork is imported directly from wagmi/actions
  
  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState('')

  // Read contract data
  const { data: tokenBalance, refetch: refetchBalance } = useBalance({
    address,
    token: DESCI_ADDRESS as `0x${string}`,
    watch: true,
  })

  // Write contract functions
  const { data: mintHash, writeContract: mintTokens, isPending: isMintPending } = useWriteContract()
  
  // Wait for transaction
  // Note: useWaitForTransactionReceipt is already used below for mintHash
  const { isLoading: isConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  const handleMintTokens = useCallback(async () => {
    if (!address || !isConnected) {
      setError('Wallet not connected.')
      return false
    }

    if (!DESCI_ADDRESS) {
      setError('Contract address is invalid.')
      return false
    }

    setIsMinting(true)
    setError('')
    
    try {
      mintTokens({
        address: DESCI_ADDRESS as `0x${string}`,
        abi: Desci_ABI,
        functionName: 'mintGovernanceTokens',
        value: BigInt('100000000000000000'), // 0.1 ETH in wei
      })
      return true
    } catch (err: any) {
      console.error('Failed to mint tokens:', err)
      setError(`Minting failed: ${err.message || 'Unknown error'}`)
      return false
    } finally {
      setIsMinting(false)
    }
  }, [address, isConnected, mintTokens])

  // Refetch balance when mint is successful
  if (isMintSuccess && refetchBalance) {
    refetchBalance()
  }

  return {
    address,
    isConnected,
    isConnecting,
    chains,
    switchNetwork,
    tokenBalance: tokenBalance?.formatted || '0',
    isMinting: isMinting || isMintPending || isConfirming,
    error,
    handleMintTokens,
    isMintSuccess,
  }
}
