require('@nomicfoundation/hardhat-toolbox');
require('@nomicfoundation/hardhat-verify');
require('dotenv').config();

// env
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x00...000';
const SECOND_PRIVATE_KEY = process.env.SECOND_PRIVATE_KEY || '0x00...000';

module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true
    }
  },
  networks: {
    sei_atlantic_2: {
      url: 'https://evm-rpc-testnet.sei-apis.com',
      accounts: [PRIVATE_KEY, SECOND_PRIVATE_KEY],
      chainId: 1328,
      gasPrice: 2000000000
    },
    seimainnet: {
      url: 'https://evm-rpc.sei-apis.com',
      accounts: [PRIVATE_KEY, SECOND_PRIVATE_KEY],
      chainId: 1329,
      gasPrice: 2000000000
    },
    hardhat: { chainId: 31337 }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  mocha: { timeout: 40000 },

  // <-- ADD / UPDATE THIS SECTION
  etherscan: {
    // Seitrace does not require a real API key; the docs ask for a dummy key like "dummy"
    apiKey: {
      // map the network name you're using with hardhat to a key value
      sei_atlantic_2: process.env.SEITRACE_API_KEY || 'dummy'
    },
    // Tell the plugin how to reach Seitrace for chainId 1328
    customChains: [
      {
        network: 'sei_atlantic_2',
        chainId: 1328,
        urls: {
          apiURL: 'https://seitrace.com/atlantic-2/api',
          browserURL: 'https://seitrace.com'
        }
      },
      {
        network: 'seimainnet',
        chainId: 1329,
        urls: {
          apiURL: 'https://seitrace.com/pacific-1/api',
          browserURL: 'https://seitrace.com'
        }
      }
    ]
  },

  // optional: keep chainDescriptors if you like; not required for verification
  chainDescriptors: {
    1328: {
      name: 'sei_atlantic_2',
      blockExplorers: {
        etherscan: {
          name: 'Seitrace',
          url: 'https://seitrace.com',
          apiUrl: 'https://seitrace.com/atlantic-2/api'
        }
      }
    }
  }
};
