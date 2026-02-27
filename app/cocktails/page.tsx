"use client";

import Link from "next/link";
import { useEffect } from "react";

const cocktails = [
  { en: "Aviation",        ja: "アビエーション",       dot: "#c084fc", desc: "ジン、マラスキーノ、クレーム・ド・ヴィオレット、レモン。淡い紫がグラスに揺れる。飲む前から少し、悲しくなれる。",         mood: "言葉を失った夜に。" },
  { en: "Negroni",         ja: "ネグローニ",           dot: "#f87171", desc: "ジン、カンパリ、スイートベルモット。甘さと苦みが等量で存在する。妥協しない人間の味がする。",                         mood: "本音で話したい夜に。" },
  { en: "Last Word",       ja: "ラスト・ワード",       dot: "#34d399", desc: "ジン、グリーン・シャルトリューズ、マラスキーノ、ライム。すべてが等量。誰も譲らない、でも誰も負けていない。",           mood: "最後に言えなかった言葉のために。" },
  { en: "Bijou",           ja: "ビジュー",             dot: "#fbbf24", desc: "ジン、グリーン・シャルトリューズ、スイートベルモット。宝石という名を持つカクテル。複雑で、深く、飽きない。",           mood: "静かに酔いたい夜に。" },
  { en: "French 75",       ja: "フレンチ75",           dot: "#60a5fa", desc: "ジン、レモン、シロップ、シャンパン。軽やかに見えて、意外と強い。笑顔で核心を突く人に似ている。",                     mood: "祝いたいわけでもないのに乾杯したい夜に。" },
  { en: "Singapore Sling", ja: "シンガポール・スリング", dot: "#fb923c", desc: "ジン、チェリーリキュール、柑橘、ソーダ。南国の夜を連れてくる一杯。遠い場所への郷愁を、甘さで包んだ味。", mood: "どこか遠くを思い出す夜に。" },
];

export default function CocktailsPage() {
  useEffect(() => {
    // Custom cursor
    const cursor = document.getElementById("cur");
    const ring   = document.getElementById("cur-ring");
    const onMove = (e: MouseEvent) => {
      if (cursor) { cursor.style.left = e.clientX + "px"; cursor.style.top = e.clientY + "px"; }
      if (ring)   { ring.style.left   = e.clientX + "px"; ring.style.top   = e.clientY + "px"; }
    };
    document.addEventListener("mousemove", onMove);

    // Nav scroll
    const nav = document.getElementById("c-nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Reveal
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));

    return () => {
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      obs.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        :root {
          --p: #8b5cf6;
          --pg: rgba(139,92,246,0.4);
          --bg: #07060d;
          --bg2: #0d0b14;
          --cr: #e8e4f0;
          --cd: rgba(232,228,240,0.55);
          --mu: rgba(232,228,240,0.35);
          --ru: rgba(139,92,246,0.2);
        }
        body { background: var(--bg); color: var(--cr); font-family: Georgia, serif; cursor: none; overflow-x: hidden; }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1000; opacity: .45;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 128px;
        }
        #cur { position:fixed; width:8px; height:8px; background:var(--p); border-radius:50%; pointer-events:none; z-index:9999; transform:translate(-50%,-50%); box-shadow:0 0 12px var(--pg),0 0 32px var(--pg); }
        #cur-ring { position:fixed; width:36px; height:36px; border-radius:50%; pointer-events:none; z-index:9998; transform:translate(-50%,-50%); background:conic-gradient(from 0deg,#ff0080,#ff8c00,#ffe100,#39d353,#00b4d8,#7b2fff,#ff0080); -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 1.5px),#fff calc(100% - 1.5px)); mask:radial-gradient(farthest-side,transparent calc(100% - 1.5px),#fff calc(100% - 1.5px)); animation:spin 3s linear infinite; }
        @keyframes spin { to { transform:translate(-50%,-50%) rotate(360deg); } }
        #c-nav { position:fixed; top:0; left:0; right:0; z-index:500; display:flex; justify-content:space-between; align-items:center; padding:28px 60px; background:linear-gradient(to bottom,rgba(7,6,13,.95),transparent); transition:background .4s; }
        #c-nav.scrolled { background:rgba(7,6,13,.96); border-bottom:1px solid var(--ru); backdrop-filter:blur(12px); }
        .n-logo { font-style:italic; font-size:1.3rem; letter-spacing:.22em; color:var(--cr); text-decoration:none; }
        .n-logo span { color:var(--p); text-shadow:0 0 20px var(--pg); }
        .n-back { font-style:italic; font-size:.82rem; letter-spacing:.15em; color:var(--mu); text-decoration:none; display:flex; align-items:center; gap:12px; transition:color .3s; }
        .n-back::before { content:''; display:block; width:28px; height:1px; background:var(--p); transition:width .3s; }
        .n-back:hover { color:var(--cr); }
        .n-back:hover::before { width:40px; }
        #hero { min-height:52vh; display:flex; flex-direction:column; justify-content:flex-end; padding:0 12vw 72px; position:relative; overflow:hidden; }
        #hero::before { content:''; position:absolute; top:0; left:30%; width:600px; height:400px; background:radial-gradient(ellipse,rgba(139,92,246,.1) 0%,transparent 70%); animation:breathe 7s ease-in-out infinite; pointer-events:none; }
        @keyframes breathe { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.2);opacity:1} }
        .h-label { font-size:.7rem; letter-spacing:.38em; text-transform:uppercase; color:var(--p); text-shadow:0 0 16px var(--pg); margin-bottom:24px; }
        .h-title { font-style:italic; font-size:clamp(2.8rem,5.5vw,5rem); font-weight:300; line-height:1.2; letter-spacing:.03em; color:var(--cr); margin-bottom:20px; }
        .h-sub { font-style:italic; font-size:clamp(.9rem,1.3vw,1.1rem); color:var(--mu); letter-spacing:.08em; max-width:480px; line-height:1.9; }
        #cocktails { padding:80px 12vw 140px; }
        .cgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--ru); border:1px solid var(--ru); }
        .card { background:var(--bg2); padding:52px 40px; position:relative; overflow:hidden; transition:background .4s; display:flex; flex-direction:column; }
        .card::after { content:''; position:absolute; bottom:0; left:0; width:100%; height:1px; background:linear-gradient(to right,var(--p),transparent); transform:scaleX(0); transform-origin:left; transition:transform .5s ease; box-shadow:0 0 16px var(--pg); }
        .card:hover { background:#100d1a; }
        .card:hover::after { transform:scaleX(1); }
        .dot { width:10px; height:10px; border-radius:50%; margin-bottom:32px; flex-shrink:0; }
        .c-en { font-style:italic; font-size:1.55rem; font-weight:300; color:var(--cr); letter-spacing:.04em; margin-bottom:6px; line-height:1.2; }
        .c-jp { font-size:.78rem; letter-spacing:.18em; color:var(--mu); margin-bottom:28px; }
        .c-div { width:24px; height:1px; background:var(--p); opacity:.4; margin-bottom:24px; flex-shrink:0; }
        .c-desc { font-size:.86rem; color:var(--cd); line-height:2.1; flex:1; }
        .c-mood { margin-top:28px; font-style:italic; font-size:.9rem; color:var(--p); text-shadow:0 0 12px var(--pg); letter-spacing:.06em; opacity:.8; }
        footer { border-top:1px solid var(--ru); padding:36px 60px; display:flex; justify-content:space-between; align-items:center; }
        .f-name { font-size:.88rem; letter-spacing:.2em; color:var(--mu); }
        .f-note { font-style:italic; font-size:.76rem; color:rgba(232,228,240,.18); }
        .reveal { opacity:0; transform:translateY(28px); transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1); }
        .reveal.visible { opacity:1; transform:none; }
        @media(max-width:900px){ #c-nav{padding:20px 24px} #hero{padding:0 6vw 56px} #cocktails{padding:60px 6vw 100px} .cgrid{grid-template-columns:1fr 1fr} footer{flex-direction:column;gap:10px;text-align:center;padding:28px 24px} }
        @media(max-width:600px){ .cgrid{grid-template-columns:1fr} }
      `}</style>

      <div id="cur" />
      <div id="cur-ring" />

      <nav id="c-nav">
        <Link href="/" className="n-logo">昇<span>蘭</span></Link>
        <Link href="/" className="n-back">プロフィールに戻る</Link>
      </nav>

      <section id="hero">
        <p className="h-label reveal">Bar — Cocktail Menu</p>
        <h1 className="h-title reveal">今夜、何を飲みますか。</h1>
        <p className="h-sub reveal">
          &ldquo;A good cocktail doesn&apos;t just taste — it speaks.<br />
          Here are the ones I&apos;d pour without hesitation.&rdquo;
        </p>
      </section>

      <section id="cocktails">
        <div className="cgrid">
          {cocktails.map((c) => (
            <div key={c.en} className="card reveal">
              <span className="dot" style={{ background: c.dot, boxShadow: `0 0 12px ${c.dot}` }} />
              <div className="c-en">{c.en}</div>
              <div className="c-jp">{c.ja}</div>
              <div className="c-div" />
              <div className="c-desc">{c.desc}</div>
              <div className="c-mood">— {c.mood}</div>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <span className="f-name">昇蘭 / Shōran</span>
        <span className="f-note">&ldquo;Every glass tells a story.&rdquo;</span>
      </footer>
    </>
  );
}
