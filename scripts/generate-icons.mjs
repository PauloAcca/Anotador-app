/**
 * Genera los iconos de Aura · Espacio sin dependencias:
 * cuadrado redondeado con gradiente iris→salvia y el glifo del anotador
 * (tres renglones con viñeta) en blanco con halo, en la misma línea
 * visual que el aro de Aura · Finanzas. PNG encoder propio con zlib de Node.
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
const C1 = hex('#8E7DDC') // iris profundo
const C2 = hex('#66BA97') // salvia
const WHITE = [255, 255, 255]

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

// Renglones del anotador: viñeta + línea, en coordenadas unitarias.
const DOT_X = 0.3
const DOT_R = 0.0235
const BAR_X0 = 0.348
const BAR_H = 0.027
const ROWS = [
  { y: 0.378, end: 0.7 },
  { y: 0.5, end: 0.645 },
  { y: 0.622, end: 0.678 },
]

// Distancia mínima (en unidades) al glifo completo.
function glyphDistance(x, y, barH, dotR) {
  let d = Infinity
  for (const row of ROWS) {
    d = Math.min(d, Math.hypot(x - DOT_X, y - row.y) - dotR)
    const cx = (BAR_X0 + row.end) / 2
    const hw = (row.end - BAR_X0) / 2
    d = Math.min(d, sdRoundRect(x, y, cx, row.y, hw, barH / 2, barH / 2))
  }
  return d
}

function render(size, { maskable = false } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const S = 1 / size
  // Maskable: fondo a sangre (el sistema recorta la forma); el resto, cuadrado redondeado.
  const half = maskable ? 0.5 : 0.5 - 3 * S
  const corner = maskable ? 0 : 0.225 * (0.5 + half)
  const scale = maskable ? 0.8 : 1
  const glowR = 0.024 * scale
  const glowStrength = 0.34
  // A tamaños chicos el trazo se engrosa para no desaparecer (favicon).
  const minStrokePx = 1.25
  const barH = Math.max(BAR_H, minStrokePx / (size * scale))
  const dotR = Math.max(DOT_R, barH * 0.95)

  for (let py = 0; py < size; py++) {
    for (let pxIndex = 0; pxIndex < size; pxIndex++) {
      const x = (pxIndex + 0.5) * S
      const y = (py + 0.5) * S

      const rectD = maskable
        ? -1
        : sdRoundRect(x, y, 0.5, 0.5, half, half, corner) * size
      const alphaRect = maskable ? 1 : cov(rectD)
      if (alphaRect <= 0) continue

      // Gradiente diagonal iris → salvia
      const t = clamp01(x * 0.56 + y * 0.44)
      let r = lerp(C1[0], C2[0], t)
      let g = lerp(C1[1], C2[1], t)
      let b = lerp(C1[2], C2[2], t)

      // Luz de vidrio arriba a la izquierda
      const sheen =
        Math.max(0, 1 - Math.hypot((x - 0.3) * 2.2, (y - 0.24) * 2.2)) * 0.12
      r += (255 - r) * sheen
      g += (255 - g) * sheen
      b += (255 - b) * sheen

      // Aurora tenue abajo a la derecha, para que el fondo tenga aire Aura
      const aurora = Math.max(0, 1 - Math.hypot(x - 0.82, y - 0.84) * 2.4) * 0.1
      r += (255 - r) * aurora * 0.4
      g += (255 - g) * aurora * 0.7
      b += (176 - b) * aurora

      let alpha = alphaRect

      // Glifo: halo blanco difuso + renglones nítidos
      const gx = (x - 0.5) / scale + 0.5
      const gy = (y - 0.5) / scale + 0.5
      const d = glyphDistance(gx, gy, barH, dotR)
      const dPx = d * size * scale

      const glow = d > 0 ? Math.exp(-Math.pow(d / glowR, 2)) * glowStrength : 0
      if (glow > 0.001) {
        const ga = glow * alpha
        r += (WHITE[0] - r) * ga
        g += (WHITE[1] - g) * ga
        b += (WHITE[2] - b) * ga
      }

      const glyph = cov(dPx)
      if (glyph > 0) {
        const outAlpha = glyph * 0.98 + alpha * (1 - glyph * 0.98)
        r = (WHITE[0] * glyph * 0.98 + r * alpha * (1 - glyph * 0.98)) / (outAlpha || 1)
        g = (WHITE[1] * glyph * 0.98 + g * alpha * (1 - glyph * 0.98)) / (outAlpha || 1)
        b = (WHITE[2] * glyph * 0.98 + b * alpha * (1 - glyph * 0.98)) / (outAlpha || 1)
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
