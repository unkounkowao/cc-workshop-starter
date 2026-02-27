import Link from "next/link";

const values = [
  {
    num: "01",
    title: "聴くこと",
    body: "答えを急がない。沈黙にも言葉がある。その人の呼吸ごと受け取ることを、対話と呼ぶ。",
  },
  {
    num: "02",
    title: "余白への敬意",
    body: "言葉にならないものが、その人の本質に近い。だから説明を求めない。",
  },
  {
    num: "03",
    title: "正直な厳しさ",
    body: "優しい嘘より、痛い本音を選ぶ。それは、あなたのことを本気で考えているという証明だ。",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="font-medium tracking-widest text-sm text-gray-800">昇蘭 / Shōran</span>
          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#about" className="hover:text-gray-800 transition-colors">About</a>
            <a href="#work" className="hover:text-gray-800 transition-colors">Work</a>
            <a href="#bar" className="hover:text-gray-800 transition-colors">Bar</a>
            <a href="#values" className="hover:text-gray-800 transition-colors">Values</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-32">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-8">
          Lecturer · Listener · Bartender
        </p>
        <h1 className="text-5xl sm:text-7xl font-light leading-tight text-gray-900 mb-8">
          言葉は、<br />
          人を壊しもするし、<br />
          <span className="text-gray-400">救いもする。</span>
        </h1>
        <p className="text-gray-400 italic text-lg">
          &ldquo;She spoke in languages — and meant every word.&rdquo;
        </p>
      </section>

      <hr className="border-gray-100" />

      {/* About */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid sm:grid-cols-3 gap-16">
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">01 — About</p>
            <h2 className="text-2xl font-light leading-snug">昇蘭という人間について、少しだけ。</h2>
          </div>
          <div className="sm:col-span-2 space-y-5 text-gray-600 leading-relaxed">
            <p>言葉を教えることを選んだのは、誰かの言葉に救われた記憶があるからかもしれない。</p>
            <p>英語と中国語。文字が違えど、人の迷いや痛みを乗せる器として、言葉はどこか似ている。英文学を愛するのも、結局のところ、他人の人生をそっと覗く行為が好きなのだろうと思っている。</p>
            <p>教壇に立つ前は、高校で英語を教えていた。生徒の目が、初めて文章の意味をつかんだ瞬間に光るのを、何度見ても飽きなかった。</p>
            <p>今は大学で非常勤として教えながら、夜はバーのカウンターに立つ。昼と夜、どちらの自分も本物だと思っている。</p>
            <blockquote className="border-l-2 border-gray-200 pl-5 text-gray-500 italic mt-8">
              人生には、説明しなくていいことがある。
            </blockquote>
          </div>
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* Work */}
      <section id="work" className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid sm:grid-cols-3 gap-16">
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">02 — Work</p>
            <h2 className="text-2xl font-light leading-snug italic">
              &ldquo;Teaching is not telling.<br />It&apos;s listening first.&rdquo;
            </h2>
          </div>
          <div className="sm:col-span-2 space-y-10">
            <div className="border-t border-gray-100 pt-8">
              <h3 className="font-medium text-gray-800 mb-3">言葉を、解剖する。</h3>
              <p className="text-gray-500 text-sm leading-relaxed">正しい英語よりも、自分の言葉で語れる英語を。上手な発音よりも、伝えようとする意志を。語学は技術ではなく、感覚だと思っている。</p>
            </div>
            <div className="border-t border-gray-100 pt-8">
              <h3 className="font-medium text-gray-800 mb-3">厳しさは、愛だ。</h3>
              <p className="text-gray-500 text-sm leading-relaxed">甘やかすことが優しさだとは思っていない。本当に伸びる瞬間は、少しだけ苦しい場所にある。それを知っているから、手を緩めない。</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* Bar */}
      <section id="bar" className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="grid sm:grid-cols-3 gap-16">
            <div>
              <p className="text-xs tracking-widest text-gray-500 uppercase mb-4">03 — Night</p>
              <h2 className="text-2xl font-light leading-snug text-gray-100">夜、カウンターの向こう側。</h2>
            </div>
            <div className="sm:col-span-2 space-y-5 text-gray-400 leading-relaxed">
              <p>趣味で、バーに立っている。</p>
              <p>酒を混ぜながら、話を聞く。名前も素性も、聞かない。</p>
              <p>「どうしてバーを?」とよく聞かれる。いつも少し考えてから、「昼間に渡せなかった言葉を、夜に返せる気がして」と答えることにしている。</p>
              <blockquote className="border-l-2 border-gray-700 pl-5 text-gray-500 italic mt-6">
                秘密は、ここに置いていっていい。<br />明日、覚えていないふりをするから。
              </blockquote>
              <div className="pt-6">
                <Link
                  href="/cocktails"
                  className="inline-flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  おすすめカクテルを見る
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">04 — Values</p>
          <h2 className="text-2xl font-light">信じているもの。</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-12">
          {values.map((v) => (
            <div key={v.num} className="border-t border-gray-100 pt-8">
              <span className="text-4xl font-light text-gray-100">{v.num}</span>
              <h3 className="font-medium text-gray-800 mt-4 mb-3">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* Message */}
      <section className="max-w-5xl mx-auto px-6 py-32 text-center">
        <p className="text-xl sm:text-2xl font-light text-gray-700 leading-loose mb-10">
          もし言葉に詰まっているなら、<br />
          一度だけ、話しかけてみてください。<br />
          <span className="text-gray-400">答えは出さないかもしれない。でも、ちゃんと聞きます。</span>
        </p>
        <p className="text-gray-400 italic">— Shōran</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center text-xs text-gray-300 tracking-widest">
          <span>昇蘭 / Shōran</span>
          <span className="italic">Lecturer · Listener · Bartender</span>
        </div>
      </footer>

    </main>
  );
}
