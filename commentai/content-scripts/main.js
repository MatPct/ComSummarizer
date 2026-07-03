/**
 * CommentAI - main.js
 *
 * Orchestrateur du content script. Chargé en dernier : à ce stade,
 * window.CommentAI expose déjà scrapeComments(), getInjectionAnchor(),
 * config, pickTopComments(), summarizeComments(), injectSummary().
 *
 * Flux (sans action utilisateur) :
 *   1. Attendre que les commentaires soient chargés (lazy-loading)
 *   2. Scraper les commentaires visibles
 *   3. Sélectionner les 5 plus pertinents
 *   4. Générer le résumé via la Summarizer API
 *   5. Injecter le résumé dans le DOM
 */

(async function run() {
  const { config, scrapeComments, getInjectionAnchor, pickTopComments, summarizeComments, injectSummary, injectUnavailableNotice, platform } =
    window.CommentAI;

  console.log(`[CommentAI] Démarrage sur ${platform}`);

  await window.CommentAI.waitForComments({
    rootSelector: config.rootSelector,
    itemSelector: config.itemSelector,
    minCount: config.minCount,
  });

  const allComments = scrapeComments();
  console.log(`[CommentAI] ${allComments.length} commentaires extraits`);

  if (allComments.length === 0) {
    console.log('[CommentAI] Aucun commentaire trouvé, arrêt.');
    return;
  }

  const topComments = pickTopComments(allComments, 5);
  const anchor = getInjectionAnchor();

  const summary = await summarizeComments(topComments);

  if (!summary) {
    injectUnavailableNotice(anchor);
    return;
  }

  console.log('[CommentAI] Résumé généré :', summary);
  injectSummary(summary, anchor);
})();
