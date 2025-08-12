export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const jwt = process.env.PINATA_JWT
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'PINATA_JWT not configured' }), { status: 500 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return new Response(JSON.stringify({ error: 'file missing' }), { status: 400 })
    }

    const forward = new FormData()
    forward.append('file', file, file.name)

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`
      },
      body: forward
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(JSON.stringify({ error: 'Pinata error', details: text }), { status: 500 })
    }

    const data = await res.json()
    const cid = data.IpfsHash || data.Hash || data.cid
    return new Response(JSON.stringify({ cid }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), { status: 500 })
  }
}
