/** Stable identifiers for all interactive and background stems. */
export type TrackId = "vocals" | "drums" | "bass" | "guitar" | "piano" | "other"

const trackFiles: Record<TrackId, string> = {
  vocals: "/assets/audio/vocals.mp3",
  drums: "/assets/audio/drums.mp3",
  bass: "/assets/audio/bass.mp3",
  guitar: "/assets/audio/guitar.mp3",
  piano: "/assets/audio/piano.mp3",
  other: "/assets/audio/other.mp3",
}

/** Fixed linear gain for the two non-interactive background stems. */
const backgroundGain = 0.25

/**
 * Owns loading, synchronized playback, pause/resume, and per-stem gain.
 * Inputs: six local MP3 URLs and four hand-selected LOW/MEDIUM/HIGH levels.
 * Outputs: one playback timeline and GainNode-controlled audio to the speakers.
 * Processing: decodes each stem once, then schedules all BufferSourceNodes on
 * the same AudioContext clock. Piano and Other always use `backgroundGain`.
 */
export class AudioEngine {
  private context: AudioContext | null = null
  private buffers = new Map<TrackId, AudioBuffer>()
  private gains = new Map<TrackId, GainNode>()
  private sources: AudioBufferSourceNode[] = []
  private startedAt = 0
  private offset = 0
  private playing = false
  private loading: Promise<void> | null = null

  /**
   * Input: none. Output: resolves after all six AudioBuffers are decoded.
   * Processing: fetches stems in parallel and builds one gain node per track.
   */
  async load() {
    if (this.buffers.size === 6) return
    if (this.loading) return this.loading

    this.context ??= new AudioContext()
    this.loading = (async () => {
      const entries = await Promise.all(
        Object.entries(trackFiles).map(async ([id, url]) => {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`Could not load ${id} audio (${response.status})`)
          const data = await response.arrayBuffer()
          const buffer = await this.context!.decodeAudioData(data)
          return [id as TrackId, buffer] as const
        }),
      )
      entries.forEach(([id, buffer]) => this.buffers.set(id, buffer))
      this.createGainNodes()
    })().catch((error) => {
      this.loading = null
      throw error
    })
    return this.loading
  }

  /** Input: none. Output: begins every stem together from song time zero. */
  async start() {
    await this.load()
    await this.context!.resume()
    this.stopSources()
    this.offset = 0
    this.startAtOffset(0)
  }

  /** Input: none. Output: resumes all stems from the paused offset. */
  async resume() {
    await this.load()
    await this.context!.resume()
    if (this.playing) return
    this.startAtOffset(this.offset)
  }

  /** Input: none. Processing: stores the shared clock offset and stops active sources. */
  pause() {
    if (!this.playing || !this.context) return
    this.offset = this.getCurrentTime()
    this.stopSources()
  }

  /** Input: none. Output: stops playback and resets the next start to zero. */
  stop() {
    this.offset = 0
    this.stopSources()
  }

  /**
   * Input: an interactive track and one of three hand volume levels.
   * Output: a smoothed GainNode update; background stems are excluded by type.
   * Processing: maps levels to linear gain and ramps without abrupt clicks.
   */
  setInteractiveGain(track: Exclude<TrackId, "piano" | "other">, level: "LOW" | "MEDIUM" | "HIGH") {
    const value = { LOW: 0.18, MEDIUM: 0.5, HIGH: 0.88 }[level]
    const gain = this.gains.get(track)
    if (!gain || !this.context) return
    gain.gain.setTargetAtTime(value, this.context.currentTime, 0.08)
  }

  /** Input: none. Output: current shared song position in seconds. */
  getCurrentTime() {
    if (!this.context || !this.playing) return this.offset
    return Math.min(this.duration, this.offset + this.context.currentTime - this.startedAt)
  }

  /** Output: decoded vocals duration in seconds, or zero before loading. */
  get duration() {
    return this.buffers.get("vocals")?.duration ?? 0
  }

  /** Output: whether the shared timeline is currently advancing. */
  get isPlaying() {
    return this.playing
  }

  /** Input: decoded buffers. Output: one connected GainNode for each stem. */
  private createGainNodes() {
    if (!this.context) return
    ;(Object.keys(trackFiles) as TrackId[]).forEach((id) => {
      if (this.gains.has(id)) return
      const gain = this.context!.createGain()
      gain.gain.value = id === "piano" || id === "other" ? backgroundGain : 0.5
      gain.connect(this.context!.destination)
      this.gains.set(id, gain)
    })
  }

  /** Input: playback offset in seconds. Processing: schedules every source at one future AudioContext time. */
  private startAtOffset(offset: number) {
    if (!this.context) return
    const startTime = this.context.currentTime + 0.12
    this.sources = (Object.keys(trackFiles) as TrackId[]).map((id) => {
      const source = this.context!.createBufferSource()
      source.buffer = this.buffers.get(id)!
      source.connect(this.gains.get(id)!)
      source.start(startTime, Math.min(offset, Math.max(0, source.buffer.duration - 0.01)))
      return source
    })
    this.startedAt = startTime
    this.offset = offset
    this.playing = true
    this.sources[0]?.addEventListener("ended", () => {
      if (this.getCurrentTime() >= this.duration - 0.05) {
        this.playing = false
        this.offset = this.duration
      }
    })
  }

  /** Input: none. Processing: safely stops and disconnects the active buffer sources. */
  private stopSources() {
    this.sources.forEach((source) => {
      try { source.stop() } catch { /* already stopped */ }
      source.disconnect()
    })
    this.sources = []
    this.playing = false
  }
}
