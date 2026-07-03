/**
 * CommentAI - translator.js
 *
 * Encapsule l'appel à la Translator API embarquée dans Chrome.
 * https://developer.chrome.com/docs/ai/translator-api
 *
 * Une instance de Translator est liée à UNE paire de langues (source ->
 * cible) : on ne peut pas réutiliser un même traducteur pour deux langues
 * sources différentes. On garde donc un petit cache par paire de langues,
 * pour éviter de recréer un traducteur à chaque clic si l'utilisateur
 * traduit plusieurs commentaires dans la même langue source.
 */

window.CommentAI = window.CommentAI || {};

const translatorCache = new Map(); // clé: "source->cible"

/**
 * Traduit un texte de sourceLanguage vers targetLanguage.
 * Retourne le texte traduit, ou null si l'API/la paire de langues est
 * indisponible.
 */
window.CommentAI.translateText = async function translateText(
  text,
  sourceLanguage,
  targetLanguage
) {
  if (!('Translator' in self)) {
    console.warn('[CommentAI] Translator API non supportée.');
    return null;
  }
  if (!sourceLanguage || !targetLanguage) return null;
  if (sourceLanguage === targetLanguage) return text; // rien à traduire

  const cacheKey = `${sourceLanguage}->${targetLanguage}`;

  try {
    let translator = translatorCache.get(cacheKey);

    if (!translator) {
      const availability = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });

      if (availability === 'unavailable') {
        console.warn(
          `[CommentAI] Paire de langues non supportée : ${cacheKey}`
        );
        return null;
      }

      translator = await Translator.create({ sourceLanguage, targetLanguage });
      translatorCache.set(cacheKey, translator);
    }

    return await translator.translate(text);
  } catch (err) {
    console.warn('[CommentAI] Erreur de traduction :', err);
    return null;
  }
};
