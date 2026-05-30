/* ============================================================================
   HUD.jsx — the real in-game heads-up display, faithfully recreated:
   • top-left   chapter + gold mono timer
   • top-center 4 chapter dots
   • top-right  distance-to-Elias bar
   • dual CONNEXION / AUDIENCE meters (the redesign's signature)
   • bottom     action button
   ============================================================================ */

function ChapterDots({ active = 0 }) {
  return (
    <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
      display:'flex', gap:11, zIndex:30 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ width:9, height:9, borderRadius:'50%',
          background: i < active ? 'var(--gold)' : i === active ? '#fff' : 'rgba(255,255,255,.22)',
          boxShadow: i === active ? '0 0 8px rgba(255,255,255,.6)' : 'none',
          border: i === active ? '1px solid #fff' : 'none' }} />
      ))}
    </div>
  );
}

function DistanceBar({ fill = 0.4, chapter = 1 }) {
  const danger = chapter < 4;
  return (
    <div style={{ position:'absolute', top:14, right:16, width:210, zIndex:30, textAlign:'right' }}>
      <div style={{ height:14, borderRadius:7, background:'rgba(255,255,255,.12)', overflow:'hidden',
        border:'1px solid rgba(255,255,255,.15)' }}>
        <div style={{ height:'100%', width:`${fill*100}%`, borderRadius:7,
          background: danger ? 'linear-gradient(90deg,#f2c14e,#d9402e)' : 'linear-gradient(90deg,#6e93bd,#3aa856)' }} />
      </div>
      <div style={{ fontFamily:'var(--game)', fontSize:11, color:'#fff', marginTop:4, opacity:.85 }}>
        {danger ? 'Elias is getting closer…' : 'Distance to Elias'}
      </div>
    </div>
  );
}

/* the signature dual meter — connexion (cold→warm) vs audience (warm) */
function ConnexionMeters({ connexion = 0.34, audience = 0.64 }) {
  const Row = ({ label, color, fill, grad }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'6px 0' }}>
      <span style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:1.5, width:74, color, textTransform:'uppercase' }}>{label}</span>
      <span style={{ flex:1, height:7, borderRadius:4, background:'rgba(255,255,255,.1)', overflow:'hidden' }}>
        <i style={{ display:'block', height:'100%', width:`${fill*100}%`, borderRadius:4, background:grad }} />
      </span>
      <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'#e3d6bf', width:26, textAlign:'right' }}>{Math.round(fill*100)}</span>
    </div>
  );
  return (
    <div style={{ position:'absolute', left:16, bottom:14, width:248, zIndex:30,
      background:'rgba(13,11,18,.5)', backdropFilter:'blur(4px)', border:'1px solid var(--line)',
      borderRadius:10, padding:'9px 12px' }}>
      <Row label="connexion" color="var(--amber)" fill={connexion} grad="linear-gradient(90deg,#6e93bd,#f2c14e)" />
      <Row label="audience"  color="var(--burnt-orange)" fill={audience} grad="linear-gradient(90deg,#f2c14e,#d8693b)" />
    </div>
  );
}

function HUD({ chapter = 1, title = 'First Day at the College', timer = '00:42',
  distance = 0.4, connexion = 0.34, audience = 0.64 }) {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:30, pointerEvents:'none' }}>
      {/* top-left chapter + timer */}
      <div style={{ position:'absolute', top:12, left:16, whiteSpace:'nowrap' }}>
        <div style={{ fontFamily:'var(--game)', fontWeight:700, fontSize:15, color:'#fff' }}>Ch.{chapter} — {title}</div>
        <div style={{ fontFamily:'var(--mono)', fontWeight:600, fontSize:14, color:'var(--gold)', marginTop:2 }}>{timer}</div>
      </div>
      <ChapterDots active={chapter-1} />
      <DistanceBar fill={distance} chapter={chapter} />
      <ConnexionMeters connexion={connexion} audience={audience} />
    </div>
  );
}

Object.assign(window, { HUD, ChapterDots, DistanceBar, ConnexionMeters });
