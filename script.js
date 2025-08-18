// Professeur Nour — JS simplifié, modulaire et robuste

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initFileUpload();
  initChat();
  initAnalysis();
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
    if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      reader.onload = () => (textInput.value = reader.result);
      reader.readAsText(file);
    } else if (file.name.endsWith(".docx")) {
      reader.onload = async () => {
        const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
        textInput.value = result.value;
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

/* ---------- Chat interne ---------- */
function initChat() {
  const sendBtn = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  sendBtn.addEventListener("click", () => {
    const msg = input.value.trim();
    if (!msg) return;
    addMessage("user", msg, messages);
    input.value = "";
    setTimeout(() => addMessage("assistant", "Voici une réponse fictive !", messages), 600);
  });
}

function addMessage(role, text, container) {
  const div = document.createElement("div");
  div.classList.add("chat-message", `${role}-message`);
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
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
          <div class="fc-inner">
            <div class="fc-face fc-front"><b>Q.</b> ${card.q}<br><small class="muted">${card.active}</small></div>
            <div class="fc-face fc-back"><span>${card.a}</span></div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="muted">Retourne chaque carte pour voir la réponse développée.</div>
  `;
  Array.from(pane.querySelectorAll('.fc-inner')).forEach(inner => {
    inner.addEventListener('click', () => inner.classList.toggle('flip'));
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
// Branche sur analyse
const textArea = document.getElementById('textInput');
const processBtn = document.getElementById('processBtn');
processBtn?.addEventListener('click', () => {
  const text = textArea?.value || '';
  buildModelFromRaw(text);
  renderAlignedFiches();
  renderQCM();
  renderSmartFlashcards(text);
  if (CM.sections.length) showAdaptiveSection(0);
});