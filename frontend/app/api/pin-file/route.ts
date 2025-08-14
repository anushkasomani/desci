import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get Pinata JWT from environment
    const jwt = process.env.PINATA_JWT
    if (!jwt) {
      return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create form data for Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', new Blob([buffer], { type: file.type }), file.name)

    // Upload to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
      body: pinataFormData
    })

    if (!pinataResponse.ok) {
      const errorData = await pinataResponse.json()
      console.error('Pinata error:', errorData)
      return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 })
    }

    const result = await pinataResponse.json()
    
    return NextResponse.json({ 
      cid: result.IpfsHash,
      message: 'File uploaded successfully to IPFS'
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
