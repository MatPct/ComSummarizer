/**
 * CommentAI - reddit-scraper.js
 *
 * Scraper dédié à Reddit. Gère les deux structures possibles :
 *   - le nouveau Reddit (www.reddit.com), basé sur le web component
 *     <shreddit-comment>
 *   - l'ancien Reddit (old.reddit.com), structure HTML classique
 *     (.comment > .entry > .usertext-body)
 *
 * Le sélecteur effectivement utilisé est déterminé au chargement selon
 * le domaine courant.
 */

window.CommentAI = window.CommentAI || {};

window.CommentAI.platform = 'reddit';

const IS_OLD_REDDIT = location.hostname === 'old.reddit.com';

window.CommentAI.config = IS_OLD_REDDIT
  ? {
      rootSelector: '.commentarea',
      itemSelector: '.comment',
      minCount: 5,
    }
  : {
      rootSelector: 'shreddit-comment-tree',
      itemSelector: 'shreddit-comment',
      minCount: 5,
    };

window.CommentAI.scrapeComments = function scrapeComments() {
  return IS_OLD_REDDIT ? scrapeOldReddit() : scrapeNewReddit();
};

function scrapeOldReddit() {
  const nodes = document.querySelectorAll('.comment');
  const comments = [];

  nodes.forEach((node) => {
    const authorEl = node.querySelector('.author');
    const textEl = node.querySelector('.usertext-body .md');
    const scoreEl = node.querySelector('.score.unvoted');

    if (!textEl) return;
    const text = textEl.innerText.trim();
    if (!text) return;

    comments.push({
      author: authorEl ? authorEl.innerText.trim() : '[supprimé]',
      text,
      likes: scoreEl ? parseInt(scoreEl.innerText, 10) || 0 : 0,
    });
  });

  return comments;
}

function scrapeNewReddit() {
  const nodes = document.querySelectorAll('shreddit-comment');
  const comments = [];

  nodes.forEach((node) => {
    // shreddit-comment expose l'auteur et le score en attributs custom.
    const author = node.getAttribute('author') || 'Inconnu';
    const score = parseInt(node.getAttribute('score'), 10) || 0;

    // Le corps du commentaire est rendu dans un slot / div interne.
    const textEl = node.querySelector('[slot="comment"], .md');
    if (!textEl) return;
    const text = textEl.innerText.trim();
    if (!text) return;

    comments.push({ author, text, likes: score });
  });

  return comments;
}

window.CommentAI.getInjectionAnchor = function getInjectionAnchor() {
  if (IS_OLD_REDDIT) {
    return document.querySelector('.commentarea');
  }
  return (
    document.querySelector('shreddit-comment-tree') ||
    document.querySelector('#comment-tree')
  );
};
