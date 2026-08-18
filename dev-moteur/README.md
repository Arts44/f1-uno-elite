# dev-moteur — atelier du tutoriel Obsidian

Le livrable final est **un seul fichier** `obsidian-tuto.html`, autonome et
ouvrable en double-clic. Ce dossier contient les sources de travail, pour
qu'il n'y ait jamais deux copies du moteur qui divergent.

| Fichier | Rôle |
|---|---|
| `moteur.js` | le moteur Markdown, source unique. Module ES pour être testable sous Node. |
| `test-moteur.mjs` | 37 cas, chaîne → chaîne, sans DOM. `node dev-moteur/test-moteur.mjs` |
| `assembler.mjs` | concatène moteur + chapitres + interface dans `obsidian-tuto.html` (à venir) |

## Lancer les tests

```
node dev-moteur/test-moteur.mjs
```

Sortie attendue : `37/37 cas passent.` Un échec affiche le HTML produit,
tronqué à 400 caractères, pour qu'on voie tout de suite ce qui a bougé.

## Les quatre règles d'échappement

Elles sont documentées en tête de `moteur.js` et valent pour tout le
contenu du tutoriel : span de code (R1), antislash (R2), clôture à quatre
accents graves (R3), `<\/script` dans les blocs de données (R4).
