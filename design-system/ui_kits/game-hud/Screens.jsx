/* ============================================================================
   Screens.jsx — the five game states recreated as React screens.
   TitleMenu · ChapterSelect · PlayScene · Cutscene · Ending
   ============================================================================ */

const CHAPTERS = [
  { n:1, title:'First Day at the College', landmark:'Welcome to Bruges', best:'00:48',
    intro:'Lou arrives at the College of Europe. She has barely set foot on campus when she notices a tall blond guy staring at her. He starts running after her.' },
  { n:2, title:'Canal Chase', landmark:'The Belfort of Bruges', best:'01:02',
    intro:"Something strange happened to Elias. Lou can't stop laughing. But he's still fast." },
  { n:3, title:'The Train to Paris', landmark:'The Eiffel Tower', best:'01:15',
    intro:'Lou decides to take the train to Paris. Somehow, the monkey bought a ticket too.' },
  { n:4, title:'She Chases Back', landmark:'The Swedish border', best:'00:39',
    intro:'For the first time, Lou is the one running after someone. And Elias… is the one running away.' },
];

/* ---- 1 · TITLE MENU ------------------------------------------------------ */
function TitleMenu({ onStart, onSelect }) {
  return (
    <div className="scene" style={{ background:'linear-gradient(180deg,#3a2030 0%,#241a33 55%,#141a2e 100%)' }}>
      {/* climate glows */}
      <div style={{ position:'absolute', inset:0,
        background:'radial-gradient(45% 60% at 14% 12%, rgba(216,105,59,.3), transparent 60%), radial-gradient(45% 60% at 88% 92%, rgba(110,147,189,.34), transparent 60%)' }} />
      {/* a sleeping cat easter egg, bottom-left */}
      <div title="Baudelaire" style={{ position:'absolute', left:22, bottom:18, fontSize:22, filter:'grayscale(.3)' }}>🐈‍⬛</div>
      {/* title */}
      <div style={{ position:'absolute', top:'17%', left:0, right:0, textAlign:'center' }}>
        <div style={{ fontFamily:'var(--mono)', fontWeight:700, letterSpacing:'-1px', lineHeight:1,
          fontSize:'min(7vw,52px)',
          background:'linear-gradient(100deg,#d8693b,#f2c14e 40%,#cdd6dd 62%,#6e93bd)',
          WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent',
          textShadow:'0 0 40px rgba(242,193,78,.1)' }}>
          WHEN YOU CALL ME, SINGE<span style={{ WebkitTextFillColor:'#f2c14e', color:'#f2c14e', animation:'blinkcur 1.05s steps(1) infinite' }}>_</span>
        </div>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:17, color:'var(--gold)', marginTop:14 }}>
          A love story in 4 chapters
        </div>
      </div>
      {/* buttons */}
      <div style={{ position:'absolute', bottom:'20%', left:0, right:0, display:'flex',
        flexDirection:'column', alignItems:'center', gap:13 }}>
        <button className="gbtn" style={{ width:200 }} onClick={onStart}>▶  START GAME</button>
        <button className="gbtn" style={{ width:200 }} onClick={onSelect}>CHAPTER SELECT</button>
      </div>
      <div style={{ position:'absolute', bottom:14, left:0, right:0, textAlign:'center',
        fontFamily:'var(--game)', fontSize:11, color:'rgba(255,255,255,.5)' }}>
        ← → move · ↑/Space jump · ↓ slide · Z item · Esc menu
      </div>
    </div>
  );
}

/* ---- 2 · CHAPTER SELECT -------------------------------------------------- */
function ChapterSelect({ unlocked = 2, onPick, onBack }) {
  return (
    <div className="scene" style={{ background:'linear-gradient(180deg,#1a1430,#2a1d3a)' }}>
      <div style={{ textAlign:'center', paddingTop:30, fontFamily:'var(--game)', fontWeight:800,
        fontSize:30, color:'#fff' }}>Chapter Select</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, width:380,
        margin:'22px auto 0' }}>
        {CHAPTERS.map((c,i) => {
          const open = i < unlocked;
          return (
            <button key={c.n} disabled={!open} onClick={() => open && onPick(i)}
              style={{ textAlign:'left', padding:'12px 14px', borderRadius:12, cursor: open?'pointer':'default',
                background:'rgba(255,255,255,.05)', border:`2px solid ${open?'var(--gold)':'#555'}`,
                color: open?'#fff':'#888', fontFamily:'var(--game)', transition:'.15s', height:96 }}
              onMouseEnter={e=> open && (e.currentTarget.style.boxShadow='0 0 20px rgba(245,208,59,.25)')}
              onMouseLeave={e=> e.currentTarget.style.boxShadow='none'}>
              <div style={{ fontWeight:700, fontSize:16 }}>Ch.{c.n}</div>
              <div style={{ fontSize:13, marginTop:4 }}>{open ? c.title : '🔒 locked'}</div>
              {open && <div style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--gold)', marginTop:10 }}>best {c.best}</div>}
            </button>
          );
        })}
      </div>
      <div style={{ textAlign:'center', marginTop:18 }}>
        <button className="gbtn" onClick={onBack}>BACK</button>
      </div>
    </div>
  );
}

/* ---- 3 · CUTSCENE -------------------------------------------------------- */
function Cutscene({ chapter = 1, onSkip }) {
  const c = CHAPTERS[chapter-1];
  return (
    <div className="scene" onClick={onSkip} style={{ background:'#08070c', cursor:'pointer',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 14%' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(60% 60% at 20% 10%, rgba(216,105,59,.12), transparent 60%), radial-gradient(60% 60% at 85% 95%, rgba(110,147,189,.14), transparent 60%)' }} />
      <div style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:3, textTransform:'uppercase',
        color:'var(--amber)', marginBottom:18, position:'relative' }}>Chapter {c.n} · {c.landmark}</div>
      <div style={{ fontFamily:'var(--serif)', fontSize:'clamp(18px,2.4vw,24px)', lineHeight:1.5,
        color:'#f4ead5', textAlign:'center', maxWidth:560, position:'relative', animation:'fadeup .8s ease both' }}>
        {c.intro}
      </div>
      <div style={{ position:'absolute', bottom:24, fontFamily:'var(--game)', fontSize:12,
        color:'rgba(255,255,255,.5)' }}>press SPACE / tap to skip</div>
    </div>
  );
}

/* ---- 5 · ENDING ---------------------------------------------------------- */
const ENDINGS = {
  warm:    { icon:'🔥', kicker:'THE WARM ENDING', lines:['She let him stay.','Not forever — but long enough to mean it.'], tint:'#d8693b' },
  honest:  { icon:'🥀', kicker:'THE HONEST ENDING', lines:['Some people arrive like unfinished songs.','He loved her more than she loved him,','and the phone stopped ringing.'], tint:'#b8b0cf' },
  cold:    { icon:'❄', kicker:'THE COLD ENDING', lines:['He made it home.','The blue heart stayed unopened.'], tint:'#6e93bd' },
};
function Ending({ kind = 'honest', onReplay }) {
  const e = ENDINGS[kind];
  return (
    <div className="scene" style={{ background:`linear-gradient(180deg,#0c0a12, ${e.tint}22)`,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:40, marginBottom:8, animation:'bob 3s ease-in-out infinite' }}>{e.icon}</div>
      <div style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:3, color:e.tint, marginBottom:18 }}>{e.kicker}</div>
      {e.lines.map((l,i) => (
        <div key={i} style={{ fontFamily:'var(--serif)', fontSize:21, color:'#fff', lineHeight:1.45,
          textAlign:'center', animation:`fadeup .8s ${0.5+i*0.5}s ease both` }}>{l}</div>
      ))}
      <div style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--gold)', marginTop:24,
        animation:'fadeup .8s 2.4s ease both' }}>total time 04:18 · Elias caught Lou 3×</div>
      <button className="gbtn" style={{ marginTop:18, animation:'fadeup .8s 2.6s ease both' }} onClick={onReplay}>PLAY AGAIN</button>
    </div>
  );
}

Object.assign(window, { CHAPTERS, TitleMenu, ChapterSelect, Cutscene, Ending, ENDINGS });
