import type { NextApiRequest, NextApiResponse } from 'next'
import MINTED from '../../minted.json' assert { type: 'json' }

const SPACESCAN_API_KEY = process.env.SPACESCAN_API_KEY || ''

type MintedType = {
  [key: string]: {
    mint_block: number
  }
}

const data: MintedType = MINTED

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { launcher_id } = req.query

  if (!launcher_id || typeof launcher_id !== 'string') {
    return res.status(400).send('Missing launcher_id')
  }

  const id = launcher_id.trim().toLowerCase()
  const entry = data[id]

  if (!entry) return res.status(404).send('Launcher ID not found in minted.json')

  const mintBlock = entry.mint_block

  try {
    const response = await fetch('https://api.spacescan.io/block/peak', {
      headers: { 'x-api-key': SPACESCAN_API_KEY }
    })
    const result = await response.json()
    const currentBlock = parseInt(result.data.number)

    const dotCount = Math.max(0, currentBlock - mintBlock)
    const dotColor = dotCount >= 100 ? 'red' : 'black'

    const cols = 10
    const rows = Math.ceil(dotCount / cols)
    const width = cols * 20 + 10
    const height = rows * 20 + 10

    const svgDots = Array.from({ length: dotCount }, (_, i) => {
      const x = 10 + (i % cols) * 20
      const y = 10 + Math.floor(i / cols) * 20
      return `<circle cx="${x}" cy="${y}" r="5" fill="${dotColor}" />`
    }).join('')

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white" />
      ${svgDots}
    </svg>`

    res.setHeader('Content-Type', 'image/svg+xml')
    res.status(200).send(svg)
  } catch (err) {
    console.error('Error fetching block height:', err)
    res.status(500).send('Internal Server Error')
  }
}
