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
  const {
    config,
    scrapeComments,
    getInjectionAnchor,
    pickTopComments,
    summarizeComments,
    injectSummary,
    injectUnavailableNotice,
    injectTranslateButton,
    detectLanguage,
    getUserLanguage,
    platform,
  } = window.CommentAI;

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

  // --- Palier 1 : résumé automatique des commentaires les plus pertinents ---
  const topComments = pickTopComments(allComments, 5);
  const anchor = getInjectionAnchor();

  const summary = await summarizeComments(topComments);

  if (!summary) {
    injectUnavailableNotice(anchor);
  } else {
    console.log('[CommentAI] Résumé généré :', summary);
    injectSummary(summary, anchor);
  }

  // --- Palier 2 : détection de langue + bouton de traduction par commentaire ---
  await attachTranslateButtons(allComments, { detectLanguage, getUserLanguage, injectTranslateButton });
})();

/**
 * Pour chaque commentaire scrapé : détecte sa langue, la compare à celle
 * de l'utilisateur, et n'ajoute un bouton "Traduire" que si elles diffèrent.
 * Traité séquentiellement (et non en parallèle) pour ne pas saturer le
 * modèle on-device avec de nombreux appels simultanés.
 */
async function attachTranslateButtons(comments, { detectLanguage, getUserLanguage, injectTranslateButton }) {
  const userLanguage = getUserLanguage();
  console.log(`[CommentAI] Langue utilisateur détectée : ${userLanguage}`);

  let buttonsAdded = 0;

  for (const comment of comments) {
    if (!comment.textElement) continue;

    const detectedLang = await detectLanguage(comment.text);
    if (!detectedLang) continue; // API indisponible ou détection impossible

    comment.detectedLang = detectedLang;

    if (detectedLang !== userLanguage) {
      injectTranslateButton(comment, userLanguage);
      buttonsAdded += 1;
    }
  }

  console.log(`[CommentAI] ${buttonsAdded} bouton(s) de traduction ajouté(s)`);
}
