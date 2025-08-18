// Cohesive course model and generators
// Source de vérité unique
const CM = {
  meta: { title: "", lang: "fr" },
  text: "",
  sections: [],
  conceptIndex: {},
  qa: { qcm: [], flashcards: [] }
};

// ---- Utilitaires de base ----
const sentSplit = t => (t || "").split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
const normalize = s => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s-]/gu, " ");
const uniq = arr => [...new Set(arr)];

// Simple scoring (longueur modérée, position, tf-idf local)
function scoreSentences(sentences){
  const tf = new Map();
  const toks = w => normalize(w).split(/\s+/).filter(x => x.length>2);
  const all = sentences.map(s => toks(s));
  all.flat().forEach(w => tf.set(w, (tf.get(w) || 0) + 1));
  const N = sentences.length || 1;
  return sentences.map((s,i)=>{
    const words = toks(s);
    const lenPenalty = Math.abs(words.length - 18);
    const posBonus = (i===0?2:(i<3?1:0));
    const tfidf = uniq(words).reduce((acc,w)=>{
      const f = tf.get(w)||1;
      const idf = Math.log(1 + N/(1+f));
      return acc + (f*idf);
    },0) / Math.max(1, words.length);
    return { s, score: tfidf + posBonus - (lenPenalty*0.02) };
  }).sort((a,b)=>b.score-a.score);
}

// Résumés tri-niveaux + enrichissements
function buildSummaries(raw){
  const S = sentSplit(raw);
  const ranked = scoreSentences(S);
  const pick = k => ranked.slice(0,k).map(r=>r.s);
  const short = pick(6).join(' ');
  const medium = pick(12).join(' ');
  const base = pick(24);
  const long = [
    ...base.slice(0,6),
    "Exemple clé : " + (S.find(x=>/exemple|par exemple|illustr|cas/i.test(x)) || base[6] || ""),
    "Contre-exemple / limite : " + (S.find(x=>/limite|biais|risque|attention/i.test(x)) || base[7] || ""),
    ...base.slice(8,16),
    "Mise en perspective : " + (S.find(x=>/en pratique|dans le contexte|conduit à|implique/i.test(x)) || base[16] || ""),
    ...base.slice(16,24)
  ].filter(Boolean).join(' ');
  return { short, medium, long };
}

// Générateur de section + mots-clés
function buildSection(id, title, raw){
  const sentences = sentSplit(raw);
  const freq = new Map();
  normalize(raw).split(/\s+/).forEach(w => {
    if(w.length>3) freq.set(w, (freq.get(w)||0)+1);
  });
  const keywords = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([w])=>w);
  return { id, title, raw, sentences, keywords, summary: buildSummaries(raw) };
}

// Pipeline depuis un texte complet
function buildModelFromText(text){
  CM.text = text;
  const chunks = text.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
  CM.sections = chunks.map((c,i)=>{
    const t = c.split('\n')[0].slice(0,80);
    return buildSection('S'+(i+1), t || `Section ${i+1}`, c);
  });
}

// ---- Génération QCM ----
function nearMisses(term){
  return [
    `Interprétation partielle de ${term}`,
    `Généralisation abusive liée à ${term}`,
    `Contre-exemple mal appliqué`,
    `Hypothèse non vérifiée`
  ];
}

function makeMCQ_FromSection(sec){
  const out=[];
  const sents=sec.sentences;
  const defSent=sents.find(x=>/ (est|sont|désigne|correspond|se définit)/i.test(x)) || sents[0];
  if(defSent){
    const stem=`Laquelle exprime le plus correctement la définition ou l'idée centrale de « ${sec.title} » ?`;
    const correct=defSent.replace(/^[-–•]\s*/,'');
    const ds=nearMisses(sec.title).map(d=>`${d} (mal cadré)`);
    out.push({type:'definition',stem,options:shuffle([correct,...ds]).slice(0,4),answer:correct});
  }
  const cause=sents.find(x=>/parce que|car|entraîne|conduit à|provoque|résulte/i.test(x));
  if(cause){
    const stem=`Quelle relation de causalité est la plus défendable à propos de « ${sec.title} » ?`;
    const correct=cause;
    const ds=[
      correct.replace(/(entraîne|conduit à|provoque)/i,'correspond à'),
      'Corrélation sans lien causal',
      'Effet et cause inversés'
    ];
    out.push({type:'causalite',stem,options:shuffle([correct,...ds]),answer:correct});
  }
  const cmp=sents.find(x=>/ (contraire|diffère|vs|plut[oô]t que|comparé)/i.test(x));
  if(cmp){
    const stem=`Quelle différence essentielle ressort ?`;
    const correct=cmp;
    const ds=['Différence superficielle','Similitude prise pour différence','Cas particulier présenté comme général'];
    out.push({type:'comparaison',stem,options:shuffle([correct,...ds]),answer:correct});
  }
  const base=sents.slice(0,3).join(' ');
  if(base.length>50){
    const stem=`Cas : ${base} → Quelle conclusion s'applique le mieux ?`;
    const correct=sents[3] || sents[sents.length-1];
    const ds=['Conclusion trop générale','Conclusion contredite par les prémisses','Conclusion hors contexte'];
    out.push({type:'application',stem,options:shuffle([correct,...ds]),answer:correct});
  }
  return out;
}

function shuffle(a){
  return a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
}

function buildQCM(){
  CM.qa.qcm = CM.sections.flatMap(sec => makeMCQ_FromSection(sec));
}

// ---- Flashcards ----
function firstMatching(sentences,rx){ return sentences.find(s=>rx.test(s)) || ""; }

function buildFlashcards(){
  CM.qa.flashcards=[];
  for(const sec of CM.sections){
    const s=sec.sentences;
    const def=firstMatching(s,/\b(est|se définit|désigne|correspond|consiste)\b/i) || s[0];
    if(def) CM.qa.flashcards.push({type:'def',q:`Qu'est-ce que « ${sec.title} » ?`,a:def});
    const pourquoi=firstMatching(s,/\b(parce que|car|afin|pour que|entraine|conduit à|provoque)\b/i);
    if(pourquoi) CM.qa.flashcards.push({type:'why',q:`Pourquoi ${sec.title} ?`,a:pourquoi});
    const effet=firstMatching(s,/\b(entra[îi]ne|conduit à|provoque|résulte|implique)\b/i);
    if(effet) CM.qa.flashcards.push({type:'effect',q:`Quelles conséquences de ${sec.title} ?`,a:effet});
    const cmp=firstMatching(s,/\b(diffère|vs|plut[oô]t que|compar[ée] à|contraire)\b/i);
    if(cmp) CM.qa.flashcards.push({type:'compare',q:`Différence clé liée à « ${sec.title} » ?`,a:cmp});
    const ex=firstMatching(s,/\b(exemple|par exemple|cas|illustr)/i);
    if(ex) CM.qa.flashcards.push({type:'example',q:`Un exemple parlant de ${sec.title} ?`,a:ex});
    const cex=firstMatching(s,/\b(contre-exemple|limite|biais|attention)\b/i);
    if(cex) CM.qa.flashcards.push({type:'counter',q:`Une limite/contre-exemple de ${sec.title} ?`,a:cex});
  }
}

// ---- Index de concepts + chat ----
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

function answerQuery(q){
  const nq=normalize(q);
  if(/résume|summary/.test(nq)){
    const joined=CM.sections.map(s=>s.summary.short).join(' ');
    return joined || "Commence par coller ton cours puis clique Analyser.";
  }
  if(/mots\s*cl[eé]s|keywords?/.test(nq)){
    const kw=uniq(CM.sections.flatMap(s=>s.keywords)).slice(0,20);
    return `Mots-clés: ${kw.join(', ')}`;
  }
  const m=q.match(/qu['’]est-ce que\s+(.+?)\s*\?/i);
  if(m){
    const term=normalize(m[1]).split(/\s+/).slice(0,3).join(' ');
    const c=CM.conceptIndex[term];
    if(c?.defs?.length) return c.defs[0].def;
    const sec=CM.sections.find(s=>normalize(s.title).includes(term));
    return sec?.summary.medium || "Je n'ai pas trouvé une définition sûre.";
  }
  return "Tu peux me demander « résume », « mots-clés », « qu’est-ce que … ? », « quiz ».";
}

// ---- Pipeline principal ----
function runPipeline(text){
  buildModelFromText(text);
  indexConcepts();
  buildQCM();
  buildFlashcards();
}

// ---- Rendus basiques ----
function renderFiches(){
  const host=document.getElementById('sheet-output');
  if(!host) return;
  host.innerHTML=CM.sections.map((s,i)=>`
    <article class="fiche" data-i="${i}">
      <h4>${s.title}</h4>
      <div class="view-toggle">
        <button data-view="short">Courte</button>
        <button data-view="medium">Moyenne</button>
        <button data-view="long" class="active">Longue</button>
      </div>
      <p class="fiche-content">${s.summary.long}</p>
    </article>
  `).join('');
  host.querySelectorAll('.fiche').forEach(card=>{
    const idx=+card.dataset.i;
    const content=card.querySelector('.fiche-content');
    card.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const v=btn.dataset.view;
        card.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===btn));
        content.textContent=CM.sections[idx].summary[v];
      });
    });
  });
}

function renderQCM(){
  const host=document.getElementById('qcm-output');
  if(!host) return;
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
        fb.textContent=idx===correctIndex? 'Bravo ! ✔️' : `À revoir : ${q.answer}`;
      });
    });
  });
}

function renderFlashcards(){
  const host=document.getElementById('flashcards-pane');
  if(!host) return;
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

function setupChat(){
  const send=document.getElementById('chat-send');
  const input=document.getElementById('chat-input');
  const messages=document.getElementById('chat-messages');
  if(!send || send.dataset.bound) return;
  send.dataset.bound='1';
  send.addEventListener('click',()=>{
    const q=input.value.trim();
    if(!q) return;
    const a=answerQuery(q);
    messages.innerHTML+=`<div class="user-msg">${q}</div><div class="bot-msg">${a}</div>`;
    input.value='';
  });
}

// ---- Initialisation ----
document.addEventListener('DOMContentLoaded',()=>{
  const textArea=document.getElementById('textInput');
  const processBtn=document.getElementById('processBtn');
  processBtn?.addEventListener('click',()=>{
    const text=textArea?.value.trim();
    if(!text) return;
    runPipeline(text);
    renderFiches();
    renderQCM();
    renderFlashcards();
    setupChat();
  });
});

