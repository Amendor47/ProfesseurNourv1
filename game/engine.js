/* ============================================================
   WHEN YOU CALL ME, SINGE — game engine
   Visual-novel nodes + canvas minigames.
   Two meters: CONNEXION (how close they really are, drives blend
   + ending) and AUDIENCE (chat love; pulls against connexion
   during streams). Lou loves less; Elias loves more; he hates
   being called "singe" and answers to it anyway.
   ============================================================ */
const S = {
  connection: 46,           // Lou is only half in it -> starts lower
  audience: 68,             // she's a popular streamer
  flags:{ heart:false, vodUnlocked:false, lakeAnswered:false, quiz:0, deleted:0, singe:null },
  blend:0,
};
const screens = {
  landing: document.getElementById('landing'),
  vn:      document.getElementById('vn'),
  game:    document.getElementById('game-wrap'),
};
function show(name){
  Object.values(screens).forEach(s=>s.classList.remove('active'));
  screens[name].classList.add('active');
}
function setBlend(v){
  S.blend = Math.max(0,Math.min(1,v));
  document.documentElement.style.setProperty('--blend',S.blend.toFixed(2));
}
function bump(n){
  S.connection = Math.max(0,Math.min(100,S.connection+n));
  document.getElementById('meterfill').style.width = S.connection+'%';
  setBlend(S.connection/100);
}
function bumpAud(n){
  S.audience = Math.max(0,Math.min(100,S.audience+n));
  document.getElementById('audfill').style.width = S.audience+'%';
}
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2600);
}
const isTouch = ('ontouchstart' in window)||navigator.maxTouchPoints>0;

/* ============================================================
   LANDING — typewriter title + buzzing phone + cat
   ============================================================ */
(function landing(){
  const titleText="WHEN YOU CALL ME, SINGE";
  const el=document.getElementById('title');
  const cam=document.getElementById('loucam'); if(cam) cam.innerHTML=Characters.svg('lou','neutral');
  let i=0;
  const tick=()=>{
    el.textContent=titleText.slice(0,i);
    i++;
    if(i<=titleText.length){ setTimeout(tick, 66+Math.random()*60); }
    else{
      const b=document.getElementById('startbtn');
      b.disabled=false;b.style.opacity=1;b.textContent="▶ press call";
      document.getElementById('nokia').classList.remove('ring');
    }
  };
  setTimeout(tick,500);

  document.getElementById('startbtn').addEventListener('click',()=>{ Sound.start(); story.go('c1'); });
  document.getElementById('musicwidget').addEventListener('click',()=>Sound.toggle());

  document.getElementById('baudelaire').addEventListener('click',()=>{
    if(!S.flags.vodUnlocked){
      S.flags.vodUnlocked=true;
      toast("🐈‍⬛ Baudelaire stretched. The 9-hour VOD unlocked.");
      bump(4);
      document.getElementById('twnotif').textContent="🔔 VOD archive: 'the 9-hour stream' unlocked";
    } else { toast("🐈‍⬛ Baudelaire is still asleep."); }
  });
})();

/* ============================================================
   TINY WEBAUDIO SOUND ENGINE (lo-fi blips, no assets)
   ============================================================ */
const Sound = (function(){
  let ctx=null, musicOn=false, musicTimer=null;
  function ac(){ if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)(); return ctx; }
  function blip(freq=440,dur=.08,type='square',gain=.05){
    try{const c=ac();const o=c.createOscillator(),g=c.createGain();
      o.type=type;o.frequency.value=freq;g.gain.value=gain;
      o.connect(g);g.connect(c.destination);o.start();
      g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur);
      o.stop(c.currentTime+dur);}catch(e){}
  }
  function start(){ ac(); if(ctx.state==='suspended')ctx.resume(); }
  function toggle(){
    musicOn=!musicOn;
    document.getElementById('musicwidget').textContent = "♪ lo-fi // "+(musicOn?"playing":"paused");
    if(musicOn){ start(); loop(); } else { clearTimeout(musicTimer); }
  }
  const scale=[261.6,293.7,329.6,392,440,523.3];
  function loop(){
    if(!musicOn)return;
    const n=scale[Math.floor(Math.random()*scale.length)]/2;
    blip(n,.5,'sine',.03);
    musicTimer=setTimeout(loop,600+Math.random()*500);
  }
  return {blip,start,toggle,
    ui:()=>blip(660,.05,'square',.04),
    good:()=>{blip(523,.08);setTimeout(()=>blip(784,.12),90);},
    bad:()=>blip(140,.18,'sawtooth',.05),
    hit:()=>blip(200,.06,'square',.06),
    ring:()=>{blip(880,.2,'sine',.05);setTimeout(()=>blip(740,.3,'sine',.05),250);}
  };
})();

/* ============================================================
   STORY ENGINE  (visual-novel nodes)
   ============================================================ */
const vnEmoji=document.getElementById('vnemoji');
const vnArt  =document.getElementById('vn-art');
const snowBox=document.getElementById('snow');
const portrait=document.getElementById('portrait');
let lastFace={who:'lou',expr:'neutral'};
function setFace(node){
  let f=node.face;
  if(f===undefined){
    if(node.cls==='lou') f={who:'lou',expr:node.expr||'neutral'};
    else if(node.cls==='elias') f={who:'elias',expr:node.expr||'neutral'};
  }
  if(f===null){ lastFace=null; }
  else if(f){ lastFace=f; }
  // narrator w/ no face => keep the lingering portrait
  if(!portrait) return;
  if(!lastFace){ portrait.innerHTML=''; portrait.style.opacity=0; return; }
  portrait.style.opacity=1;
  portrait.innerHTML = lastFace.who==='both'
    ? Characters.two(lastFace.lExpr, lastFace.eExpr)
    : Characters.svg(lastFace.who, lastFace.expr);
}

function setSnow(on){
  snowBox.innerHTML='';
  if(!on)return;
  for(let i=0;i<26;i++){
    const f=document.createElement('div');f.className='flake';f.textContent='❄';
    f.style.left=Math.random()*100+'%';
    f.style.fontSize=(6+Math.random()*10)+'px';
    f.style.animationDuration=(4+Math.random()*6)+'s';
    f.style.animationDelay=(-Math.random()*6)+'s';
    snowBox.appendChild(f);
  }
}

const story = (function(){
  const $chap=document.getElementById('vn-chapter');
  const $spk =document.getElementById('vn-speaker');
  const $txt =document.getElementById('vn-text');
  const $ch  =document.getElementById('vn-choices');
  const $next=document.getElementById('vn-next');
  const $meter=document.getElementById('meter');
  let cur=null, typing=null, full="";

  function render(node){
    cur=node;
    show('vn');
    $meter.classList.add('show');
    $meter.classList.toggle('with-aud', !!node.stream);
    $chap.textContent=node.chapter||'';
    $spk.textContent=node.speaker||'—';
    $spk.className=node.cls||'narr';
    if(node.art) vnEmoji.textContent=node.art;
    if(node.bg)  vnArt.style.background=node.bg;
    setFace(node);
    setSnow(!!node.snow);
    if(node.action) node.action();

    full=node.text||'';
    $txt.innerHTML='';
    $ch.innerHTML='';
    $next.style.display='none';
    clearInterval(typing);
    let plain=full, idx=0;
    typing=setInterval(()=>{
      idx+=2;
      if(idx>=plain.length){
        clearInterval(typing);
        $txt.innerHTML=full;
        showChoices(node);
      } else {
        $txt.textContent = plain.replace(/<[^>]+>/g,'').slice(0,idx);
      }
    },14);
    Sound.ui();
  }
  function showChoices(node){
    if(node.choices){
      node.choices.forEach(c=>{
        const b=document.createElement('button');
        b.className='choice'+(c.cold?' cold':'');
        b.textContent=c.label;
        b.onclick=()=>{ Sound.ui(); if(c.effect)c.effect(); go(c.to); };
        $ch.appendChild(b);
      });
    } else {
      $next.style.display='block';
      $next.onclick=()=>{ Sound.ui(); go(node.next); };
    }
  }
  document.getElementById('vn-box').addEventListener('click',()=>{
    if(typing && $txt.textContent.length < full.replace(/<[^>]+>/g,'').length){
      clearInterval(typing);$txt.innerHTML=full;showChoices(cur);
    }
  });
  function go(id){
    if(typeof id==='function'){ id(); return; }
    const node=NODES[id];
    if(!node){ console.warn('missing node',id); return; }
    render(node);
  }
  return {go,render};
})();

/* ============================================================
   STORY NODES
   ============================================================ */
const NODES = {

/* ---------- CHAPTER 1 ---------- */
c1:{chapter:"Chapter 1 — The First Stream", speaker:"narrator", cls:"narr", face:{who:'lou',expr:'cry'},
  art:"🌙", bg:"radial-gradient(circle at 50% 30%,#241a2e,#0d0b12)", stream:true,
  text:"It's 1&nbsp;a.m. Elias can't sleep. He clicks a clip: a French streamer mid-meltdown over the ending of an indie game — half-apologizing to chat, half-yelling at it, in two languages at once.",
  next:"c1b"},
c1b:{chapter:"Chapter 1 — The First Stream", speaker:"Lou", cls:"lou", expr:'angry', art:"🎧", stream:true,
  bg:"radial-gradient(circle at 30% 40%,#3a1f1a,#0d0b12)",
  text:"<span class='fr'>\"Non mais c'est nul, arrêtez de spam—\"</span> okay, okay, I know it's stupid to cry at a game. <em>I know.</em> But art's supposed to hurt a little. If you don't get that, log off.",
  next:"c1c"},
c1c:{chapter:"Chapter 1 — The First Stream", speaker:"narrator", cls:"narr", art:"💬", stream:true,
  text:"Alerts overlap. Chat spams frog emotes and hearts, everyone performing love at her, loud. Elias should close the tab. Instead he hovers over the message box. Some love stories are decided by one small act of attention.",
  choices:[
    {label:"💙 send a single blue heart", cold:true, effect:()=>{S.flags.heart=true;bump(10);bumpAud(2);toast("Lou clocked the quiet one.");}, to:"c1heart"},
    {label:"😂 spam the frog like everyone else", effect:()=>{bumpAud(5);bump(-1);toast("You blended into the noise.");}, to:"c1heart"},
    {label:"✕ close the tab", effect:()=>bump(-40), to:"c1leave"},
  ]},
c1leave:{chapter:"Chapter 1 — The First Stream", speaker:"narrator", cls:"narr", face:null, art:"🌑",
  bg:"#0d0b12",
  text:"He closes the tab. Not dramatically. Just quietly. He never learns her name. She never learns his. The story ends here — the way most almost-loves do.",
  choices:[{label:"…try again", effect:()=>bump(50), to:"c1"}]},
c1heart:{chapter:"Chapter 1 — The First Stream", speaker:"narrator", cls:"narr", face:{who:'elias',expr:'soft'}, art:"💙", stream:true,
  text:"Everyone performs affection loudly. Lou tunes most of it out — but she reads usernames obsessively, especially the silent ones. <span class='sv'>EliasNordicBlue</span>. She clocks it. Not because it's romantic. Because it's restrained, and restraint is rare in her chat.",
  next:"c1race_intro"},
c1race_intro:{chapter:"Chapter 1 — The First Stream", speaker:"Lou", cls:"lou", expr:'laugh', art:"🏃‍♀️", stream:true,
  text:"\"Okay chat, NEW BIT — quiet boy, you. I'm gonna out-run you across the rooftops. Loser admits feelings first. <span class='fr'>Allez, le singe, bouge.</span>\"",
  next:()=>RunnerGame.start(1)},

/* after runner 1 + fight 1 -> chapter 2 */
c2:{chapter:"Chapter 2 — Le problème des émotions", speaker:"narrator", cls:"narr", face:{who:'lou',expr:'neutral'}, art:"🎙️",
  bg:"radial-gradient(circle at 60% 30%,#2a1d2e,#0d0b12)",
  text:"After a stream that went badly, Lou sends Elias a four-minute voice note: three emotions, two tangents, one meme, one joke hiding a worry, one demand for reassurance she'd deny making. Elias listens three times. He still can't tell what she actually wants.",
  next:"quiz_intro"},
quiz_intro:{chapter:"Chapter 2 — Decode Lou's Emotions", speaker:"Elias", cls:"elias", art:"❓",
  text:"\"I want to get this right.\" Help him translate. <span class='sv'>Lou speaks in implication; Elias only understands action. She thinks he's not trying. He's trying so hard he's frozen.</span>",
  next:()=>quiz.start()},

/* after quiz */
c2sleep:{chapter:"Chapter 2 — The First Real Connection", speaker:"narrator", cls:"narr", face:{who:'lou',expr:'sleep'}, art:"😴",
  bg:"linear-gradient(160deg,#2a1d2e 0%,#1a2230 100%)",
  text:"Lou falls asleep on the Discord call mid-sentence. Elias stays connected — silently — for three hours, working to the sound of her breathing and her keyboard. Nothing romantic is said. It's the closest he's felt to anyone in months. For her it's just Tuesday.",
  action:()=>{bump(8);},
  next:"singe1"},

/* ---------- THE SINGE BEAT ---------- */
singe1:{chapter:"Chapter 2 — One Small Word", speaker:"Lou", cls:"lou", expr:'laugh', art:"🐵",
  bg:"radial-gradient(160deg,#2a1d2e,#1a1622)",
  text:"She wakes around 5&nbsp;a.m., sees he's still there, and grins. <span class='fr'>\"T'es resté? Mon petit singe, va.\"</span> <em>You stayed? My little monkey.</em> She means it as warm. It doesn't land warm. <em>Singe.</em> Monkey. Her entertainment.",
  choices:[
    {label:"let it slide. it's just how she talks.", cold:true,
      effect:()=>{S.flags.singe='slide';bump(2);toast("You swallowed it. Again.");}, to:"singe_slide"},
    {label:"tease back — \"only if you're the organ-grinder.\"",
      effect:()=>{S.flags.singe='tease';bump(4);bumpAud(0);toast("She laughed. Crisis postponed.");}, to:"singe_tease"},
    {label:"\"…actually, I don't love that name.\"", cold:true,
      effect:()=>{S.flags.singe='ask';bump(6);toast("You said the true thing. Risky.");}, to:"singe_ask"},
  ]},
singe_slide:{chapter:"Chapter 2 — One Small Word", speaker:"narrator", cls:"narr", face:{who:'elias',expr:'neutral'}, art:"🐵",
  text:"He lets it go, like he lets most things go. It's a small word. He can carry a small word. He's carrying a lot of small words by now — a whole pocketful he never empties.",
  next:"c3"},
singe_tease:{chapter:"Chapter 2 — One Small Word", speaker:"Lou", cls:"lou", expr:'laugh', art:"😄",
  text:"\"<em>L'orgue de Barbarie</em> — ha. See, THIS is why I keep you.\" It's affection, real affection, the kind she only does sideways. He'll take sideways. Sideways is more than most people give him.",
  next:"c3"},
singe_ask:{chapter:"Chapter 2 — One Small Word", speaker:"Elias", cls:"elias", expr:'soft', art:"💙",
  text:"A pause on the line. He braces for her to snap — she snaps easily. Instead, quiet: <span class='fr'>\"…okay. Pas singe. Noted.\"</span> She keeps slipping and saying it anyway. But she <em>noticed</em>. From Lou, being noticed back is the whole prize.",
  action:()=>bump(3),
  next:"c3"},

/* ---------- CHAPTER 3 SWEDEN ---------- */
c3:{chapter:"Chapter 3 — Första resan", speaker:"narrator", cls:"narr", face:{who:'both',lExpr:'neutral',eExpr:'neutral'}, art:"🇸🇪",
  bg:"linear-gradient(160deg,#1a2535,#0d0b12)", snow:true,
  text:"Lou visits Sweden. Less internet. No chat to perform for. More reality than she's comfortable with. Choose a memory to step into.",
  choices:[
    {label:"🏙️ Stockholm", to:"c3stockholm"},
    {label:"🧊 the frozen lake", cold:true, to:"c3lake"},
    {label:"☕ the café", to:"c3cafe"},
  ]},
c3stockholm:{chapter:"Chapter 3 — Stockholm", speaker:"Lou", cls:"lou", expr:'laugh', art:"🏙️", snow:true,
  bg:"linear-gradient(160deg,#1a2535,#0d0b12)",
  text:"\"This whole city looks emotionally unavailable. Like you.\" — Elias laughs so hard he <em>snorts</em>, the first time she's heard it. She files it away to use against him forever. (She's keeping things now. That's new.)",
  action:()=>bump(4),
  next:"c3"},
c3cafe:{chapter:"Chapter 3 — The Café", speaker:"narrator", cls:"narr", face:{who:'both',lExpr:'soft',eExpr:'soft'}, art:"☕", snow:true,
  bg:"linear-gradient(160deg,#2a2230,#0d0b12)",
  text:"The café owner assumes they're married. Lou opens her mouth to correct him — fast, like always — and then… doesn't. Neither does Elias. They walk out in a silence that, for once, she doesn't rush to fill.",
  action:()=>bump(5),
  next:"c3"},
c3lake:{chapter:"Chapter 3 — The Frozen Lake", speaker:"Lou", cls:"lou", art:"🧊", snow:true,
  bg:"linear-gradient(160deg,#16202e,#0d0b12)",
  text:"Lou talks and talks, because silence terrifies her — silence is where people leave. Then, quietly, almost angry about it: \"Do you ever feel like people only love a <em>version</em> of you? Like, the one that streams well?\"",
  next:"c3lake2"},
c3lake2:{chapter:"Chapter 3 — The Frozen Lake", speaker:"Elias", cls:"elias", expr:'soft', art:"🧊", snow:true,
  bg:"linear-gradient(160deg,#16202e,#0d0b12)",
  text:"A long pause. The kind that used to make her want to scream.<br><br><span class='sv'>\"…Yes.\"</span>",
  next:"c3lake3"},
c3lake3:{chapter:"Chapter 3 — The Frozen Lake", speaker:"narrator", cls:"narr", face:{who:'lou',expr:'soft'}, art:"❄️", snow:true,
  bg:"linear-gradient(160deg,#16202e,#0d0b12)",
  text:"It's the first time Lou understands: his silence isn't him leaving. It's him being careful. She's spent her whole life reading silence as the door closing. With him, it's the opposite.",
  action:()=>{S.flags.lakeAnswered=true;bump(12);},
  next:()=>RunnerGame.start(2)},

/* after runner 2 + fight 2 -> chapter 4 */
c4:{chapter:"Chapter 4 — La grande dispute", speaker:"narrator", cls:"narr", face:{who:'lou',expr:'angry'}, art:"💢",
  bg:"radial-gradient(circle at 40% 60%,#3a1820,#0d0b12)", stream:true,
  text:"They fight — about something small that wasn't small. Lou runs hot, says three cruel things in ten seconds, and reaches for the one she knows stings: she calls him <span class='fr'>singe</span> like an insult now, not a pet name. Then, still shaking, she does the thing she always does when she's hurt. She goes live.",
  next:"c4stream"},
c4stream:{chapter:"Chapter 4 — La grande dispute", speaker:"Lou (LIVE)", cls:"lou", expr:'angry', art:"🔴", stream:true,
  bg:"radial-gradient(circle at 50% 40%,#3a1820,#0d0b12)",
  text:"The chat is already filling. She could vent the whole fight to forty thousand people who'll take her side instantly — or she could close the laptop and say the hard thing to the one person it's actually about. Audience love is faster. It's just pointed the wrong way.",
  choices:[
    {label:"📣 vent it all to chat (they'll defend Loupiote)",
      effect:()=>{bumpAud(16);bump(-14);toast("Chat erupts. Elias goes very quiet.");}, to:"c4overshared"},
    {label:"⏹ end stream. take it to him.", cold:true,
      effect:()=>{bumpAud(-10);bump(8);toast("Forty thousand people, muted. One person, reached.");}, to:"c4texts_intro"},
  ]},
c4overshared:{chapter:"Chapter 4 — La grande dispute", speaker:"narrator", cls:"narr", art:"📈", stream:true,
  text:"The clip travels by morning. The audience meter spikes; strangers pile on Elias's silence with her. He doesn't fire back. He just disappears — not to punish her, to <em>regulate</em>. She reads the silence as abandonment. He reads the broadcast as betrayal. Both of them hurting the other while trying to protect themselves.",
  next:"c4texts_intro"},
c4texts_intro:{chapter:"Chapter 4 — La grande dispute", speaker:"narrator", cls:"narr", face:null, art:"💬",
  text:"Hours later. No audience now — just two phones and the distance between them. Typing bubbles appear, vanish, return. You can delete a message before it sends. Choose what actually crosses the gap.",
  next:()=>TextGame.start()},

/* climax, set after text minigame */
c4climax:{chapter:"Chapter 4 — La grande dispute", speaker:"Elias", cls:"elias", expr:'warm', art:"💙",
  bg:"linear-gradient(160deg,#1a2230,#2a1820)",
  text:"\"I don't always know what you mean. I get it wrong, constantly. And I hate the name. But —\"<br><br><b>\"I stay even when I don't understand. That's the part you can count on.\"</b>",
  next:"c4climax2"},
c4climax2:{chapter:"Chapter 4 — La grande dispute", speaker:"narrator", cls:"narr", face:{who:'both',lExpr:'soft',eExpr:'warm'}, art:"🫶",
  text:"Not \"I understand you perfectly.\" Not \"you're easy to love\" — she isn't, and he won't lie. Just: I stay. Lou has been loved loudly by thousands and it never once felt like this. She doesn't say that. But she stops typing the cruel thing.",
  action:()=>bump(10),
  next:"final"},

/* ---------- FINAL ---------- */
final:{chapter:"Final Chapter — When You Call Me", speaker:"narrator", cls:"narr", face:{who:'both',lExpr:'soft',eExpr:'soft'}, art:"📞",
  bg:"#05040a",
  text:"They mostly text. Voice feels too intimate, too real, no edit button. So the final chapter begins the way the whole game began: with a phone, ringing.",
  next:()=>PhoneCall.start()},
};

/* ============================================================
   DECODE-LOU QUIZ
   ============================================================ */
const quiz = (function(){
  const Q=[
    {q:"\"I'm fine.\" — what does Lou actually mean?",
     a:[["She is, in fact, fine.",0],["Ask me one more time. Gently. Then I'll tell you.",2],["Leave me alone forever.",0]]},
    {q:"She sends a playlist at 2&nbsp;a.m. Why?",
     a:[["She wants song recommendations back.",0],["It's a confession in the only language that doesn't scare her.",2],["Her phone glitched.",0]]},
    {q:"\"whatever lol\" translates to…",
     a:[["genuine indifference",0],["\"this matters to me and I'm terrified it doesn't to you\"",2],["a typo",0]]},
    {q:"She's spiralling. What reassurance actually works?",
     a:[["\"Calm down, it's not a big deal.\"",0],["Stay on the call. Don't leave. Don't fix it. Just don't leave.",2],["A long, logical explanation of why she's wrong.",0]]},
  ];
  let i=0;
  function start(){ i=0; ask(); }
  function ask(){
    if(i>=Q.length){ done(); return; }
    const node=Q[i];
    story.render({
      chapter:"Chapter 2 — Decode Lou's Emotions",
      speaker:"Lou (decode "+(i+1)+"/"+Q.length+")", cls:"lou", art:"🧩",
      bg:"radial-gradient(circle at 50% 40%,#2a1d2e,#0d0b12)",
      text:node.q,
      choices:node.a.map(opt=>({
        label:opt[0],
        effect:()=>{ if(opt[1]>0){Sound.good();S.flags.quiz++;bump(opt[1]);} else {Sound.bad();bump(-1);} },
        to:()=>{ i++; setTimeout(ask,260); }
      }))
    });
  }
  function done(){
    const good=S.flags.quiz;
    story.render({
      chapter:"Chapter 2 — Decode Lou's Emotions", speaker:"narrator", cls:"narr", art:"🪞",
      text:"You decoded "+good+"/"+Q.length+" correctly. "+(good>=3
        ? "You're learning her grammar of implication. It's hard, and it's exhausting, and she will never grade you on it. Misunderstanding her is just this easy."
        : "You misread her more than once. So does Elias. The game was never about getting it right — it's about staying to try again."),
      next:"c2sleep"
    });
  }
  return {start};
})();

/* ============================================================
   TEXT-MESSAGE MINIGAME (Chapter 4)
   ============================================================ */
const TextGame=(function(){
  const beats=[
    {ctx:"Lou typed three furious paragraphs. The bubble blinks, loaded.",
     opt:[["send all three paragraphs",-3],["delete them. send: \"i got scared. that's all it was.\"",4]]},
    {ctx:"Elias has been silent 40 minutes. Your move, as Lou.",
     opt:[["\"forget it. obviously you don't care.\"",-3],["\"i don't need you to fix it. i need to know you didn't leave.\"",4]]},
    {ctx:"Elias is typing… deleting… typing. Your move, as Elias.",
     opt:[["\"you shouldn't have put us on stream.\"",-2],["\"i went quiet to think, not to leave. i'm still here.\"",4]]},
  ];
  let i=0;
  function start(){ i=0; beat(); }
  function beat(){
    if(i>=beats.length){ story.go('c4climax'); return; }
    const b=beats[i];
    story.render({
      chapter:"Chapter 4 — La grande dispute",
      speaker:"text thread ("+(i+1)+"/"+beats.length+")", cls:"narr", art:"📱",
      bg:"radial-gradient(circle at 40% 60%,#2a1820,#0d0b12)",
      text:b.ctx,
      choices:b.opt.map(o=>({
        label:o[0],
        cold:o[1]>0,
        effect:()=>{ if(o[1]>0){Sound.good();if(o[0].startsWith('delete'))S.flags.deleted++;}else Sound.bad(); bump(o[1]); },
        to:()=>{ i++; setTimeout(beat,260); }
      }))
    });
  }
  return {start};
})();

/* ============================================================
   CANVAS — shared setup
   ============================================================ */
const cv=document.getElementById('cv'), ctx2=cv.getContext('2d');
const W=cv.width, H=cv.height;
const banner=document.getElementById('game-banner');
const help=document.getElementById('game-help');
const input={left:false,right:false,jump:false,jumpEdge:false,act:false,actEdge:false};

window.addEventListener('keydown',e=>{
  if(['ArrowLeft','a','A'].includes(e.key)) input.left=true;
  if(['ArrowRight','d','D'].includes(e.key)) input.right=true;
  if([' ','ArrowUp','w','W'].includes(e.key)){ if(!input.jump)input.jumpEdge=true; input.jump=true; e.preventDefault();}
  if(['x','X','Enter','f','F'].includes(e.key)){ if(!input.act)input.actEdge=true; input.act=true; }
});
window.addEventListener('keyup',e=>{
  if(['ArrowLeft','a','A'].includes(e.key)) input.left=false;
  if(['ArrowRight','d','D'].includes(e.key)) input.right=false;
  if([' ','ArrowUp','w','W'].includes(e.key)) input.jump=false;
  if(['x','X','Enter','f','F'].includes(e.key)) input.act=false;
});
function bindPad(){
  const pad=document.getElementById('pad');
  if(isTouch) pad.classList.add('show');
  const L=document.getElementById('padL'),R=document.getElementById('padR'),A=document.getElementById('padA');
  const dn=(set)=>(e)=>{e.preventDefault();set(true);};
  const up=(set)=>(e)=>{e.preventDefault();set(false);};
  L.ontouchstart=L.onmousedown=dn(v=>input.left=v); L.ontouchend=L.onmouseup=up(v=>input.left=v);
  R.ontouchstart=R.onmousedown=dn(v=>input.right=v); R.ontouchend=R.onmouseup=up(v=>input.right=v);
  A.ontouchstart=A.onmousedown=(e)=>{e.preventDefault();if(!input.jump)input.jumpEdge=true;input.jump=true;if(!input.act)input.actEdge=true;input.act=true;};
  A.ontouchend=(e)=>{e.preventDefault();input.jump=false;input.act=false;};
}
bindPad();

let rafId=null, loopFn=null;
function startLoop(fn){ stopLoop(); loopFn=fn; const step=(t)=>{ if(!loopFn)return; loopFn(t); input.jumpEdge=false; input.actEdge=false; rafId=requestAnimationFrame(step);}; rafId=requestAnimationFrame(step); }
function stopLoop(){ if(rafId)cancelAnimationFrame(rafId); rafId=null; loopFn=null; }

function showCanvasMsg(title,sub,btnLabel,cb){
  const div=document.createElement('div');
  div.className='center-msg';
  div.innerHTML=`<h2>${title}</h2><p>${sub}</p>`;
  const b=document.createElement('button');b.className='start-btn';b.textContent=btnLabel;
  b.onclick=()=>{Sound.ui();div.remove();cb();};
  div.appendChild(b);
  document.getElementById('game-wrap').appendChild(div);
}

// pixel-person drawing helper
function drawRunner(x,y,col,hair,w=26,h=40,run=0,facing=1){
  ctx2.save();ctx2.translate(x,y);
  ctx2.fillStyle='#23202b';
  const swing=Math.sin(run)*7;
  ctx2.fillRect(-7, h-14, 6, 14+ (facing>0?swing:-swing));
  ctx2.fillRect(2,  h-14, 6, 14- (facing>0?swing:-swing));
  ctx2.fillStyle=col;
  ctx2.fillRect(-9,8,18,h-20);
  ctx2.fillStyle='#f0d7c2';
  ctx2.fillRect(-7,-6,14,15);
  ctx2.fillStyle=hair;
  ctx2.fillRect(-8,-9,16,7);
  ctx2.fillRect(facing>0?5:-8,-9,3,12);
  ctx2.fillStyle=col;
  ctx2.fillRect(facing>0?6:-9, 12, 5, 16+Math.sin(run+1)*4);
  ctx2.restore();
}

/* ============================================================
   GAME 1 & 2 — RUNNER: Lou races Elias
   ============================================================ */
const RunnerGame=(function(){
  let level=1, st;
  function start(lvl){
    level=lvl||1;
    show('game');
    document.getElementById('meter').classList.add('show');
    document.getElementById('meter').classList.remove('with-aud');
    banner.textContent = level===1
      ? "RACE — Lou vs Elias // 'loser admits feelings first'"
      : "RACE 2 — across the frozen lake";
    help.innerHTML = isTouch
      ? "tap ● to jump · reach the finish before Elias"
      : "SPACE / ↑ = jump · reach the finish before Elias · hold to keep pace";
    init();
    showCanvasMsg(level===1?"THE FIRST STREAM":"FÖRSTA RESAN",
      level===1?"Out-run the quiet boy across the rooftops.":"Race him across the ice. Don't slip into silence.",
      "▶ run", ()=>startLoop(frame));
  }
  function init(){
    st={
      lou:{x:120,y:300,vy:0,onGround:true,run:0},
      dist:0, finish:2600, speed:4.2, baseSpeed:4.2,
      obstacles:[], spawn:0,
      eliasDist:0, eliasSpeed: level===1?3.9:4.05,
      over:false, won:false, slipped:0,
    };
    let d=600;
    while(d<st.finish-200){ st.obstacles.push({d, hit:false, kind: Math.random()<.5?'gap':'box'}); d+=260+Math.random()*200; }
  }
  function frame(){
    const s=st;
    ctx2.clearRect(0,0,W,H);
    const g=ctx2.createLinearGradient(0,0,0,H);
    if(level===1){ g.addColorStop(0,'#241a2e');g.addColorStop(1,'#3a1f1a'); }
    else { g.addColorStop(0,'#16202e');g.addColorStop(1,'#1a2535'); }
    ctx2.fillStyle=g;ctx2.fillRect(0,0,W,H);
    ctx2.fillStyle='rgba(255,255,255,.15)';
    for(let i=0;i<40;i++){ const px=(i*120 - s.dist*0.3)%(W+40); ctx2.fillRect((px+W+40)%(W+40)-20, 30+(i*53)%140, 2,2); }

    if(!s.over){
      s.dist += s.speed;
      s.eliasDist += s.eliasSpeed;
      s.lou.run += s.speed*0.05;
      const L=s.lou;
      if(input.jumpEdge && L.onGround){ L.vy=-12; L.onGround=false; Sound.blip(520,.07,'square',.05); }
      L.vy+=0.6; L.y+=L.vy;
      if(L.y>=300){ L.y=300; L.vy=0; L.onGround=true; }
      for(const o of s.obstacles){
        const screenX = 120 + (o.d - s.dist);
        if(!o.hit && screenX<150 && screenX>90){
          if(L.onGround && L.y>290){
            o.hit=true; s.speed=Math.max(2.4,s.speed-1.4); s.slipped++; Sound.bad();
            banner.textContent = level===1? "tripped on a cable!" : "slipped on the ice!";
          } else { o.hit=true; s.speed=Math.min(s.baseSpeed+0.6,s.speed+0.2); Sound.blip(700,.05,'square',.04);}
        }
      }
      s.speed += (s.baseSpeed - s.speed)*0.01;
      if(s.dist>=s.finish){ s.over=true; s.won=true; finishRace(true); }
      else if(s.eliasDist>=s.finish){ s.over=true; s.won=false; finishRace(false); }
    }

    ctx2.fillStyle = level===1? '#1a141f' : '#223247';
    ctx2.fillRect(0,340,W,H-340);
    ctx2.strokeStyle= level===1?'rgba(242,193,78,.25)':'rgba(184,176,207,.3)';
    ctx2.beginPath();ctx2.moveTo(0,340);ctx2.lineTo(W,340);ctx2.stroke();

    for(const o of s.obstacles){
      const sx=120+(o.d - s.dist);
      if(sx<-40||sx>W+40)continue;
      if(o.kind==='box'){ ctx2.fillStyle=o.hit?'#555':'#7a4'; ctx2.fillRect(sx-12,316,24,24);}
      else { ctx2.fillStyle='#0a0810'; ctx2.fillRect(sx-16,340,32,40);}
    }
    const fsx=120+(s.finish - s.dist);
    if(fsx<W+60){ for(let i=0;i<8;i++){ ctx2.fillStyle=i%2?'#fff':'#000'; ctx2.fillRect(fsx, 250+i*12, 14,12);} }

    const gap = (s.dist - s.eliasDist);
    const eliasScreenX = 120 - gap*0.6;
    drawRunner(Math.max(20,Math.min(W-40,eliasScreenX)), 300, '#6e93bd', '#e0c98a', 26,40, s.lou.run*0.9, 1);
    drawRunner(120, s.lou.y, '#d8693b', '#6b3a22', 26,40, s.lou.run, 1);

    ctx2.fillStyle='#f4ead5';ctx2.font='13px monospace';
    ctx2.fillText(gap>=0? "Lou leads by "+Math.round(gap) : "Elias leads by "+Math.round(-gap), 16,24);
    ctx2.fillText(Math.round(Math.min(100,s.dist/s.finish*100))+"%",W-60,24);
  }
  function finishRace(won){
    stopLoop();
    if(won){ bump(8); Sound.good(); }
    else { bump(-4); Sound.bad(); }
    setTimeout(()=>{
      showCanvasMsg(
        won? (level===1?"Lou wins. Elias has to admit it first.":"She beats him across the lake."):
             (level===1?"Elias wins by a step.":"He waits for her at the far shore."),
        won? "\"told you, le singe.\" He just smiles — which, from him, is a paragraph."
           : "He doesn't gloat. He offers a hand. Different people, different finish lines.",
        "next ▸",
        ()=> MonkeyFight.start(level)
      );
    },700);
  }
  return {start};
})();

/* ============================================================
   MONKEY FIGHT — gremlins of "you're too much"
   ============================================================ */
const MonkeyFight=(function(){
  let level=1, st;
  function start(lvl){
    level=lvl||1;
    show('game');
    document.getElementById('meter').classList.add('show');
    document.getElementById('meter').classList.remove('with-aud');
    banner.textContent = "MONKEY FIGHT — the gremlins of 'you're too much'";
    help.innerHTML = isTouch
      ? "◀ ▶ move · ● punch · clear the monkeys"
      : "← → move · X / Enter = punch · clear the wave";
    init();
    showCanvasMsg("INTERLUDE — LES SINGES",
      "Between rounds, the monkeys come: every intrusive thought that whispers <i>you're too loud, too much, impossible to love</i>. Lou punches back.",
      "▶ fight", ()=>startLoop(frame));
  }
  function init(){
    st={ lou:{x:W/2,facing:1,punch:0,run:0}, monkeys:[], spawn:0, killed:0,
      target: level===1?8:11, hp:3, over:false, win:false, t:0, hurtCD:0 };
  }
  function spawnMonkey(){
    const fromLeft=Math.random()<.5;
    st.monkeys.push({ x: fromLeft? -30 : W+30, y:300+Math.random()*20-10,
      dir: fromLeft?1:-1, spd:1+Math.random()*1.2+level*0.2, bob:Math.random()*6, alive:true, hitFlash:0 });
  }
  function frame(){
    const s=st; s.t++;
    ctx2.clearRect(0,0,W,H);
    const g=ctx2.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#2a1620');g.addColorStop(1,'#1a1018');
    ctx2.fillStyle=g;ctx2.fillRect(0,0,W,H);
    ctx2.fillStyle='#140d14';ctx2.fillRect(0,340,W,H-340);

    if(!s.over){
      s.spawn--;
      if(s.spawn<=0 && (s.killed+s.monkeys.filter(m=>m.alive).length)<s.target){
        spawnMonkey(); s.spawn=70-level*8 - Math.random()*20;
      }
      const L=s.lou;
      if(input.left){ L.x-=4.5; L.facing=-1; }
      if(input.right){ L.x+=4.5; L.facing=1; }
      L.x=Math.max(30,Math.min(W-30,L.x));
      L.run += (input.left||input.right)?0.2:0;
      if(s.hurtCD>0)s.hurtCD--;
      if(input.actEdge && L.punch<=0){ L.punch=12; Sound.hit();
        for(const m of s.monkeys){
          if(!m.alive)continue;
          const inFront = (L.facing>0 && m.x>L.x && m.x<L.x+70) || (L.facing<0 && m.x<L.x && m.x>L.x-70);
          if(inFront && Math.abs(m.y-300)<40){ m.alive=false; m.hitFlash=14; s.killed++; Sound.blip(300,.08,'square',.06); bump(0.6); }
        }
      }
      if(L.punch>0)L.punch--;
      for(const m of s.monkeys){
        if(!m.alive){ m.hitFlash--; continue; }
        m.x += m.dir*m.spd; m.bob+=0.2;
        if(Math.abs(m.x-L.x)<26 && s.hurtCD<=0){
          s.hp--; s.hurtCD=50; Sound.bad(); m.alive=false; m.hitFlash=10;
          if(s.hp<=0){ s.over=true; s.win=false; endFight(); }
        }
      }
      s.monkeys=s.monkeys.filter(m=>m.alive||m.hitFlash>0);
      if(s.killed>=s.target){ s.over=true; s.win=true; endFight(); }
    }

    ctx2.strokeStyle='rgba(224,163,163,.3)';ctx2.beginPath();ctx2.moveTo(0,340);ctx2.lineTo(W,340);ctx2.stroke();
    for(const m of s.monkeys){
      ctx2.save();ctx2.translate(m.x, m.y+Math.sin(m.bob)*4);
      if(m.hitFlash>0){ ctx2.globalAlpha=Math.max(0,m.hitFlash/14); ctx2.fillStyle='#fff';
        ctx2.font='22px serif';ctx2.fillText('💥',-10,0);ctx2.restore();continue;}
      ctx2.font='30px serif';ctx2.fillText('🐒',-16,8);
      ctx2.restore();
    }
    drawFighter(s.lou.x,300,s.lou.facing,s.lou.punch>6, s.hurtCD>40);
    ctx2.fillStyle='#f4ead5';ctx2.font='14px monospace';
    ctx2.fillText("monkeys cleared: "+s.killed+" / "+s.target, 16,26);
    ctx2.fillText("❤".repeat(Math.max(0,s.hp))+"·".repeat(3-Math.max(0,s.hp)), W-70,26);
  }
  function drawFighter(x,y,facing,punching,hurt){
    ctx2.save();ctx2.translate(x,y);ctx2.scale(facing,1);
    if(hurt && Math.floor(performance.now()/100)%2) ctx2.globalAlpha=.5;
    ctx2.fillStyle='#23202b';ctx2.fillRect(-7,26,6,14);ctx2.fillRect(2,26,6,14);
    ctx2.fillStyle='#d8693b';ctx2.fillRect(-9,8,18,20);
    ctx2.fillStyle='#f0d7c2';ctx2.fillRect(-7,-6,14,15);
    ctx2.fillStyle='#6b3a22';ctx2.fillRect(-8,-9,16,7);
    ctx2.fillStyle='#d8693b';
    if(punching){ ctx2.fillRect(8,10,24,7); ctx2.fillStyle='#f0d7c2';ctx2.fillRect(30,9,9,9);}
    else { ctx2.fillRect(6,12,6,16); }
    ctx2.restore();
  }
  function endFight(){
    stopLoop();
    const win=st.win;
    if(win){bump(6);Sound.good();}else{bump(-3);Sound.bad();}
    setTimeout(()=>{
      const cont = level===1? ()=>story.go('c2') : ()=>story.go('c4');
      showCanvasMsg(
        win?"The monkeys scatter.":"The monkeys win this round.",
        win? "The voices quiet — for now. Elias texts: <span style='color:#6e93bd'>\"you ok? brought you water (metaphorically).\"</span>"
           : "She's overwhelmed. But Elias stays on the line anyway. That's the whole point.",
        "continue the story ▸",
        cont
      );
    },700);
  }
  return {start};
})();

/* ============================================================
   FINAL — THE PHONE CALL + endings
   ============================================================ */
const PhoneCall=(function(){
  let waited=0, timer=null, monoTimer=null;
  const monologues=[
    "Lou: \"What if his real voice changes everything?\"",
    "Lou: \"What if I'm only good at this from behind a screen?\"",
    "Elias: \"Pick up. Or don't. I'll still be here either way.\"",
    "Lou: \"He'd actually still be here. That's the scary part.\"",
    "Lou: \"…okay. okay. breathe.\"",
  ];
  function start(){
    show('vn');
    document.getElementById('meter').classList.remove('show');
    const vn=document.getElementById('vn');
    vn.innerHTML='';
    const c=document.createElement('div');
    c.id='callscreen';c.className='center-msg';c.style.background='#05040a';
    c.innerHTML=`
      <div class="call-ring">📞</div>
      <div class="call-name">Elias is calling…</div>
      <div class="call-sub">pixel stars drift. lo-fi hums. the screen is almost black.</div>
      <div class="call-monologue" id="mono">${monologues[0]}</div>
      <div class="call-btns"><button class="call-btn answer" id="answer">📞</button></div>
      <p class="mono" style="margin-top:16px;color:#6e93bd;font-size:11px">(you can wait. the longer you wait, the more she thinks.)</p>`;
    vn.appendChild(c);
    Sound.ring();
    timer=setInterval(()=>{Sound.ring();},2600);
    let mi=0;
    monoTimer=setInterval(()=>{ mi=(mi+1); waited++; if(mi<monologues.length){ document.getElementById('mono').textContent=monologues[mi]; } },2600);
    document.getElementById('answer').onclick=answer;
  }
  function answer(){
    clearInterval(timer);clearInterval(monoTimer);Sound.ui();
    const vn=document.getElementById('vn');
    const callsHim = S.flags.singe==='ask'
      ? "She almost says \"mon petit singe\" — then doesn't. \"Hey. …Elias.\" His actual name. From her, that's a whole confession."
      : "\"…hey, mon petit singe.\" The name he never liked. He smiles anyway. It's hers, so he keeps it.";
    vn.innerHTML=`<div class="center-msg" style="background:#070510">
      <div style="width:190px;margin:0 auto">${Characters.svg('elias','warm')}</div>
      <h2 class="elias">"${S.flags.singe==='ask'?'Hey. …Elias.':'mon petit singe.'}"</h2>
      <p>${callsHim}</p>
      <button class="start-btn" id="toEnd">see how it ends ▸</button></div>`;
    setBlend(Math.max(.6,S.connection/100));
    document.getElementById('toEnd').onclick=ending;
  }
  function ending(){
    Sound.ui();
    const vn=document.getElementById('vn');
    let title,emoji,body,bg,cls;
    if(S.connection>=72){
      title="ENSEMBLE À STOCKHOLM 🔥"; emoji="🔥"; cls="lou";
      bg="linear-gradient(160deg,#3a1f1a,#1a2535)";
      body="The hopeful ending — not the perfect one. Lou will never love quietly, and she'll never love easy. But she lets Elias closer than she lets the forty thousand, and from her, that's everything. He still doesn't fully understand her. He stays anyway.<br><br><em>Final image: the two of them assembling IKEA furniture, arguing lovingly about the instructions. She calls him singe. He lets it go.</em>";
    } else if(S.connection>=40){
      title="STILL FIGURING IT OUT ❄"; emoji="❄"; cls="elias";
      bg="linear-gradient(160deg,#1a2535,#2a1d2e)";
      body="The honest ending. He loves her more than she loves him, and they both know it, and they keep going anyway. Some nights that feels like enough. Some nights it doesn't.<br><br><em>The last scene isn't dramatic. Just: another phone call. Another night. Another attempt.</em>";
    } else {
      title="WE BURNED BEAUTIFULLY 🥀"; emoji="🥀"; cls="narr";
      bg="linear-gradient(160deg,#241a2e,#0d0b12)";
      body="The bittersweet ending. He gave more than he got, and one day that ran out. Years later, certain songs still hurt. Certain notification sounds still feel dangerous.<br><br><b>\"Some people arrive in your life like unfinished songs.\"</b>";
    }
    const endFace = S.connection>=72? Characters.two('soft','warm')
      : S.connection>=40? Characters.two('neutral','soft')
      : Characters.svg('elias','sad');
    const fw = S.connection>=40? 330 : 180;
    vn.innerHTML=`<div class="center-msg" style="background:${bg}">
      <div style="width:${fw}px;max-width:80vw;margin:0 auto 4px">${endFace}</div>
      <h2 class="${cls}">${title}</h2>
      <p style="max-width:580px">${body}</p>
      <p class="mono" style="color:#b8b0cf;font-size:12px;margin-top:8px">connexion ${Math.round(S.connection)}/100 · audience ${Math.round(S.audience)}/100 · quiz ${S.flags.quiz}/4 · deleted ${S.flags.deleted}${S.flags.vodUnlocked?' · 🐈‍⬛ VOD':''}</p>
      <button class="start-btn" id="roll">roll credits ▸</button>
    </div>`;
    document.getElementById('roll').onclick=credits;
  }
  function credits(){
    Sound.ui();
    const vn=document.getElementById('vn');
    vn.innerHTML=`<div id="credits" class="center-msg" style="background:#070510">
      <div class="credit-roll">
        <h2 style="color:#f2c14e">WHEN YOU CALL ME, SINGE</h2><br>
        a bilingual interactive love story<br><br>
        <b class="lou">LOU</b> — loud, quick to anger, only half in it<br>
        <b class="elias">ELIAS</b> — quiet, all the way in, can't read her<br>
        <b>BAUDELAIRE</b> — the cat, asleep<br><br>
        ❝ What if love is not perfect understanding?<br>What if it is patient translation? ❞<br><br>
        not soulmates. not destiny. not even fair.<br>
        just: staying on the call.<br><br>
        merci · tack · thank you for staying.<br><br>
        ♪ the music player is still playing.
      </div></div>`;
    setTimeout(()=>{
      const n=document.createElement('div');
      n.className='sub-notif';
      n.innerHTML=`<b>EliasNordicBlue</b> subscribed for 36 months.<br><span>"still here."</span>`;
      document.body.appendChild(n);
      requestAnimationFrame(()=>n.classList.add('show'));
      Sound.good();
    },9000);
  }
  return {start};
})();

/* init meters */
document.getElementById('meterfill').style.width=S.connection+'%';
document.getElementById('audfill').style.width=S.audience+'%';
setBlend(S.connection/100);
