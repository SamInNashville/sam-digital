import { buildMailto } from './contact.js';
const form = document.querySelector('#brief-form');
form.hidden = false;
const service = document.querySelector('#service');
for (const card of document.querySelectorAll('[data-service]')) {
  card.addEventListener('click', () => { service.value = card.dataset.service; });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const brief = document.querySelector('#brief');
  if (!brief.value.trim()) { brief.setCustomValidity('Tell us a little about the problem or idea.'); brief.reportValidity(); return; }
  const url = buildMailto(service.value, brief.value);
  document.querySelector('#form-status').textContent = 'Your email draft is ready. If your email app didn’t open, email sam-in-nashville@pm.me directly. Nothing has been sent.';
  window.location.href = url;
});
document.querySelector('#brief').addEventListener('input', (e) => e.target.setCustomValidity(''));
// The business remains fully usable before (or without) this enhancement.
if (navigator.gpu && !navigator.connection?.saveData) {
  import('./signal.js').then(({ startSignal }) => startSignal()).catch(() => {
    document.querySelector('#signal').dataset.renderer = 'fallback';
  });
} else {
  document.querySelector('#signal').dataset.renderer = 'fallback';
}
