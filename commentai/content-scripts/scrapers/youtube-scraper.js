/**
 * CommentAI - youtube-scraper.js
 *
 * Scraper dédié à YouTube. Extrait les commentaires visibles dans le DOM
 * et fournit le point d'ancrage où injecter le résumé.
 *
 * NB : les sélecteurs ci-dessous correspondent à la structure de
 * youtube.com au moment de l'écriture. Comme précisé dans la doc du projet,
 * ils sont fragiles par nature (custom elements ytd-*) et peuvent nécessiter
 * une mise à jour si YouTube change son DOM.
 */

window.CommentAI = window.CommentAI || {};

window.CommentAI.platform = 'youtube';

window.CommentAI.config = {
  rootSelector: '#comments #contents',
  itemSelector: 'ytd-comment-thread-renderer',
  minCount: 5,
};

/**
 * Extrait les commentaires actuellement chargés dans le DOM.
 * Retourne un tableau de { author, text, likes }.
 */
window.CommentAI.scrapeComments = function scrapeComments() {
  const threads = document.querySelectorAll('ytd-comment-thread-renderer');
  const comments = [];

  threads.forEach((thread) => {
    const authorEl = thread.querySelector('#author-text');
    const textEl = thread.querySelector('#content-text');
    const likesEl = thread.querySelector('#vote-count-middle');

    if (!textEl) return;

    const text = textEl.innerText.trim();
    if (!text) return;

    comments.push({
      author: authorEl ? authorEl.innerText.trim() : 'Inconnu',
      text,
      likes: likesEl ? parseLikeCount(likesEl.innerText) : 0,
    });
  });

  return comments;
};

/**
 * Convertit "1,2 k" / "3" / "" en nombre exploitable pour le tri.
 */
function parseLikeCount(raw) {
  if (!raw) return 0;
  const cleaned = raw.trim().toLowerCase().replace(',', '.');
  if (cleaned.includes('k')) {
    return Math.round(parseFloat(cleaned) * 1000);
  }
  if (cleaned.includes('m')) {
    return Math.round(parseFloat(cleaned) * 1000000);
  }
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Retourne l'élément DOM au sommet duquel injecter le résumé.
 */
window.CommentAI.getInjectionAnchor = function getInjectionAnchor() {
  // On cible l'en-tête de la section commentaires (juste au-dessus du fil).
  return (
    document.querySelector('#comments #sections') ||
    document.querySelector('#comments')
  );
};
