# Atelier Solo : Triple Triad Deck Builder

Triple Triad est un jeu de plateau à base de cartes, inventé par SquareEnix et présent dans Final Fantasy 8.

Les règles sont plutôt simples, mais ce n'est pas ce qui nous intéresse aujourd'hui !

On a récupéré toutes les données relatives aux cartes ainsi que leurs visuels. Et on voudrait construire une application pour gérer nos cartes, chercher des cartes selons plusieurs critères, et même gérer nos decks (= paquets de 5 cartes différentes).

## Étape 0 : Analyse du code fourni et mise en place

Un stagiaire a déjà commencé à poser les bases de l'application. Sympa !

Bon, niveau intégration c'est pas un champion... Mais c'est pas très important. Après tout, c'est un vieux jeu, on reste dans le thème _rétro_...

Analyse le code fourni pour comprendre ce qui a déjà été fait et voir ce que tu va pouvoir réutiliser dans la suite.

Ensuite, met en place la base de données à partir du fichier `data/create_db.sql`.

## Étape 1 : Détail d'une carte

Quand on clique sur carte dans la page d'accueil, on veut arriver sur la page "détail de la carte".

En terme d'intégration, fait comme tu veux, mais n'y passe pas trop de temps ! Reste simple, l'important est que les informations disponibles soient visibles.

A toi de jouer !
<details>
<summary>Un peu d'aide...</summary>

- Commence par écrire la requête pour récupérer les infos d'une carte, dans une nouvelle méthode `getCard` de dataMapper.
- Code ensuite une nouvelle méthode dans un controller (mainController, ou un autre. Fait ce qui te parait le plus logique !), qui appelle `dataMapper.getCard` et génère la view en conséquence.
- La view est à créer d'ailleurs.
- Crée une nouvelle route paramétrée qui pointe vers la nouvelle méthode du controller.
- Enfin, remplace les href des liens des cartes sur la page d'acceuil pour qu'il pointent vers la nouvelle route.
</details>

## Étape 2 : Recherche

Comme tu a pu le constater, le stagiaire a implémenté une view avec différents formulaires pour chercher des cartes. Pour l'instant la seule recherche qui m'interesse c'est "par élément".
A toi de finir le travail :muscle:

<details>
<summary>Au secours!</summary>

- Suit les mêmes étapes qu'à l'étape 1 : construire la requete, puis la méthode dans le controller, puis la view _si besoin_, et enfin la route.
- Utilise [req.query](http://expressjs.com/fr/api.html#req.query) pour accèder aux paramètres GET.
- Garde [la fiche récap SQL](https://github.com/O-clock-Alumni/fiches-recap/blob/master/bdd/sql.md) sous la main...
- Attention, petit piège lorsqu'on choisit "aucun" élément :imp:. Mais voilà [un peu d'aide](https://sql.sh/cours/where/is).
</details>

## Étape 3 : Construire un deck

On veut pouvoir construire un deck de 5 cartes différentes.

Pour ça, on va utiliser les sessions.

Et pour éviter de faire trop d'appels à la base de données, on va directement stocker toutes les données des cartes dans la session (et pas _juste_ les ID).

### 3.1: Activer les sessions

<details>
<summary>A l'aideuh !</summary>

- [Un petit tour sur npm](https://www.npmjs.com/package/express-session).
- La correction des challenges de cette semaine _peut aider_. :wink:
</details>

### 3.2 Ajouter une carte au deck

Les liens `[+]`, présents sur toutes les cartes, doivent ajouter la carte au deck de la session.

**NOTE**: Si la carte est déjà présente dans le deck ou que le deck possède déjà 5 cartes, on ne fait rien !

### 3.3 Une page pour visualiser le deck !

Un lien vers la route `/deck` est déjà prévu dans la nav, mais je crois que le stagiaire n'a pas eu le temps de mettre la route en place, ni la view...

### 3.4 Supprimer une carte du deck

Sur la view de l'étape précédente, rajouter des liens pour supprimer chacune des cartes du deck.

## Bonus: finir les recherches

### Recherche par niveau

On veut le niveau exact. Pas de "au moins".

### Recherche par valeur

On veut toutes les cartes qui ont _au moins_ la valeur choisi dans la direction sélectionnée.

### Par nom

On veut les cartes dont le nom contient la valeur entrée.

Par exemple, chercher `ek` doit renvoyer "Sel*ek*" et "*Ek*arissor".# Deck-Builder
# Deck-Builder
