/**
 * CommentAI - service-worker.js
 *
 * Pour le palier 1, toute la logique se passe dans les content scripts
 * (voir content-scripts/main.js), qui ont un accès direct aux API IA
 * embarquées ainsi qu'au DOM de la page. Le service worker n'a donc pas
 * de rôle actif pour l'instant ; il est prêt à accueillir une logique
 * globale future (ex : gestion de préférences utilisateur partagées entre
 * onglets, via chrome.storage).
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[CommentAI] Extension installée.');
});
