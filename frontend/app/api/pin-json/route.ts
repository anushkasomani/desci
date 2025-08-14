import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json()
    
    if (!metadata) {
      return NextResponse.json({ error: 'No metadata provided' }, { status: 400 })
    }

    // Get Pinata JWT from environment
    const jwt = process.env.PINATA_JWT
    if (!jwt) {
      return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 })
    }

    // Create metadata object for Pinata
    const pinataMetadata = {
      name: metadata.title || 'IP NFT Metadata',
      description: metadata.description || 'Intellectual Property NFT Metadata',
      attributes: [
        {
          trait_type: 'IP Type',
          value: metadata.ip_type || 'Unknown'
        },
        {
          trait_type: 'Authors',
          value: metadata.authors?.length || 0
        },
        {
          trait_type: 'License Type',
          value: metadata.license?.type || 'Unknown'
        }
      ]
    }

    // Prepare the data for Pinata
    const dataToPin = {
      pinataMetadata,
      pinataContent: metadata
    }

    // Upload to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(dataToPin)
    })

    if (!pinataResponse.ok) {
      const errorData = await pinataResponse.json()
      console.error('Pinata error:', errorData)
      return NextResponse.json({ error: 'Failed to upload metadata to IPFS' }, { status: 500 })
    }

    const result = await pinataResponse.json()
    
    return NextResponse.json({ 
      cid: result.IpfsHash,
      message: 'Metadata uploaded successfully to IPFS'
    })

  } catch (error) {
    console.error('Error uploading metadata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
