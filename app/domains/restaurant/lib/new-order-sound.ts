import type { RestaurantNewOrderSound } from "@/app/domains/messaging/hooks/useWhatsAppSettings"

export function playRestaurantNewOrderSound(sound: RestaurantNewOrderSound) {
  if (sound === "off" || typeof window === "undefined") return

  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext
    if (!AudioContextCtor) return

    const audio = new AudioContextCtor()
    const notes =
      sound === "bell"
        ? [
            { frequency: 740, duration: 0.12, delay: 0 },
            { frequency: 988, duration: 0.12, delay: 0.16 },
            { frequency: 1175, duration: 0.18, delay: 0.32 },
          ]
        : [
            { frequency: 880, duration: 0.12, delay: 0 },
            { frequency: 1175, duration: 0.16, delay: 0.18 },
          ]

    for (const note of notes) {
      const primary = audio.createOscillator()
      const overtone = audio.createOscillator()
      const gain = audio.createGain()

      primary.type = sound === "bell" ? "triangle" : "square"
      overtone.type = "sine"

      primary.frequency.value = note.frequency
      overtone.frequency.value = note.frequency * 2

      gain.gain.setValueAtTime(0.0001, audio.currentTime + note.delay)
      gain.gain.exponentialRampToValueAtTime(0.16, audio.currentTime + note.delay + 0.015)
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audio.currentTime + note.delay + note.duration
      )

      primary.connect(gain)
      overtone.connect(gain)
      gain.connect(audio.destination)

      primary.start(audio.currentTime + note.delay)
      overtone.start(audio.currentTime + note.delay)
      primary.stop(audio.currentTime + note.delay + note.duration)
      overtone.stop(audio.currentTime + note.delay + note.duration)
    }
  } catch {
    // Browsers may block audio until a user gesture happens on the page.
  }
}
