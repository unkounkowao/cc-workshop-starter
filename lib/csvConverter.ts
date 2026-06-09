export const REQUIRED_HEADERS = [
  '名前',
  'メールアドレス',
  '性別',
  '都道府県',
  '年齢',
  'ログイン頻度',
  '課金ステータス',
  'マッチング通知',
] as const;

export type RequiredHeader = (typeof REQUIRED_HEADERS)[number];

const HEADER_MAP: Record<RequiredHeader, string> = {
  名前: '氏名',
  メールアドレス: 'E-Mail',
  性別: '性別(Luna)',
  都道府県: '都道府県',
  年齢: '年齢',
  ログイン頻度: 'ログイン頻度',
  課金ステータス: '課金ステータス',
  マッチング通知: '配信フラグ',
};

export type ConvertSuccess = {
  ok: true;
  csv: string;
  processedCount: number;
  removedCount: number;
  excludedCount: number;
};

export type ConvertFailure = {
  ok: false;
  type: 'validation' | 'system';
  message: string;
  missingColumns?: string[];
};

export type ConvertResult = ConvertSuccess | ConvertFailure;

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (!inQuotes) {
          inQuotes = true;
        } else if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    result.push(fields);
  }

  return result;
}

function escapeField(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// 配信失敗者リストCSV（"E-Mail" or "メールアドレス" 列、またはメールのみの1列）を
// メールアドレスの Set に変換する。
export function parseExcludeEmails(text: string): Set<string> {
  const emails = new Set<string>();
  const rows = parseCSV(text);
  if (rows.length === 0) return emails;

  const headers = rows[0].map((h) => h.trim());
  const emailColIndex =
    headers.indexOf('E-Mail') !== -1
      ? headers.indexOf('E-Mail')
      : headers.indexOf('メールアドレス') !== -1
        ? headers.indexOf('メールアドレス')
        : -1;

  if (emailColIndex !== -1) {
    for (const row of rows.slice(1)) {
      const email = (row[emailColIndex] ?? '').trim().toLowerCase();
      if (email && email.includes('@')) emails.add(email);
    }
  } else {
    // ヘッダー行も含めて全行の先頭列をメールとして扱う
    for (const row of rows) {
      const val = (row[0] ?? '').trim().toLowerCase();
      if (val && val.includes('@')) emails.add(val);
    }
  }

  return emails;
}

export function convertCSV(text: string, excludeEmails?: Set<string>): ConvertResult {
  try {
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return { ok: false, type: 'validation', message: 'CSVファイルが空です。' };
    }

    const headers = rows[0].map((h) => h.trim());

    const missingColumns = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missingColumns.length > 0) {
      return {
        ok: false,
        type: 'validation',
        message: `必須列が不足しています: ${missingColumns.join('、')}`,
        missingColumns,
      };
    }

    const colIndex: Record<string, number> = {};
    headers.forEach((h, i) => {
      colIndex[h] = i;
    });

    const dataRows = rows.slice(1);
    let removedCount = 0;
    let excludedCount = 0;
    const outputRows: string[] = [];

    for (const row of dataRows) {
      const email = (row[colIndex['メールアドレス']] ?? '').trim();

      // メールアドレスが空、またはフォーマット不正な行を除外
      if (!email || !email.includes('@')) {
        removedCount++;
        continue;
      }

      // 配信失敗者リストに含まれるアドレスを除外
      if (excludeEmails?.has(email.toLowerCase())) {
        excludedCount++;
        continue;
      }

      const outFields = REQUIRED_HEADERS.map((header) => {
        let value = (row[colIndex[header]] ?? '').trim();
        if (header === 'マッチング通知') value = 'ON';
        if (header === '名前' && !value) value = '無名';
        return escapeField(value);
      });

      outputRows.push(outFields.join(','));
    }

    const outputHeaders = REQUIRED_HEADERS.map((h) => escapeField(HEADER_MAP[h]));
    const csv = [outputHeaders.join(','), ...outputRows].join('\r\n');

    return {
      ok: true,
      csv,
      processedCount: outputRows.length,
      removedCount,
      excludedCount,
    };
  } catch (err) {
    console.error('CSV変換エラー:', err);
    return {
      ok: false,
      type: 'system',
      message: 'システム一時停止：変換処理中にエラーが発生しました。しばらくお待ちください。',
    };
  }
}
