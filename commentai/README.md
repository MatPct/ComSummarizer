# CommentAI

Extension Chrome (Manifest V3) qui résume automatiquement les commentaires
YouTube et Reddit à l'aide des API IA embarquées de Chrome (Summarizer,
Translator, Language Detector).

## Structure du projet

```
commentai/                      <- dossier à charger dans chrome://extensions
├── manifest.json                 (DOIT rester à la racine de ce dossier)
├── content-scripts/
│   ├── main.js                   orchestrateur (chargé en dernier)
│   ├── summarizer.js             appel à la Summarizer API
│   ├── ui-injector.js            injection du résumé dans le DOM (Shadow DOM)
│   ├── scrapers/
│   │   ├── youtube-scraper.js
│   │   └── reddit-scraper.js
│   └── utils/
│       └── dom-observer.js       gestion du lazy-loading
├── background/
│   └── service-worker.js
└── icons/                        (vide pour l'instant, voir plus bas)
```

## Installation en mode développeur

1. Aller sur `chrome://extensions`
2. Activer le **mode développeur** (interrupteur en haut à droite)
3. Cliquer sur **"Charger l'extension non empaquetée"**
4. Sélectionner le dossier `commentai/` **lui-même** (celui qui contient
   directement `manifest.json`, pas un dossier parent qui le contiendrait).

> Point d'attention "Load unpacked" : Chrome exige que le `manifest.json`
> soit directement à la racine du dossier sélectionné. Si tu obtiens une
> erreur "Manifest file is missing or unreadable", vérifie que tu ne
> sélectionnes pas un dossier parent (ex: le dossier du repo Git contenant
> `commentai/` en sous-dossier) ni un `.zip` non extrait.

5. Ouvrir une vidéo YouTube avec des commentaires, ou un post Reddit avec
   des commentaires, et observer la console (F12) : les logs `[CommentAI]`
   indiquent la progression (extraction, génération du résumé, injection).

## Prérequis machine pour les API IA

Avant de tester, vérifie que la machine utilisée respecte les prérequis
matériels de la Summarizer API (sinon un message "indisponible" apparaîtra
à la place du résumé) :
- Windows 10/11, macOS 13+, Linux ou ChromeOS
- ~22 Go d'espace disque libre
- GPU avec plus de 4 Go de VRAM, ou à défaut 16 Go de RAM / 4 cœurs CPU
- Connexion internet non métrée pour le premier téléchargement du modèle
  (Gemini Nano)

Le premier appel à `Summarizer.create()` doit être déclenché depuis une
interaction utilisateur réelle (chargement de page + activité normale sur
l'onglet suffit généralement, mais si le téléchargement ne démarre pas,
essaie de cliquer une fois sur la page avant de recharger).

## État d'avancement (palier 1)

- [x] Scraper YouTube (extraction commentaires visibles)
- [x] Scraper Reddit (nouveau Reddit + old.reddit.com) — **à re-tester et
      affiner** : les sélecteurs du nouveau Reddit (`shreddit-comment`)
      sont basés sur des web components dont la structure interne peut
      varier ; vérifier en particulier le sélecteur du corps du texte
      (`[slot="comment"], .md`).
- [x] Gestion du lazy-loading via `MutationObserver` + scroll programmatique
- [x] Génération du résumé (Summarizer API, type `key-points`)
- [x] Injection automatique du résumé dans le DOM (Shadow DOM, sans action
      utilisateur)

## À faire ensuite (palier 2)

- Language Detector API : détecter la langue de chaque commentaire scrapé
- Comparer à la langue de l'utilisateur (`navigator.language` ou préférence
  stockée dans `chrome.storage`)
- Afficher un bouton "Traduire" à côté des commentaires en langue différente
- Translator API : traduction à la demande au clic

## Icônes

Aucune icône n'est déclarée dans le manifest pour l'instant (champ
`icons` omis), ce qui évite une erreur de chargement en l'absence de
fichiers PNG. Tu peux ajouter des icônes 16/48/128px dans `icons/` puis
référencer le champ `"icons"` dans `manifest.json` et `"default_icon"`
si tu ajoutes un `action` (popup) plus tard.
