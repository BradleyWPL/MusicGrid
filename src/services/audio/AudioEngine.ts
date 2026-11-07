export type TrackId = "vocals" | "drums" | "bass" | "guitar" | "piano" | "other"
export type InteractiveSection = "vocals" | "drums" | "bass" | "strings"
export type VolumeLevel = "RED" | "ORANGE" | "YELLOW" | "GREEN"

const trackFiles: Record<TrackId, string> = {
  vocals: "/assets/audio/vocals.mp3",
  drums: "/assets/audio/drums.mp3",
  bass: "/assets/audio/bass.mp3",
  guitar: "/assets/audio/guitar.mp3",
  piano: "/assets/audio/piano.mp3",
  other: "/assets/audio/other.mp3",
}

/** Fixed linear gain for the non-interactive Piano background stem. */
const backgroundGain = 0.25
const gainFadeOutSeconds = 3
const gainFadeInSeconds = 0.16
const gainByLevel: Record<VolumeLevel, number> = {
  RED: 0.12,
  ORANGE: 0.3,
  YELLOW: 0.58,
  GREEN: 0.88,
}

/**
 * Owns six synchronized, streaming audio elements and their Web Audio gains.
 * Inputs: six local MP3 files, playback commands, and four hand-selected levels.
 * Outputs: synchronized audio and song time, routed through per-stem GainNodes.
 * Processing: streams compressed files instead of decoding their full four-minute
 * durations into large PCM buffers. All play calls are issued in one task against
 * a shared AudioContext; Piano keeps fixed gain and Strings controls Guitar and Other.
 */
export class AudioEngine {
  private context: AudioContext | null = null
  private elements = new Map<TrackId, HTMLAudioElement>()
  private gains = new Map<TrackId, GainNode>()
  private targetLevels = new Map<TrackId, VolumeLevel>()
  private offset = 0
  private playing = false
  private loading: Promise<void> | null = null

  /**
   * Input: none. Output: resolves after all six tracks have audio metadata.
   * Processing: creates streaming media elements and connects them to the shared context.
   */
  async load() {
    if (this.elements.size === 6) return
    if (this.loading) return this.loading

    this.context ??= new AudioContext()
    this.loading = Promise.all(
      Object.entries(trackFiles).map(async ([key, url]) => {
        const id = key as TrackId
        const element = new Audio()
        element.preload = "auto"
        element.src = url
        element.load()

        const gain = this.context!.createGain()
        const baseLevel: VolumeLevel = id === "vocals" ? "ORANGE" : "RED"
        gain.gain.value = id === "piano" ? backgroundGain : gainByLevel[baseLevel]
        if (id !== "piano") this.targetLevels.set(id, baseLevel)
        const source = this.context!.createMediaElementSource(element)
        source.connect(gain)
        gain.connect(this.context!.destination)
        element.addEventListener("ended", () => {
          if (id === "vocals") {
            this.playing = false
            this.offset = this.duration
            this.pauseElements()
          }
        })

        this.elements.set(id, element)
        this.gains.set(id, gain)
        await this.waitForMetadata(element, id)
      }),
    ).then(() => undefined).catch((error) => {
      this.loading = null
      throw error
    })

    return this.loading
  }

  /** Input: none. Output: starts all six stems at song time zero. */
  async start() {
    await this.load()
    await this.context!.resume()
    await this.playAt(0)
  }

  /** Input: none. Output: resumes all stems from the shared paused position. */
  async resume() {
    await this.load()
    await this.context!.resume()
    if (this.playing) return
    await this.playAt(this.offset)
  }

  /** Input: none. Processing: pauses every stream and preserves the master time. */
  pause() {
    if (!this.playing) return
    this.offset = this.getCurrentTime()
    this.pauseElements()
    this.playing = false
  }

  /** Input: none. Output: pauses every stream and resets the playhead to zero. */
  stop() {
    this.pauseElements()
    this.offset = 0
    this.playing = false
    this.elements.forEach((element) => {
      if (element.readyState >= HTMLMediaElement.HAVE_METADATA) element.currentTime = 0
    })
  }

  /**
   * Input: an interactive orchestra section and one of its four cue levels.
   * Output: smoothed gain updates; Strings addresses both string stems.
   * Processing: ramps increases quickly and decreases over three seconds; vocals
   * use ORANGE as their floor while the other interactive stems use RED.
   */
  setInteractiveGain(
    track: InteractiveSection,
    level: VolumeLevel,
  ) {
    const value = gainByLevel[level]
    const tracks: TrackId[] = track === "strings" ? ["guitar", "other"] : [track]
    if (!this.context) return
    const now = this.context.currentTime
    tracks.forEach((id) => {
      const gain = this.gains.get(id)
      if (!gain || this.targetLevels.get(id) === level) return
      const previousValue = gainByLevel[this.targetLevels.get(id) ?? "RED"]
      const fadeSeconds = value < previousValue ? gainFadeOutSeconds : gainFadeInSeconds
      gain.gain.cancelAndHoldAtTime(now)
      gain.gain.linearRampToValueAtTime(value, now + fadeSeconds)
      this.targetLevels.set(id, level)
    })
  }

  /** Input: none. Output: vocals currentTime, used as the shared song clock. */
  getCurrentTime() {
    const master = this.elements.get("vocals")
    if (!master || !this.playing) return this.offset
    return Math.min(this.duration, master.currentTime)
  }

  /** Output: vocals duration in seconds, or zero before metadata is loaded. */
  get duration() {
    const duration = this.elements.get("vocals")?.duration ?? 0
    return Number.isFinite(duration) ? duration : 0
  }

  /** Output: whether all six audio elements are currently in the play state. */
  get isPlaying() {
    return this.playing
  }

  /** Assigns one shared offset and starts each media element without separate timers. */
  private async playAt(time: number) {
    const playPromises = Array.from(this.elements.values()).map((element) => {
      element.currentTime = Math.min(time, Math.max(0, element.duration - 0.01))
      return element.play()
    })
    try {
      await Promise.all(playPromises)
    } catch (error) {
      this.pauseElements()
      throw error
    }
    this.offset = time
    this.playing = true
  }

  /** Pauses every media element in the same synchronous turn. */
  private pauseElements() {
    this.elements.forEach((element) => element.pause())
  }

  /** Waits for duration metadata and turns a media load failure into a useful error. */
  private waitForMetadata(element: HTMLAudioElement, track: TrackId) {
    if (element.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        element.removeEventListener("loadedmetadata", onMetadata)
        element.removeEventListener("error", onError)
      }
      const onMetadata = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error(`Could not load ${track} audio`))
      }
      element.addEventListener("loadedmetadata", onMetadata, { once: true })
      element.addEventListener("error", onError, { once: true })
      if (element.error) onError()
    })
  }
}
