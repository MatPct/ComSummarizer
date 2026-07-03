/**
 * CommentAI - summarizer.js
 *
 * Encapsule l'appel à la Summarizer API embarquée dans Chrome.
 * https://developer.chrome.com/docs/ai/summarizer-api
 */

window.CommentAI = window.CommentAI || {};

/**
 * Sélectionne les N commentaires les plus "pertinents".
 * Heuristique simple pour le palier 1 : tri par nombre de likes décroissant,
 * puis on garde le top N. À défaut de likes exploitables, on garde l'ordre
 * d'apparition.
 */
window.CommentAI.pickTopComments = function pickTopComments(comments, n = 5) {
  return [...comments]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, n);
};

/**
 * Vérifie la disponibilité de la Summarizer API et retourne un résumé
 * (chaîne de texte au format markdown, type "key-points") des commentaires
 * fournis. Retourne null si l'API est indisponible sur cette machine.
 */
window.CommentAI.summarizeComments = async function summarizeComments(comments) {
  if (!('Summarizer' in self)) {
    console.warn('[CommentAI] Summarizer API non supportée sur ce navigateur.');
    return null;
  }

  const availability = await Summarizer.availability();
  if (availability === 'unavailable') {
    console.warn('[CommentAI] Summarizer API indisponible sur cette machine (voir prérequis matériel).');
    return null;
  }

  const summarizer = await Summarizer.create({
    type: 'key-points',
    format: 'markdown',
    length: 'short',
    outputLanguage: 'fr',
    sharedContext:
      `Ce sont des commentaires d'utilisateurs sur ${window.CommentAI.platform === 'youtube' ? 'une vidéo YouTube' : 'un post Reddit'}.`,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`[CommentAI] Téléchargement du modèle : ${Math.round(e.loaded * 100)}%`);
      });
    },
  });

  const inputText = comments
    .map((c, i) => `Commentaire ${i + 1} (${c.author}) : ${c.text}`)
    .join('\n\n');

  const summary = await summarizer.summarize(inputText, {
    context: 'Résume les avis et points de débat principaux exprimés dans ces commentaires.',
  });

  summarizer.destroy();
  return summary;
};
