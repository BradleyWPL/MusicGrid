# Third-party notices

## Google MediaPipe Tasks Vision

MusicGrid uses `@mediapipe/tasks-vision` version 1.2.2 and the bundled WASM runtime to run Google's Hand Landmarker in the browser. The package and MediaPipe source are licensed under Apache License 2.0. The license text is included at [`third_party/mediapipe/LICENSE`](third_party/mediapipe/LICENSE).

- Project: [Google AI Edge MediaPipe](https://github.com/google-ai-edge/mediapipe)
- Web package: [@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision)
- Task documentation: [Hand Landmarker for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)
- License: [Apache License 2.0](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)

## Hand Landmarker model

`public/models/hand_landmarker.task` is Google's HandLandmarker Full FP16 model bundle. The model includes the palm detector and 21-point hand landmark model required by the task. Google's [Hand Tracking Model Card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20%28Lite_Full%29%20with%20Fairness%20Oct%202021.pdf) identifies Apache License 2.0 terms.

The model is loaded locally. MusicGrid runs only the hand landmarker task; it does not initialize or run face detection, face landmarks, or a face model.

## TensorFlow.js Models repository

The supplied `tensorflow/tfjs-models` repository is not included. The supplied MediaPipe Hand Landmarker API already provides the required live two-hand detections and normalized X/Y landmarks, so adding the separate TensorFlow.js hand-pose detector would duplicate the feature and increase the download and maintenance footprint.
