# MusicGrid

Conduct a pixel-art orchestra with your hands. The current playable milestone has a mouse based two-hand simulator and six synchronized song stems. Real camera tracking and the musical instruction timeline are still in development.

## Run locally

Requirements: Node.js 22 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://localhost:8443`). Click **Begin Performance**, then move the mouse over the stage. Hold **Shift** to move the right hand; release it to move the left. Horizontal position selects Vocals, Drums, Bass, or Guitar. Vertical position selects high, medium, or low volume. Use the playback controls to play, pause, or stop the song.

The browser asks for audio playback only after you press **Play Song**. Camera tracking is not wired up yet; the status badge identifies the current input as simulation mode.

## Audio behavior

All six supplied stems are scheduled on a shared Web Audio clock. Vocals, Drums, Bass, and Guitar respond to the simulated hand levels. Piano and Other remain at the fixed background gain configured in `src/services/audio/AudioEngine.ts`.

## Documentation

See [`docs/FILE_GUIDE.md`](docs/FILE_GUIDE.md) for each project file’s inputs, outputs, processing, and function responsibilities. The app and audio engine also include function-level comments.

## Build

```sh
pnpm build
```
