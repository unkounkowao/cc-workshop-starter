'use client'
import { useState, useEffect, useRef } from 'react'
import { saveToGist, loadFromGist, saveScheduleToGist, loadScheduleFromGist, saveMemoToGist, loadMemoFromGist } from '@/lib/gist'
import { validateImportData } from '@/lib/validation'
import { loadData, saveData } from '@/lib/storage'
import { loadScheduleData, saveScheduleData } from '@/lib/scheduleStorage'
import { loadMemoData, saveMemoData, MEMO_DELETED_IDS_KEY, MEMO_VERSION } from '@/lib/memoStorage'
import { DATA_VERSION, DELETED_IDS_KEY, SCHEDULE_DATA_VERSION, SCHEDULE_DELETED_IDS_KEY } from '@/lib/constants'

const TOKEN_KEY = 'novel-cs-gist-token'
const GIST_ID_KEY = 'novel-cs-gist-id'

// スケジュールデータのマージ
function mergeSchedule(
  local: ReturnType<typeof loadScheduleData>,
  remote: ReturnType<typeof loadScheduleData>
) {
  const deletedRaw = localStorage.getItem(SCHEDULE_DELETED_IDS_KEY)
  const deletedList: { id: string; deletedAt: string }[] = deletedRaw ? JSON.parse(deletedRaw) : []
  const deletedMap = new Map(deletedList.map((d) => [d.id, d.deletedAt]))

  const localYearMap = new Map(local.years.map((y) => [y.id, y]))
  const remoteYearMap = new Map(remote.years.map((y) => [y.id, y]))
  const allYearIds = new Set([...localYearMap.keys(), ...remoteYearMap.keys()])
  const years = Array.from(allYearIds).flatMap((id) => {
    const deletedAt = deletedMap.get(id)
    const l = localYearMap.get(id)
    const r = remoteYearMap.get(id)
    if (deletedAt && r && deletedAt >= r.updatedAt) return []
    if (l && r) return [l.updatedAt >= r.updatedAt ? l : r]
    return [(l ?? r)!]
  }).sort((a, b) => a.sortOrder - b.sortOrder)

  const localEntryMap = new Map(local.entries.map((e) => [e.id, e]))
  const remoteEntryMap = new Map(remote.entries.map((e) => [e.id, e]))
  const allEntryIds = new Set([...localEntryMap.keys(), ...remoteEntryMap.keys()])
  const entries = Array.from(allEntryIds).flatMap((id) => {
    const deletedAt = deletedMap.get(id)
    const l = localEntryMap.get(id)
    const r = remoteEntryMap.get(id)
    if (deletedAt && r && deletedAt >= r.updatedAt) return []
    if (l && r) return [l.updatedAt >= r.updatedAt ? l : r]
    return [(l ?? r)!]
  })
  return { version: SCHEDULE_DATA_VERSION, years, entries }
}

// メモデータのマージ
function mergeMemo(
  local: ReturnType<typeof loadMemoData>,
  remote: ReturnType<typeof loadMemoData>
) {
  const deletedRaw = localStorage.getItem(MEMO_DELETED_IDS_KEY)
  const deletedList: { id: string; deletedAt: string }[] = deletedRaw ? JSON.parse(deletedRaw) : []
  const deletedMap = new Map(deletedList.map((d) => [d.id, d.deletedAt]))

  const localMap = new Map(local.memos.map((m) => [m.id, m]))
  const remoteMap = new Map(remote.memos.map((m) => [m.id, m]))
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()])
  const memos = Array.from(allIds).flatMap((id) => {
    const deletedAt = deletedMap.get(id)
    const l = localMap.get(id)
    const r = remoteMap.get(id)
    if (deletedAt && r && deletedAt >= r.updatedAt) return []
    if (l && r) return [l.updatedAt >= r.updatedAt ? l : r]
    return [(l ?? r)!]
  })
  return { version: MEMO_VERSION, memos }
}

export default function GistSync() {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

  const getCredentials = () => ({
    savedToken: localStorage.getItem(TOKEN_KEY) ?? '',
    savedGistId: localStorage.getItem(GIST_ID_KEY) ?? '',
  })

  const showStatus = (msg: string, ok: boolean) => {
    setStatus({ msg, ok })
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setStatus(null), 3000)
  }

  // 保存（直列実行・排他制御で競合防止）
  const autoSave = async () => {
    if (savingRef.current) return
    const { savedToken, savedGistId } = getCredentials()
    if (!savedToken || !savedGistId) return
    savingRef.current = true
    try {
      await saveToGist(savedToken, savedGistId, loadData())
      await saveScheduleToGist(savedToken, savedGistId, loadScheduleData())
      await saveMemoToGist(savedToken, savedGistId, loadMemoData())
    } catch { /* ignore */ } finally {
      savingRef.current = false
    }
  }

  // 読み込み（Gistを1回だけフェッチして全データを処理）
  const autoLoad = () => {
    const { savedToken, savedGistId } = getCredentials()
    if (!savedToken || !savedGistId) return

    fetch(`https://api.github.com/gists/${savedGistId}`, {
      headers: {
        Authorization: `Bearer ${savedToken}`,
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) return
        const gist = await res.json()

        const getContent = async (filename: string): Promise<string | null> => {
          const file = gist.files[filename]
          if (!file) return null
          return file.truncated
            ? await fetch(file.raw_url).then((r) => r.text())
            : file.content
        }

        let changed = false

        // キャラクターデータ
        try {
          const raw = await getContent('character-sheet-data.json')
          if (raw) {
            const parsed: unknown = JSON.parse(raw)
            if (validateImportData(parsed)) {
              const localData = loadData()
              const deletedRaw = localStorage.getItem(DELETED_IDS_KEY)
              const deletedList: { id: string; deletedAt: string }[] = deletedRaw ? JSON.parse(deletedRaw) : []
              const deletedMap = new Map(deletedList.map((d) => [d.id, d.deletedAt]))
              const localMap = new Map(localData.characters.map((c) => [c.id, c]))
              const gistMap = new Map(parsed.characters.map((c) => [c.id, c]))
              const allIds = new Set([...localMap.keys(), ...gistMap.keys()])
              const merged = Array.from(allIds).flatMap((id) => {
                const deletedAt = deletedMap.get(id)
                const local = localMap.get(id)
                const remote = gistMap.get(id)
                if (deletedAt && remote && deletedAt >= remote.updatedAt) return []
                if (local && remote) return [local.updatedAt >= remote.updatedAt ? local : remote]
                if (local) return [local]
                return [remote!]
              })
              const hasChange =
                merged.some((c) => { const l = localMap.get(c.id); return !l || l.updatedAt !== c.updatedAt }) ||
                merged.length !== localData.characters.length
              if (hasChange) {
                saveData({ version: DATA_VERSION, characters: merged }, false)
                changed = true
              }
            }
          }
        } catch { /* ignore */ }

        // スケジュールデータ
        try {
          const raw = await getContent('schedule-data.json')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && Array.isArray(parsed.years) && Array.isArray(parsed.entries)) {
              const local = loadScheduleData()
              const merged = mergeSchedule(local, parsed)
              const hasChange =
                merged.years.length !== local.years.length ||
                merged.entries.length !== local.entries.length ||
                merged.years.some((y) => { const l = local.years.find((x) => x.id === y.id); return !l || l.updatedAt !== y.updatedAt }) ||
                merged.entries.some((e) => { const l = local.entries.find((x) => x.id === e.id); return !l || l.updatedAt !== e.updatedAt })
              if (hasChange) {
                saveScheduleData(merged)
                changed = true
              }
            }
          }
        } catch { /* ignore */ }

        // メモデータ
        try {
          const raw = await getContent('memo-data.json')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && Array.isArray(parsed.memos)) {
              const local = loadMemoData()
              const merged = mergeMemo(local, parsed)
              const hasChange =
                merged.memos.length !== local.memos.length ||
                merged.memos.some((m) => { const l = local.memos.find((x) => x.id === m.id); return !l || l.updatedAt !== m.updatedAt })
              if (hasChange) {
                saveMemoData(merged)
                changed = true
              }
            }
          }
        } catch { /* ignore */ }

        if (changed) {
          window.dispatchEvent(new CustomEvent('gist-synced'))
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    autoLoad()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        autoLoad()
      } else {
        autoSave()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    const poll = setInterval(autoLoad, 30000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(poll)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY) ?? '')
    setGistId(localStorage.getItem(GIST_ID_KEY) ?? '')
  }, [open])

  const handleSave = async () => {
    if (!token.trim()) { showStatus('Personal Access Tokenを入力してください', false); return }
    if (savingRef.current) { showStatus('同期中です。しばらく待ってから再試行してください', false); return }
    savingRef.current = true
    setLoading(true)
    try {
      const newId = await saveToGist(token.trim(), gistId.trim() || null, loadData())
      await saveScheduleToGist(token.trim(), newId, loadScheduleData())
      await saveMemoToGist(token.trim(), newId, loadMemoData())
      setGistId(newId)
      localStorage.setItem(TOKEN_KEY, token.trim())
      localStorage.setItem(GIST_ID_KEY, newId)
      showStatus('Gistに保存しました', true)
      setOpen(false)
    } catch (e) {
      showStatus(e instanceof Error ? e.message : 'Gist保存に失敗しました', false)
    } finally {
      savingRef.current = false
      setLoading(false)
    }
  }

  const handleLoad = async () => {
    if (!token.trim()) { showStatus('Personal Access Tokenを入力してください', false); return }
    if (!gistId.trim()) { showStatus('Gist IDを入力してください', false); return }
    if (!window.confirm('Gistのデータと現在のデータをマージします。よいですか？')) return
    setLoading(true)
    try {
      localStorage.setItem(TOKEN_KEY, token.trim())
      localStorage.setItem(GIST_ID_KEY, gistId.trim())
      const gistData = await loadFromGist(token.trim(), gistId.trim())
      saveData({ ...gistData, version: DATA_VERSION }, false)
      const remoteSchedule = await loadScheduleFromGist(token.trim(), gistId.trim())
      if (remoteSchedule) saveScheduleData(mergeSchedule(loadScheduleData(), remoteSchedule))
      const remoteMemo = await loadMemoFromGist(token.trim(), gistId.trim())
      if (remoteMemo) saveMemoData(mergeMemo(loadMemoData(), remoteMemo))
      window.dispatchEvent(new CustomEvent('gist-synced'))
      showStatus('Gistから読み込みました', true)
      setOpen(false)
    } catch (e) {
      showStatus(e instanceof Error ? e.message : 'Gist読み込みに失敗しました', false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-all"
        title="クロスデバイス同期（GitHub Gist）"
      >
        ☁
      </button>

      {status && (
        <span className={`text-xs px-2 ${status.ok ? 'text-green-600' : 'text-red-500'}`}>
          {status.ok ? '✓' : '✗'} {status.msg}
        </span>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mt-8 mb-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-dialog-title"
          >
            <div className="p-6">
              <h2 id="sync-dialog-title" className="text-lg font-semibold text-slate-900 mb-1">
                クロスデバイス同期
              </h2>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                GitHub Gist を使ってデバイス間でデータを共有します。キャラクター・カレンダー・メモをまとめて同期します。
                設定済みの場合はページを開くと自動読み込み、タブを閉じると自動保存します。
              </p>

              <div className="mb-4">
                <label htmlFor="gist-token" className="block text-sm font-medium text-slate-700 mb-1">
                  GitHub Personal Access Token<span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="gist-token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono"
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-slate-400">
                  GitHub Settings → Developer settings → Personal access tokens → Gistスコープを付与
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="gist-id" className="block text-sm font-medium text-slate-700 mb-1">
                  Gist ID<span className="ml-2 text-xs text-slate-400 font-normal">（初回保存後に自動入力）</span>
                </label>
                <input
                  id="gist-id"
                  type="text"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  placeholder="例：a1b2c3d4e5f6..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono"
                />
              </div>

              <div className="mb-5 p-3 bg-sky-50 rounded-lg text-xs text-sky-800 leading-relaxed">
                <p className="font-medium mb-1">初回設定手順</p>
                <p>① PCで「Gistに保存」→ Gist IDをコピー</p>
                <p>② スマホで同じPAT + Gist IDを入力して「Gistから読み込み」</p>
                <p>③ 以降はページを開くと自動同期</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {loading ? '処理中...' : gistId ? 'Gistに保存（上書き）' : 'Gistに保存（新規作成）'}
                </button>
                <button
                  onClick={handleLoad}
                  disabled={loading || !gistId.trim()}
                  className="flex-1 px-4 py-2 text-sm text-sky-600 border border-sky-300 hover:bg-sky-50 disabled:opacity-40 rounded-lg transition-colors"
                >
                  {loading ? '処理中...' : 'Gistから読み込み'}
                </button>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="mt-3 w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
