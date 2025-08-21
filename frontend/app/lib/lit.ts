'use client'
import { LIT_NETWORK } from '@lit-protocol/constants'
const LIT_ENABLED = process.env.NEXT_PUBLIC_LIT_ENABLED === 'true'

type AccessControlCondition = any

async function loadLit() {
    if (process.env.NEXT_PUBLIC_LIT_ENABLED !== 'true') throw new Error('Lit disabled')
    // @ts-ignore
    const { LitNodeClient } = await import('@lit-protocol/lit-node-client')
    // @ts-ignore
    const { checkAndSignAuthMessage } = await import('@lit-protocol/auth-browser')
    return { LitNodeClient, checkAndSignAuthMessage, modern: true }
  }

// Very simple gating: user must own ANY LicenseNFT from our contract
// For tighter gating to ipTokenId, consider indexing on-chain or embedding ipId in tokenURI and verifying off-chain.
export async function saveDecryptionKeyForIP(ipTokenId: string | number, base64Key: string, licenseContract: string) {
  const { LitNodeClient, checkAndSignAuthMessage } = await loadLit()
  const client = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilDev}) // Lit testnet
  await client.connect()
  // @ts-ignore – Lit types vary across versions; our chain is Sei testnet
  const authSig = await checkAndSignAuthMessage({ chain: 'seiTestnet' })

  const accessControlConditions: AccessControlCondition[] = [
    {
      contractAddress: licenseContract,
      standardContractType: 'ERC721',
      chain: 'seiTestnet',
      method: 'balanceOf',
      parameters: [':userAddress'],
      returnValueTest: { comparator: '>', value: '0' }
    }
  ]

  const keyUint8 = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))
  // @ts-ignore
  const { encryptedSymmetricKey } = await client.saveEncryptionKey({
    accessControlConditions,
    symmetricKey: keyUint8,
    authSig,
    chain: 'seiTestnet'
  })
  return encryptedSymmetricKey
}

export async function getDecryptionKeyForIP(ipTokenId: string | number, licenseContract: string) {
  const { LitNodeClient, checkAndSignAuthMessage } = await loadLit()
  const client = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilDev })
  await client.connect()
  // @ts-ignore
  const authSig = await checkAndSignAuthMessage({ chain: 'seiTestnet' })

  const accessControlConditions: AccessControlCondition[] = [
    {
      contractAddress: licenseContract,
      standardContractType: 'ERC721',
      chain: 'seiTestnet',
      method: 'balanceOf',
      parameters: [':userAddress'],
      returnValueTest: { comparator: '>', value: '0' }
    }
  ]

  // @ts-ignore
  const symmetricKey = await client.getEncryptionKey({
    accessControlConditions,
    toDecrypt: '',
    authSig,
    chain: 'seiTestnet'
  })
  const b64 = btoa(String.fromCharCode(...new Uint8Array(symmetricKey)))
  return b64
}


