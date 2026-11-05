#!/usr/bin/env node
// Generates ShaderGradient output from a preset plus overrides. No dependencies.
//
//   node gradient.mjs list
//   node gradient.mjs html --preset halo --colors "#ff5005,#dbba95,#d0bce1" --out hero.html
//   node gradient.mjs jsx  --preset mint --set uSpeed=0.2 --name HeroGradient --out HeroGradient.tsx
//   node gradient.mjs url  --preset universe
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PRESETS = JSON.parse(readFileSync(join(HERE, 'presets.json'), 'utf8'))

// Versions the html output is pinned to. Tested together; bump them together.
// three is the fragile one: 0.187 removed a shader chunk the package includes.
const VERSIONS = {
  shadergradient: '2.4.20',
  react: '19.3.1',
  three: '0.169.0',
  fiber: '9.8.2',
}

const ENUMS = {
  type: ['plane', 'sphere', 'waterPlane'],
  animate: ['on', 'off'],
  grain: ['on', 'off'],
  lightType: ['3d', 'env'],
  envPreset: ['city', 'dawn', 'lobby'],
  shader: ['defaults', 'positionMix', 'cosmic', 'glass'],
}
const NUMBERS = [
  'uTime', 'uSpeed', 'uStrength', 'uDensity', 'uFrequency', 'uAmplitude',
  'positionX', 'positionY', 'positionZ', 'rotationX', 'rotationY', 'rotationZ',
  'reflection', 'cAzimuthAngle', 'cPolarAngle', 'cDistance', 'cameraZoom',
  'brightness', 'grainBlending',
]
const COLORS = ['color1', 'color2', 'color3']
const BOOLEANS = ['wireframe']

function fail(message) {
  console.error(`gradient: ${message}`)
  process.exit(1)
}

function coerce(key, raw) {
  if (COLORS.includes(key)) {
    if (!/^#[0-9a-fA-F]{6}$/.test(raw)) fail(`${key} must be a 6-digit hex color like #ff5005, got "${raw}"`)
    return raw.toLowerCase()
  }
  if (NUMBERS.includes(key)) {
    const value = Number(raw)
    if (raw === '' || !Number.isFinite(value)) fail(`${key} must be a number, got "${raw}"`)
    return value
  }
  if (BOOLEANS.includes(key)) {
    if (raw !== 'true' && raw !== 'false') fail(`${key} must be true or false, got "${raw}"`)
    return raw === 'true'
  }
  if (ENUMS[key]) {
    if (!ENUMS[key].includes(raw)) fail(`${key} must be one of ${ENUMS[key].join(', ')}, got "${raw}"`)
    return raw
  }
  fail(`unknown prop "${key}". Valid props: ${[...COLORS, ...NUMBERS, ...BOOLEANS, ...Object.keys(ENUMS)].join(', ')}`)
}

function parseArgs(argv) {
  const options = { preset: 'halo', set: [], colors: null, out: null, name: 'GradientBackground', title: 'Gradient' }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    const value = argv[i + 1]
    if (!flag.startsWith('--')) fail(`unexpected argument "${flag}"`)
    if (value === undefined) fail(`${flag} needs a value`)
    const key = flag.slice(2)
    if (key === 'set') options.set.push(value)
    else if (key in options) options[key] = value
    else fail(`unknown option ${flag}`)
    i++
  }
  return options
}

function buildProps(options) {
  const preset = PRESETS[options.preset]
  if (!preset) fail(`unknown preset "${options.preset}". Run "list" to see them.`)
  const props = { ...preset.props }
  if (options.colors) {
    const colors = options.colors.split(',').map((color) => color.trim())
    if (colors.length !== 3) fail('--colors needs exactly three comma-separated hex colors')
    colors.forEach((color, index) => { props[`color${index + 1}`] = coerce(`color${index + 1}`, color) })
  }
  for (const pair of options.set) {
    const split = pair.indexOf('=')
    if (split < 1) fail(`--set expects key=value, got "${pair}"`)
    const key = pair.slice(0, split)
    props[key] = coerce(key, pair.slice(split + 1))
  }
  return props
}

// Shown until WebGL paints, and left in place if WebGL is unavailable.
function fallbackBackground(props) {
  return `linear-gradient(135deg, ${props.color1}, ${props.color2}, ${props.color3})`
}

function renderHtml(props, title) {
  const { shadergradient, react, three, fiber } = VERSIONS
  const importMap = {
    imports: {
      react: `https://esm.sh/react@${react}`,
      'react/': `https://esm.sh/react@${react}/`,
      'react-dom/client': `https://esm.sh/react-dom@${react}/client?external=react`,
      three: `https://esm.sh/three@${three}`,
      '@react-three/fiber': `https://esm.sh/@react-three/fiber@${fiber}?external=react,react-dom,three`,
      '@shadergradient/react': `https://esm.sh/@shadergradient/react@${shadergradient}?external=react,react-dom,three,@react-three/fiber`,
    },
  }
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // "<" is escaped so a value can never close the script tag it sits in.
  const json = (value) => JSON.stringify(value, null, 2).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>
  html, body { margin: 0; height: 100%; }
  body { background: ${fallbackBackground(props)}; }
  #gradient { position: fixed; inset: 0; }
</style>
<script type="importmap">
${json(importMap)}
</script>
</head>
<body>
<div id="gradient"></div>
<script type="module">
const props = ${json(props)};

function supportsWebGL() {
  try { return Boolean(document.createElement('canvas').getContext('webgl2')); }
  catch { return false; }
}

if (supportsWebGL()) {
  try {
    const [{ createElement: h }, { createRoot }, { ShaderGradientCanvas, ShaderGradient }] = await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('@shadergradient/react'),
    ]);
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    createRoot(document.getElementById('gradient')).render(
      h(ShaderGradientCanvas, { pixelDensity: 1, fov: 45, lazyLoad: false, pointerEvents: 'none' },
        h(ShaderGradient, { ...props, animate: reduceMotion ? 'off' : props.animate })),
    );
  } catch (error) {
    console.error('ShaderGradient failed to load; keeping the CSS fallback.', error);
  }
}
</script>
</body>
</html>
`
}

function renderJsx(props, name) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) fail(`--name must be a PascalCase component name, got "${name}"`)
  const attributes = Object.entries(props)
    .map(([key, value]) => `        ${key}=${typeof value === 'string' ? JSON.stringify(value) : `{${JSON.stringify(value)}}`}`)
    .join('\n')
  return `'use client'

import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

// Fills its nearest positioned ancestor, so give the parent position: relative.
export default function ${name}() {
  return (
    <ShaderGradientCanvas
      style={{ position: 'absolute', inset: 0, background: '${fallbackBackground(props)}' }}
      pixelDensity={1}
      fov={45}
      pointerEvents="none"
    >
      <ShaderGradient
${attributes}
      />
    </ShaderGradientCanvas>
  )
}
`
}

function renderUrl(props) {
  const query = Object.entries(props)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')
  return `https://www.shadergradient.co/customize?${query}\n`
}

function emit(text, out) {
  if (!out) {
    process.stdout.write(text)
    return
  }
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, text)
  console.log(`Wrote ${out}`)
}

const [command, ...rest] = process.argv.slice(2)

if (command === 'list') {
  for (const [id, preset] of Object.entries(PRESETS)) {
    const { type, color1, color2, color3 } = preset.props
    console.log(`${id.padEnd(16)} ${type.padEnd(11)} ${color1} ${color2} ${color3}  ${preset.mood}`)
  }
} else if (command === 'html' || command === 'jsx' || command === 'url') {
  const options = parseArgs(rest)
  const props = buildProps(options)
  if (command === 'html') emit(renderHtml(props, options.title), options.out)
  if (command === 'jsx') emit(renderJsx(props, options.name), options.out)
  if (command === 'url') emit(renderUrl(props), options.out)
} else {
  fail('usage: gradient.mjs <list|html|jsx|url> [--preset id] [--colors a,b,c] [--set key=value] [--name Name] [--title Title] [--out file]')
}
