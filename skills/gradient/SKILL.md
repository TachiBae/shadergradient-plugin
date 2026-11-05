---
name: gradient
description: Generate animated 3D mesh gradient backgrounds with ShaderGradient, as a React component, a standalone HTML page or a customizer link. Use when the user asks for a ShaderGradient, or for a moving, animated, flowing, WebGL or 3D gradient, for a hero, landing page, app or wallpaper background, even if they never name ShaderGradient. Not for plain static CSS gradients.
argument-hint: "[mood, colors or use, e.g. calm dark purple hero background]"
---

# ShaderGradient

Request: $ARGUMENTS

The generator below validates every prop, so use it instead of writing props or install commands by hand:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/gradient/scripts/gradient.mjs" <command> [options]
```

| Command | Output |
| --- | --- |
| `list` | The presets, with type, colors and mood |
| `html` | A complete standalone page, which needs internet access at runtime because it loads from esm.sh |
| `jsx` | A React component, valid as `.tsx` or `.jsx` |
| `url` | A link to the official customizer, for tuning by hand |

Options: `--preset <id>` (default `halo`), `--colors "#aaaaaa,#bbbbbb,#cccccc"`, `--set key=value` (repeatable), `--out <file>`, `--name <PascalCase>` (jsx), `--title <text>` (html).

## Workflow

1. **Pick the output.** If the working directory has a `package.json` with `react`, use `jsx` unless told otherwise. Otherwise use `html`. Use `url` when the user wants to fine-tune it themselves.
2. **Pick a preset.** Run `list` and choose the closest mood. Change as little as needed, because presets are tuned as a whole: camera, position and rotation depend on each other.
3. **Generate it**, then show it to the user: a preview if you can, otherwise the file path. Always include the `url` output too, so they can tune it visually.
4. **For `jsx`, install and place it** using the sections below.

If the user's request has no mood, colors or use, ask for one instead of guessing.

## Colors

Rendered colors are noticeably more saturated than the hex values, and they shift with lighting. `#123456,#abcdef,#ff00aa` renders as neon red, pink and cyan. So:

- Prefer a preset's own colors when one fits.
- Treat brand colors as approximate, and say so. Exact brand color matching is not something this does.
- Lower `brightness` if a recolor looks blown out, and always look at a recolor before calling it done.

## React install

Pin `three` exactly. This is the most important line in this file:

```bash
npm i @shadergradient/react@2.4.20 @react-three/fiber@9 three@0.169.0
```

- **Do not install the latest `three`.** At 0.187 the package fails with `THREE.WebGLProgram: Can not resolve #include <cube_uv_reflection_fragment>`, and no gradient appears. The upstream README's `three >=0.158` is wrong about this. If the project already has a newer `three`, tell the user about the conflict before changing it.
- `three-stdlib` and `camera-controls`, listed in the upstream README, are not imported by the published package. They aren't needed.
- `@react-three/fiber@9` requires React 19. For React 18 use `@react-three/fiber@8`. Only the React 19 combination has been tested.
- For TypeScript, add `@types/three@0.169` as a dev dependency.

## Placing the component

- The generated component is `position: absolute; inset: 0`, so its parent needs `position: relative` and a real height. Without a height it renders nothing.
- Keep content above it with `position: relative` or a `z-index`.
- It adds about 350 KB gzipped, so load it lazily and let the built-in CSS fallback show first:
  - React: `const Gradient = lazy(() => import('./Gradient'))` inside `<Suspense>`
  - Next.js: `dynamic(() => import('./Gradient'), { ssr: false })`, called from a client component. WebGL can't render on the server.
- Respect reduced motion in React by passing `animate={reduceMotion ? 'off' : 'on'}`, from `matchMedia('(prefers-reduced-motion: reduce)')`. The `html` output already does this.

## Props

Set these through `--set`. Ranges are the ones the package's own controls use.

| Prop | Values | Effect |
| --- | --- | --- |
| `type` | `plane`, `sphere`, `waterPlane` | Shape. Camera settings are specific to each type, so don't change it alone |
| `uSpeed` | from 0.1 | Animation speed. Presets use 0.1 to 0.4 |
| `uStrength` | from 0.1 | Height of the waves |
| `uDensity` | from 0.1 | Tightness of the waves |
| `uFrequency`, `uAmplitude` | numbers | Spiral detail |
| `brightness` | 0.1 to 3 | Overall exposure |
| `reflection` | 0 to 1 | Sheen |
| `grain` | `on`, `off` | Film grain |
| `animate` | `on`, `off` | Motion. `off` gives a still |
| `cDistance`, `cameraZoom` | 0 to 20, 0.1 to 30 | Framing |
| `cAzimuthAngle`, `cPolarAngle` | 0 to 360, 0 to 180 | Camera angle |
| `positionX/Y/Z`, `rotationX/Y/Z` | numbers, -360 to 360 | Placement of the mesh |
| `lightType`, `envPreset` | `3d` or `env`; `city`, `dawn`, `lobby` | Lighting |
| `shader` | `defaults`, `cosmic`, `glass`, `positionMix` | Keep `defaults` unless asked |

## Pitfalls

- **`control="query"` with `urlString` discards all defaults.** Anything missing from the URL is undefined, not the preset value. Use props, which is what the generator emits.
- **`shader` values other than `defaults` need retuning.** With preset settings, `cosmic` blows out to white, `glass` is almost black and `positionMix` may not cover the screen.
- **`lightType=env` downloads from a third party.** It fetches three HDR files from `ruucm.github.io`, so it depends on that host staying up. To self-host them, pass `envBasePath` to `ShaderGradientCanvas`. The `interstella` preset is the one that uses this.
- **The CSS fallback can show through** when a mesh doesn't fill the frame, usually after changing position, rotation or camera. Look at the edges after changing those.
- **Never present it as verified from a hidden page.** Browsers stop animating background tabs, which leaves the canvas at 300×150 and shows only the fallback.
- **Video and GIF export isn't part of this.** The official Figma plugin does that: <https://www.figma.com/community/plugin/1203016883447870818>
