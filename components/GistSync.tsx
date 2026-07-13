'use client'
import { useState, useEffect, useRef } from 'react'
import { saveToGist, loadFromGist } from '@/lib/gist'
import { loadData, saveData } from '@/lib/storage'
import { DATA_VERSION } from '@/lib/constants'
import type { CharacterSheetData } from '@/lib/types'

const TOKEN_KEY = 'novel-cs-gist-token'
const GIST_ID_KEY = 'novel-cs-gist-id'

type Props = {
  data: CharacterSheetData
  onSynced: () => void
  onToast: (msg: string, type: 'success' | 'error' | 'warning') => void
}

export default function GistSync({ data, onSynced, onToast }: Props) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [loading, setLoading] = useState(false)
  const isFirstRender = useRef(true)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 起動時に自動読み込み
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) ?? ''
    const savedGistId = localStorage.getItem(GIST_ID_KEY) ?? ''
    if (!savedToken || !savedGistId) return

    loadFromGist(savedToken, savedGistId)
      .then((loaded) => {
        saveData({ ...loaded, version: DATA_VERSION })
        onSynced()
        onToast('Gistからデータを自動読み込みしました', 'success')
      })
      .catch(() => {
        // 自動読み込み失敗は無視
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // データ変更時に自動保存（5秒デバウンス）
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const savedToken = localStorage.getItem(TOKEN_KEY) ?? ''
    const savedGistId = localStorage.getItem(GIST_ID_KEY) ?? ''
    if (!savedToken || !savedGistId) return

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await saveToGist(savedToken, savedGistId, data)
        onToast('Gistに自動保存しました', 'success')
      } catch {
        // 自動保存失敗は無視
      }
    }, 5000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [data, onToast])

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY) ?? '')
    setGistId(localStorage.getItem(GIST_ID_KEY) ?? '')
  }, [open])

  const saveSettings = () => {
    localStorage.setItem(TOKEN_KEY, token.trim())
    localStorage.setItem(GIST_ID_KEY, gistId.trim())
  }

  const handleSave = async () => {
    if (!token.trim()) {
      onToast('Personal Access Tokenを入力してください', 'error')
      return
    }
    setLoading(true)
    try {
      const currentData = loadData()
      const newId = await saveToGist(token.trim(), gistId.trim() || null, currentData)
      setGistId(newId)
      localStorage.setItem(TOKEN_KEY, token.trim())
      localStorage.setItem(GIST_ID_KEY, newId)
      onToast('Gistにデータを保存しました', 'success')
      setOpen(false)
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Gist保存に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = async () => {
    if (!token.trim()) {
      onToast('Personal Access Tokenを入力してください', 'error')
      return
    }
    if (!gistId.trim()) {
      onToast('Gist IDを入力してください', 'error')
      return
    }
    if (!window.confirm('現在のデータをGistのデータで上書きします。よいですか？')) return
    setLoading(true)
    try {
      saveSettings()
      const loaded: CharacterSheetData = await loadFromGist(token.trim(), gistId.trim())
      saveData({ ...loaded, version: DATA_VERSION })
      onSynced()
      onToast(`${loaded.characters.length}件のデータをGistから読み込みました`, 'success')
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
        onClick={() => setOpen(true)}
        className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
        title="クロスデバイス同期（GitHub Gist）"
        aria-label="データ同期設定"
      >
        ☁ 同期
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mt-8 mb-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-dialog-title"
          >
            <div className="p-6">
              <h2 id="sync-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                クロスデバイス同期
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                GitHub Gist を使ってデバイス間でデータを共有します。
                PAT と Gist ID は、各デバイスのブラウザにのみ保存されます。
                設定済みの場合はページを開くと自動読み込み、データ変更後5秒で自動保存します。
              </p>

              {/* PAT入力 */}
              <div className="mb-4">
                <label
                  htmlFor="gist-token"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  GitHub Personal Access Token
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="gist-token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  GitHub Settings → Developer settings → Personal access tokens → Gistスコープを付与
                </p>
              </div>

              {/* Gist ID入力 */}
              <div className="mb-6">
                <label
                  htmlFor="gist-id"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Gist ID
                  <span className="ml-2 text-xs text-gray-500 font-normal">（初回保存後に自動入力）</span>
                </label>
                <input
                  id="gist-id"
                  type="text"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  placeholder="例：a1b2c3d4e5f6..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  別デバイスで読み込む際は、保存後に表示されるIDを入力
                </p>
              </div>

              {/* 使い方ガイド */}
              <div className="mb-5 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                <p className="font-medium mb-1">初回設定手順</p>
                <p>① PCで「Gistに保存」→ Gist IDをコピー</p>
                <p>② スマホで同じPAT + Gist IDを入力して「Gistから読み込み」</p>
                <p>③ 以降はページを開くと自動同期</p>
              </div>

              {/* ボタン */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors min-h-[44px]"
                >
                  {loading ? '処理中...' : gistId ? 'Gistに保存（上書き）' : 'Gistに保存（新規作成）'}
                </button>
                <button
                  onClick={handleLoad}
                  disabled={loading || !gistId.trim()}
                  className="flex-1 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-40 rounded-lg transition-colors min-h-[44px]"
                >
                  {loading ? '処理中...' : 'Gistから読み込み'}
                </button>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="mt-3 w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
