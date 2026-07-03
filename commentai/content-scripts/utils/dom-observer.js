/**
 * CommentAI - dom-observer.js
 *
 * Utilitaire générique pour attendre le chargement dynamique (lazy-loading)
 * des commentaires avant de lancer le scraping.
 *
 * Principe : on observe un conteneur avec MutationObserver. On considère
 * que "suffisamment" de commentaires sont chargés dès que :
 *   - le nombre d'éléments correspondant au sélecteur atteint `minCount`,
 *   OU
 *   - plus aucun nouvel élément n'apparaît pendant `stableDelayMs`
 *     (le DOM est "stable" -> on arrête d'attendre).
 *
 * Chaque scraper (YouTube, Reddit) fournit son propre sélecteur CSS et son
 * propre conteneur racine, car la structure HTML diffère selon la plateforme.
 */

window.CommentAI = window.CommentAI || {};

window.CommentAI.waitForComments = function waitForComments({
  rootSelector,
  itemSelector,
  minCount = 5,
  stableDelayMs = 1500,
  timeoutMs = 15000,
}) {
  return new Promise((resolve) => {
    const start = Date.now();
    let stableTimer = null;

    const getRoot = () => document.querySelector(rootSelector);

    const currentCount = () => {
      const root = getRoot();
      if (!root) return 0;
      return root.querySelectorAll(itemSelector).length;
    };

    const finish = () => {
      if (observer) observer.disconnect();
      resolve(currentCount());
    };

    const resetStableTimer = () => {
      if (stableTimer) clearTimeout(stableTimer);
      stableTimer = setTimeout(finish, stableDelayMs);
    };

    // Timeout de sécurité : on ne bloque jamais indéfiniment.
    const hardTimeout = setTimeout(finish, timeoutMs);

    const observer = new MutationObserver(() => {
      if (currentCount() >= minCount) {
        clearTimeout(hardTimeout);
        finish();
        return;
      }
      resetStableTimer();
    });

    const root = getRoot();
    if (!root) {
      // Le conteneur de commentaires n'existe pas encore dans le DOM
      // (cas fréquent sur YouTube au tout premier rendu) : on observe le body
      // en attendant qu'il apparaisse, puis on bascule sur le vrai conteneur.
      const bootObserver = new MutationObserver(() => {
        const r = getRoot();
        if (r) {
          bootObserver.disconnect();
          observer.observe(r, { childList: true, subtree: true });
          resetStableTimer();
        }
      });
      bootObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      observer.observe(root, { childList: true, subtree: true });
      resetStableTimer();
    }

    // Provoque le chargement lazy en scrollant légèrement la page.
    // (YouTube charge les commentaires suivants quand on approche du bas
    // de la liste déjà rendue.)
    const scrollNudge = setInterval(() => {
      window.scrollBy(0, 800);
      if (currentCount() >= minCount || Date.now() - start > timeoutMs) {
        clearInterval(scrollNudge);
      }
    }, 700);
  });
};
