export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ここにあなたのサービスが表示されます
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Claude Codeにサービスのアイデアを伝えてください。
          <br />
          AIチームが自動的にWebサイトを構築します。
        </p>
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <p className="text-sm text-gray-500 mb-2">例：</p>
          <p className="text-gray-700 italic">
            「ペットのトリミングサロン予約サイトを作って。ターゲットは犬の飼い主で、
            メニュー一覧・料金表・予約フォーム（表示のみ）が必要です。」
          </p>
        </div>
      </div>
    </main>
  )
}
