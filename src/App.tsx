import { useEffect, useMemo, useRef, useState } from "react"
import { AudioEngine, type TrackId } from "./services/audio/AudioEngine"
import {
  HandTrackingService,
  type HandFrame,
  type HandTrackingStatus,
  type TrackedHand,
} from "./services/handTracking/HandTrackingService"

type Section = "VOCALS" | "DRUMS" | "BASS" | "GUITAR"
type Volume = "HIGH" | "MEDIUM" | "LOW"
type HandState = {
  section: Section | null
  volume: Volume
  x: number
  y: number
  confidence: number | null
}

const sections: Section[] = [
  "VOCALS",
  "DRUMS",
  "BASS",
  "GUITAR",
]
const trackForSection: Record<Section, Exclude<TrackId, "piano" | "other">> = {
  VOCALS: "vocals", DRUMS: "drums", BASS: "bass", GUITAR: "guitar",
}
const volumeStrength: Record<Volume, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 }
const volumeColor: Record<Volume, string> = {
  HIGH: "green",
  MEDIUM: "yellow",
  LOW: "red",
}

const cameraStatusText: Record<HandTrackingStatus, string> = {
  idle: "CAMERA OFF",
  "requesting-camera": "REQUESTING CAMERA ACCESS…",
  "loading-model": "LOADING HAND TRACKER…",
  searching: "SHOW BOTH HANDS TO CAMERA",
  "no-hands": "NO HANDS DETECTED",
  "one-hand": "1 HAND DETECTED · FIND YOUR OTHER HAND",
  "two-hands": "2 HANDS DETECTED",
  "permission-denied": "CAMERA ACCESS DENIED · ALLOW CAMERA AND RETRY",
  "camera-unavailable": "CAMERA UNAVAILABLE · CONNECT A CAMERA AND RETRY",
  error: "HAND TRACKING ERROR",
}

/** Uses the previously selected zone near boundaries to avoid flicker. */
function sectionForX(x: number, previous: Section | null): Section {
  const previousIndex = previous ? sections.indexOf(previous) : -1
  if (previousIndex >= 0) {
    const lower = previousIndex / sections.length - 0.035
    const upper = (previousIndex + 1) / sections.length + 0.035
    if (x >= lower && x <= upper) return previous!
  }
  return sections[Math.min(sections.length - 1, Math.floor(x * sections.length))]
}

/** Converts tracked Y into red/yellow/green volume with vertical hysteresis. */
function volumeForY(y: number, previous: Volume): Volume {
  if (previous === "HIGH" && y < 0.37) return "HIGH"
  if (previous === "MEDIUM" && y >= 0.31 && y < 0.70) return "MEDIUM"
  if (previous === "LOW" && y >= 0.64) return "LOW"
  return y < 0.34 ? "HIGH" : y < 0.67 ? "MEDIUM" : "LOW"
}

/** Maps one MediaPipe normalized point to its instrument and gain state. */
function toHandState(hand: TrackedHand, previous: HandState): HandState {
  return {
    section: sectionForX(hand.x, previous.section),
    volume: volumeForY(hand.y, previous.volume),
    x: hand.x,
    y: hand.y,
    confidence: hand.confidence,
  }
}

/**
 * Input: one visible orchestra section.
 * Output: the matching CSS pixel icon.
 * Processing: selects the small decorative shape for the section.
 */
function PixelIcon({ section }: { section: Section }) {
  return (
    <span
      className={`pixel-icon pixel-icon--${section.toLowerCase()}`}
      aria-hidden="true"
    >
      {section === "VOCALS" && (
        <>
          <i className="mic-head" />
          <i className="mic-stick" />
        </>
      )}
      {section === "DRUMS" && (
        <>
          <i className="drum-top" />
          <i className="drum-body" />
          <i className="drum-stick" />
        </>
      )}
      {(section === "BASS" || section === "GUITAR") && (
        <>
          <i
            className={`guitar-icon-body guitar-icon-body--${section.toLowerCase()}`}
          />
          <i className="guitar-icon-neck" />
        </>
      )}
    </span>
  )
}

/** Input: an instrument section. Output: its top navigation label. */
function OrchestraSectionLabel({ name }: { name: Section }) {
  return <div className="section-label">{name}</div>
}

/**
 * Input: elapsed and total song time in seconds.
 * Output: the song title, progress fill, and formatted clock.
 * Processing: clamps progress to 100% and formats seconds as mm:ss.
 */
function SongProgressBar({ currentTime, duration }: { currentTime: number; duration: number }) {
  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0
  const format = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`
  return (
    <div className="song-row">
      <div className="song-name">
        <span className="song-number">01</span>
        <span>VEIL OF TEMPESTUOUS HARMONIES</span>
      </div>
      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="time">{format(currentTime)} / {format(duration)}</span>
      </div>
    </div>
  )
}

/**
 * Input: hand side and its current camera or simulation state.
 * Output: one of the two independent hand status cards.
 * Processing: shows the selected section and volume, or a simulation prompt.
 */
function HandInstructionCard({
  hand,
  state,
}: {
  hand: "LEFT" | "RIGHT"
  state: HandState
}) {
  const section = state.section ?? (hand === "LEFT" ? "DRUMS" : "VOCALS")
  return (
    <article
      className={`instruction-card ${
        !state.section ? "instruction-card--idle" : ""
      }`}
    >
      <div className="card-topline">
        <span>{hand} HAND</span>
        <span
          className={`status-pip ${state.section ? "status-pip--live" : ""}`}
        />
      </div>
      <div className="instruction-body">
        <PixelIcon section={section} />
        <div>
          <strong>{state.section ?? "NO HAND"}</strong>
          <span
            className={`volume-copy volume-copy--${volumeColor[state.volume]}`}
          >
            {state.section ? `${state.volume}${state.confidence === null ? "" : ` · ${Math.round(state.confidence * 100)}%`}` : "WAITING FOR HAND"}
          </span>
          {state.section && <small className="hand-coordinates">X {state.x.toFixed(2)} · Y {state.y.toFixed(2)}</small>}
        </div>
      </div>
    </article>
  )
}

/** Input: a hand volume or no active hand. Output: the matching spotlight style. */
function DynamicSpotlight({ intensity }: { intensity: Volume | null }) {
  return (
    <div
      className={`spotlight ${
        intensity ? `spotlight--${intensity.toLowerCase()}` : ""
      }`}
    />
  )
}

/**
 * Input: one of the four interactive sections.
 * Output: its pixel-art performer and instrument.
 * Processing: chooses drummer art or the shared standing-performer variants.
 */
function OrchestraPerformer({ section }: { section: Section }) {
  if (section === "DRUMS") {
    return (
      <div className="performer drummer" aria-label="Pixel art drummer">
        <i className="head">
          <b />
        </i>
        <i className="body" />
        <i className="arm arm--left" />
        <i className="arm arm--right" />
        <i className="cymbal cymbal--left" />
        <i className="cymbal cymbal--right" />
        <i className="tom tom--left" />
        <i className="tom tom--right" />
        <i className="kick" />
      </div>
    )
  }

  return (
    <div
      className={`performer standing standing--${section.toLowerCase()}`}
      aria-label={`Pixel art ${section.toLowerCase()} performer`}
    >
      <i className="hair" />
      <i className="face" />
      <i className="torso" />
      <i className="leg leg--left" />
      <i className="leg leg--right" />
      <i className="arm arm--left" />
      <i className="arm arm--right" />
      {section === "VOCALS" && (
        <>
          <i className="microphone" />
          <i className="mic-cord" />
        </>
      )}
      {(section === "BASS" || section === "GUITAR") && (
        <>
          <i className={`instrument guitar guitar--${section.toLowerCase()}`} />
          <i className="guitar-neck" />
        </>
      )}
    </div>
  )
}

/** Input: section plus combined hand intensity. Output: one lit orchestra bay. */
function InstrumentPlatform({
  section,
  intensity,
}: {
  section: Section
  intensity: Volume | null
}) {
  return (
    <div
      className={`orchestra-bay ${
        intensity ? `orchestra-bay--${intensity.toLowerCase()}` : ""
      }`}
    >
      <DynamicSpotlight intensity={intensity} />
      <div className="platform-shadow" />
      <div className="platform">
        <OrchestraPerformer section={section} />
        <div className="platform-front">
          <span>{section}</span>
        </div>
      </div>
    </div>
  )
}

/** Input: volume level and active status. Output: an accessible color lamp button. */
function VolumeLevelIndicator({
  level,
  active,
  onSelect,
}: {
  level: Volume
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      className={`volume-lamp volume-lamp--${volumeColor[level]} ${
        active ? "volume-lamp--active" : ""
      }`}
      onClick={onSelect}
      aria-label={`${level} volume`}
      type="button"
    >
      <span />
    </button>
  )
}

/**
 * Input: hand side, live state, and volume selection callback.
 * Output: the three edge lamps used to show or set that hand's volume.
 * Processing: marks the current level and forwards manual level selection.
 */
function HandPositionIndicator({
  side,
  state,
  onVolumeChange,
}: {
  side: "LEFT" | "RIGHT"
  state: HandState
  onVolumeChange: (level: Volume) => void
}) {
  return (
    <aside className={`hand-meter hand-meter--${side.toLowerCase()}`}>
      <span className="meter-hand">{side.slice(0, 1)}</span>
      {(["HIGH", "MEDIUM", "LOW"] as Volume[]).map((level) => (
        <VolumeLevelIndicator
          key={level}
          level={level}
          active={state.section !== null && state.volume === level}
          onSelect={() => onVolumeChange(level)}
        />
      ))}
    </aside>
  )
}

/** Input: none. Output: the decorative rear-facing pixel-art conductor. */
function ConductorCharacter() {
  return (
    <div className="conductor" aria-label="Pixel art conductor">
      <i className="conductor-hair" />
      <i className="conductor-head" />
      <i className="conductor-neck" />
      <i className="conductor-body" />
      <i className="conductor-vest" />
      <i className="conductor-arm conductor-arm--left" />
      <i className="conductor-arm conductor-arm--right" />
      <i className="conductor-hand conductor-hand--left" />
      <i className="conductor-hand conductor-hand--right" />
      <i className="baton" />
      <i className="conductor-leg conductor-leg--left" />
      <i className="conductor-leg conductor-leg--right" />
    </div>
  )
}

/** Input: start callback. Output: the Figma-inspired landing screen. */
function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="welcome">
      <div className="welcome-spotlight" />
      <div className="welcome-mark">
        <span>THE ORCHESTRA AWAITS</span>
        <h1>MUSICGRID</h1>
        <div className="baton-rule">
          <i />
        </div>
        <p>YOUR HANDS. YOUR ORCHESTRA.</p>
        <button type="button" onClick={onStart}>
          BEGIN PERFORMANCE
        </button>
        <small>BEST EXPERIENCED WITH CAMERA &amp; SOUND</small>
      </div>
      <div className="welcome-stage">
        <ConductorCharacter />
      </div>
    </main>
  )
}

/**
 * Main screen controller.
 * Inputs: pointer position, Shift key, playback button actions, and AudioEngine state.
 * Outputs: welcome/game screens, two hand readouts, four instrument lights, and song transport.
 * Processing: maps normalized pointer coordinates to four sections and three gain levels.
 */
export default function App() {
  const [started, setStarted] = useState(false)
  const [audio] = useState(() => new AudioEngine())
  const [handTracker] = useState(() => new HandTrackingService())
  const videoRef = useRef<HTMLVideoElement>(null)
  const [inputMode, setInputMode] = useState<"camera" | "simulation">("camera")
  const [cameraStatus, setCameraStatus] = useState<HandTrackingStatus>("idle")
  const [cameraDetail, setCameraDetail] = useState("")
  const [cameraRetry, setCameraRetry] = useState(0)
  const [audioStatus, setAudioStatus] = useState<"loading" | "ready" | "error">("loading")
  const [audioError, setAudioError] = useState("")
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [left, setLeft] = useState<HandState>({
    section: null,
    volume: "HIGH",
    x: 0.2,
    y: 0.2,
    confidence: null,
  })
  const [right, setRight] = useState<HandState>({
    section: null,
    volume: "MEDIUM",
    x: 0.8,
    y: 0.5,
    confidence: null,
  })
  const [shiftHeld, setShiftHeld] = useState(false)

  // Load and decode all six local stems only after the player enters the game.
  useEffect(() => {
    if (!started) return
    let live = true
    audio.load().then(() => {
      if (!live) return
      setDuration(audio.duration)
      setAudioStatus("ready")
    }).catch((error: unknown) => {
      if (!live) return
      setAudioError(error instanceof Error ? error.message : "Audio could not be loaded")
      setAudioStatus("error")
    })
    return () => { live = false }
  }, [audio, started])

  // Ask for camera access after the player presses Begin Performance.
  useEffect(() => {
    if (!started || inputMode !== "camera") return
    const video = videoRef.current
    if (!video) return
    let live = true
    setCameraDetail("")
    void handTracker.start(
      video,
      (hands: HandFrame) => {
        if (!live) return
        setLeft((previous) => hands.left
          ? toHandState(hands.left, previous)
          : { ...previous, section: null, confidence: null })
        setRight((previous) => hands.right
          ? toHandState(hands.right, previous)
          : { ...previous, section: null, confidence: null })
      },
      (status, detail) => {
        if (!live) return
        setCameraStatus(status)
        if (detail) setCameraDetail(detail)
      },
    ).catch((error: unknown) => {
      if (!live) return
      setCameraDetail(error instanceof Error ? error.message : "Could not start the camera")
    })
    return () => {
      live = false
      handTracker.stop()
    }
  }, [handTracker, started, inputMode, cameraRetry])

  // Poll the AudioContext clock for the visible song progress display.
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      const time = audio.getCurrentTime()
      setCurrentTime(time)
      if (!audio.isPlaying) setPlaying(false)
    }, 100)
    return () => window.clearInterval(timer)
  }, [audio, playing])

  // Track Shift so the same pointer can move the right hand independently.
  useEffect(() => {
    const down = (event: KeyboardEvent) =>
      event.key === "Shift" && setShiftHeld(true)
    const up = (event: KeyboardEvent) =>
      event.key === "Shift" && setShiftHeld(false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  // Apply live hand levels to the four interactive stems; Piano and Other are excluded.
  useEffect(() => {
    if (audioStatus !== "ready") return
    const activeBySection = new Map<Section, Volume>()
    ;[left, right].forEach((hand) => {
      if (!hand.section) return
      const current = activeBySection.get(hand.section)
      if (!current || volumeStrength[hand.volume] > volumeStrength[current]) {
        activeBySection.set(hand.section, hand.volume)
      }
    })
    activeBySection.forEach((volume, section) => {
      audio.setInteractiveGain(trackForSection[section], volume)
    })
  }, [audio, audioStatus, left.section, left.volume, right.section, right.volume])

  const sectionIntensity = useMemo(() => {
    const intensity = new Map<Section, Volume>()
    ;[left, right].forEach((hand) => {
      if (!hand.section) return
      const current = intensity.get(hand.section)
      if (!current || volumeStrength[hand.volume] > volumeStrength[current]) {
        intensity.set(hand.section, hand.volume)
      }
    })
    return intensity
  }, [left, right])

  /** Input: pointer event within the game. Output: selected hand state and stem gain. */
  const handleStageMove = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.max(
      0,
      Math.min(0.999, (event.clientX - bounds.left) / bounds.width),
    )
    const y = Math.max(
      0,
      Math.min(0.999, (event.clientY - bounds.top) / bounds.height),
    )
    const section = sections[Math.floor(x * sections.length)]
    const volume = y < 0.34 ? "HIGH" : y < 0.67 ? "MEDIUM" : "LOW"
    const next: HandState = {
      section,
      volume,
      x,
      y,
      confidence: null,
    }
    if (shiftHeld) setRight(next)
    else setLeft(next)
  }

  /** Input: hand side and requested level. Processing: combines same-section hands by strongest level. */
  const setHandVolume = (side: "left" | "right", volume: Volume) => {
    const hand = side === "left" ? left : right
    const otherHand = side === "left" ? right : left
    if (hand.section) {
      const effective = otherHand.section === hand.section && volumeStrength[otherHand.volume] > volumeStrength[volume]
        ? otherHand.volume
        : volume
      audio.setInteractiveGain(trackForSection[hand.section], effective)
    }
    if (side === "left") setLeft({ ...left, volume })
    else setRight({ ...right, volume })
  }

  /** Input: play/pause button action. Output: synchronized stem playback or a visible error. */
  const handlePlayback = async () => {
    try {
      if (playing) {
        audio.pause()
        setCurrentTime(audio.getCurrentTime())
        setPlaying(false)
      } else if (currentTime > 0 && currentTime < duration) {
        await audio.resume()
        setPlaying(true)
      } else {
        await audio.start()
        setCurrentTime(0)
        setPlaying(true)
      }
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : "Audio playback failed")
      setAudioStatus("error")
    }
  }

  if (!started) return <WelcomeScreen onStart={() => setStarted(true)} />

  return (
    <main className="game-shell">
      <div className="game" onPointerMove={inputMode === "simulation" ? handleStageMove : undefined}>
        <header>
          <div className="section-nav">
            {sections.map((section) => (
              <OrchestraSectionLabel key={section} name={section} />
            ))}
          </div>
          <SongProgressBar currentTime={currentTime} duration={duration} />
        </header>

        <div className="instruction-pair">
          <HandInstructionCard hand="LEFT" state={left} />
          <HandInstructionCard hand="RIGHT" state={right} />
        </div>

        <button
          className="brand"
          type="button"
          onClick={() => setStarted(false)}
        >
          MUSICGRID
        </button>
        <div className="control-hint">
          {shiftHeld ? "RIGHT HAND ACTIVE" : "LEFT HAND ACTIVE"}{" "}
          <span>{inputMode === "camera" ? "LIVE CAMERA · TRACK BOTH HANDS" : "MOUSE SIMULATION · HOLD SHIFT TO SWITCH"}</span>
        </div>

        <div className="transport-controls" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={handlePlayback} disabled={audioStatus !== "ready"}>
            {audioStatus === "loading" ? "LOADING STEMS…" : playing ? "PAUSE" : "PLAY SONG"}
          </button>
          <button type="button" onClick={() => { audio.stop(); setCurrentTime(0); setPlaying(false) }} disabled={audioStatus !== "ready"}>STOP</button>
          <span>{audioStatus === "error" ? `AUDIO ERROR: ${audioError}` : inputMode === "camera" ? "LIVE CAMERA · MUSIC FOLLOWS BOTH HANDS" : "MOUSE SIMULATION · MOVE MOUSE · SHIFT SWITCHES HAND"}</span>
        </div>

        {left.section && <div className={`hand-marker hand-marker--left hand-marker--${inputMode}`} style={{ left: `${left.x * 100}%`, top: `${left.y * 100}%` }} aria-label="Left hand position" />}
        {right.section && <div className={`hand-marker hand-marker--right hand-marker--${inputMode}`} style={{ left: `${right.x * 100}%`, top: `${right.y * 100}%` }} aria-label="Right hand position" />}

        <HandPositionIndicator
          side="LEFT"
          state={left}
          onVolumeChange={(volume) => setHandVolume("left", volume)}
        />
        <HandPositionIndicator
          side="RIGHT"
          state={right}
          onVolumeChange={(volume) => setHandVolume("right", volume)}
        />

        <section className="orchestra" aria-label="Orchestra stage">
          {sections.map((section) => (
            <InstrumentPlatform
              key={section}
              section={section}
              intensity={sectionIntensity.get(section) ?? null}
            />
          ))}
        </section>

        <div className="main-stage">
          <div className="stage-grain" />
          <ConductorCharacter />
          <div className="footlights">
            {Array.from({ length: 9 }).map((_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>

        <div className="camera-panel">
          {inputMode === "camera" && <video ref={videoRef} className="camera-feed" muted autoPlay playsInline aria-label="Local camera preview used for hand tracking" />}
          <div className={`camera-status camera-status--${cameraStatus}`}>
            <i />
            <span>{inputMode === "simulation" ? "MOUSE SIMULATION ACTIVE" : cameraStatusText[cameraStatus]}</span>
          </div>
          {cameraDetail && inputMode === "camera" && <small className="camera-detail">{cameraDetail}</small>}
          <button
            type="button"
            className="camera-mode-button"
            onClick={() => {
              setCameraDetail("")
              if (inputMode === "camera") {
                setCameraStatus("idle")
                setInputMode("simulation")
              } else {
                setInputMode("camera")
                setCameraRetry((count) => count + 1)
              }
            }}
          >
            {inputMode === "camera" ? "USE MOUSE SIMULATION" : "ENABLE CAMERA"}
          </button>
          {inputMode === "camera" && (cameraStatus === "permission-denied" || cameraStatus === "camera-unavailable" || cameraStatus === "error") && (
            <button type="button" className="camera-mode-button" onClick={() => setCameraRetry((count) => count + 1)}>RETRY CAMERA</button>
          )}
        </div>
      </div>
    </main>
  )
}
