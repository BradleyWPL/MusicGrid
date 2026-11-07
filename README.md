# MusicGrid

Conduct a pixel-art orchestra with your hands. The game uses your camera and Google MediaPipe Hand Landmarker to track left/right hand positions, then controls the four interactive stems from their X/Y coordinates. It also includes a mouse simulator for camera-free development.

## Run locally

Requirements: Node.js 22 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://localhost:8443`). Click **Begin Performance** and allow camera access when your browser asks. Place both hands in view of the camera. Their horizontal positions select Vocals, Drums, Bass, or Guitar; vertical positions select high, medium, or low volume. The two cards display the detected section, volume, confidence, and normalized X/Y coordinates. Use the playback controls to play, pause, or stop the song.

If the browser denies access, allow Camera for `localhost` in the address-bar site controls and press **Retry Camera**. Also check that your operating system allows the browser to use the camera.

The browser asks for audio playback only after you press **Play Song**. To use mouse input, choose **Use Mouse Simulation** in the camera panel; move over the stage, holding **Shift** to move the other hand. Return to camera input with **Enable Camera**.

Camera access requires `localhost` during development or HTTPS after deployment. The app uses the browser camera stream only for local hand landmark inference; it does not upload or record camera frames. MediaPipe Tasks may send usage/performance metrics as described in [Google's MediaPipe privacy notice](https://ai.google.dev/edge/mediapipe/solutions/tasks#mediapipe_tasks_privacy_notice).

## Audio behavior

All six supplied stems are scheduled on a shared Web Audio clock. Vocals, Drums, Bass, and Guitar respond to the detected hand levels. Piano and Other remain at the fixed background gain configured in `src/services/audio/AudioEngine.ts`.

## Hand tracking and attribution

Live tracking uses [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision) and Google's [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker). The hand model and WASM runtime are included locally in `public/models/` and `public/assets/mediapipe/wasm/`, so camera inference does not need to download model files at runtime. Only hand landmarks are enabled; there is no face detection or face model in this project. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for credit and license links.

## Documentation

See [`docs/FILE_GUIDE.md`](docs/FILE_GUIDE.md) for each project file’s inputs, outputs, processing, and function responsibilities. The app and audio engine also include function-level comments.

## Build

```sh
pnpm build
```
