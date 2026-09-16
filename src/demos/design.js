import './design.css';

const THEMES = {
  mint: { label: 'Mint / ink', accent: '#a9dfd6', accent2: '#aca3df', surface: '#e9f3ef', ink: '#142228', soft: '#c8e1da' },
  lavender: { label: 'Lavender / plum', accent: '#c9c1ff', accent2: '#f3b5d5', surface: '#f2edf8', ink: '#241d32', soft: '#dcd2ef' },
  ember: { label: 'Ember / moss', accent: '#f0b27b', accent2: '#b9d48c', surface: '#f4efe5', ink: '#24251d', soft: '#d9d1b8' },
};
const FONTS = { display: 'Manrope, sans-serif', grotesk: 'Arial, sans-serif', serif: 'Georgia, serif' };

function contrastRatio(a, b) { const luminance = (hex) => { const rgb = hex.match(/.{2}/g).map((v) => parseInt(v, 16) / 255).map((v) => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]; }; const l1 = luminance(a.replace('#', '')); const l2 = luminance(b.replace('#', '')); return ((Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05)).toFixed(2); }

export function mount(host) {
  if (!(host instanceof HTMLElement)) throw new TypeError('mount(host) expects an HTMLElement');
  host.replaceChildren();
  const root = document.createElement('section'); root.className = 'design-demo'; root.dataset.palette = 'mint'; root.dataset.layout = 'editorial'; root.dataset.type = 'display';
  root.innerHTML = `
    <header class="design-demo__header"><div><p class="design-demo__eyebrow">Brand system / 02</p><h2>Make room for better questions.</h2><p>A live design study: tokens, typography and composition stay coherent while you change the point of view.</p></div><span class="design-demo__version">SD / 02.6</span></header>
    <div class="design-demo__workbench"><aside class="design-demo__controls" aria-label="Design system controls"><fieldset><legend>Palette</legend><button type="button" data-palette="mint" aria-pressed="true">Mint / ink</button><button type="button" data-palette="lavender" aria-pressed="false">Lavender / plum</button><button type="button" data-palette="ember" aria-pressed="false">Ember / moss</button></fieldset><fieldset><legend>Type voice</legend><button type="button" data-type="display" aria-pressed="true">Soft display</button><button type="button" data-type="grotesk" aria-pressed="false">Clean grotesk</button><button type="button" data-type="serif" aria-pressed="false">Editorial serif</button></fieldset><fieldset><legend>Composition</legend><button type="button" data-layout="editorial" aria-pressed="true">Editorial</button><button type="button" data-layout="split" aria-pressed="false">Split field</button><button type="button" data-layout="mono" aria-pressed="false">Monolith</button></fieldset><div class="design-demo__readout"><span>Live token check</span><b data-contrast>—</b><small data-contrast-label>Contrast ratio</small></div></aside>
      <article class="design-demo__preview" aria-label="Live editorial product preview"><div class="design-demo__nav"><b>sam<span>·</span>digital</b><span>Field notes&nbsp;&nbsp; / &nbsp;&nbsp;Practice</span><i>↗</i></div><div class="design-demo__hero"><p class="design-demo__label">SD / OBSERVATION 014</p><h3>Attention is<br><em>an active choice.</em></h3><p class="design-demo__copy">A small editorial interface for ideas with somewhere to go.</p><a href="#design-demo-preview" data-preview-link>Select this direction <span>↗</span></a></div><div class="design-demo__shape" aria-hidden="true"><span>01</span></div><footer><span>Selected system</span><b data-token-name>Mint / ink</b></footer></article></div>
  `;
  host.append(root);
  const controls=root.querySelector('.design-demo__controls'),panel=document.createElement('details');panel.className='design-demo__panel';panel.innerHTML='<summary>Remix the system</summary>';controls.replaceWith(panel);panel.append(controls);panel.open=matchMedia('(min-width:681px)').matches;
  const preview = root.querySelector('.design-demo__preview'); const contrast = root.querySelector('[data-contrast]'); const contrastLabel = root.querySelector('[data-contrast-label]'); const tokenName = root.querySelector('[data-token-name]');
  const setPressed = (selector, active) => root.querySelectorAll(selector).forEach((button) => { const on = button === active; button.classList.toggle('is-active', on); button.setAttribute('aria-pressed', String(on)); });
  const applyPalette = (button) => { const theme = THEMES[button.dataset.palette]; root.dataset.palette = button.dataset.palette; root.style.setProperty('--accent', theme.accent); root.style.setProperty('--accent-2', theme.accent2); root.style.setProperty('--surface', theme.surface); root.style.setProperty('--ink', theme.ink); root.style.setProperty('--soft', theme.soft); tokenName.textContent = theme.label; const ratio = contrastRatio(theme.ink, theme.surface); contrast.textContent = `${ratio}:1`; contrastLabel.textContent = ratio >= 7 ? 'Ink / surface · AAA' : ratio >= 4.5 ? 'Ink / surface · AA' : 'Check contrast'; setPressed('[data-palette]', button); };
  root.querySelectorAll('[data-palette]').forEach((button) => button.addEventListener('click', () => applyPalette(button)));
  root.querySelectorAll('[data-type]').forEach((button) => button.addEventListener('click', () => { root.dataset.type = button.dataset.type; root.style.setProperty('--display-font', FONTS[button.dataset.type]); setPressed('[data-type]', button); }));
  root.querySelectorAll('[data-layout]').forEach((button) => button.addEventListener('click', () => { root.dataset.layout = button.dataset.layout; setPressed('[data-layout]', button); }));
  const onPreviewClick = (event) => { event.preventDefault(); preview.classList.toggle('is-affirmed'); preview.querySelector('[data-preview-link]').innerHTML = preview.classList.contains('is-affirmed') ? 'Direction selected <span>✓</span>' : 'Select this direction <span>↗</span>'; };
  const link = root.querySelector('[data-preview-link]'); link.addEventListener('click', onPreviewClick); applyPalette(root.querySelector('[data-palette]'));
  return () => { root.querySelectorAll('button').forEach((button) => { button.replaceWith(button.cloneNode(true)); }); link.removeEventListener('click', onPreviewClick); root.remove(); };
}
