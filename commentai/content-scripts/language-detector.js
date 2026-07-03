/**
 * CommentAI - language-detector.js
 *
 * Encapsule l'appel à la Language Detector API embarquée dans Chrome.
 * https://developer.chrome.com/docs/ai/language-detection
 */

window.CommentAI = window.CommentAI || {};

let sharedDetector = null;
let detectorReady = false;

/**
 * Crée (une seule fois, réutilisée ensuite) une instance de détecteur.
 * Retourne null si l'API est indisponible sur cette machine.
 */
async function getDetector() {
  if (detectorReady) return sharedDetector;
  detectorReady = true; // évite de retenter en boucle si indisponible

  if (!('LanguageDetector' in self)) {
    console.warn('[CommentAI] Language Detector API non supportée.');
    return null;
  }

  const availability = await LanguageDetector.availability();
  if (availability === 'unavailable') {
    console.warn('[CommentAI] Language Detector API indisponible sur cette machine.');
    return null;
  }

  sharedDetector = await LanguageDetector.create();
  return sharedDetector;
}

/**
 * Détecte la langue d'un texte. Retourne un code langue court (ex: "en",
 * "fr") ou null si la détection a échoué / l'API est indisponible.
 */
window.CommentAI.detectLanguage = async function detectLanguage(text) {
  const detector = await getDetector();
  if (!detector || !text) return null;

  try {
    const results = await detector.detect(text);
    if (!results || results.length === 0) return null;
    // results est trié par confiance décroissante.
    return results[0].detectedLanguage;
  } catch (err) {
    console.warn('[CommentAI] Erreur de détection de langue :', err);
    return null;
  }
};

/**
 * Renvoie la langue "principale" de l'utilisateur (ex: "fr" à partir de
 * "fr-FR"), utilisée comme référence de comparaison.
 */
window.CommentAI.getUserLanguage = function getUserLanguage() {
  const raw = chrome.i18n?.getUILanguage?.() || navigator.language || 'fr';
  return raw.split('-')[0].toLowerCase();
};
