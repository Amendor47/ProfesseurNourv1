/* ============================================================================
   PlayScene.jsx — the live chase: backdrop + Lou (chased) and Elias/monkey
   (chasing) + dialogue + full HUD. Chapter 2/3 turn Elias into the monkey;
   chapter 4 flips who chases whom.
   ============================================================================ */

function PlayScene({ chapter = 1, timer = '00:42' }) {
  const isMonkey = chapter === 2 || chapter === 3;
  const flipped = chapter === 4; // Lou chases Elias
  const eliasWho = isMonkey ? 'monkey' : 'elias';

  const louLine   = { 1:'Not today!', 2:'A monkey?! Really?!', 3:'Paris… and he followed me here?!', 4:"You're not getting away!" }[chapter];
  const eliasLine = { 1:'Wait— I just want to talk!', 2:'🍌 Ooh ooh!', 3:'Ooh ooh! 🍌', 4:'Lou— wait— I can explain—' }[chapter];

  // positions: leader ahead (right), chaser behind (left)
  const distance = { 1:0.4, 2:0.55, 3:0.62, 4:0.3 }[chapter];
  const connexion = { 1:0.18, 2:0.34, 3:0.52, 4:0.78 }[chapter];
  const audience  = { 1:0.7, 2:0.64, 3:0.58, 4:0.44 }[chapter];

  return (
    <div className="scene">
      <PlayBackdrop chapter={chapter} />
      {/* characters on the ground line (~bottom 60px) */}
      <div style={{ position:'absolute', left:0, right:0, bottom:60, height:58, zIndex:20 }}>
        {/* leader */}
        <div style={{ position:'absolute', bottom:0, left: flipped ? '64%' : '60%', animation:'bob .34s steps(2) infinite' }}>
          {flipped
            ? <Runner who={eliasWho} facing={1} />
            : <Runner who="lou" facing={1} />}
          <Bubble text={flipped ? eliasLine : louLine} tone={flipped ? 'cold' : 'warm'}
            style={{ bottom:64, left:'50%', transform:'translateX(-50%)' }} />
        </div>
        {/* chaser */}
        <div style={{ position:'absolute', bottom:0, left: flipped ? '30%' : '28%', animation:'bob .3s steps(2) infinite' }}>
          {flipped
            ? <Runner who="lou" facing={1} />
            : <Runner who={eliasWho} facing={1} />}
          <Bubble text={flipped ? louLine : eliasLine} tone={flipped ? 'warm' : 'cold'}
            style={{ bottom:64, left:'50%', transform:'translateX(-50%)' }} />
        </div>
      </div>

      {/* a coffee pickup + a heart pickup floating */}
      <div style={{ position:'absolute', bottom:118, left:'46%', fontSize:15, zIndex:18, animation:'bob 2s ease-in-out infinite' }}>☕</div>
      <div style={{ position:'absolute', bottom:140, left:'80%', fontSize:14, zIndex:18, color:'#ff5a7a',
        filter:'drop-shadow(0 0 6px #ff5a7a)', animation:'bob 2.4s ease-in-out infinite' }}>❤</div>

      <HUD chapter={chapter} title={CHAPTERS[chapter-1].title} timer={timer}
        distance={distance} connexion={connexion} audience={audience} />

      {/* item cooldown ring, bottom-right (the Z throwable) */}
      <div style={{ position:'absolute', right:18, bottom:16, width:40, height:40, borderRadius:'50%',
        border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--game)', fontSize:11, color:'#fff', zIndex:30 }}>Z</div>
    </div>
  );
}

Object.assign(window, { PlayScene });
