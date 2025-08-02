import type { NextApiRequest, NextApiResponse } from 'next'

// Load API key from env
const SPACESCAN_API_KEY = process.env.SPACESCAN_API_KEY || ''

// Import minted launcher IDs
import mintedJson from '../../minted.json' assert { type: 'json' }

type MintedType = {
  [key: string]: {
    mint_block: number
  }
}

const MINTED: MintedType = mintedJson

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { launcher_id } = req.query

  if (!launcher_id || typeof launcher_id !== 'string') {
    return res.status(400).send('Missing launcher_id')
  }

  const entry = MINTED[launcher_id.trim().toLowerCase()]

  if (!entry) return res.status(404).send('Launcher ID not found in minted.json')

  const mintBlock = entry.mint_block

  const response = await fetch('https://api.spacescan.io/block/peak', {
  headers: { 'x-api-key': SPACESCAN_API_KEY }
})
const result = await response.json()
const currentBlock = parseInt(result.data.number)


  const dotCount = Math.max(0, currentBlock - mintBlock)
  const dotColor = dotCount >= 100 ? 'red' : 'black'

  const svgDots = Array.from({ length: Math.min(dotCount, 100) }, (_, i) => {
    const x = 10 + (i % 10) * 20
    const y = 10 + Math.floor(i / 10) * 20
    return `<circle cx="${x}" cy="${y}" r="5" fill="${dotColor}" />`
  }).join('')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
    <rect width="100%" height="100%" fill="white" />
    ${svgDots}
  </svg>`

  res.setHeader('Content-Type', 'image/svg+xml')
  res.status(200).send(svg)
}
