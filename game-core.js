export function toggleSelection(selected, index, max = 4) {
  const next = new Set(selected)
  if (next.has(index)) next.delete(index)
  else if (next.size < max) next.add(index)
  return next
}

export function selectedTotal(cells, selected) {
  return [...selected].reduce((sum, index) => sum + (cells[index] ?? 0), 0)
}

export function canSubmit(cells, selected, target) {
  return selected.size >= 2 && selected.size <= 4 && selectedTotal(cells, selected) === target
}

export function formatDuration(milliseconds) {
  const safe = Math.max(0, Math.floor(milliseconds))
  const minutes = Math.floor(safe / 60_000)
  const seconds = Math.floor((safe % 60_000) / 1_000)
  const millis = safe % 1_000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

function seededRandom(seedText) {
  let seed = 2166136261
  for (const char of seedText) {
    seed ^= char.codePointAt(0) ?? 0
    seed = Math.imul(seed, 16777619)
  }
  return () => {
    seed += 0x6d2b79f5
    let value = seed
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function dailyChallenge(site, day) {
  const random = seededRandom(`${site}\0${day}\0signal-game-v1`)
  const cells = Array.from({ length: 7 }, () => 2 + Math.floor(random() * 18))
  const answer = new Set()
  while (answer.size < 3) answer.add(Math.floor(random() * cells.length))
  return {
    id: day,
    cells,
    target: [...answer].reduce((sum, index) => sum + cells[index], 0),
  }
}
