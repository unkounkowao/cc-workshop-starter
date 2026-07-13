import { validateImportData } from './validation'
import type { CharacterSheetData } from './types'

const GIST_FILENAME = 'character-sheet-data.json'

// Gistにデータを保存（新規作成またはPATCH）
export async function saveToGist(
  token: string,
  gistId: string | null,
  data: CharacterSheetData
): Promise<string> {
  const url = gistId
    ? `https://api.github.com/gists/${gistId}`
    : 'https://api.github.com/gists'

  const response = await fetch(url, {
    method: gistId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      description: 'キャラクターシートデータ（Novel Character Sheet）',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  })

  if (!response.ok) {
    const status = response.status
    if (status === 401) throw new Error('認証エラー：Personal Access Tokenを確認してください')
    if (status === 404) throw new Error('Gistが見つかりません。IDを確認するか、新規作成してください')
    throw new Error(`Gist保存に失敗しました（${status}）`)
  }

  const result = await response.json()
  return result.id as string
}

// GistからデータをGETして返す
export async function loadFromGist(
  token: string,
  gistId: string
): Promise<CharacterSheetData> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    const status = response.status
    if (status === 401) throw new Error('認証エラー：Personal Access Tokenを確認してください')
    if (status === 404) throw new Error('Gistが見つかりません。IDを確認してください')
    throw new Error(`Gist読み込みに失敗しました（${status}）`)
  }

  const gist = await response.json()
  const file = gist.files[GIST_FILENAME]
  if (!file) {
    throw new Error(`Gist内に "${GIST_FILENAME}" が見つかりません`)
  }

  // rawファイルが切り詰められている場合はraw_urlから取得
  const content: string = file.truncated
    ? await fetch(file.raw_url).then((r) => r.text())
    : file.content

  const parsed: unknown = JSON.parse(content)
  if (!validateImportData(parsed)) {
    throw new Error('Gistのデータ形式が無効です')
  }

  return parsed
}
