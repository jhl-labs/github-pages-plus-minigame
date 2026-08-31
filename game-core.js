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
