# MusicGrid file guide

This guide describes the files that make up the application and the development scaffold. For application functions, the comments immediately above each function in `src/App.tsx` and `src/services/audio/AudioEngine.ts` give the same input, output, and processing summary.

## Application source

| File | Input | Output | Processing |
| --- | --- | --- | --- |
| `src/App.tsx` | React events, pointer position, Shift key state, and audio engine status | Welcome/game screens, two hand cards, four orchestra bays, hand indicators, and transport controls | Maps normalized pointer coordinates to one of four instrument zones and three volume levels; combines both hands on the same section using the stronger requested level. |
| `src/services/audio/AudioEngine.ts` | Six local MP3 files, playback commands, and interactive volume levels | Synchronized audio and current song time | Decodes the stems, schedules six buffer sources from a shared AudioContext clock, and routes each through its own gain node. Piano and Other keep a fixed gain of `0.25`. |
| `src/main.tsx` | `index.html` root element and the `App` React component | Mounted React application | Creates the React root, loads global CSS, and renders the app under StrictMode. |
| `src/index.css` | Semantic component class names and viewport dimensions | Pixel-art stage, responsive layout, typography, lighting, controls, and state colors | Uses layered CSS gradients, shapes, and transitions to preserve the Figma visual style without an external runtime renderer. |
| `src/vite-env.d.ts` | Vite client type definitions | TypeScript declarations for Vite features | Adds the Vite ambient types to the application compilation. |

## Browser and build files

| File | Input | Output | Processing |
| --- | --- | --- | --- |
| `index.html` | Browser document request | Metadata, `#root`, and the JavaScript module entry | Defines the document shell that Vite serves and React mounts into. |
| `vite.config.ts` | Vite mode and environment variables | Dev server and production build configuration | Registers React, Tailwind, and the supplied Figma Make compatibility plugins; sets the development port and HTML metadata behavior. |
| `package.json` | Package-manager commands | `dev`, `build`, `preview`, and `format` scripts | Declares React runtime and Vite/Tailwind/TypeScript tooling. |
| `pnpm-lock.yaml` | `package.json` dependency ranges | Exact dependency versions | Makes installs repeatable with `pnpm install --frozen-lockfile`. |
| `tsconfig.json` | TypeScript source and compiler options | Type-check/build configuration | Enables the project’s React and browser TypeScript settings. |
| `.mise.toml` | Project tool-version manager | Node and pnpm version hints | Records the scaffold’s preferred local toolchain. |
| `.gitignore` | Generated file paths | Git exclusion rules | Keeps dependencies, build output, caches, and local environment files out of commits. |
| `.gitattributes` | File extension patterns | Git line-ending and Git LFS behavior | Keeps binary assets out of text diffs and sends audio/image assets through Git LFS. |

## Assets and supplied scaffold

| Path | Input | Output | Processing / purpose |
| --- | --- | --- | --- |
| `public/assets/audio/vocals.mp3` | Supplied vocals stem | Vocals audio buffer | Loaded by `AudioEngine`; controlled by the Vocals section. |
| `public/assets/audio/drums.mp3` | Supplied drums stem | Drums audio buffer | Loaded by `AudioEngine`; controlled by the Drums section. |
| `public/assets/audio/bass.mp3` | Supplied bass stem | Bass audio buffer | Loaded by `AudioEngine`; controlled by the Bass section. |
| `public/assets/audio/guitar.mp3` | Supplied guitar stem | Guitar audio buffer | Loaded by `AudioEngine`; controlled by the Guitar section. |
| `public/assets/audio/piano.mp3` | Supplied piano stem | Piano audio buffer | Plays continuously at fixed background gain; never controlled by the hands. |
| `public/assets/audio/other.mp3` | Supplied Other stem | Other audio buffer | Plays continuously at fixed background gain; never controlled by the hands. |
| `public/favicon.svg` | Static SVG asset | Browser tab icon | Served directly from `public`. |
| `maestro-welcome.png` | Supplied Figma export image | Reference artwork | Kept intact; the current screen is rendered from the original CSS/React implementation and does not load this file. |
| `.figma/make/site.json` | Figma Make site metadata | Vite document metadata | Supplies the source configuration used by the included Figma Make Vite plugin. |
| `.figma/make/dev.json` | Figma Make dev watcher settings | Figma Make tool behavior | Identifies files that should restart its dev environment when changed. |
| `.figma/make/{analyze-routes,deploy,deploy-preview,dev,format,install,langserver}` | Figma Make CLI calls | Development, formatting, and deployment operations | Tooling scripts supplied by the exported project; they are not part of browser runtime. |
| `AGENTS.md` | Repository agent guidance | Contributor workflow hints | Supplied scaffold notes for the original Figma Make environment. |
| `CLAUDE.md` | Agent guidance reference | Link/reference to `AGENTS.md` | Supplied scaffold file; not loaded by the browser. |

## Current runtime boundary

The current release is playable with mouse simulation and local audio. MediaPipe camera capture, calibration, generated/editable musical instructions, and scoring have not been implemented yet. Those features should be added as separate services so presentation, hand input, and audio remain independently maintainable.
