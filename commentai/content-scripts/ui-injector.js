/**
 * CommentAI - ui-injector.js
 *
 * Injecte le bloc de résumé dans la page hôte, dans un Shadow DOM pour
 * éviter toute collision de style avec YouTube / Reddit.
 */

window.CommentAI = window.CommentAI || {};

const CONTAINER_ID = 'commentai-summary-root';

/**
 * Convertit un minimum de markdown (listes à puces, gras) en HTML,
 * suffisant pour le format "key-points" de la Summarizer API.
 * Volontairement minimaliste : pas de dépendance externe.
 */
function miniMarkdownToHtml(markdown) {
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);
  let html = '';
  let inList = false;

  for (const line of lines) {
    const isBullet = line.startsWith('-') || line.startsWith('*');
    const content = isBullet ? line.slice(1).trim() : line;
    const withBold = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    if (isBullet && !inList) {
      html += '<ul>';
      inList = true;
    }
    if (!isBullet && inList) {
      html += '</ul>';
      inList = false;
    }

    html += isBullet ? `<li>${withBold}</li>` : `<p>${withBold}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

window.CommentAI.injectSummary = function injectSummary(summaryMarkdown, anchorEl) {
  if (!anchorEl) {
    console.warn('[CommentAI] Point d\'ancrage introuvable, injection annulée.');
    return;
  }

  // Évite les doublons si le script se relance (ex : SPA navigation YouTube).
  const existing = document.getElementById(CONTAINER_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = CONTAINER_ID;
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .card {
      font-family: Roboto, Arial, sans-serif;
      background: #f4f4f8;
      border: 1px solid #d9d9e3;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 12px 0;
    }
    .title {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .badge {
      background: #6c5ce7;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .content { font-size: 14px; color: #333; line-height: 1.5; }
    .content ul { margin: 4px 0 4px 18px; padding: 0; }
    .content li { margin-bottom: 4px; }
    .content p { margin: 4px 0; }
  `;

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="title"><span class="badge">CommentAI</span> Résumé des commentaires les plus pertinents</div>
    <div class="content">${miniMarkdownToHtml(summaryMarkdown)}</div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(card);

  anchorEl.prepend(host);
};

window.CommentAI.injectUnavailableNotice = function injectUnavailableNotice(anchorEl) {
  if (!anchorEl) return;
  const existing = document.getElementById(CONTAINER_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = CONTAINER_ID;
  const shadow = host.attachShadow({ mode: 'open' });
  const div = document.createElement('div');
  div.style.cssText =
    'font-family:Roboto,Arial,sans-serif;background:#fff3f0;border:1px solid #ffcdc2;border-radius:12px;padding:12px 16px;margin:12px 0;font-size:13px;color:#7a2e20;';
  div.textContent =
    "CommentAI : la Summarizer API n'est pas disponible sur cet appareil (voir prérequis matériel dans la doc Chrome).";
  shadow.appendChild(div);
  anchorEl.prepend(host);
};
