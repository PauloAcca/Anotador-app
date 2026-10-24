/**
 * Genera los iconos de Aura · Espacio sin dependencias:
 * cuadrado redondeado con gradiente iris→salvia y tres renglones
 * (el glifo del anotador). PNG encoder propio con zlib de Node.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/* ---------------- PNG encoder ---------------- */
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
  return Buffer.concat([len, typeB, data, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function encodeIco(pngBuf, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry[0] = size >= 256 ? 0 : size
  entry[1] = size >= 256 ? 0 : size
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(pngBuf.length, 8)
  entry.writeUInt32LE(22, 12)
  return Buffer.concat([header, entry, pngBuf])
}

/* ---------------- Render ---------------- */
const hex = (value) => [
  parseInt(value.slice(1, 3), 16),
  parseInt(value.slice(3, 5), 16),
  parseInt(value.slice(5, 7), 16),
]
const C1 = hex('#B8AEE8') // iris
const C2 = hex('#8FCBB0') // salvia
const GLYPH = hex('#0A0E14')

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (value) => Math.min(1, Math.max(0, value))
const cov = (distancePx) => clamp01(0.5 - distancePx)

function sdRoundRect(x, y, cx, cy, hw, hh, r) {
  const dx = Math.abs(x - cx) - hw + r
  const dy = Math.abs(y - cy) - hh + r
  const ax = Math.max(dx, 0)
  const ay = Math.max(dy, 0)
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(ax, ay) - r
}

function render(size, { maskable = false } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const S = 1 / size
  const margin = 3 * S
  const half = 0.5 - margin
  const corner = 0.225 * (0.5 + half)
  const scale = maskable ? 0.82 : 1

  // Tres renglones: punto + línea.
  const rows = [
    { y: 0.375, lineEnd: 0.685 },
    { y: 0.5, lineEnd: 0.635 },
    { y: 0.625, lineEnd: 0.67 },
  ]

  for (let py = 0; py < size; py++) {
    for (let pxIndex = 0; pxIndex < size; pxIndex++) {
      const x = (pxIndex + 0.5) * S
      const y = (py + 0.5) * S

      const rectD = sdRoundRect(x, y, 0.5, 0.5, half, half, corner) * size
      const alphaRect = cov(rectD)
      if (alphaRect <= 0) continue

      const t = clamp01(x * 0.65 + y * 0.35)
      let r = lerp(C1[0], C2[0], t)
      let g = lerp(C1[1], C2[1], t)
      let b = lerp(C1[2], C2[2], t)

      const sheen =
        Math.max(0, 1 - Math.hypot((x - 0.3) * 2.2, (y - 0.25) * 2.2)) * 0.16
      r += (255 - r) * sheen
      g += (255 - g) * sheen
      b += (255 - b) * sheen

      let alpha = alphaRect

      // Glifo: puntos y renglones centrados con escala.
      const gx = (x - 0.5) / scale + 0.5
      const gy = (y - 0.5) / scale + 0.5

      let glyphCoverage = 0
      for (const row of rows) {
        const dot = cov((Math.hypot(gx - 0.335, gy - row.y) - 0.018) * size * scale)
        const line = cov(
          sdRoundRect(
            gx,
            gy,
            0.335 + 0.03 + (row.lineEnd - 0.365) / 2,
            row.y,
            (row.lineEnd - 0.365) / 2,
            0.018,
            0.018
          ) *
            size *
            scale
        )
        glyphCoverage = Math.max(glyphCoverage, dot, line)
      }

      if (glyphCoverage > 0) {
        const outAlpha = glyphCoverage + alpha * (1 - glyphCoverage)
        r = (GLYPH[0] * glyphCoverage + r * alpha * (1 - glyphCoverage)) / (outAlpha || 1)
        g = (GLYPH[1] * glyphCoverage + g * alpha * (1 - glyphCoverage)) / (outAlpha || 1)
        b = (GLYPH[2] * glyphCoverage + b * alpha * (1 - glyphCoverage)) / (outAlpha || 1)
        alpha = outAlpha
      }

      const index = (py * size + pxIndex) * 4
      px[index] = Math.round(r)
      px[index + 1] = Math.round(g)
      px[index + 2] = Math.round(b)
      px[index + 3] = Math.round(alpha * 255)
    }
  }

  return encodePng(size, size, px)
}

/* ---------------- Outputs ---------------- */
const outputs = [
  { file: 'src/app/icon.png', size: 512 },
  { file: 'src/app/apple-icon.png', size: 180 },
  { file: 'src/app/favicon.ico', size: 32, ico: true },
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'public/icon-maskable-512.png', size: 512, maskable: true },
]

for (const { file, size, ico, maskable } of outputs) {
  const buf = render(size, { maskable })
  const out = ico ? encodeIco(buf, size) : buf
  const path = join(ROOT, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, out)
  console.log(`✓ ${file} (${size}x${size})`)
}
