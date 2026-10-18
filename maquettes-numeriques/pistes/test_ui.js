/**
 * Suite de tests automatisés de l'interface graphique (Headless Chrome via CDP)
 * Vérifie :
 *  1. Zéro erreur JS / console
 *  2. Zéro occlusion (elementFromPoint) sur les modales, boutons, cartes et visites guidées
 *  3. Zéro chevauchement entre la boîte de la visite guidée et l'élément mis en lumière
 *  4. Zéro débordement horizontal de page ou texte tronqué involontairement
 *  5. Intégrité géométrique du plateau SVG, des pistes, des 4 phases, du mode didactique et de la partie exemple
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].find((p) => fs.existsSync(p));

if (!CHROME_PATH) {
  console.error('Aucun navigateur Chromium trouvé.');
  process.exit(1);
}

const PORT = 9229;
const FILE_URL = 'file:///' + path.resolve(__dirname, 'pistes.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, '.ui_screenshots');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function connectCDP() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) { /* retry */ }
    await sleep(200);
  }
  throw new Error('Impossible de se connecter au port CDP de Chrome');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.errors = [];
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        this.errors.push('JS Exception: ' + JSON.stringify(msg.params.exceptionDetails.text));
      } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        this.errors.push('Log Error: ' + msg.params.entry.text);
      }
    });
  }
  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Eval Exception: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
    }
    return res.result.value;
  }
  async screenshot(name) {
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(SCREENSHOT_DIR, `${name}.png`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  }
  close() {
    this.ws.close();
  }
}

// Fonction injectée dans le navigateur pour auditer la géométrie, l'occlusion et la lisibilité
const AUDIT_FN_SOURCE = `
window.__auditUI = function(stepLabel) {
  const anomalies = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 1. Débordement horizontal de la page
  if (document.documentElement.scrollWidth > vw + 4) {
    anomalies.push({
      type: 'OVERFLOW_X',
      detail: 'Scroll horizontal de la page (' + document.documentElement.scrollWidth + 'px > ' + vw + 'px)'
    });
  }

  // Helper visibilité
  function isVisible(el) {
    if (!el || el.hidden) return false;
    let cur = el;
    while (cur && cur !== document.body) {
      if (cur.hidden) return false;
      const st = getComputedStyle(cur);
      if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return false;
      cur = cur.parentElement;
    }
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }

  // Helper test d'occlusion en un point (x, y) pour un élément cible attendu
  function checkPointVisible(el, x, y, label) {
    if (x < 2 || y < 2 || x > vw - 2 || y > vh - 2) return;
    const hit = document.elementFromPoint(x, y);
    if (!hit) return;
    if (el.contains(hit) || hit.contains(el)) return;
    anomalies.push({
      type: 'OCCLUSION',
      detail: label + ' est masqué au point (' + Math.round(x) + ',' + Math.round(y) + ') par <' + hit.tagName.toLowerCase() + (hit.id ? '#' + hit.id : '') + (hit.className && typeof hit.className === 'string' ? '.' + hit.className.trim().split(/\\s+/).join('.') : '') + '>'
    });
  }

  // 2. Si la visite guidée est ouverte, vérifier que #guiTourModal est 100% dans le viewport, non masquée, et ne recouvre pas abusivement la cible
  const overlay = document.getElementById('guiTourOverlay');
  if (overlay && !overlay.hidden) {
    const modal = overlay.querySelector('.tour-modal');
    const r = modal.getBoundingClientRect();
    if (r.left < 0 || r.top < 0 || r.right > vw || r.bottom > vh) {
      anomalies.push({
        type: 'MODAL_OFFSCREEN',
        detail: '#guiTourModal dépasse du viewport : ' + JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), vw, vh })
      });
    }
    // Tester 5 points sur #guiTourModal (4 coins intérieurs + centre)
    const pts = [
      [r.left + 14, r.top + 14, 'coin haut-gauche'],
      [r.right - 14, r.top + 14, 'coin haut-droit'],
      [r.left + 14, r.bottom - 14, 'coin bas-gauche'],
      [r.right - 14, r.bottom - 14, 'coin bas-droit'],
      [(r.left + r.right) / 2, (r.top + r.bottom) / 2, 'centre']
    ];
    for (const [px, py, posName] of pts) {
      checkPointVisible(modal, px, py, '#guiTourModal (' + posName + ')');
    }
    // Tester les boutons de la visite guidée
    for (const btnId of ['guiTourPrev', 'guiTourNext', 'guiTourClose']) {
      const btn = document.getElementById(btnId);
      if (btn && isVisible(btn)) {
        const br = btn.getBoundingClientRect();
        checkPointVisible(btn, (br.left + br.right) / 2, (br.top + br.bottom) / 2, '#' + btnId);
      }
    }
    // Vérifier le chevauchement entre #guiTourModal et le projecteur #guiTourSpotlight
    const spot = document.getElementById('guiTourSpotlight');
    if (spot) {
      const hr = spot.getBoundingClientRect();
      const ix = Math.max(0, Math.min(r.right, hr.right) - Math.max(r.left, hr.left));
      const iy = Math.max(0, Math.min(r.bottom, hr.bottom) - Math.max(r.top, hr.top));
      const interArea = ix * iy;
      const modalArea = Math.max(1, r.width * r.height);
      if (interArea / modalArea > 0.02) {
        anomalies.push({
          type: 'TOUR_OVERLAP_TARGET',
          detail: '#guiTourModal chevauche le projecteur #guiTourSpotlight (' + Math.round(100 * interArea / modalArea) + '% de la modale sur la cible)'
        });
      }
    }
  } else {
    // 3. Hors visite guidée : vérifier que les éléments interactifs visibles dans le viewport ne sont pas masqués
    const selectors = ['#bgaPhaseBar', '#walkthroughBar', '.didactic-box', '.clue-card', '#go', '#btnWalkthrough', '#btnGuiTour', '#btnPhysMode'];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => {
        if (!isVisible(el)) return;
        const r = el.getBoundingClientRect();
        if (r.top >= 60 && r.bottom <= vh - 10 && r.left >= 0 && r.right <= vw) {
          checkPointVisible(el, (r.left + r.right) / 2, (r.top + r.bottom) / 2, sel);
        }
      });
    }
  }

  // 4. Détecter les conteneurs flex/grid qui cassent du texte inline contenant des balises <b>/<strong>/<i>/<em>
  document.querySelectorAll('div, p, span').forEach((el) => {
    if (!isVisible(el)) return;
    const disp = getComputedStyle(el).display;
    if (disp !== 'flex' && disp !== 'inline-flex' && disp !== 'grid' && disp !== 'inline-grid') return;
    let hasTextNode = false;
    let hasInlineFormatting = false;
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim().length > 2) hasTextNode = true;
      if (node.nodeType === 1 && ['B', 'STRONG', 'I', 'EM'].includes(node.tagName) && node.textContent.trim().length > 0) hasInlineFormatting = true;
    }
    if (hasTextNode && hasInlineFormatting) {
      anomalies.push({
        type: 'INLINE_IN_FLEX_GRID',
        detail: '<' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + (el.className || '') + '> a display:' + disp + ' mais contient directement du texte et des balises <b>/<i>'
      });
    }
  });

  // 5. Vérifier que les noms de joueurs (.tile-name) sur le SVG ne chevauchent pas le disque de la couronne (R1+7 = 289)
  const svg = document.getElementById('plateau');
  if (svg && isVisible(svg)) {
    svg.querySelectorAll('.tile-name').forEach((tn) => {
      const x = parseFloat(tn.getAttribute('x') || '0');
      const y = parseFloat(tn.getAttribute('y') || '0');
      const tr = tn.getAttribute('transform') || '';
      const dist = Math.hypot(x - 315, y - 330);
      if (dist < 296 || (!tr.includes('rotate') && Math.abs(x - 315) > 80)) {
        anomalies.push({
          type: 'SVG_LABEL_OVERLAP',
          detail: 'Label .tile-name (' + tn.textContent + ') trop proche ou non tangent à l\\'arc (dist=' + Math.round(dist) + ')'
        });
      }
    });
  }

  return { stepLabel, vw, vh, anomalies };
};
`;

async function runSuite() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pistes-chrome-'));
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    FILE_URL
  ], { stdio: 'ignore' });

  let client;
  const allAnomalies = [];

  try {
    const wsUrl = await connectCDP();
    client = new CDPClient(wsUrl);
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Log.enable');

    // Définir la taille du viewport (1440x900)
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await sleep(600);
    await client.eval(AUDIT_FN_SOURCE);

    async function checkStep(name, takeShot = false) {
      await sleep(180);
      const res = await client.eval(`window.__auditUI(${JSON.stringify(name)})`);
      if (takeShot) {
        await client.screenshot(name.replace(/[^a-zA-Z0-9_-]/g, '_'));
      }
      if (res.anomalies.length > 0) {
        console.log(`❌ [${name}] ${res.anomalies.length} anomalie(s) :`);
        for (const a of res.anomalies) {
          console.log(`   - [${a.type}] ${a.detail}`);
          allAnomalies.push({ step: name, ...a });
        }
      } else {
        console.log(`✅ [${name}] OK`);
      }
    }

    // 1. État initial (Configuration de la table)
    await checkStep('01_accueil_configuration', true);

    // 2. Visite guidée UI (les 6 étapes)
    await client.eval(`document.getElementById('btnGuiTour').click()`);
    for (let i = 0; i < 6; i++) {
      await sleep(250);
      await checkStep(`02_visite_guidee_etape_${i + 1}`, true);
      await client.eval(`document.getElementById('guiTourNext').click()`);
    }

    // 3. Partie exemple pas-à-pas (les 9 scènes)
    await client.eval(`document.getElementById('btnWalkthrough').click()`);
    for (let s = 0; s < 9; s++) {
      await sleep(200);
      await checkStep(`03_walkthrough_scene_${s + 1}`, s === 0 || s === 1 || s === 5);
      if (s < 8) {
        await client.eval(`document.getElementById('wtNext').click()`);
      }
    }
    await client.eval(`document.getElementById('wtTakeOver').click()`);

    // 4. Test en résolution ordinateur portable compacte (1280x720) sur la visite guidée et les phases
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(200);
    await client.eval(`document.getElementById('btnGuiTour').click()`);
    for (let i = 0; i < 6; i++) {
      await sleep(250);
      await checkStep(`04_1280x720_visite_guidee_etape_${i + 1}`, i === 1);
      await client.eval(`document.getElementById('guiTourNext').click()`);
    }

    // 5. Onglet Règle & Matériel Physique + Simulateur des 5 gestes physiques, puis Séries & Archives
    await client.eval(`document.getElementById('tab-regles').click()`);
    await checkStep('05_onglet_regles_geste_1', true);
    for (let g = 1; g < 5; g++) {
      await client.eval(`document.querySelector('[data-gstep="${g}"]').click()`);
      await checkStep(`05_onglet_regles_geste_${g + 1}`, g === 2);
    }
    await client.eval(`document.getElementById('tab-series').click()`);
    await checkStep('06_onglet_series');
    await client.eval(`document.getElementById('tab-archives').click()`);
    await checkStep('07_onglet_archives');

    if (client.errors.length > 0) {
      console.log('❌ Erreurs console/JS détectées :', client.errors);
      for (const err of client.errors) allAnomalies.push({ step: 'global', type: 'JS_ERROR', detail: err });
    }
  } finally {
    if (client) client.close();
    chrome.kill();
  }

  console.log(`\nRésumé de l'audit UI : ${allAnomalies.length} anomalie(s) détectée(s).`);
  process.exit(allAnomalies.length > 0 ? 1 : 0);
}

runSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
