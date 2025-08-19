import IPNFT_ARTIFACT from '../../../sei-hardhat-project/artifacts/contracts/IPNFT.sol/IPNFT.json'
import LicenseNFT_ARTIFACT from '../../../sei-hardhat-project/artifacts/contracts/LicenseNFT.sol/LicenseNFT.json'
import Desci_ARTIFACT from '../../../sei-hardhat-project/artifacts/contracts/Desci.sol/Desci.json'
import DerivativeIPNFT_ARTIFACT from '../../../sei-hardhat-project/artifacts/contracts/DerivativeIP.sol/DerivativeIP.json'

export const IPNFT_ADDRESS = process.env.NEXT_PUBLIC_IPNFT_ADDRESS || ''
export const LICENSE_NFT_ADDRESS = process.env.NEXT_PUBLIC_LICENSE_CONTRACT_ADDRESS || ''
export const DESCI_ADDRESS = process.env.NEXT_PUBLIC_DESCI_CONTRACT_ADDRESS || ''
export const DERIVATIVE_IP_NFT_ADDRESS = process.env.NEXT_PUBLIC_DERIVATIVE_IP_CONTRACT_ADDRESS || '0x55Bfdb285664Bf4f52c3d6b36c8623c1E2E02be3'
export const IPNFT_ABI = IPNFT_ARTIFACT.abi
export const LicenseNFT_ABI = LicenseNFT_ARTIFACT.abi
export const Desci_ABI = Desci_ARTIFACT.abi
export const DerivativeIPNFT_ABI = DerivativeIPNFT_ARTIFACT.abi
