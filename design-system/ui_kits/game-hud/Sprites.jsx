/* ============================================================================
   Sprites.jsx — stylized CSS stand-ins for the canvas pixel-art, plus the
   parallax play backdrop. These are deliberately simple recreations: the real
   game draws characters on a 2D canvas. Cities are CSS silhouettes.
   ============================================================================ */
const { useState, useEffect, useRef } = React;

/* --- a runner figure built from blocks (Lou=warm, Elias=cold, monkey=brown) - */
function Runner({ who = 'lou', facing = 1, run = true, style = {} }) {
  const skin = '#e8b98c';
  const cfg = {
    lou:    { hood:'#E87D9A', hair:'#5a3a26', label:'Lou' },
    elias:  { hood:'#5b6b86', hair:'#e6cf86', label:'Elias' },
    monkey: { hood:'#8B4513', hair:'#6b3410', label:'singe' },
  }[who];
  const px = (n) => `${n}px`;
  const legAnim = run ? 'runlegs .34s steps(2) infinite' : 'none';
  return (
    <div style={{ position:'relative', width:px(34), height:px(58), transform:`scaleX(${facing})`, ...style }}>
      {/* head */}
      <div style={{ position:'absolute', top:0, left:9, width:16, height:15, background:skin, borderRadius:'4px 4px 3px 3px' }} />
      {/* hair */}
      <div style={{ position:'absolute', top:-2, left:7, width:20, height:9,
        background:cfg.hair, borderRadius: who==='lou' ? '8px 8px 2px 6px' : '7px 7px 0 0' }} />
      {who==='monkey' && <div style={{ position:'absolute', top:3, left:5, width:7, height:7, background:cfg.hair, borderRadius:'50%' }} />}
      {who==='monkey' && <div style={{ position:'absolute', top:3, left:22, width:7, height:7, background:cfg.hair, borderRadius:'50%' }} />}
      {/* eye */}
      <div style={{ position:'absolute', top:6, left:19, width:3, height:3, background:'#1a1118', borderRadius:'50%' }} />
      {/* hoodie body */}
      <div style={{ position:'absolute', top:14, left:5, width:24, height:26, background:cfg.hood, borderRadius:'6px 6px 4px 4px' }} />
      {/* arm */}
      <div style={{ position:'absolute', top:18, left:22, width:8, height:15, background:cfg.hood, borderRadius:4, transformOrigin:'top',
        animation: run ? 'runarm .34s steps(2) infinite' : 'none' }} />
      {/* legs */}
      <div style={{ position:'absolute', top:38, left:8, width:7, height:18, background:'#2b2230', borderRadius:3, transformOrigin:'top', animation:legAnim }} />
      <div style={{ position:'absolute', top:38, left:18, width:7, height:18, background:'#2b2230', borderRadius:3, transformOrigin:'top', animation: run ? 'runlegs2 .34s steps(2) infinite' : 'none' }} />
    </div>
  );
}

/* --- speech bubble (mono, pointed) ---------------------------------------- */
function Bubble({ text, tone = 'warm', style = {} }) {
  const color = tone === 'warm' ? 'var(--burnt-orange)' : 'var(--nordic-blue)';
  return (
    <div style={{ position:'absolute', ...style }}>
      <div style={{ background:'#f4ead5', color:'#2a2230', fontFamily:'var(--mono)', fontSize:11,
        padding:'5px 9px', borderRadius:8, whiteSpace:'nowrap', border:`2px solid ${color}`,
        fontWeight:600, boxShadow:'0 4px 14px rgba(0,0,0,.4)' }}>{text}</div>
      <div style={{ width:0, height:0, margin:'0 auto', borderLeft:'5px solid transparent',
        borderRight:'5px solid transparent', borderTop:`7px solid ${color}` }} />
    </div>
  );
}

/* --- parallax city backdrop (warm sky → cold ground), chapter-aware ------- */
function PlayBackdrop({ chapter = 1 }) {
  // warm-to-cold sky shifts colder as chapters progress toward Sweden
  const skies = {
    1: ['#3a2030','#241830'], 2:['#33233a','#1f1d33'],
    3:['#2a2440','#1c2236'], 4:['#1d2740','#101a2e'],
  }[chapter];
  const landmark = { 1:'BRUGES', 2:'BELFORT', 3:'EIFFEL', 4:'SVERIGE' }[chapter];
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden',
      background:`linear-gradient(180deg, ${skies[0]}, ${skies[1]})` }}>
      {/* far building band */}
      <div style={{ position:'absolute', left:0, right:0, bottom:78, height:120, opacity:.4,
        background:'repeating-linear-gradient(90deg, #0f1a2a 0 38px, transparent 38px 70px)',
        maskImage:'linear-gradient(180deg, transparent, #000 50%)' }} />
      {/* mid silhouette with one landmark spire */}
      <div style={{ position:'absolute', left:'62%', bottom:84, width:6, height:160,
        background:'#0a0f1c' }} />
      <div style={{ position:'absolute', left:'60%', bottom:230, fontFamily:'var(--mono)',
        fontSize:9, letterSpacing:2, color:'rgba(205,214,221,.4)' }}>{landmark}</div>
      {/* warm glow low-left, cold glow low-right (the connexion climate) */}
      <div style={{ position:'absolute', inset:0,
        background:'radial-gradient(40% 60% at 10% 90%, rgba(216,105,59,.22), transparent 60%), radial-gradient(40% 60% at 92% 95%, rgba(110,147,189,.28), transparent 60%)' }} />
      {/* ground */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:78,
        background:'linear-gradient(180deg,#15101c,#0a070f)', borderTop:'2px solid rgba(242,193,78,.18)' }} />
      <div style={{ position:'absolute', left:0, right:0, bottom:60, height:2,
        background:'repeating-linear-gradient(90deg, rgba(242,193,78,.25) 0 16px, transparent 16px 40px)' }} />
    </div>
  );
}

Object.assign(window, { Runner, Bubble, PlayBackdrop });
