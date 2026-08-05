let audioContext

const context = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  audioContext ||= new AudioContext()
  return audioContext
}

const bell = (audio, destination, start, frequency, duration, volume) => {
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(frequency, start)
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.015, start + duration)
  gain.gain.setValueAtTime(.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + .008)
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
  oscillator.connect(gain).connect(destination)
  oscillator.start(start)
  oscillator.stop(start + duration + .02)
}

const coinClink = (audio, destination, start, frequency, volume) => {
  const oscillator = audio.createOscillator()
  const overtone = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = 'square'
  overtone.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, start)
  overtone.frequency.setValueAtTime(frequency * 2.73, start)
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(.0001, start + .065)
  oscillator.connect(gain)
  overtone.connect(gain)
  gain.connect(destination)
  oscillator.start(start)
  overtone.start(start)
  oscillator.stop(start + .07)
  overtone.stop(start + .07)
}

export function playWinnerChime(enabled = true) {
  if (!enabled) return
  const audio = context()
  if (!audio) return
  audio.resume().catch(() => {})

  const master = audio.createGain()
  const compressor = audio.createDynamicsCompressor()
  master.gain.value = .34
  compressor.threshold.value = -18
  compressor.knee.value = 12
  compressor.ratio.value = 5
  compressor.attack.value = .003
  compressor.release.value = .16
  master.connect(compressor).connect(audio.destination)

  const now = audio.currentTime + .012
  coinClink(audio, master, now, 1380, .13)
  coinClink(audio, master, now + .085, 1840, .11)
  bell(audio, master, now + .055, 880, .32, .13)
  bell(audio, master, now + .13, 1320, .42, .14)
  bell(audio, master, now + .21, 1760, .58, .12)

  window.setTimeout(() => {
    master.disconnect()
    compressor.disconnect()
  }, 950)
}
