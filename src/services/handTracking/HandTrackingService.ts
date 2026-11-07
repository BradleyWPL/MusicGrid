import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision"

export type HandSide = "left" | "right"

export type TrackedHand = {
  /** Mirrored image X in normalized viewport coordinates [0, 1]. */
  x: number
  /** Image Y in normalized viewport coordinates [0, 1], with 0 at the top. */
  y: number
  /** MediaPipe handedness classification score in [0, 1]. */
  confidence: number
}

export type HandFrame = Record<HandSide, TrackedHand | null>

export type HandTrackingStatus =
  | "idle"
  | "requesting-camera"
  | "loading-model"
  | "searching"
  | "no-hands"
  | "one-hand"
  | "two-hands"
  | "permission-denied"
  | "camera-unavailable"
  | "error"

const WASM_PATH = "/assets/mediapipe/wasm"
const MODEL_PATH = "/models/hand_landmarker.task"
const SMOOTHING = 0.32
const MAX_FPS_INTERVAL_MS = 42
const PALM_LANDMARKS = [0, 5, 9, 13, 17]

/**
 * Live webcam adapter for Google's MediaPipe Hand Landmarker.
 * Inputs: an HTML video element backed by the user's camera.
 * Outputs: independently labeled left/right normalized X/Y positions and status.
 * Processing: runs VIDEO-mode hand-only landmark inference, mirrors X to match
 * the user's selfie view, and applies a small exponential smoothing filter.
 * No face detector or face model is loaded.
 */
export class HandTrackingService {
  private stream: MediaStream | null = null
  private landmarker: HandLandmarker | null = null
  private video: HTMLVideoElement | null = null
  private running = false
  private session = 0
  private frameRequest = 0
  private lastVideoTime = -1
  private lastInferenceAt = 0
  private lastTimestamp = 0
  private smoothed = new Map<HandSide, TrackedHand>()
  private onHands: ((hands: HandFrame) => void) | null = null
  private onStatus: ((status: HandTrackingStatus, detail?: string) => void) | null = null

  /**
   * Requests camera access, loads the local model/runtime files, then starts tracking.
   * Input: mounted video element and frame/status callbacks.
   * Output: resolves once the camera and two-hand landmarker are ready.
   */
  async start(
    video: HTMLVideoElement,
    onHands: (hands: HandFrame) => void,
    onStatus: (status: HandTrackingStatus, detail?: string) => void,
  ) {
    this.stop()
    const session = ++this.session
    this.video = video
    this.onHands = onHands
    this.onStatus = onStatus

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("This browser does not support camera access.", "NotSupportedError")
      }

      this.onStatus("requesting-camera")
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
      })
      if (session !== this.session) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      this.stream = stream
      video.srcObject = this.stream
      await video.play()
      if (session !== this.session) return

      this.onStatus("loading-model")
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
      if (session !== this.session) return
      const options = {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate: "GPU" as const },
        runningMode: "VIDEO" as const,
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.5,
      }

      try {
        this.landmarker = await HandLandmarker.createFromOptions(vision, options)
      } catch {
        // Some browsers/devices cannot initialize WebGL inference; CPU remains supported.
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
        })
      }
      if (session !== this.session) {
        this.landmarker.close()
        this.landmarker = null
        return
      }

      this.running = true
      this.onStatus("searching")
      this.frameRequest = requestAnimationFrame(this.processFrame)
    } catch (error) {
      if (session !== this.session) return
      const domError = error instanceof DOMException ? error : null
      if (domError?.name === "NotAllowedError" || domError?.name === "PermissionDeniedError") {
        this.onStatus?.("permission-denied", domError?.message)
      } else if (
        domError?.name === "NotFoundError" ||
        domError?.name === "DevicesNotFoundError" ||
        domError?.name === "NotSupportedError"
      ) {
        this.onStatus?.("camera-unavailable", domError?.message)
      } else {
        this.onStatus?.("error", error instanceof Error ? error.message : "Camera setup failed")
      }
      this.stop()
      throw error
    }
  }

  /** Stops inference and releases every camera track held by this service. */
  stop(clearVideo = true) {
    this.session++
    this.running = false
    cancelAnimationFrame(this.frameRequest)
    this.landmarker?.close()
    this.landmarker = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    if (clearVideo && this.video) this.video.srcObject = null
    this.video = null
    this.smoothed.clear()
    this.lastVideoTime = -1
    this.onHands?.({ left: null, right: null })
  }

  /** Processes a fresh camera frame, reports both sides, and schedules the next frame. */
  private processFrame = () => {
    const video = this.video
    if (!this.running || !video || !this.landmarker) return

    const now = performance.now()
    if (
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.currentTime !== this.lastVideoTime &&
      now - this.lastInferenceAt >= MAX_FPS_INTERVAL_MS
    ) {
      try {
        this.lastVideoTime = video.currentTime
        this.lastInferenceAt = now
        this.lastTimestamp = Math.max(now, this.lastTimestamp + 1)
        const result = this.landmarker.detectForVideo(video, this.lastTimestamp)
        const hands: HandFrame = { left: null, right: null }

        result.landmarks.forEach((landmarks, index) => {
          const category = result.handedness[index]?.[0]
          const confidence = category?.score ?? 0
          if (!category || confidence < 0.55 || landmarks.length <= 17) return

          const side = category.categoryName.toLowerCase() as HandSide
          if (side !== "left" && side !== "right") return

          const palm = PALM_LANDMARKS.reduce(
            (center, landmarkIndex) => ({
              x: center.x + landmarks[landmarkIndex].x / PALM_LANDMARKS.length,
              y: center.y + landmarks[landmarkIndex].y / PALM_LANDMARKS.length,
            }),
            { x: 0, y: 0 },
          )
          const position = this.smooth(side, {
            x: 1 - palm.x,
            y: palm.y,
            confidence,
          })
          hands[side] = position
        })

        this.onHands?.(hands)
        const detectedCount = Number(Boolean(hands.left)) + Number(Boolean(hands.right))
        this.onStatus?.(detectedCount === 2 ? "two-hands" : detectedCount === 1 ? "one-hand" : "no-hands")
      } catch (error) {
        this.onStatus?.("error", error instanceof Error ? error.message : "Hand tracking failed")
        this.stop()
        return
      }
    }

    this.frameRequest = requestAnimationFrame(this.processFrame)
  }

  /** Blends landmark coordinates with the prior frame to reduce jitter. */
  private smooth(side: HandSide, next: TrackedHand): TrackedHand {
    const previous = this.smoothed.get(side)
    const position = previous
      ? {
          x: previous.x + (next.x - previous.x) * SMOOTHING,
          y: previous.y + (next.y - previous.y) * SMOOTHING,
          confidence: next.confidence,
        }
      : next
    this.smoothed.set(side, position)
    return position
  }
}
