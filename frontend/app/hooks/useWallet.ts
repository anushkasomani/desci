'use client'

import { useState, useEffect, useCallback } from 'react'
import { ethers, BrowserProvider, Contract } from 'ethers'
// Make sure you have this config file with your ABI and address
import { Desci_ABI, DESCI_ADDRESS } from '../config/contracts'

interface WindowWithEthereum extends Window {
  ethereum?: any
}

export function useWallet() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [isMinting, setIsMinting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const isValidContractAddress = !!DESCI_ADDRESS && ethers.isAddress(DESCI_ADDRESS)

  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const ethereum = (window as WindowWithEthereum).ethereum
    if (!ethereum) {
      console.log('No wallet found. Please install MetaMask.')
      return null
    }
    return new ethers.BrowserProvider(ethereum)
  }, [])

  const fetchTokenBalance = useCallback(async (address: string, currentProvider: BrowserProvider) => {
    if (!isValidContractAddress) return
    try {
      const contract = new ethers.Contract(DESCI_ADDRESS, Desci_ABI, currentProvider)
      const balance = await contract.balanceOf(address)
      setTokenBalance(ethers.formatUnits(balance, 18)) // Assuming 18 decimals
    } catch (err) {
      console.error('Failed to fetch token balance:', err)
    }
  }, [isValidContractAddress])

  const connectWallet = useCallback(async () => {
    const newProvider = getProvider()
    if (!newProvider) {
      setError('MetaMask is not installed. Please install the extension.')
      return
    }

    setIsConnecting(true)
    setError('')
    try {
      const accounts = await newProvider.send('eth_requestAccounts', [])
      if (accounts.length > 0) {
        const address = accounts[0]
        setUserAddress(address)
        setProvider(newProvider)
        await fetchTokenBalance(address, newProvider)
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      setError('Failed to connect wallet. The request was denied or an error occurred.')
    } finally {
      setIsConnecting(false)
    }
  }, [getProvider, fetchTokenBalance])
  
  const handleMintTokens = async () => {
    if (!provider) {
      setError('Wallet not connected.')
      return false
    }
    if (!isValidContractAddress) {
      setError('Contract address is invalid.')
      return false
    }

    setIsMinting(true)
    setError('')
    try {
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(DESCI_ADDRESS, Desci_ABI, signer)
      const mintPrice = ethers.parseEther('0.1')

      const tx = await contract.mintGovernanceTokens({ value: mintPrice })
      await tx.wait()

      const currentAddress = await signer.getAddress()
      await fetchTokenBalance(currentAddress, provider)
      return true // Indicate success
    } catch (err: any) {
      console.error('Failed to mint tokens:', err)
      const reason = err.reason || err.message || 'An unknown error occurred during minting.'
      setError(`Minting failed: ${reason}`)
      return false // Indicate failure
    } finally {
      setIsMinting(false)
    }
  }

  useEffect(() => {
    const checkConnection = async () => {
      const newProvider = getProvider()
      if (newProvider) {
        const accounts = await newProvider.listAccounts()
        if (accounts.length > 0) {
          const address = accounts[0].address
          setUserAddress(address)
          setProvider(newProvider)
          await fetchTokenBalance(address, newProvider)
        }
      }
    }
    checkConnection()
  }, [getProvider, fetchTokenBalance])

  return {
    userAddress,
    tokenBalance,
    isConnecting,
    isMinting,
    error,
    connectWallet,
    handleMintTokens
  }
}