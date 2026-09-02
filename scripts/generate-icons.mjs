import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

// Palette
const P = {
  '.': null,
  R: '#E24B4A', // boule du joystick
  r: '#F09595', // reflet boule
  S: '#5F5E5A', // manche
  s: '#888780', // reflet manche
  B: '#534AB7', // boîtier
  b: '#7F77DD', // arête haute du boîtier
  D: '#26215C', // ombre boîtier
  A: '#EF9F27', // bouton
  a: '#FAC775', // reflet bouton
  K: '#2C2C2A', // fente / pieds
}

// Grille 16x16
const GRID = [
  '................',
  '......RRR.......',
  '.....RrRRR......',
  '.....RRRRR......',
  '......RRR.......',
  '.......sS.......',
  '.......sS.......',
  '.......sS.......',
  '.......sS.......',
  '..bbbbbKKbbbbb..',
  '.BBBBBBBBBAaBBB.',
  '.BBBBBBBBBAABBB.',
  '.BBBBBBBBBBBBBB.',
  '.BBBBBBBBBBBBBB.',
  '.DDDDDDDDDDDDDD.',
  '..KK........KK..',
]

const N = 16

function svg() {
  const byColor = new Map()
  GRID.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      const c = P[ch]
      if (!c) return
      if (!byColor.has(c)) byColor.set(c, [])
      byColor.get(c).push(`M${x} ${y}h1v1h-1z`)
    })
  })
  const paths = [...byColor.entries()].map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${paths}</svg>\n`
}

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size, background = null) {
  const scale = size / N
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const ch = GRID[Math.floor(y / scale)][Math.floor(x / scale)]
      const hex = P[ch] ?? background
      const o = y * (size * 4 + 1) + 1 + x * 4
      if (!hex) continue
      raw[o] = parseInt(hex.slice(1, 3), 16)
      raw[o + 1] = parseInt(hex.slice(3, 5), 16)
      raw[o + 2] = parseInt(hex.slice(5, 7), 16)
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function ico(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = 6 + 16 * pngs.length
  const entries = []
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16)
    e[0] = size === 256 ? 0 : size
    e[1] = size === 256 ? 0 : size
    e[2] = 0
    e[3] = 0
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    entries.push(e)
  }
  return Buffer.concat([header, ...entries, ...pngs.map(p => p.data)])
}

const out = process.argv[2] ?? 'public'
writeFileSync(`${out}/favicon.svg`, svg())
writeFileSync(`${out}/favicon.ico`, ico([16, 32, 48].map(size => ({ size, data: png(size) }))))
writeFileSync(`${out}/icon-192.png`, png(192))
writeFileSync(`${out}/icon-512.png`, png(512))
writeFileSync(`${out}/apple-touch-icon.png`, png(176 + 4, '#F6F5F0'))
console.log('ok')
