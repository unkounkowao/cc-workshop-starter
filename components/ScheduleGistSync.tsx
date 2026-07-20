'use client'
import { useState, useEffect, useRef } from 'react'
import { saveScheduleToGist, loadScheduleFromGist, saveToGist } from '@/lib/gist'
import { loadScheduleData, saveScheduleData } from '@/lib/scheduleStorage'
import { loadData } from '@/lib/storage'
import { SCHEDULE_DATA_VERSION } from '@/lib/constants'
import type { ScheduleData } from '@/lib/types'

const TOKEN_KEY = 'novel-cs-gist-token'
const GIST_ID_KEY = 'novel-cs-gist-id'

type Props = {
  data: ScheduleData
  onSynced: () => void
  onToast: (msg: string, type: 'success' | 'error') => void
}

function mergeScheduleData(local: ScheduleData, remote: ScheduleData): ScheduleData {
  // 年のマージ（新しい updatedAt を採用）
  const localYearMap = new Map(local.years.map((y) => [y.id, y]))
  const remoteYearMap = new Map(remote.years.map((y) => [y.id, y]))
  const allYearIds = new Set([...localYearMap.keys(), ...remoteYearMap.keys()])
  const years = Array.from(allYearIds).map((id) => {
    const l = localYearMap.get(id)
    const r = remoteYearMap.get(id)
    if (l && r) return l.updatedAt >= r.updatedAt ? l : r
    return (l ?? r)!
  }).sort((a, b) => a.sortOrder - b.sortOrder)

  // エントリのマージ
  const localEntryMap = new Map(local.entries.map((e) => [e.id, e]))
  const remoteEntryMap = new Map(remote.entries.map((e) => [e.id, e]))
  const allEntryIds = new Set([...localEntryMap.keys(), ...remoteEntryMap.keys()])
  const entries = Array.from(allEntryIds).map((id) => {
    const l = localEntryMap.get(id)
    const r = remoteEntryMap.get(id)
    if (l && r) return l.updatedAt >= r.updatedAt ? l : r
    return (l ?? r)!
  })

  return { version: SCHEDULE_DATA_VERSION, years, entries }
}

export default function ScheduleGistSync({ data, onSynced, onToast }: Props) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [loading, setLoading] = useState(false)
  const dataRef = useRef(data)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { dataRef.current = data }, [data])

  const getCredentials = () => ({
    savedToken: localStorage.getItem(TOKEN_KEY) ?? '',
    savedGistId: localStorage.getItem(GIST_ID_KEY) ?? '',
  })

  const autoSave = () => {
    const { savedToken, savedGistId } = getCredentials()
    if (!savedToken || !savedGistId) return
    saveScheduleToGist(savedToken, savedGistId, dataRef.current).catch(() => {})
  }

  const autoLoad = () => {
    const { savedToken, savedGistId } = getCredentials()
    if (!savedToken || !savedGistId) return
    loadScheduleFromGist(savedToken, savedGistId)
      .then((remote) => {
        if (!remote) return
        const local = loadScheduleData()
        const merged = mergeScheduleData(local, remote)
        const hasChange =
          merged.years.length !== local.years.length ||
          merged.entries.length !== local.entries.length ||
          merged.years.some((y) => { const l = local.years.find((x) => x.id === y.id); return !l || l.updatedAt !== y.updatedAt }) ||
          merged.entries.some((e) => { const l = local.entries.find((x) => x.id === e.id); return !l || l.updatedAt !== e.updatedAt })
        if (!hasChange) return
        saveScheduleData(merged)
        onSynced()
      })
      .catch(() => {})
  }

  // 起動時・タブアクティブ時に読み込み、非アクティブ時に即時保存
  useEffect(() => {
    autoLoad()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        autoLoad()
      } else {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = null
        autoSave()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    const pollInterval = setInterval(autoLoad, 30000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(pollInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // データ変更後3秒で自動保存
  useEffect(() => {
    const { savedToken, savedGistId } = getCredentials()
    if (!savedToken || !savedGistId) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      autoSave()
    }, 3000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY) ?? '')
    setGistId(localStorage.getItem(GIST_ID_KEY) ?? '')
  }, [open])

  const handleSave = async () => {
    if (!token.trim()) { onToast('Personal Access Tokenを入力してください', 'error'); return }
    setLoading(true)
    try {
      // GistIDがない場合はキャラクターシートと同じGistを新規作成
      let targetGistId = gistId.trim()
      if (!targetGistId) {
        const charData = loadData()
        targetGistId = await saveToGist(token.trim(), null, charData)
        setGistId(targetGistId)
        localStorage.setItem(GIST_ID_KEY, targetGistId)
      }
      localStorage.setItem(TOKEN_KEY, token.trim())
      await saveScheduleToGist(token.trim(), targetGistId, loadScheduleData())
      onToast('Gistにカレンダーを保存しました', 'success')
      setOpen(false)
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Gist保存に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = async () => {
    if (!token.trim()) { onToast('Personal Access Tokenを入力してください', 'error'); return }
    if (!gistId.trim()) { onToast('Gist IDを入力してください', 'error'); return }
    if (!window.confirm('Gistのデータと現在のデータをマージします。よいですか？')) return
    setLoading(true)
    try {
      localStorage.setItem(TOKEN_KEY, token.trim())
      localStorage.setItem(GIST_ID_KEY, gistId.trim())
      const remote = await loadScheduleFromGist(token.trim(), gistId.trim())
      if (!remote) { onToast('Gistにカレンダーデータが見つかりません', 'error'); return }
      const merged = mergeScheduleData(loadScheduleData(), remote)
      saveScheduleData(merged)
      onSynced()
      onToast('Gistからカレンダーを読み込みました', 'success')
      setOpen(false)
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Gist読み込みに失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        title="クロスデバイス同期（GitHub Gist）"
      >
        ☁ 同期
      </button>

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
            aria-labelledby="schedule-sync-title"
          >
            <div className="p-6">
              <h2 id="schedule-sync-title" className="text-lg font-semibold text-slate-900 mb-1">
                カレンダー同期
              </h2>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                GitHub Gist を使ってデバイス間でカレンダーデータを同期します。
                PAT と Gist ID は登場人物の同期と共有されます。
                設定済みの場合はページを開くと自動読み込み、データ変更後3秒で自動保存します。
              </p>

              <div className="mb-4">
                <label htmlFor="sgs-token" className="block text-sm font-medium text-slate-700 mb-1">
                  GitHub Personal Access Token<span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="sgs-token"
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
                <label htmlFor="sgs-gistid" className="block text-sm font-medium text-slate-700 mb-1">
                  Gist ID<span className="ml-2 text-xs text-slate-400 font-normal">（初回保存後に自動入力）</span>
                </label>
                <input
                  id="sgs-gistid"
                  type="text"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  placeholder="例：a1b2c3d4e5f6..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono"
                />
              </div>

              <div className="mb-4 p-3 bg-sky-50 rounded-lg text-xs text-sky-800 leading-relaxed">
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
