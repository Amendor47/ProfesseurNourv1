// Professeur Nour — JS simplifié, modulaire et robuste

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initFileUpload();
  initAnalysis();
  initTestMode();
  initThemeToggler();
});

/* ---------- Gestion des onglets ---------- */
function initTabs() {
  const buttons = document.querySelectorAll(".tab-link");
  const panes = document.querySelectorAll(".tab-pane");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const tab = document.getElementById(btn.dataset.tab);
      if (tab) tab.classList.add("active");
    });
  });
}

/* ---------- Drag & Drop + Input ---------- */
function initFileUpload() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const textInput = document.getElementById("textInput");
  if (!dropzone || !fileInput || !textInput) return;
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("dragover", e => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
  dropzone.addEventListener("drop", e => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0], textInput);
    }
  });
  fileInput.addEventListener("change", e => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0], textInput);
    }
  });
}

async function handleFile(file, textInput) {
  try {
    const reader = new FileReader();
    const name = file.name.toLowerCase();
    if (name.endsWith(".txt") || name.endsWith(".md")) {
      reader.onload = () => (textInput.value = reader.result);
      reader.onerror = () => {
        console.error("Erreur de lecture du fichier", reader.error);
        alert("Impossible de lire le fichier.");
      };
      reader.readAsText(file);
    } else if (name.endsWith(".docx")) {
      reader.onload = async () => {
        if (!window.mammoth) {
          alert("La bibliothèque Mammoth n'est pas chargée.");
          return;
        }
        try {
          const result = await window.mammoth.extractRawText({ arrayBuffer: reader.result });
          textInput.value = result.value;
        } catch (err) {
          console.error("Erreur lors de l'extraction du DOCX", err);
          alert("Impossible de lire le fichier.");
        }
      };
      reader.onerror = () => {
        console.error("Erreur de lecture du fichier", reader.error);
        alert("Impossible de lire le fichier.");
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Format non supporté : utilisez .txt, .md ou .docx");
    }
  } catch (err) {
    console.error("Erreur lors du traitement du fichier", err);
    alert("Impossible de lire le fichier.");
  }
}

/* ---------- Analyse du texte ---------- */
function initAnalysis() {
  const processBtn = document.getElementById("processBtn");
  const textInput = document.getElementById("textInput");
  const output = document.getElementById("analysis-output");
  processBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    if (!text) {
      alert("Veuillez fournir un texte à analyser.");
      return;
    }
    output.innerHTML = `<p class=\"banner warn\">Analyse fictive en cours…</p><pre>${text}</pre>`;
    // Exemple pour un appel backend
    // const res = await fetch("/analyze", { method:"POST", body: JSON.stringify({ text }) });
    // const data = await res.json();
    // output.textContent = data.result;
  });
}


function initTestMode() {
  const startBtn = document.getElementById('test-start');
  const qPane = document.getElementById('test-question-pane');
  const questionEl = document.getElementById('test-question');
  const optionsEl = document.getElementById('test-options');
  const answerInput = document.getElementById('test-answer');
  const submitBtn = document.getElementById('test-submit');
  const feedbackEl = document.getElementById('test-feedback');
  const progressEl = document.getElementById('test-progress');
  let index = 0, score = 0, streak = 0;
  const questions = [
    { type:'mcq', q:'Quelle est la capitale de la France ?', options:['Paris','Lyon','Marseille','Nice'], answer:'Paris' },
    { type:'tf', q:'La Terre est plate.', answer:false },
    { type:'short', q:'Qui a écrit "Le Petit Prince" ?', answer:'Antoine de Saint-Exupéry' }
  ];
  function showQuestion(){
    const q = questions[index];
    if(!q) return;
    feedbackEl.classList.add('hidden');
    optionsEl.innerHTML='';
    answerInput.value='';
    answerInput.classList.add('hidden');
    submitBtn.classList.add('hidden');
    questionEl.textContent = q.q;
    if(q.type==='mcq'){
      optionsEl.innerHTML = q.options.map(opt=>`<label><input type="radio" name="test-${index}" value="${opt}"> ${opt}</label>`).join('');
      optionsEl.querySelectorAll('label').forEach(l=>{
        l.addEventListener('click',()=>checkAnswer(l.querySelector('input').value));
      });
    } else if(q.type==='tf'){
      optionsEl.innerHTML = `<label><input type="radio" name="test-${index}" value="true"> Vrai</label><label><input type="radio" name="test-${index}" value="false"> Faux</label>`;
      optionsEl.querySelectorAll('label').forEach(l=>{
        l.addEventListener('click',()=>checkAnswer(l.querySelector('input').value === 'true'));
      });
    } else {
      answerInput.classList.remove('hidden');
      submitBtn.classList.remove('hidden');
    }
  }
  function checkAnswer(val){
    const q = questions[index];
    let correct=false;
    if(q.type==='mcq') correct = val===q.answer;
    else if(q.type==='tf') correct = val===q.answer;
    else correct = val.trim().toLowerCase()===q.answer.toLowerCase();
    feedbackEl.classList.remove('hidden');
    if(correct){
      feedbackEl.textContent='✅ Correct';
      score++; streak++; if(streak===3) feedbackEl.textContent+=' 🔥 Tu progresses vite !';
    } else {
      feedbackEl.textContent=`❌ Réponse : ${q.answer}`;
      streak=0;
    }
    progressEl.value=++index;
    if(index<questions.length) setTimeout(showQuestion,800);
    else feedbackEl.textContent+=` — Score ${score}/${questions.length}`;
  }
  submitBtn?.addEventListener('click',()=>{ const val=answerInput.value; if(!val.trim()) return; checkAnswer(val); });
  startBtn?.addEventListener('click',()=>{
    index=0;score=0;streak=0;progressEl.max=questions.length;progressEl.value=0;
    document.getElementById('test-start-pane')?.classList.add('hidden');
    qPane?.classList.remove('hidden');
    showQuestion();
  });
}

/* ==========================
   Chat local “Professeur Nour”
   - marche sans backend
   - exploite le texte importé / analysé
   ========================== */
(function(){
  if (window.__NOUR_CHAT_WIRED__) return; window.__NOUR_CHAT_WIRED__ = true;

  // --- Helpers DOM
  const $  = (q, c=document)=>c.querySelector(q);
  const $$ = (q, c=document)=>Array.from(c.querySelectorAll(q));
  const elChatMsg   = $('#chat-messages');
  const elChatIn    = $('#chat-input');
  const elChatSend  = $('#chat-send');

  const elFab       = $('#nour-fab');
  const elNourChat  = $('#nour-chat');
  const elNourIn    = $('#nour-chat-input');
  const elNourSend  = $('#nour-chat-send');
  const elNourClose = $('#nour-close');
  const elNourMin   = $('#nour-min');

  // Source de texte : textarea + analyse locale déjà fournie dans la page
  const getRawText = ()=> ($('#textInput')?.value || '').trim();
  const getAnalysisSummary = ()=>{
    // essaye de récupérer le résumé local déjà affiché
    const block = $('#analysis-output');
    if (!block) return '';
    const h4s = block.querySelectorAll('h4');
    let out = '';
    h4s.forEach(h=>{
      if(/Résumé/i.test(h.textContent||'')) {
        const nxt = h.parentElement?.querySelector('p');
        if(nxt) out = nxt.textContent.trim();
      }
    });
    return out;
  };

  // Mini NLP local
  const norm = s => (s||'').toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s-]/gu,' ');
  const sentences = t => (t||'').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  const topKeywords = (text, n=10)=>{
    const stop = new Set('les des une un du le la de et que qui pour pas est sont avec sans par sur dans plus moins donc or car comme entre ainsi cela ceci ces ceux celles tres tout toute tous toutes chez fait faire avoir etre selon lorsque ou quand puis alors si sinon tandis meme contre au aux ces cet cette ce d’ des l’ m’ n’ s’ t’ qu’'.split(/\s+/));
    const freq = new Map();
    norm(text).split(/\s+/).forEach(w=>{
      if(w && w.length>2 && !stop.has(w)) freq.set(w, (freq.get(w)||0)+1);
    });
    return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([w])=>w);
  };

  // Moteur de réponse local
  function localAnswer(q){
    const raw = getRawText();
    const sum = getAnalysisSummary();
    const qn = norm(q);

    // routes rapides
    if (!raw && !sum) {
      if (/bonjour|salut|hello/i.test(q)) return "Bonjour ! Colle ton cours dans la zone de gauche, puis je pourrai te résumer, extraire des mots-clés et générer des QCM.";
      return "Je suis prêt. Colle un cours (ou charge un fichier) pour que je puisse t'aider (résumé, mots-clés, plan, quiz).";
    }
    if (/\b(resume|résume|summary)\b/.test(qn)) {
      const s = sum || sentences(raw).slice(0,5).join(' ');
      return s || "Je n'ai pas encore de résumé. Lance “Analyser le cours”, puis repose la question.";
    }
    if (/\b(mots\s*cl[eé]s?|keywords?)\b/.test(qn)) {
      const t = raw || sum; const kws = topKeywords(t, 12);
      return `Mots-clés : ${kws.join(', ')}`;
    }
    if (/\b(plan|sections?)\b/.test(qn)) {
      // heuristique : 6 premières phrases comme "plan"
      const ps = sentences(raw).slice(0,6).map((s,i)=>`- Section ${i+1} — ${s}`);
      return ps.join('\n') || "Pas assez de contenu pour un plan. Ajoute un peu de texte.";
    }
    if (/\b(quiz|qcm|questions?)\b/.test(qn)) {
      // génère un QCM minimal (1 item) à partir de la 1ère phrase
      const s = sentences(raw)[0] || (sum && sentences(sum)[0]) || '';
      if (!s) return "Je n'ai pas assez de matière pour fabriquer un QCM. Ajoute un cours.";
      const stem = s.replace(/[,;:–-].*$/, '.');
      const correct = "Vrai";
      const wrongs = ["Plutôt faux", "Faux", "Sans rapport"];
      return `QCM rapide\nQ: ${stem}\nA) ${correct}\nB) ${wrongs[0]}\nC) ${wrongs[1]}\nD) ${wrongs[2]}\n→ Réponse: A`;
    }
    if (/\b(aide|help|comment|usage|utiliser)\b/.test(qn)) {
      return "Je peux : 1) résumer ton cours (« résume »), 2) sortir des mots-clés (« mots-clés »), 3) proposer un plan (« plan »), 4) générer un mini QCM (« quiz »).";
    }
    // fallback : phrase clé + rappel d'options
    const kw = topKeywords(raw || sum, 6).slice(0,6).join(', ');
    return `Je t'ai compris. Essaie « résume », « mots-clés », « plan » ou « quiz ». Mots-clés possibles : ${kw}.`;
  }

  // --- Appel LLM selon fournisseur sélectionné ---
  async function askLLM(question){
    const providerSel = document.getElementById('aiProvider');
    const provider = providerSel?.value || 'offline';
    const apiKey = (document.getElementById('apiKey')?.value || '').trim();
    const messages = [{role:'user', content: question}];
    try {
      if (provider === 'internal') {
        const res = await fetch('/api/chat', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({messages, context: getRawText()})
        });
        const data = await res.json();
        return (data.reply || data.error || '');
      } else if (provider === 'openai') {
        const headers = {'Content-Type':'application/json'};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const res = await fetch('/chat', {
          method:'POST',
          headers,
          body: JSON.stringify({messages, provider:'openai', api_key: apiKey})
        });
        const data = await res.json();
        return (data.output || data.error || '');
      } else if (provider === 'firecrawl') {
        const headers = {'Content-Type':'application/json'};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const res = await fetch('/firecrawl/chat', {
          method:'POST', headers, body: JSON.stringify({messages, api_key: apiKey})
        });
        const data = await res.json();
        return (data.answer || data.error || '');
      }
    } catch(err){
      console.error(err);
      return `Erreur: ${err.message}`;
    }
    // Fallback local
    return localAnswer(question);
  }

  // Rendu bulles
  function appendMsg(container, role, text){
    if (!container) return;
    const wrap = document.createElement('div');
    wrap.className = `chat-message ${role==='user'?'user-message':'assistant-message'}`;
    wrap.textContent = text;
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  }

  // Branchements — Onglet "Chat"
  async function sendMain(){
    const msg = (elChatIn?.value||'').trim();
    if (!msg) return;
    appendMsg(elChatMsg, 'user', msg);
    elChatIn.value = '';
    elChatIn.focus();
    const out = await askLLM(msg);
    appendMsg(elChatMsg, 'assistant', out || '');
  }
  elChatSend?.addEventListener('click', sendMain);
  elChatIn?.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMain(); } });

  // Branchements — Chat flottant
  function openNour(){ elNourChat?.classList.remove('hidden'); elNourIn?.focus(); }
  function closeNour(){ elNourChat?.classList.add('hidden'); }
  function minNour(){ elNourChat?.classList.toggle('hidden'); }

  elFab?.addEventListener('click', openNour);
  elNourClose?.addEventListener('click', closeNour);
  elNourMin?.addEventListener('click', minNour);

  async function sendNour(){
    const msg = (elNourIn?.value||'').trim();
    const cont = $('#nour-chat-messages');
    if (!msg || !cont) return;
    appendMsg(cont, 'user', msg);
    elNourIn.value = '';
    elNourIn.focus();
    const out = await askLLM(msg);
    appendMsg(cont, 'assistant', out || '');
  }
  elNourSend?.addEventListener('click', sendNour);
  elNourIn?.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendNour(); } });

  // Message de bienvenue (une seule fois)
  setTimeout(()=>{
    appendMsg(elChatMsg, 'assistant', "Salut ! Colle ton cours puis demande « résume », « mots-clés », « plan » ou « quiz ».");
    const cont = $('#nour-chat-messages'); if (cont) appendMsg(cont, 'assistant', "Je suis là. Clique et pose ta question !");
  }, 200);
})();

function initThemeToggler(){
  const html=document.documentElement;
  const headerSel=document.getElementById('themeSelect');
  const settingsSel=document.getElementById('theme-select');
  const map={nour:'theme-nour',studycave:'theme-studycave'};
  const rev={'theme-nour':'nour','theme-studycave':'studycave'};
  let saved=localStorage.getItem('selected-theme')||'theme-nour';
  if(saved==='theme-light') saved='theme-nour';
  function applyClass(cls){
    html.classList.remove('theme-nour','theme-light','theme-studycave');
    html.classList.add(cls,'theme-dark');
    localStorage.setItem('selected-theme',cls);
    if(headerSel) headerSel.value=rev[cls]||'nour';
    if(settingsSel) settingsSel.value=cls;
  }
  applyClass(saved);
  headerSel?.addEventListener('change',()=>applyClass(map[headerSel.value]||'theme-nour'));
  settingsSel?.addEventListener('change',()=>applyClass(settingsSel.value||'theme-nour'));
}

// === Flashcards : jusqu'à 25, ultra-pertinentes, logique d'analyse avancée & accompagnement actif ===
function buildSmartFlashcards(text) {
  // Analyse avancée : pertinence, diversité, accompagnement
  const sents = (text||'').split(/(?<=[\.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  // Score de pertinence : mots-clés, complexité, diversité
  function score(s) {
    let sc = 0;
    if (/pourquoi|comment|conséquence|application|différence|exemple|méthode|impact|fonctionne|utilisation|objectif|but|cause|résultat|comparaison|processus|effet|implique|mise en oeuvre|limite|avantage|inconvénient|stratégie|erreur|piège|attention|problème|solution|démonstration|preuve|justification|analyse|synthèse|interprétation|explication|argumentation|plan|étape|procédure|résolution|hypothèse|conclusion|déduction|induction|relation|lien|contraste|opposition|nuance|exception|cas particulier/i.test(s)) sc += 4;
    if (s.length > 80) sc += 2;
    if (s.split(/[,;:]/).length > 2) sc += 1;
    if (/\b(je|tu|nous|vous|on|dois|peux|faut|devrais|devrait|réfléchis|imagine|explique|analyse|argumente|justifie|démontre|prouve|relie|compare|interprète|synthétise|résous|planifie|construis|déduis|induis|conclus|identifie|repère|explore|expérimente|applique|utilise|corrige|améliore|évalue|questionne|observe|décris|résume|structure|organise|classe|catégorise|hiérarchise|priorise|sélectionne|choisis|distingue|différencie|associe|illustre|expose|présente|rédige|formule|modélise|schématise|représente|simule|prédits|prévois|anticipe|propose|suggère|recommande|conseille|critique|discute|débat|argumente|défends|conteste|remets en cause|remarque|note|observe|constate|découvre|invente|innove|crée|imagine|visualise|projette|planifie|organise|structure|synthétise|résume|explique|interprète|analyse|justifie|démontre|prouve|relie|compare|contraste|opposition|nuance|exception|cas particulier)\b/i.test(s)) sc += 2;
    return sc;
  }
  // Trie par score de pertinence et diversité
  let ranked = sents.map(s => ({s, sc: score(s)})).sort((a,b) => b.sc - a.sc);
  // Diversité : évite les doublons de type de question
  const types = [
    {re:/pourquoi|cause|raison|but|objectif|motif/i, q:'Pourquoi : '},
    {re:/comment|méthode|procédé|processus|fonctionne|utilise|appliquer/i, q:'Comment ? '},
    {re:/conséquence|impact|effet|résultat|aboutit|implique/i, q:'Quelles conséquences ? '},
    {re:/exemple|application|cas|utilisation|mise en oeuvre/i, q:'Donne un exemple ou une application : '},
    {re:/différence|comparaison|similitude|opposé|contraire/i, q:'Compare ou distingue : '},
    {re:/limite|avantage|inconvénient/i, q:'Limite/Avantage/Inconvénient : '},
    {re:/stratégie|plan|étape|procédure|résolution/i, q:'Quelle stratégie ou procédure ? '},
    {re:/erreur|piège|attention|problème|solution/i, q:'Quels pièges ou solutions ? '},
    {re:/démonstration|preuve|justification/i, q:'Démontre ou justifie : '},
    {re:/analyse|synthèse|interprétation|explication|argumentation/i, q:'Analyse ou explique : '},
    {re:/relation|lien|contraste|opposition|nuance|exception|cas particulier/i, q:'Relie ou nuance : '}
  ];
  const usedTypes = new Set();
  const cards = [];
  for (let i = 0; i < ranked.length && cards.length < 25; i++) {
    const s = ranked[i].s;
    let q = '';
    let typeFound = false;
    for (const t of types) {
      if (t.re.test(s)) {
        if (!usedTypes.has(t.q) || cards.length < 10) { // diversité sur les 10 premières
          q = t.q + s;
          usedTypes.add(t.q);
          typeFound = true;
          break;
        }
      }
    }
    if (!typeFound) {
      q = `Explique en détail : ${s}`;
    }
    // Accompagnement actif : invite à réfléchir, à donner un exemple, à relier à un vécu
    let active = '';
    if (/pourquoi|cause|raison|but|objectif|motif/i.test(s)) active = "→ Peux-tu relier cette cause à un exemple vécu ?";
    else if (/comment|méthode|procédé|processus|fonctionne|utilise|appliquer/i.test(s)) active = "→ Essaie de décrire la méthode étape par étape.";
    else if (/exemple|application|cas|utilisation|mise en oeuvre/i.test(s)) active = "→ Trouve un exemple concret dans ta pratique.";
    else if (/différence|comparaison|similitude|opposé|contraire/i.test(s)) active = "→ Compare avec un autre concept étudié.";
    else if (/limite|avantage|inconvénient/i.test(s)) active = "→ Liste les avantages et inconvénients.";
    else if (/stratégie|plan|étape|procédure|résolution/i.test(s)) active = "→ Propose une stratégie alternative.";
    else if (/erreur|piège|attention|problème|solution/i.test(s)) active = "→ Comment éviter ce piège ?";
    else if (/démonstration|preuve|justification/i.test(s)) active = "→ Justifie avec un raisonnement détaillé.";
    else if (/analyse|synthèse|interprétation|explication|argumentation/i.test(s)) active = "→ Fais une synthèse personnelle.";
    else if (/relation|lien|contraste|opposition|nuance|exception|cas particulier/i.test(s)) active = "→ Relie à un autre chapitre ou notion.";
    else active = "→ Reformule avec tes mots et donne un exemple.";
    // Réponse développée = phrase + contexte précédent
    const context = sents.slice(Math.max(0,sents.indexOf(s)-2),sents.indexOf(s)).join(' ');
    const a = context ? `${context} ${s}` : s;
    cards.push({ q, a, active });
  }
  return cards;
}
function renderSmartFlashcards(text) {
  const cards = buildSmartFlashcards(text);
  const pane = document.getElementById('flashcards-pane');
  if (!pane) return;
  pane.innerHTML = `
    <h3>Flashcards — Questions de fond (accompagnement actif)</h3>
    <div class="fc-deck">
      ${cards.map(card => `
        <div class="flashcard">
          <div class="flashcard-inner">
            <div class="flashcard-front"><b>Q.</b> ${card.q}<br><small class="muted">${card.active}</small></div>
            <div class="flashcard-back"><span>${card.a}</span></div>
          </div>
          <button class="btn flip-btn">Retourner</button>
        </div>
      `).join('')}
    </div>
  `;
  pane.querySelectorAll('.flip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.flashcard').classList.toggle('flipped');
    });
  });
}

/* ---------- QCM interactifs ---------- */
function renderQCM() {
  const host = document.getElementById('qcm-output');
  if (!host || !window.CM) return;
  const items = CM.sections.flatMap(sec => sec.quiz || []);
  host.innerHTML = items
    .map((it, qi) => `
      <div class="qcm-item" data-q="${qi}">
        <p><strong>${it.q}</strong></p>
        <div class="qcm-options">
          ${it.options
            .map(
              (opt, idx) =>
                `<label><input type="radio" name="q-${qi}" value="${idx}"> ${opt}</label>`
            )
            .join('')}
        </div>
        <div class="feedback hidden"></div>
      </div>`)
    .join('');
  host.querySelectorAll('.qcm-item').forEach((item, qi) => {
    const q = items[qi];
    const labels = item.querySelectorAll('.qcm-options label');
    labels.forEach((lab, idx) => {
      lab.addEventListener('click', () => {
        labels.forEach(l => l.classList.remove('qq-correct', 'qq-wrong'));
        lab.classList.add(idx === q.correctIndex ? 'qq-correct' : 'qq-wrong');
        const fb = item.querySelector('.feedback');
        if (fb) {
          fb.classList.remove('hidden');
          fb.textContent =
            idx === q.correctIndex
              ? 'Bravo ! ✔️'
              : `À revoir : ${q.explain || ''}`;
        }
      });
    });
  });
}
