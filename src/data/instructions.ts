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
 * Processing: curated around two-second RMS activity checks plus the user's
 * requested anchors (vocals near 5/10s, strings near 20s, drums near 2:13/4:13).
 * Unlisted sections remain RED; Piano stays a fixed background stem.
 */
export const INSTRUCTION_TIMELINE: InstructionCue[] = [
  // Opening: vocals lead alone, changing level before the arrangement expands.
  { id: "vocal-opening-low", start: 0, duration: 4, section: "VOCALS", level: "ORANGE" },
  { id: "vocal-opening-rise", start: 4, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "vocal-opening-turn", start: 9, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "vocal-opening-return", start: 14, duration: 4, section: "VOCALS", level: "GREEN" },
  { id: "strings-first-entry", start: 18, duration: 5, section: "STRINGS", level: "GREEN" },
  { id: "bass-first-entry", start: 20, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "vocal-phrase-1", start: 28, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "bass-phrase-1", start: 34, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "bass-phrase-2", start: 40, duration: 4, section: "BASS", level: "GREEN" },

  // First drum entrance and the growing rhythm section.
  { id: "drum-entrance", start: 52, duration: 4, section: "DRUMS", level: "GREEN" },
  { id: "bass-under-drum-1", start: 54, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "drum-response-1", start: 58, duration: 4, section: "DRUMS", level: "YELLOW" },
  { id: "drum-break-1", start: 64, duration: 4, section: "DRUMS", level: "ORANGE" },
  { id: "drum-groove-1", start: 70, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "bass-under-drum-2", start: 72, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "drum-groove-2", start: 76, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "vocal-over-groove-1", start: 80, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "strings-return-1", start: 84, duration: 5, section: "STRINGS", level: "ORANGE" },
  { id: "drum-groove-3", start: 88, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "bass-under-drum-3", start: 90, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "drum-groove-4", start: 96, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "vocal-over-groove-2", start: 98, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "drum-groove-5", start: 104, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "strings-return-2", start: 106, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "bass-phrase-3", start: 110, duration: 5, section: "BASS", level: "YELLOW" },
  { id: "strings-return-3", start: 112, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "drum-groove-6", start: 118, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "strings-return-4", start: 118, duration: 4, section: "STRINGS", level: "ORANGE" },

  // Around 2:13 the drum stem rises; vocals and bass answer in short phrases.
  { id: "drum-build-1", start: 126, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "vocal-build-1", start: 128, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "drum-anchor-213", start: 133, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "vocal-anchor-213", start: 133, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "vocal-build-2", start: 138, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "drum-response-2", start: 138, duration: 4, section: "DRUMS", level: "YELLOW" },
  { id: "drum-build-2", start: 142, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "bass-build-1", start: 144, duration: 4, section: "BASS", level: "GREEN" },
  { id: "bass-phrase-4", start: 150, duration: 5, section: "BASS", level: "YELLOW" },
  { id: "drum-response-3", start: 150, duration: 4, section: "DRUMS", level: "ORANGE" },
  { id: "drum-groove-7", start: 156, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "bass-under-drum-4", start: 156, duration: 4, section: "BASS", level: "YELLOW" },
  { id: "vocal-phrase-2", start: 162, duration: 5, section: "VOCALS", level: "YELLOW" },
  { id: "strings-phrase-1", start: 164, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "drum-groove-8", start: 168, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "strings-phrase-2", start: 168, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "vocal-phrase-3", start: 174, duration: 5, section: "VOCALS", level: "GREEN" },

  // Late-song exchanges keep cues long enough for deliberate hand movement.
  { id: "drum-groove-9", start: 182, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "bass-phrase-5", start: 184, duration: 5, section: "BASS", level: "GREEN" },
  { id: "strings-phrase-3", start: 188, duration: 5, section: "STRINGS", level: "YELLOW" },
  { id: "vocal-phrase-4", start: 194, duration: 5, section: "VOCALS", level: "YELLOW" },
  { id: "strings-phrase-4", start: 196, duration: 5, section: "STRINGS", level: "ORANGE" },
  { id: "drum-groove-10", start: 200, duration: 5, section: "DRUMS", level: "GREEN" },
  { id: "bass-phrase-6", start: 202, duration: 5, section: "BASS", level: "YELLOW" },
  { id: "strings-phrase-5", start: 206, duration: 5, section: "STRINGS", level: "GREEN" },
  { id: "drum-groove-11", start: 210, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "vocal-phrase-5", start: 212, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "strings-phrase-6", start: 218, duration: 5, section: "STRINGS", level: "YELLOW" },
  { id: "drum-response-4", start: 218, duration: 4, section: "DRUMS", level: "ORANGE" },
  { id: "drum-groove-12", start: 226, duration: 5, section: "DRUMS", level: "YELLOW" },
  { id: "strings-phrase-7", start: 226, duration: 4, section: "STRINGS", level: "ORANGE" },
  { id: "vocal-phrase-6", start: 234, duration: 5, section: "VOCALS", level: "GREEN" },
  { id: "strings-phrase-8", start: 234, duration: 4, section: "STRINGS", level: "YELLOW" },
  { id: "strings-final-rise", start: 240, duration: 5, section: "STRINGS", level: "GREEN" },
  { id: "vocal-final-rise", start: 242, duration: 4, section: "VOCALS", level: "YELLOW" },
  { id: "vocal-final-phrase", start: 246, duration: 5, section: "VOCALS", level: "ORANGE" },
  { id: "vocal-ending", start: 252, duration: 4, section: "VOCALS", level: "GREEN" },
  { id: "drum-anchor-413", start: 252, duration: 4, section: "DRUMS", level: "GREEN" },
]
