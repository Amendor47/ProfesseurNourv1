/* =========================
   Coach — pipeline unifié
   Offline IA ++  •  Merge IA interne  •  Rendus stables
   ========================= */

// ---------- Source de vérité ----------
const CM = { meta:{title:"",lang:"fr"}, text:"", sections:[], conceptIndex:{}, qa:{ qcm:[], flashcards:[] } };

// ---------- Utils ----------
const normalize = s => (s||"").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s-]/gu," ");
const tokens = s => normalize(s).split(/\s+/).filter(w=>w.length>2);
const uniq = a => [...new Set(a)];
const clamp = (arr,min,max) => (arr.length<min? [...arr, ...arr.slice(0,Math.max(0,min-arr.length))] : arr).slice(0,Math.min(arr.length,max));
const Jaccard = (A,B)=>{ const a=new Set(A), b=new Set(B); let i=0; a.forEach(x=>b.has(x)&&i++); return i/Math.max(1,a.size+b.size-i); };

// Split FR robuste (protège ex., p.ex., nombres décimaux)
const sentSplit = t => {
  const safe = (t||"")
    .replace(/\b(p\.ex\.|ex\.|i\.e\.|e\.g\.)/gi,m=>m.replaceAll('.','∎'))
    .replace(/(\d)\.(\d)/g,'$1∎$2');
  return safe
    .split(/(?<=[.!?])\s+(?=[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ0-9])/)
    .map(s=>s.replaceAll('∎','.').trim()).filter(Boolean);
};

// ---------- IA OFFLINE (compréhension de fond) ----------
function computeGlobalStats(text){
  const secs = text.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
  const secToks = secs.map(s => tokens(s));
  const df = new Map();
  secToks.forEach(set => uniq(set).forEach(w=>df.set(w,(df.get(w)||0)+1)));
  const N = Math.max(1, secs.length);
  const idf = w => Math.log(1 + N / (1 + (df.get(w)||0)));
  return { idf, secs };
}

function scoreSentencesGlobal(sentences, idf){
  const all = sentences.map(s=>tokens(s));
  const tf = new Map(); all.flat().forEach(w=>tf.set(w,(tf.get(w)||0)+1));
  return sentences.map((s,i)=>{
    const ws=tokens(s);
    const lenPenalty = Math.abs(ws.length-18);
    const posBonus   = (i===0?2:(i<3?1:0));
    const tfidf      = uniq(ws).reduce((a,w)=>a + ((tf.get(w)||1)*idf(w)),0)/Math.max(1,ws.length);
    const deepBonus  = /\b(parce que|entra[iî]ne|implique|résulte|conduit à|donc|ainsi)\b/i.test(s) ? 0.8 : 0;
    return { s, score: tfidf + posBonus + deepBonus - (lenPenalty*0.02) };
  }).sort((a,b)=>b.score-a.score);
}

function buildSummariesRich(raw, idf){
  const S = sentSplit(raw);
  const ranked = scoreSentencesGlobal(S, idf);
  const pick = k => ranked.slice(0,k).map(r=>r.s);

  const short  = clamp(pick(6), 5, 7).join(' ');
  const medium = clamp(pick(12),10,14).join(' ');

  let base = clamp(pick(28), 22, 34);
  const example = S.find(x=>/exemple|par exemple|illustr|cas\s+(concret|pratique)?/i.test(x));
  const limit   = S.find(x=>/(limite|biais|risque|attention|contre-exemple)/i.test(x));
  const persp   = S.find(x=>/(en pratique|dans le contexte|implique|conduit à|application)/i.test(x));

  const long = [
    ...base.slice(0,6),
    example ? "Exemple clé : "+example : (base[6]||""),
    limit   ? "Limite : "+limit       : (base[7]||""),
    ...base.slice(8,18),
    persp   ? "Mise en perspective : "+persp : (base[18]||""),
    ...base.slice(19)
  ].filter(Boolean).join(' ');

  // HTML pédagogique structuré (joli par défaut)
  const bullets = base.slice(0,8).map(x=>`<li>${x}</li>`).join('');
  const html = `
    <div class="fiche-card study-cave">
      <h4>Idée centrale</h4>
      <p>${ranked[0]?.s || ''}</p>
      <h5>Points clés</h5>
      <ul>${bullets}</ul>
      ${example?`<h5>Exemple</h5><p>${example}</p>`:''}
      ${limit?  `<h5>Limites</h5><p>${limit}</p>`:''}
      ${persp?  `<h5>Mise en perspective</h5><p>${persp}</p>`:''}
    </div>`;
  return { short, medium, long, html };
}

function buildSection(id, title, raw, idf){
  const sentences = sentSplit(raw);
  // mots-clés avec idf global
  const tf = new Map(); tokens(raw).forEach(w=>tf.set(w,(tf.get(w)||0)+1));
  const keywords = [...tf.entries()]
    .map(([w,f])=>[w, f * idf(w)])
    .sort((a,b)=>b[1]-a[1]).slice(0,12).map(([w])=>w);
  const summary = buildSummariesRich(raw, idf);
  // “claims” = phrases de fond (servira aux QCM & cartes)
  const claims = scoreSentencesGlobal(sentences, idf).slice(0,8).map(r=>r.s);
  return { id, title, raw, sentences, keywords, summary, claims };
}

function buildModelFromText(text){
  CM.text = text;
  const { idf, secs } = computeGlobalStats(text);
  CM.sections = secs.map((c,i)=>{
    const t = c.split('\n')[0].replace(/^[-–•]\s*/,'').slice(0,96);
    return buildSection('S'+(i+1), t || `Section ${i+1}`, c, idf);
  });
}

function indexConcepts(){
  CM.conceptIndex={};
  CM.sections.forEach(sec=>{
    sec.keywords.forEach(k=>{
      (CM.conceptIndex[k] ||= {defs:[],mentions:[]});
      CM.conceptIndex[k].mentions.push({secId:sec.id,sent:sec.sentences[0]||sec.raw});
      const def=sec.sentences.find(x=>/\b(est|se définit|désigne|consiste)\b/i.test(x));
      if(def) CM.conceptIndex[k].defs.push({secId:sec.id,def});
    });
  });
}

// ---------- QCM de fond (questions & propositions issues du cours) ----------
function uniqueOptions(arr){
  const seen=new Set(), out=[];
  for(const x of arr){ const k=normalize(x); if(k && !seen.has(k)){ seen.add(k); out.push(x); } }
  return out;
}
function fillToFour(opts, sec){
  const pool = sec.claims.concat(sec.sentences).filter(Boolean);
  while(opts.length<4){
    const cand = pool[(Math.random()*pool.length)|0] || `Affirmation liée à ${sec.title}`;
    if(!opts.includes(cand)) opts.push(cand);
  }
  return opts.slice(0,4);
}
function contextualDistractors(sec, correct){
  const base = sec.sentences.filter(s=>s!==correct);
  const cw = uniq(tokens(correct));
  const topNearby = base
    .map(s=>({ s, sim:Jaccard(cw, uniq(tokens(s))) }))
    .sort((a,b)=>b.sim-a.sim)
    .slice(0,8)
    .map(x=>x.s);
  const transforms = [
    s => s.replace(/\b(entra[iî]ne|conduit à|provoque)\b/i,'correspond à'),
    s => s.replace(/\b(parce que|car)\b/i,'alors que'),
    s => `Généralisation hâtive : ${s}`
  ];
  const out = [];
  for(const cand of topNearby){
    const t = transforms[out.length % transforms.length];
    out.push(t(cand));
    if(out.length>=3) break;
  }
  return out.length ? out : ["Corrélation sans causalité","Cause/effet inversés","Hors contexte apparent"];
}

function makeMCQ_FromSection(sec){
  const out=[]; const sents=sec.sentences;
  // Définition / idée centrale
  const defSent = sec.claims[0] || sents[0];
  if(defSent){
    const stem = `Quelle formulation rend le mieux l’idée centrale de « ${sec.title} » ?`;
    const correct = defSent.replace(/^[-–•]\s*/,'');
    let options = uniqueOptions([correct, ...contextualDistractors(sec, correct)]);
    options = fillToFour(options, sec);
    const explain = o => (o===correct) ? "C’est la formulation la plus fidèle au texte."
                                       : "C’est une approximation/contre-sens par rapport au passage.";
    out.push({type:'definition', stem, options, answer:correct, explain});
  }
  // Causalité
  const cause = sents.find(x=>/\b(parce que|car|entra[iî]ne|conduit à|provoque|résulte)\b/i.test(x));
  if(cause){
    const stem = `Quelle relation de causalité à propos de « ${sec.title} » est la plus solide ?`;
    const correct = cause;
    let options = uniqueOptions([correct, ...contextualDistractors(sec, correct)]);
    options = fillToFour(options, sec);
    const explain = o => (o===correct) ? "Le lien de cause à effet est explicite dans le texte."
                                       : "Ici, on confond corrélation et causalité ou on inverse la relation.";
    out.push({type:'causalite', stem, options, answer:correct, explain});
  }
  // Comparaison (si détectée)
  const cmp = sents.find(x=>/\b(diff[eé]re|vs|plut[oô]t que|compar[ée] à|contraire)\b/i.test(x));
  if(cmp){
    const stem = `Quelle différence essentielle ressort dans « ${sec.title} » ?`;
    const correct = cmp;
    let options = uniqueOptions([correct, ...contextualDistractors(sec, correct)]);
    options = fillToFour(options, sec);
    const explain = o => (o===correct) ? "La différence est explicitée dans le passage."
                                       : "Les autres propositions sont superficielles ou hors-sujet.";
    out.push({type:'comparaison', stem, options, answer:correct, explain});
  }
  // Application (mini-cas)
  if(sents.length>=4){
    const base = sents.slice(0,3).join(' ');
    const stem = `Cas: ${base} → Quelle conclusion est la plus cohérente ?`;
    const correct = sents[3];
    let options = uniqueOptions([correct, ...contextualDistractors(sec, correct)]);
    options = fillToFour(options, sec);
    const explain = o => (o===correct) ? "C’est la conclusion alignée avec les prémisses."
                                       : "Conclusion trop générale/contradictoire ou hors contexte.";
    out.push({type:'application', stem, options, answer:correct, explain});
  }
  return out;
}
function buildQCM(){ CM.qa.qcm = CM.sections.flatMap(sec => makeMCQ_FromSection(sec)); }

// ---------- Flashcards (déf / pourquoi / effet / comparaison / exemple) ----------
function firstMatching(s,rx){ return s.find(x=>rx.test(x)) || ""; }
function dedupeCards(cards){
  const seen=new Set(), out=[];
  for(const c of cards){
    const k=(c.q+"|"+c.a).toLowerCase().trim();
    if(!seen.has(k) && c.q && c.a){ seen.add(k); out.push(c); }
  }
  return out;
}
function buildFlashcards(){
  const cards=[];
  for(const sec of CM.sections){
    const s=sec.sentences;
    const def = firstMatching(s,/\b(est|se définit|désigne|correspond|consiste)\b/i) || sec.claims[0] || s[0];
    if(def) cards.push({type:'def',q:`Qu'est-ce que « ${sec.title} » ?`,a:def});
    const why = firstMatching(s,/\b(parce que|car|afin|pour que)\b/i);
    if(why) cards.push({type:'why',q:`Pourquoi ${sec.title} ?`,a:why});
    const effect = firstMatching(s,/\b(entra[îi]ne|conduit à|provoque|résulte|implique)\b/i);
    if(effect) cards.push({type:'effect',q:`Quelles conséquences de ${sec.title} ?`,a:effect});
    const cmp = firstMatching(s,/\b(diff[eé]re|vs|plut[oô]t que|compar[ée] à|contraire)\b/i);
    if(cmp) cards.push({type:'compare',q:`Différence clé liée à « ${sec.title} » ?`,a:cmp});
    const ex = firstMatching(s,/\b(exemple|par exemple|cas|illustr)/i);
    if(ex) cards.push({type:'example',q:`Un exemple parlant de ${sec.title} ?`,a:ex});
  }
  CM.qa.flashcards = dedupeCards(cards).slice(0, 100);
}

// ---------- Fusion avec IA interne (facultatif) ----------
function mergeInternalOut(out){
  // out peut contenir: summary, keywords, plan, qcm[], flashcards[]
  // On s'en sert pour enrichir, jamais pour casser l’offline
  if(!out) return;
  // Injecter keywords/plan au niveau global si présents
  if(Array.isArray(out.sections)){
    // format attendu: [{title, raw, summary?, keywords?, claims?, qcm?, flashcards?}, ...]
    out.sections.forEach((ext, i)=>{
      const sec = CM.sections[i]; if(!sec) return;
      if(ext.title)   sec.title   = sec.title || ext.title;
      if(ext.summary) sec.summary = { ...sec.summary, ...ext.summary };
      if(ext.keywords) sec.keywords = uniq([...sec.keywords, ...ext.keywords]);
      if(ext.claims)  sec.claims  = uniq([...(sec.claims||[]), ...ext.claims]);
      if(ext.qcm)     CM.qa.qcm.push(...ext.qcm);
      if(ext.flashcards) CM.qa.flashcards.push(...ext.flashcards);
    });
  }else{
    // format simple (global)
    if(out.qcm) CM.qa.qcm.push(...out.qcm);
    if(out.flashcards) CM.qa.flashcards.push(...out.flashcards);
  }
  // dédoublonnage après merge
  CM.qa.qcm = CM.qa.qcm.filter((q,i,self)=> i===self.findIndex(z=>q.stem===z.stem));
  CM.qa.flashcards = dedupeCards(CM.qa.flashcards);
}

// ---------- Rendus ----------
function renderFiches(){
  const host = document.getElementById('sheet-output'); if(!host) return;
  host.innerHTML = CM.sections.map((s,i)=>`
    <article class="fiche" data-i="${i}">
      <h3>${s.title}</h3>
      <div class="view-toggle">
        <button data-view="short">Courte</button>
        <button data-view="medium">Moyenne</button>
        <button data-view="long">Longue</button>
        <button data-view="html" class="active">Structurée</button>
      </div>
      <div class="fiche-content">${s.summary.html}</div>
    </article>
  `).join('');
  host.querySelectorAll('.fiche').forEach(card=>{
    const idx=+card.dataset.i;
    const content=card.querySelector('.fiche-content');
    card.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const v=btn.dataset.view;
        card.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===btn));
        content.innerHTML = (v==='html') ? CM.sections[idx].summary.html : CM.sections[idx].summary[v];
      });
    });
  });
}

function renderQCM(){
  const host=document.getElementById('qcm-output'); if(!host) return;
  if(!CM.qa.qcm.length) host.innerHTML = '';
  host.innerHTML=CM.qa.qcm.map((q,i)=>`
    <div class="qcm-item" data-i="${i}">
      <p><strong>${q.stem}</strong></p>
      <div class="qcm-options">
        ${q.options.map((opt,idx)=>`<label><input type="radio" name="q-${i}" value="${idx}"> ${opt}</label>`).join('')}
      </div>
      <div class="feedback hidden"></div>
    </div>
  `).join('');
  host.querySelectorAll('.qcm-item').forEach(item=>{
    const qi=+item.dataset.i;
    const q=CM.qa.qcm[qi];
    const labels=item.querySelectorAll('label');
    const fb=item.querySelector('.feedback');
    const correctIndex=q.options.indexOf(q.answer);
    labels.forEach((lab,idx)=>{
      lab.addEventListener('click',()=>{
        labels.forEach(l=>l.classList.remove('qq-correct','qq-wrong'));
        lab.classList.add(idx===correctIndex?'qq-correct':'qq-wrong');
        fb.classList.remove('hidden');
        const chosen = q.options[idx];
        fb.textContent = (idx===correctIndex)
          ? 'Bravo ! ✔️ ' + (q.explain?.(chosen) || '')
          : `À revoir : ${q.answer}. ` + (q.explain?.(chosen) || '');
      });
    });
  });
}

function ensureFlashcardsPane(){
  let pane = document.getElementById('flashcards-pane');
  if (!pane){
    const qcmPane = document.getElementById('qcm') || document.body;
    pane = document.createElement('div');
    pane.id = 'flashcards-pane';
    qcmPane.appendChild(pane);
  }
  return pane;
}
function renderFlashcards(){
  const host = ensureFlashcardsPane();
  host.innerHTML=CM.qa.flashcards.map((fc,i)=>`
    <div class="flashcard" data-i="${i}">
      <div class="flashcard-front">${fc.q}</div>
      <div class="flashcard-back hidden">${fc.a}</div>
      <button class="flip">Retourner</button>
    </div>
  `).join('');
  host.querySelectorAll('.flashcard').forEach(card=>{
    const front=card.querySelector('.flashcard-front');
    const back=card.querySelector('.flashcard-back');
    card.querySelector('.flip').addEventListener('click',()=>{
      front.classList.toggle('hidden');
      back.classList.toggle('hidden');
    });
  });
}

// ---------- Runner unifié (Offline + Interne avec fallback) ----------
const CONFIG = { INTERNAL_TIMEOUT: 1800, MAX_CHARS: 12000 };

async function tryInternal(text){
  // Tente /analyze/fast ; retourne null si indispo ou trop lent
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), CONFIG.INTERNAL_TIMEOUT);
  try{
    const res = await fetch('/analyze/fast', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text: text.slice(0, CONFIG.MAX_CHARS) }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if(!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }catch(e){ try{ clearTimeout(timer); }catch{}; return null; }
}

async function runUnifiedPipeline(text, mode='offline', setStatus=(s)=>{}){
  // 1) Toujours construire une base OFFLINE (rapide et robuste)
  buildModelFromText(text);
  indexConcepts();
  buildQCM();
  buildFlashcards();

  // 2) Si IA interne demandée, tenter et fusionner
  if(mode!=='offline'){
    const out = await tryInternal(text);
    if(out){ mergeInternalOut(out); }
  }

  // 3) Rendus synchronisés
  renderFiches();
  renderQCM();
  renderFlashcards();
  // (Tu peux aussi rebrancher ici ton “showSection(0)” si tu as un parcours)
}

document.addEventListener('DOMContentLoaded', ()=>{
  // restauration éventuelle plus tard si tu ajoutes LocalStorage
  // ici, on laisse simple : on attend le clic “Analyser”
});

