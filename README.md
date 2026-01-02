# Chess-Xplorer ♟️

Outil interactif d'analyse et de visualisation d'échecs développé avec React + Vite.

## 📋 Description

Chess-Xplorer est une application web complète permettant de jouer aux échecs et d'analyser les positions avec des outils visuels avancés. L'application implémente toutes les règles officielles du jeu d'échecs, y compris les mouvements spéciaux comme le roque, et offre une détection automatique des échecs et échecs et mat.

## ✨ Fonctionnalités

### Jeu d'échecs complet
- **Règles officielles** : Tous les mouvements légaux pour chaque pièce (pions, tours, cavaliers, fous, dames, rois)
- **Roque** : Support complet du petit et grand roque avec validation des conditions
- **Détection d'échec** : Le roi en échec clignote en rouge
- **Détection d'échec et mat** : Fin automatique de la partie avec indication du vainqueur
- **Validation des coups** : Impossible de jouer un coup qui met son propre roi en échec

### Interface utilisateur intuitive
- **Drag & Drop** : Déplacez les pièces en les faisant glisser
- **Clic pour jouer** : Alternative au drag & drop - cliquez sur une pièce puis sur la case de destination
- **Coups valides** : Points bleus pour les cases disponibles, points orange pour les cases où la pièce serait attaquée
- **Attaques possibles** : Cases rouges pour les captures possibles
- **Plateau visuel** : Arrière-plan en image de plateau d'échecs réaliste

### Outils d'analyse avancés
- **Attaques blanches/noires** : Visualisez toutes les pièces attaquées par chaque camp (orange pour les blancs, vert foncé pour les noirs)
- **Protection des pièces** : Bordures colorées indiquant le nombre de défenseurs (épaisseur croissante = plus de défenseurs)
- **Avertissement de danger** : Les coups valides affichent un point orange si la pièce sera sous attaque après le déplacement

### Historique et sauvegarde
- **Historique des coups** : Liste complète avec notation d'échecs et icônes Unicode (♟♜♞♝♛♚)
- **Export** : Sauvegardez vos parties dans un fichier texte avec l'historique et la position finale du plateau
- **Import** : Rechargez une partie sauvegardée pour continuer ou analyser
- **Notation** : Format lisible avec symboles de couleur (⚪ blancs, ⚫ noirs) et notation algébrique

## 🎮 Utilisation

### Démarrer une partie
1. Lancez l'application et cliquez sur "Analyse Games"
2. Le plateau s'affiche avec la position initiale
3. Les blancs commencent (indiqué par "⚪ White to move")

### Jouer un coup
**Méthode 1 - Drag & Drop :**
- Cliquez et maintenez sur une pièce de votre couleur
- Glissez-la vers une case valide
- Relâchez pour jouer le coup

**Méthode 2 - Clic :**
- Cliquez sur une pièce pour la sélectionner (la case devient jaune)
- Les coups valides s'affichent avec des points :
  - 🔵 Point bleu = case sûre (pièce non attaquée)
  - 🟠 Point orange = case risquée (pièce sera attaquée)
  - 🔴 Bordure rouge = capture possible
- Cliquez sur une case valide pour y déplacer la pièce

### Outils d'analyse
**Afficher les attaques :**
- Activez "⚪ White Attacks: ON" pour voir toutes les pièces noires menacées (cases oranges)
- Activez "⚫ Black Attacks: ON" pour voir toutes les pièces blanches menacées (cases vert foncé)

**Afficher les protections :**
- Activez "⚪ White Protection: ON" pour voir les pièces blanches défendues (bordures bleues)
- Activez "⚫ Black Protection: ON" pour voir les pièces noires défendues (bordures grises)
- L'épaisseur de la bordure indique le nombre de défenseurs (1 à 4+)

### Gérer les parties
- **Reset Board** : Réinitialise le plateau à la position initiale
- **💾 Export** : Sauvegarde la partie en cours dans un fichier .txt
- **📂 Import** : Charge une partie depuis un fichier .txt exporté

## 🛠️ Technologies utilisées

- **React 18.3.1** : Framework frontend
- **Vite 5.4.2** : Build tool et dev server
- **React Router DOM** : Navigation entre pages
- **CSS3** : Animations et styles personnalisés
- **File API** : Import/Export de parties

## 📦 Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/chess-xplorer.git

# Installer les dépendances
cd chess-xplorer
npm install

# Lancer l'application en mode développement
npm run dev

# Build pour la production
npm run build
```

## 🎨 Structure du projet

```
chess-xplorer/
├── src/
│   ├── pages/
│   │   ├── HomePage.jsx          # Page d'accueil
│   │   ├── AnalyzeGames.jsx      # Moteur de jeu et analyse
│   │   └── AnalyzeGames.css      # Styles du plateau
│   ├── resources/                # Images des pièces et plateau
│   │   ├── plateau.png
│   │   ├── white-*.png
│   │   └── black-*.png
│   └── App.jsx                   # Composant principal avec routage
├── package.json
└── README.md
```

## 🎯 Règles d'échecs implémentées

### Mouvements des pièces
- **Pion (♟)** : Avance d'une case, deux cases depuis la position initiale, capture en diagonale
- **Tour (♜)** : Déplacement horizontal et vertical illimité
- **Cavalier (♞)** : Déplacement en "L" (2+1 cases)
- **Fou (♝)** : Déplacement diagonal illimité
- **Dame (♛)** : Combinaison tour + fou
- **Roi (♚)** : Une case dans toutes les directions + roque

### Règles spéciales
- **Roque** : 
  - Petit roque (O-O) : Roi vers la colonne g, tour de h vers f
  - Grand roque (O-O-O) : Roi vers la colonne c, tour de a vers d
  - Conditions : ni le roi ni la tour ne doivent avoir bougé, cases vides entre les deux, roi ne doit pas traverser une case attaquée

- **Échec** : Le roi clignote en rouge, seuls les coups qui sortent de l'échec sont autorisés
- **Échec et mat** : Partie terminée, plus aucun coup possible

## 📝 Format d'export

Les parties exportées utilisent le format texte suivant :

```
Chess Game Move History
======================
Date: 2/1/2026, 10:30:45

1. ⚪ ♙ e2 → e4
2. ⚫ ♙ e7 → e5
...

Final Board State
=================
    a   b   c   d   e   f   g   h
  +---+---+---+---+---+---+---+---+
8 | ♜ | ♞ | ♝ | ♛ | ♚ | ♝ | ♞ | ♜ | 8
  +---+---+---+---+---+---+---+---+
...
```

## 🚀 Améliorations futures possibles

- Annuler/Refaire les coups
- Suggestions de coups (moteur d'IA)

## 👤 Auteur

Entièrement développé avec Github Copilot en mode Agent avec Claude Sonnet 4.5
