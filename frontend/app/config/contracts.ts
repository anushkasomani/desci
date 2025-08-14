import IPNFT_ARTIFACT from '../../../sei-hardhat-project/artifacts/contracts/IPNFT.sol/IPNFT.json'
import LicenseNFT_ARTIFACT from '../../../sei-hardhat-project/artifacts/contracts/LicenseNFT.sol/LicenseNFT.json'

export const IPNFT_ADDRESS = process.env.NEXT_PUBLIC_IPNFT_ADDRESS || ''
export const LICENSE_NFT_ADDRESS = process.env.NEXT_PUBLIC_LICENSE_CONTRACT_ADDRESS || ''

export const IPNFT_ABI = IPNFT_ARTIFACT.abi
export const LicenseNFT_ABI = LicenseNFT_ARTIFACT.abi
