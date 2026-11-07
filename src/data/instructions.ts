/** Four target levels; RED is the default for every unprompted section. */
export type Volume = "RED" | "ORANGE" | "YELLOW" | "GREEN"
export type Section = "VOCALS" | "DRUMS" | "BASS" | "STRINGS"

/** One timed prompt attached to the matching orchestra podium. */
export type InstructionCue = {
  id: string
  start: number
  duration: number
  section: Section
  level: Volume
}

/**
 * Editable cues for Veil of Tempestuous Harmonies.
 * Input: song time in seconds and the observed stem activity.
 * Output: at most two simultaneous podium targets, each lasting 2–5 seconds.
 * Processing: prioritizes Vocals and Strings equally, then Drums, then Bass;
 * approximate cue counts are 28 / 27 / 17 / 7. Timing follows the supplied
 * stems and preserves the requested anchors near 5/10s, 20s, 2:13, and 4:13.
 * Unlisted sections remain at their audio-engine baseline; Piano stays fixed.
 */
export const INSTRUCTION_TIMELINE: InstructionCue[] = [
  // Opening: vocals lead, with sparse string responses added where the stem enters.
  { id: "vocal-opening-low", start: 0, duration: 4, section: "VOCALS", level: "ORANGE" },
  { id: "vocal-opening-rise", start: 4, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "strings-opening-response", start: 4, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "vocal-opening-turn", start: 9, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "strings-early-phrase", start: 12, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "vocal-opening-return", start: 14, duration: 4, section: "VOCALS", level: "GREEN" },
  { id: "strings-first-entry", start: 18, duration: 5, section: "STRINGS", level: "GREEN" },
  { id: "vocal-first-return", start: 20, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "strings-first-tail", start: 24, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "vocal-phrase-1", start: 28, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "vocal-early-34", start: 34, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "vocal-early-40", start: 40, duration: 4, section: "VOCALS", level: "GREEN" },
  { id: "vocal-early-46", start: 46, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "strings-rhythm-entry", start: 50, duration: 4, section: "STRINGS", level: "ORANGE" },

  // First drum entrance and the growing rhythm section.
  { id: "drum-entrance", start: 52, duration: 4, section: "DRUMS", level: "GREEN" },
  { id: "bass-under-drum-1", start: 54, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "vocal-early-56", start: 56, duration: 4, section: "VOCALS", level: "GREEN" },
  { id: "vocal-early-60", start: 60, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "vocal-early-64", start: 64, duration: 4, section: "VOCALS", level: "ORANGE" },
  { id: "vocal-early-68", start: 68, duration: 4, section: "VOCALS", level: "GREEN" },
  { id: "drum-groove-1", start: 70, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "bass-under-drum-2", start: 72, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "drum-groove-2", start: 76, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "vocal-early-76", start: 76, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "vocal-over-groove-1", start: 80, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "strings-return-1", start: 84, duration: 5, section: "STRINGS", level: "ORANGE" },
  { id: "drum-groove-3", start: 88, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "bass-under-drum-3", start: 90, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "strings-middle-phrase", start: 94, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "vocal-over-groove-2", start: 98, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "drum-groove-5", start: 104, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "strings-return-early", start: 102, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "strings-return-2", start: 106, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "bass-phrase-3", start: 110, duration: 5, section: "BASS", level: "YELLOW" },
  { id: "strings-return-3", start: 112, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "strings-return-4", start: 118, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "vocal-middle-return", start: 122, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "strings-middle-return", start: 122, duration: 4, section: "STRINGS", level: "GREEN" },

  // Around 2:13 the drum stem rises; vocals and bass answer in short phrases.
  { id: "drum-build-1", start: 126, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "vocal-build-1", start: 128, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "drum-anchor-213", start: 133, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "vocal-anchor-213", start: 133, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "vocal-build-2", start: 138, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "drum-response-2", start: 138, duration: 4, section: "DRUMS", level: "YELLOW" },
  { id: "drum-build-2", start: 142, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "strings-bass-run-emphasis", start: 148, duration: 4, section: "STRINGS", level: "GREEN" },
  { id: "drum-response-3", start: 150, duration: 4, section: "DRUMS", level: "ORANGE" },
  { id: "drum-groove-7", start: 156, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "bass-under-drum-4", start: 156, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "strings-phrase-0", start: 160, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "vocal-phrase-2", start: 162, duration: 5, section: "VOCALS", level: "YELLOW" },
  { id: "strings-phrase-1", start: 164, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "drum-groove-8", start: 168, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "strings-phrase-2", start: 168, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "strings-phrase-2b", start: 172, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "vocal-phrase-3", start: 174, duration: 5, section: "VOCALS", level: "GREEN" },

  // Late-song exchanges keep cues long enough for deliberate hand movement.
  { id: "drum-groove-9", start: 182, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "bass-phrase-5", start: 184, duration: 5, section: "BASS", level: "GREEN" },
  { id: "strings-phrase-3", start: 188, duration: 5, section: "STRINGS", level: "YELLOW" },
  { id: "vocal-phrase-4", start: 194, duration: 5, section: "VOCALS", level: "YELLOW" },
  { id: "strings-phrase-3b", start: 193, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "strings-phrase-4", start: 197, duration: 5, section: "STRINGS", level: "ORANGE" },
  { id: "drum-groove-10", start: 200, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "bass-phrase-6", start: 202, duration: 5, section: "BASS", level: "YELLOW" },
  { id: "strings-phrase-5", start: 206, duration: 5, section: "STRINGS", level: "GREEN" },
  { id: "drum-groove-11", start: 210, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "vocal-phrase-5", start: 212, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "strings-phrase-6a", start: 215, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "strings-phrase-6", start: 219, duration: 5, section: "STRINGS", level: "YELLOW" },
  { id: "drum-groove-12", start: 226, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "strings-phrase-7", start: 226, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "vocal-phrase-6", start: 234, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "strings-phrase-8", start: 234, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "strings-final-rise", start: 240, duration: 5, section: "STRINGS", level: "GREEN" },
  { id: "vocal-final-rise", start: 242, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "vocal-final-phrase", start: 246, duration: 5, section: "VOCALS", level: "ORANGE" },
  { id: "strings-ending-color", start: 246, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "vocal-ending", start: 252, duration: 4, section: "VOCALS", level: "GREEN" },
  { id: "drum-anchor-413", start: 252, duration: 4, section: "DRUMS", level: "GREEN" },
]
