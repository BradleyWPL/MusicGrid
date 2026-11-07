# MusicGrid

Conduct a pixel-art orchestra with your hands. The game uses your camera and Google MediaPipe Hand Landmarker to track left/right hand positions, then controls the four interactive stems from their X/Y coordinates. It also includes a mouse simulator for camera-free development.

## Run locally

Requirements: Node.js 22 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://localhost:8443`). Click **Begin Performance** and allow camera access when your browser asks. Place both hands in view of the camera. Horizontal position selects Vocals, Drums, Bass, or Strings; vertical position selects green, yellow, orange, or red volume. During playback, one or two timed cue circles appear above the active podiums. Match the section and color before the countdown ends to earn points. The first second gives time to move; correct matching earns 100 points per full second after that, and a sustained mismatch can subtract 25 points per second after a two-second grace period. Unprompted sections stay at their quiet red level. Use the playback controls to play, pause, or stop the song.

If the browser denies access, allow Camera for `localhost` in the address-bar site controls and press **Retry Camera**. Also check that your operating system allows the browser to use the camera.

The browser asks for audio playback only after you press **Play Song**. To use mouse input, choose **Use Mouse Simulation** in the camera panel; move over the stage, holding **Shift** to move the other hand. Return to camera input with **Enable Camera**.

Camera access requires `localhost` during development or HTTPS after deployment. The app uses the browser camera stream only for local hand landmark inference; it does not upload or record camera frames. MediaPipe Tasks may send usage/performance metrics as described in [Google's MediaPipe privacy notice](https://ai.google.dev/edge/mediapipe/solutions/tasks#mediapipe_tasks_privacy_notice).

## Audio behavior

All six supplied stems are scheduled on a shared Web Audio clock. Vocals, Drums, Bass, and Strings respond to hand levels while their cue is active. Strings applies the same gain to the Guitar and Other stems. Vocals rest at orange so the lead remains audible; other interactive sections rest at red. Lowering an interactive level fades over three seconds, while raising it fades in over 0.16 seconds. Piano remains at the fixed background gain configured in `src/services/audio/AudioEngine.ts`. The editable cue data lives in `src/data/instructions.ts` and is based on the supplied stem arrangement and requested song moments.

## Hand tracking and attribution

Live tracking uses [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision) and Google's [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker). The hand model and WASM runtime are included locally in `public/models/` and `public/assets/mediapipe/wasm/`, so camera inference does not need to download model files at runtime. Only hand landmarks are enabled; there is no face detection or face model in this project. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for credit and license links.

## Documentation

See [`docs/FILE_GUIDE.md`](docs/FILE_GUIDE.md) for each project file’s inputs, outputs, processing, and function responsibilities. The app and audio engine also include function-level comments.

## Build

```sh
pnpm build
```
