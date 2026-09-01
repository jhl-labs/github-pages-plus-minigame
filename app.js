import { canSubmit, dailyChallenge, formatDuration, selectedTotal, toggleSelection } from './game-core.js'

const PLATFORM_HOST = 'minigame-dev.euno.work'
const PLATFORM_SITE = 'minigame-dev'
const isPlatform = location.hostname === PLATFORM_HOST || location.hostname === 'localhost'
const $ = (selector) => document.querySelector(selector)

const state = {
  challenge: null,
  runId: null,
  selected: new Set(),
  startedAt: 0,
  timerId: null,
  compatibilityMode: false,
}

function setStatus(message, healthy = true) {
  $('#service-status').textContent = message
  document.querySelector('.status-dot').classList.toggle('error', !healthy)
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function functionApi(name, path, init) {
  const response = await fetch(`/_fn/${name}/${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { accept: 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, body.error?.code ?? body.error, body.error?.message ?? body.error ?? `HTTP ${response.status}`)
  return body
}

const api = (path, init) => functionApi('signal-game', path, init)
const utcDay = () => new Date().toISOString().slice(0, 10)
const compatibilityPath = () => `/signal-sum/${utcDay()}`

function renderCells() {
  const container = $('#cells')
  container.replaceChildren(...state.challenge.cells.map((value, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'cell'
    button.dataset.index = String(index)
    button.setAttribute('aria-pressed', String(state.selected.has(index)))
    button.innerHTML = `<span>NODE ${String(index + 1).padStart(2, '0')}</span><strong>${value}</strong>`
    button.addEventListener('click', () => {
      state.selected = toggleSelection(state.selected, index)
      renderCells()
    })
    return button
  }))
  const total = selectedTotal(state.challenge.cells, state.selected)
  $('#sum').textContent = String(total)
  $('#selection-count').textContent = `${state.selected.size} / 4 CELLS`
  $('#submit').disabled = !canSubmit(state.challenge.cells, state.selected, state.challenge.target)
}

function renderScores(scores = []) {
  const list = $('#scores')
  if (!scores.length) {
    const empty = document.createElement('li')
    empty.className = 'empty'
    empty.textContent = '첫 기록을 기다리는 중…'
    list.replaceChildren(empty)
    return
  }
  list.replaceChildren(...scores.map((score) => {
    const item = document.createElement('li')
    const rank = document.createElement('span')
    const player = document.createElement('strong')
    const time = document.createElement('time')
    rank.textContent = String(score.rank).padStart(2, '0')
    player.textContent = score.player
    time.textContent = formatDuration(score.elapsedMs)
    item.append(rank, player, time)
    return item
  }))
}

function renderCompatibilityScore(count) {
  const list = $('#scores')
  const item = document.createElement('li')
  const rank = document.createElement('span')
  const player = document.createElement('strong')
  const total = document.createElement('time')
  rank.textContent = 'Σ'
  player.textContent = '오늘 완료된 회로'
  total.textContent = `${count} RUNS`
  item.append(rank, player, total)
  list.replaceChildren(item)
  $('#leaderboard-title').textContent = '실시간 완료 데이터'
}

async function refreshCompatibilityScore() {
  const query = new URLSearchParams({ path: compatibilityPath() })
  const data = await functionApi('reactions', `?${query}`)
  renderCompatibilityScore(data.counts?.like ?? 0)
  setStatus('호환 함수 · 데이터 연결됨')
}

async function refreshScores() {
  if (!isPlatform) return
  try {
    const data = await api('leaderboard')
    renderScores(data.leaderboard)
    setStatus('함수 · 데이터 연결됨')
  } catch (error) {
    if (error instanceof ApiError && error.code === 'function_not_found') {
      state.compatibilityMode = true
      try {
        await refreshCompatibilityScore()
        return
      } catch (fallbackError) {
        error = fallbackError
      }
    }
    setStatus('연결 오류', false)
    $('#result').hidden = false
    $('#result').textContent = `리더보드를 불러오지 못했습니다: ${error.message}`
  }
}

async function startGame() {
  const player = $('#player')
  if (!player.reportValidity()) return
  $('#start').disabled = true
  $('#result').hidden = true
  try {
    if (state.compatibilityMode) {
      state.challenge = dailyChallenge(PLATFORM_SITE, utcDay())
      state.runId = null
    } else {
      const data = await api('challenge')
      state.challenge = data.challenge
      state.runId = data.runId
    }
    state.selected = new Set()
    state.startedAt = performance.now()
    localStorage.setItem('signal-sum-player', player.value.trim())
    $('#target').textContent = String(state.challenge.target)
    $('#start-view').hidden = true
    $('#play-view').hidden = false
    renderCells()
    clearInterval(state.timerId)
    state.timerId = setInterval(() => {
      $('#timer').textContent = formatDuration(performance.now() - state.startedAt)
    }, 31)
  } catch (error) {
    setStatus('시작 실패', false)
    $('#result').hidden = false
    $('#result').textContent = `회로를 시작하지 못했습니다: ${error.message}`
    $('#start').disabled = false
  }
}

async function submitGame() {
  $('#submit').disabled = true
  try {
    if (state.compatibilityMode) {
      const query = new URLSearchParams({ path: compatibilityPath(), kind: 'like' })
      const data = await functionApi('reactions', `?${query}`, {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
      })
      const elapsedMs = performance.now() - state.startedAt
      clearInterval(state.timerId)
      $('#timer').textContent = formatDuration(elapsedMs)
      $('#result').hidden = false
      $('#result').innerHTML = `<strong>신호 동기화 완료</strong><span>기록 ${formatDuration(elapsedMs)} · 전 세계 ${data.counts?.like ?? 0}회 완료</span>`
      $('#play-view').hidden = true
      $('#start-view').hidden = false
      $('#start').textContent = '다시 도전'
      $('#start').disabled = false
      renderCompatibilityScore(data.counts?.like ?? 0)
      return
    }
    const data = await api('submit', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        challengeId: state.challenge.id,
        runId: state.runId,
        player: $('#player').value.trim(),
        selected: [...state.selected],
      }),
    })
    clearInterval(state.timerId)
    $('#timer').textContent = formatDuration(data.elapsedMs)
    $('#result').hidden = false
    $('#result').innerHTML = `<strong>신호 동기화 완료</strong><span>서버 기록 ${formatDuration(data.elapsedMs)} · ${data.moves}개 셀</span>`
    $('#play-view').hidden = true
    $('#start-view').hidden = false
    $('#start').textContent = '다시 도전'
    $('#start').disabled = false
    renderScores(data.leaderboard)
  } catch (error) {
    $('#result').hidden = false
    $('#result').textContent = `전송 실패: ${error.message}`
    $('#submit').disabled = false
  }
}

function boot() {
  $('#player').value = localStorage.getItem('signal-sum-player') ?? 'Pilot'
  $('#start').addEventListener('click', startGame)
  $('#submit').addEventListener('click', submitGame)
  $('#refresh').addEventListener('click', refreshScores)
  if (!isPlatform) {
    $('#origin-notice').hidden = false
    $('#start').disabled = true
    setStatus('원본 미리보기', false)
    return
  }
  refreshScores()
}

boot()
