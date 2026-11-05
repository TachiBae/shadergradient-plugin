# ShaderGradient plugin for Claude Code

An unofficial [Claude Code](https://claude.com/claude-code) plugin that lets Claude build animated 3D gradient backgrounds with [ShaderGradient](https://www.shadergradient.co/). Describe what you want in plain language, and you get a working React component, a standalone web page, or a link to tune the gradient by hand.

```text
/shadergradient:gradient calm dark purple hero background
```

## What this repository is

[ShaderGradient](https://github.com/ruucm/shadergradient) is an open-source library that renders moving mesh gradients in the browser with WebGL. It looks great, but it can be fiddly to set up: it has dozens of settings that depend on each other, and its dependency versions have to line up exactly.

This repository packages that setup knowledge as a Claude Code plugin. Once it's installed, Claude knows when to use ShaderGradient, how to choose a suitable look, which package versions work together, and how to avoid the mistakes that leave you with a blank screen.

The repository contains no copy of the ShaderGradient library. It holds instructions for Claude, a small generator script, and a set of presets. The pages and components it generates load the library themselves.

## What it's for

Use it when you want a moving gradient behind something, such as:

- A hero section on a landing page
- A background for a web app or login screen
- A full-screen page to use as a wallpaper or ambient display
- A quick visual experiment before you commit to a design

It isn't meant for plain static CSS gradients, which don't need WebGL. It also can't export video or GIF files. For those, use the [official ShaderGradient Figma plugin](https://www.figma.com/community/plugin/1203016883447870818).

## Install

You need [Claude Code](https://claude.com/claude-code), [Node.js](https://nodejs.org) and [Git](https://git-scm.com). Run these two commands in a terminal:

```bash
claude plugin marketplace add TachiBae/shadergradient-plugin
```

```bash
claude plugin install shadergradient@shadergradient-plugin
```

Then start a new Claude Code session so the plugin loads.

### Install without Git

1. On this page, select **Code**, then **Download ZIP**.
2. Unzip it somewhere you'll keep it, because Claude Code keeps reading from that folder.
3. Run these commands, using the path to the unzipped folder:

```bash
claude plugin marketplace add "/path/to/shadergradient-plugin-main"
```

```bash
claude plugin install shadergradient@shadergradient-plugin
```

### Update or remove it

```bash
claude plugin marketplace update shadergradient-plugin
```

```bash
claude plugin update shadergradient@shadergradient-plugin
```

```bash
claude plugin uninstall shadergradient@shadergradient-plugin
```

## How to use it

Run the slash command with a mood, some colors or the place you'll use it:

```text
/shadergradient:gradient warm sunset background for a travel landing page
```

You can also just ask in normal conversation, for example "add a flowing animated gradient behind this hero". Claude picks up the skill without you naming it.

Claude then:

1. **Chooses an output.** It uses a React component if your project has React, and a standalone HTML page otherwise.
2. **Chooses a preset** that's closest to your request, and changes as little as it can.
3. **Generates the result** and shows you the preview or file, along with a customizer link for tuning it by hand.
4. **Sets up React projects** with the tested package versions and placement advice.

### What you can get

| Output | What it is | Good for |
| --- | --- | --- |
| HTML page | One complete file that you open in a browser | Quick previews and non-React sites |
| React component | A `.tsx` or `.jsx` component | React and Next.js projects |
| Customizer link | A link that opens your gradient in the official ShaderGradient customizer | Adjusting it visually |

### Presets

| Preset | Shape | Look |
| --- | --- | --- |
| `halo` | Plane | Warm orange fading to peach and lilac, soft and flowing |
| `pensive` | Sphere | Moody periwinkle and violet, close up |
| `mint` | Water plane | Airy mint, cyan and white, calm and fresh |
| `interstella` | Sphere | Teal and orange, cosmic, close up |
| `nightyNight` | Water plane | Muted dusk violet and charcoal, dark and quiet |
| `violaOrientalis` | Sphere | Bright white, amber and electric blue, high contrast |
| `universe` | Water plane | Deep violet and coral fading to black, dramatic |
| `sunset` | Sphere | Orange, amber and sky blue, vivid |
| `mandarin` | Water plane | Saturated orange and burnt red, energetic |
| `cottonCandy` | Water plane | Very pale lavender and ice blue, almost white, subtle |

## Run the generator yourself

The generator has no dependencies beyond Node.js, so you can use it without Claude. Run these from the repository folder:

```bash
node skills/gradient/scripts/gradient.mjs list
```

```bash
node skills/gradient/scripts/gradient.mjs html --preset universe --out background.html
```

```bash
node skills/gradient/scripts/gradient.mjs jsx --preset mint --set uSpeed=0.2 --name HeroGradient --out HeroGradient.tsx
```

```bash
node skills/gradient/scripts/gradient.mjs url --preset halo --colors "#ff5005,#dbba95,#d0bce1"
```

| Option | Meaning |
| --- | --- |
| `--preset <id>` | Starting preset. The default is `halo` |
| `--colors "#aaaaaa,#bbbbbb,#cccccc"` | Replaces the three colors |
| `--set key=value` | Changes one setting, and can be repeated |
| `--out <file>` | Writes to a file instead of printing the result |
| `--name <PascalCase>` | Component name, for `jsx` |
| `--title <text>` | Page title, for `html` |

The generator rejects unknown settings and invalid values. The full list of settings is in [SKILL.md](skills/gradient/SKILL.md#props).

## Using the results

- **Generated HTML pages** work in a modern browser with WebGL, and need internet access because they load the library from [esm.sh](https://esm.sh). You don't need Claude Code or this plugin to view them.
- **Fallback:** if WebGL is unavailable or the library doesn't load, HTML pages keep a static CSS gradient.
- **Reduced motion:** HTML pages respect the visitor's reduced-motion setting automatically. For React, the skill tells Claude how to add this.
- **Battery:** the animation runs continuously, so it may use more battery on a laptop or phone.

### React projects

Install these exact versions:

```bash
npm i @shadergradient/react@2.4.20 @react-three/fiber@9 three@0.169.0
```

**Don't install the latest `three`.** At version 0.187 the package fails with a shader error and no gradient appears. This combination requires React 19, and it's the only one that has been tested. The component fills its nearest positioned parent, so that parent needs `position: relative` and a real height.

## Limitations

- Rendered colors look more saturated than their hex values and shift with lighting, so exact brand color matching isn't possible.
- The `interstella` preset downloads lighting files from `ruucm.github.io`, so it depends on that site staying online.
- The plugin has only been run on Windows. It's plain Node.js with nothing Windows-specific, so it should also work on macOS and Linux, but that hasn't been tested.

## What's in the repository

| Path | Purpose |
| --- | --- |
| `.claude-plugin/plugin.json` | Plugin name, version and description |
| `.claude-plugin/marketplace.json` | Lets Claude Code install the plugin from this repository |
| `skills/gradient/SKILL.md` | Instructions Claude follows when making a gradient |
| `skills/gradient/scripts/gradient.mjs` | Generator that validates settings and writes the output |
| `skills/gradient/scripts/presets.json` | The 10 presets |

## Credit and license

This is an independent project, and it isn't made by or affiliated with the ShaderGradient authors or Anthropic. All credit for the gradient library goes to [ShaderGradient](https://github.com/ruucm/shadergradient) by ruucm. The preset values come from the `@shadergradient/react` npm package, which declares the MIT license.

This plugin's own files are released under the [MIT license](LICENSE).
