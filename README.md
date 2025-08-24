# 🧬 GENOME - AI-Powered Intellectual Property Platform

> **Transform Research into Tokenized IP Assets with AI**

GENOME is a decentralized platform that empowers researchers, innovators, and organizations to seamlessly transform their research into intellectual property (IP) using cutting-edge AI technology. Whether you're a large corporation or an independent researcher, GENOME provides the tools to tokenize, license, and monetize your work—ensuring proof of ownership, transparency, and decentralized governance.

## 🚀 Core Features

### 🔹 AI-Powered IP Conversion
- **Instant Analysis**: Upload research and let GENOME AI extract all relevant details
- **Smart Tokenization**: Automatically convert work into verifiable IP assets within seconds
- **Multi-Format Support**: Research papers, datasets, algorithms, and formulas

### 🔹 Intelligent Content Processing
- **Gemini 2.0 Integration**: Advanced AI for content analysis and summarization
- **Grobid Extraction**: Professional paper content extraction and parsing
- **Pinecone Vector DB**: Semantic search and similarity matching
- **Metadata Intelligence**: Automatic extraction of authors, keywords, and abstracts

### 🔹 Flexible Storage & Privacy
- **Public/Private Options**: Choose your storage preference
- **End-to-End Encryption**: Private assets encrypted with AES-256-GCM
- **IPFS Integration**: Decentralized, immutable storage
- **Secure Key Management**: Decryption keys shared only upon license minting

### 🔹 Smart Licensing & Monetization
- **AI-Powered Suggestions**: Intelligent licensing terms based on market analysis
- **Revenue Sharing**: Automated royalty distribution via smart contracts
- **Derivative Rights**: Programmable business models through License Tokens
- **Pay-to-Mint Access**: Secure dataset unlocking for valid licensees

### 🔹 Governance & Dispute Resolution
- **Decentralized Governance**: Token-based validator system
- **Dispute Resolution**: Community-driven adjudication with stake requirements
- **Transparent Processes**: All decisions and actions recorded on-chain

## 🛠 Technology Stack

### 🔗 Blockchain & Smart Contracts
- **Network**: Sei Network (High-performance Layer 1)
- **Development**: Hardhat + TypeScript
- **Smart Contracts**: 
  - IPNFT (ERC-721 for IP assets)
  - LicenseNFT (ERC-721 for licensing rights)
  - DerivativeIP (ERC-721 for derivative works)
  - Desci (Governance token)
- **Libraries**: OpenZeppelin (Ownable, PaymentSplitter, ERC2981)
- **Indexing**: The Graph Protocol (Subgraph)

### 🤖 AI & Machine Learning
- **Content Analysis**: Gemini 2.0 (Google)
- **Vector Database**: Pinecone (Semantic search & similarity)
- **Document Processing**: Grobid (Academic paper extraction)
- **License Intelligence**: Custom ML models for licensing suggestions
- **Metadata Extraction**: AI-powered content analysis

### 🌐 Frontend & User Experience
- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS + Framer Motion
- **Wallet Integration**: RainbowKit + wagmi
- **State Management**: TanStack Query + React hooks
- **UI Components**: Heroicons + Custom components

### 🔐 Security & Infrastructure
- **Encryption**: AES-256-GCM + RSA key pairs
- **Storage**: IPFS + Pinata (IPFS pinning service)
- **Authentication**: Wallet-based authentication
- **API Security**: Rate limiting + CORS protection

### 📊 Data & Analytics
- **Search Engine**: Custom vector search API
- **Metadata Storage**: Structured JSON with IPFS
- **Analytics**: On-chain event tracking
- **Reporting**: Real-time IP asset analytics

## 🤖 ML Agents & AI Services

### 🔍 Metadata Agent
- **Purpose**: Intelligent content extraction and analysis
- **Capabilities**: 
  - Research paper metadata extraction using Grobid
  - Dataset structure analysis and column identification
  - Chemical formula and compound recognition
  - Abstract summarization and keyword extraction
- **Technologies**: Python, Grobid, Custom ML models
- **Output**: Structured metadata for IP asset creation

### 📜 License Agent
- **Purpose**: AI-powered license generation and recommendations
- **Capabilities**:
  - Market analysis for optimal licensing terms
  - Royalty structure suggestions based on content type
  - Revenue sharing model recommendations
  - License restriction and derivative rights analysis
- **Technologies**: Python, ML models, Market data analysis
- **Output**: License suggestions with pricing and terms

### 🔎 Search Agent
- **Purpose**: Semantic search and vector similarity matching
- **Capabilities**:
  - Content indexing in vector database
  - Semantic similarity search across IP assets
  - Multi-format content retrieval (papers, datasets, algorithms)
  - Relevance scoring and ranking
- **Technologies**: Python, Pinecone, Vector embeddings
- **Output**: Relevant IP asset search results with similarity scores

## 🏗 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart         │    │   AI Services   │
│   (Next.js)     │◄──►│   Contracts     │◄──►│   (Gemini 2.0)  │
│                 │    │   (Sei)         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IPFS Storage  │    │   The Graph     │    │   Pinecone      │
│   (Content)     │    │   (Indexing)    │    │   (Vectors)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Smart Contract Addresses

> **⚠️ Contract addresses will be updated after deployment**

- **IPNFT Contract**: `0x...` (ERC-721 for IP assets)
- **LicenseNFT Contract**: `0x...` (ERC-721 for licensing)
- **DerivativeIP Contract**: `0x...` (ERC-721 for derivatives)
- **Desci Governance Token**: `0x...` (ERC-20 governance token)

## 🌐 AI API Endpoints

### Content Analysis APIs (Metadata Agent)
- **Paper Metadata**: `https://sei-agents-metadata.onrender.com/paper/metadata`
- **Paper Summary**: `https://sei-agents-metadata.onrender.com/paper/summary`
- **Dataset Analysis**: `https://sei-agents-metadata.onrender.com/dataset/metadata`
- **Formula Extraction**: `https://sei-agents-metadata.onrender.com/formula/metadata`

### License Generation API (License Agent)
- **License Suggestions**: `https://sei-licence.onrender.com/generate-licenses/`

### Vector Search API (Search Agent)
- **Insert Content**: `https://sei-vectorsearch.onrender.com/insert`
- **Search Content**: `https://sei-vectorsearch.onrender.com/retrieve`

### Agent-Specific Endpoints
- **Metadata Processing**: Content extraction and analysis
- **License Intelligence**: Market-based licensing recommendations
- **Semantic Search**: Vector-based content discovery

## 📁 Project Structure

```
genome/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router components
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility libraries
├── sei-hardhat-project/     # Smart contract development
│   ├── contracts/          # Solidity smart contracts
│   ├── scripts/            # Deployment scripts
│   └── test/               # Contract tests
├── desci/                   # Subgraph indexing
│   ├── src/                # Subgraph mappings
│   └── schema.graphql      # GraphQL schema
├── metadata-agent/          # AI content extraction & analysis
│   ├── Agents.py           # Core AI processing logic
│   ├── datasets.py         # Dataset handling & processing
│   ├── Formula.py          # Chemical formula extraction
│   └── main.py             # Main execution entry point
├── license-agent/           # AI license generation & suggestions
│   ├── agent.py            # License recommendation engine
│   ├── main.py             # License generation API
│   └── royalties.json      # Royalty structure templates
└── search-agent/            # Vector search & semantic matching
    ├── database.py         # Vector database operations
    ├── main.py             # Search API endpoints
    └── test.ipynb          # Search functionality testing
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Sei Network wallet (for testing)
- IPFS node access

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Smart Contract Development
```bash
cd sei-hardhat-project
npm install
npx hardhat compile
npx hardhat test
```

### Subgraph Development
```bash
cd desci
npm install
npm run codegen
npm run build
```

### ML Agents Development
```bash
# Metadata Agent
cd metadata-agent
pip install -r requirements.txt
python main.py

# License Agent
cd license-agent
pip install -r requirements.txt
python main.py

# Search Agent
cd search-agent
pip install -r requirements.txt
python main.py
```

## 🔍 Key Workflows

### 1. IP Asset Creation
1. **Upload Content**: Research paper, dataset, or algorithm
2. **Metadata Agent**: Gemini 2.0 + Grobid extracts metadata and generates summary
3. **Search Agent**: Content indexed in Pinecone for semantic search
4. **NFT Minting**: IP asset tokenized on Sei network
5. **Storage**: Content stored on IPFS with encryption if private

### 2. License Generation
1. **Content Analysis**: Metadata Agent analyzes content structure and type
2. **License Agent**: ML models suggest optimal licensing terms and pricing
3. **Market Intelligence**: AI considers market conditions and similar IP assets
4. **Token Creation**: License NFTs minted with programmable terms
5. **Access Control**: Decryption keys distributed upon license acquisition

### 3. Derivative Creation
1. **License Verification**: Smart contracts verify derivative rights
2. **Content Access**: Original content unlocked for derivative creation
3. **Revenue Sharing**: Automated royalty distribution via smart contracts
4. **Chain of Ownership**: Immutable record of derivative relationships

### 4. Content Discovery & Search
1. **Vector Indexing**: Search Agent continuously indexes new content
2. **Semantic Matching**: Pinecone provides similarity-based search results
3. **Relevance Scoring**: AI-powered ranking of search results
4. **Multi-Format Support**: Unified search across papers, datasets, and algorithms

## 🧪 Testing & Development

### Smart Contract Testing
```bash
cd sei-hardhat-project
npx hardhat test
npx hardhat coverage
```

### Frontend Testing
```bash
cd frontend
npm run test
npm run lint
```

### Subgraph Testing
```bash
cd desci
npm run test
```

## 📚 Documentation

- **Smart Contracts**: [Contract Documentation](./sei-hardhat-project/README.md)
- **Frontend API**: [API Documentation](./frontend/README.md)
- **Subgraph**: [GraphQL Schema](./desci/schema.graphql)
- **Architecture**: [System Design](./docs/architecture.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- **Sei Network** for high-performance blockchain infrastructure
- **Google Gemini 2.0** for advanced AI capabilities
- **Pinecone** for vector database technology
- **Grobid** for academic document processing
- **OpenZeppelin** for secure smart contract libraries
- **The Graph** for decentralized indexing

## 📞 Support & Contact

- **Website**: [genome.ai](https://genome.ai)
- **Documentation**: [docs.genome.ai](https://docs.genome.ai)
- **Discord**: [Join our community](https://discord.gg/genome)
- **Email**: support@genome.ai

---

**Built with ❤️ by the GENOME Team**

*Empowering innovation through decentralized IP management*
