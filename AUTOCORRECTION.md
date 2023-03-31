# Autocorrection : Tirple Triad Deck Builder

Ces explications pourront t'aider à voir ce qui t'a bloqué ou à explorer d'autres pistes. Il y a bien souvent plusieurs solutions à un même problème, il y aura donc en général d'autres solutions acceptables.

N'hésite pas à t'aider de celles-ci en reprenant les exercices pour lesquels tu as eu des difficultés.


## Étape 0 : Analyse du code fourni et mise en place

### Mise en place de la BDD
    
Pour créer la BDD, on doit se connecter en tant qu'utilisateur `postgres` à la BDD

```shell
sudo -u postgres psql
```

Une fois connecté(e), on peut créer un nouveau rôle pour notre projet ...

```sql
CREATE ROLE triple_triad WITH LOGIN PASSWORD 'triple_triad';
```
    
... et lui attribuer une nouvelle base de données

```sql
CREATE DATABASE triple_triad OWNER triple_triad;
```

On peut maintenant importer les données fournies, on quitte la connexion postgres  
On vérifie qu'on se trouve bien dans le répertoire du projet et on lance

```shell
psql -U triple_triad -f ./data/create_db.sql
```
### Mise en place du projet


On a un package.json dans le projet, commençons par récupérer les dépendances

```shell
npm install
```

On a un fichier `.env.example` dans le projet, on le copie et on le renomme en `.env`  
On renseigne les infos de connexion à la BDD. On utilisera le port par défaut de postgres (5432), pas besoin de le préciser dans l'URL de connexion

```shell
PG_URL=postgresql://triple_triad:triple_triad@localhost/triple_triad
```

On peut maintenant lancer le projet et afficher la page d'accueil sur http://localhost:1234

```shell
node index.js
# ou bien
nodemon index.js
# ou bien
node-dev index.js
```

---

## Étape 1 : Détail d'une carte

On ajoute la méthode `getCard` dans le DataMapper.  
Cette méthode sera chargé d'interroger la BDD pour récupérer les infos de la carte souhaitée et de rendre ces infos plus "digestes" pour le contrôleur

```js
getCard: async function (cardId) {
    const query = {
      text: `SELECT * FROM "card" WHERE "id"=$1`,
      values: [cardId]
    };
    const results = await database.query(query);
    return results.rows[0];
}
```

Dans le contrôleur `mainController`, on ajoute une méthode `cardDetails` pour traiter les résultats de la requête

```js
cardDetails: async function (request, response) => {
   const cardId = parseInt(request.params.id, 10)

    try {
      const card = await dataMapper.getCard(cardId);
  
      if (card) { //équivalent à if (card !== undefined)
        //le paramètre card contient bien des infos, on les passe à la vue pour affichage
        response.render('cardDetails', {card});
    } else {
        //pas d'erreur SQL mais on n'a récupéré aucun enregistrement, on le signale au navigateur
        response.status(404).send(`Card with id ${cardId} not found`);
    }
    } catch (error) {
      console.error(error);
      response.status(500).render('error');
    }
}
```

On ajoute la route adéquate dans le routeur

```js
//détails d'une carte
router.get('/card/:id', mainController.cardDetails);
```

Pour finir, on met à jour la vue `cardList` en remplaçant le `href="#"`des liens pour la route qu'on vient d'ajouter  
On ajoute dans le dossier `views` une nouvelle vue ejs chargée d'afficher les détails d'une carte (`cardDetails.ejs`)  

```html
<div class="card">
    <a href="/card/<%= card.id %>">
    <img src="/visuals/<%= card.visual_name %>" alt="<%= card.name %> illustration">
    <p class="cardName"><%= card.name %></p>
    </a>
    <a class="link--addCard" title="Ajouter au deck" href="#">[ + ]</a>
</div>
```

La page s'affiche bien mais dans l'onglet `network` on voit que le fichier `style.css` n'est pas chargé correctement  
C'est l'habituel problème de path dans header.ejs, on corrige le chemin

```html
 <link rel="stylesheet" href="/css/style.css">
```

---

## Étape 2 : Recherche

On commence par afficher la vue recherche pour voir à quoi elle ressemble  
Si on valide le formulaire de recherche par élément, on obtient plusieurs infos en observant l'url affichée  
`http://localhost:1234/search/element?element=null`  
- le formulaire utilise la méthode http GET, on retrouve les infos du formulaire après le `?`, côté back elles seront placées dans l'object request.query
- la route contactée par le formulaire est `/search/element`, c'est cette route qu'il faudra ajouter au routeur
- la méthode du DataMapper qu'on doit ajouter devra recevoir un paramètre `element`pour effecture la requête
- quand on valide en mettant le selct du formulaire sur `aucun`, dans l'url on retrouve `element=null`

### Méthode du DataMapper

On ajoute une méthode getCardsByElement au DataMapper  
En BDD, on remarque que certaines cartes ont un élément qui vaut NULL, ce qui correspondra à la queryString `element=null`  
NULL siginife absence de valeur en SQL, on ne peut pas écrire  
```sql
SELECT * FROM card WHERE element=NULL;
```
Postgres ne comprendra pas notre requête  
Pour manipuler des champs de valeur `NULL`, on doit utiliser des opérateurs particuliers: `IS NULL` ou bien `IS NOT NULL`  

```js
getCardsByElement: async function (element) {
    let query;
    //le piège : si l'élément n'est pas renseigné en BDD, il vaut NULL. Pour effectuer la requête, on utilise les mots-clé IS NULL
    if (element === 'null') {
      query = {
        text: `SELECT * FROM "card" WHERE "element" IS NULL`
      };

    } else {

      //sinon on fait la requête de façon classique
      query = {
        text: `SELECT * FROM "card" WHERE "element"=$1`,
        values: [element]
      };

    }

    const results = await database.query(query);
    return results.rows;
}
```

### Méthode du contrôleur

On va devoir utiliser le DataMapper dans le `searchController`, on commence par l'importer dans le fichier  
```js
const dataMapper = require('../dataMapper');
```

Pour afficher les résultats, on va réutiliser la vue cardList qui va afficher toutes les cartes d'un tableau passé dans une variable `cards` et en titre la string contenue dans une variable `title`

On utilise la méthode `getCardsByElement` du DataMapper dans une nouvelle méthode `searchElement` du contrôleur `searchController`

```js
//recherche par élément
searchElement: async function (request, response) {
    //on récupère l'élément à chercher depuis la queryString de l'URL
    const element = request.query.element;
    dataMapper.getCardsByElement(element, (error, cards) => {
        if (error) {
            response.status(500).send(error);
        } else {
            
            const title = 'Liste des cartes ' + (element === 'null' ? ' sans élément' : `d'élement ${element}`);
            //on utilise la vue cardList pour afficher les cartes filtrées par élément
            response.render('cardList', {
                cards,
                title
            });
        }
    });
     //on récupère l'élément à chercher depuis la queryString de l'URL
    const element = request.query.element;
    try {

      const cards = await dataMapper.getCardsByElement(element);
      //on détermine le nouveau titre à afficher à l'aide d'une condition ternaire
      //on adapte le titre de la page en fonction de l'élément choisi
      const title = 'Liste des cartes ' + (element === 'null' ? ' sans élément' : `d'élement ${element}`);
      //on utilise la vue cardList pour afficher les cartes filtrées par élément
      response.render('cardList', {
        cards,
        title
      });

    } catch (error) {
      console.error(error);
      response.status(500).render('error');
    }
}
```

On peut maintenant ajouter la route `/search/element` dans le routeur et tester

```js
router.get('/search/element', searchController.searchElement);
```

---

## Étape 3 : Construire un deck

### 3.1: Activer les sessions
On va avoir besoin du package `express-session` pour mettre le système en place, on l'installe

```shell
npm install express-session
```

Dans `index.js`, on importe le package et on ajoute le middleware qui va bien en faisant attention à sa position dans la liste  
IMPORTANT : si on veut utiliser les sessions dans les méthodes de contrôleur, il faut placer ce middleware AVANT l'appel au routeur   
Bonne pratique : on va devoir définir un `secret` à la mise en place, on va passer par une nouvelle variable d'environnement pour le stocker

Dans le `.env`, on ajoute une nouvelle variable et on y place le mot secret de notre choix (On n'oublie pas de compléter le `.env.example` ...)

```shell
SESSION_SECRET=kjzgnkjebgkzjbgkjks
```

On peut maintenant mettre en place le middleware

```js
const session = require('express-session');
app.use(session(
    {
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true
    }
));
```

### 3.2 Ajouter une carte au deck

On va devoir stocker jusqu'à 5 cartes dans le deck. Le type idéal pour stocker une liste d'objects, c'est ... le tableau bien-sûr !  
Chaque session d'un utilisateur devra avoir une propriété qu'on va appeler `deck` qui contiendra un tableau de cartes  
On va directement initialiser ce tableau en session avec un middleware maison dans `index.js`  
On place ce nouveau middleware juste après celui qui met en place les session

```js
app.use((request, response, next) => {
	//si la propriété deck de la session vaut undefined, on la crée
	if (!request.session.deck) {
		request.session.deck = []
	}
	//sinon, on fait rien ...
	//et on passe la main au middleware suivant
	next();
});
```

On crée un nouveau contrôleur pour gérer ces opérations sur le deck, `deckController.js`   
Dans le routeur, on ajoute ce nouveau contrôleur et une route paramétrée pour l'ajout d'une carte au deck  
Le paramètre `:id` contiendra l'id de la carte à ajouter

```js
const deckController = require('./controllers/deckController');
router.get('/deck/add/:id', deckController.addCard);
```


On lui ajoute une méthode `addCard` qui va devoir :
- récupérer l'id de la carte à ajouter depuis les paramètres de l'URL (on pourra y accéder dans l'object `request.params`)
- vérifier si on n'a pas déjà une carte avec cet id dans le tableau `request.session.deck`
- si la carte est présente, on redirige vers la page d'accueil
- si elle n'est pas présente :
    - on vérifie combien de cartes sont déjà stockées, on ne dit pas dépasser 5
    - on la récupère en BDD, la méthode `getCard` du DataMapper va nous resservir ici
    - on l'ajoute au tableau `request.session.deck`
    - on redirige vers la page d'accueil

```js
 addCard: async function (request, response) {
    //on récupère l'id de la carte à ajouter
    const cardId = request.params.id;
    //on utilise la méthode find des tableaux pour vérifier si cette carte est déjà stockée
    //ATTENTION : cardId est de type string, il faut enser à le convertir
    const found = request.session.deck.find(card => card.id === parseInt(cardId, 10));
    //si un élément est trouvé, found contiendra cet élément, sinon found vaudra undefined
    //on utilise cette variable pour déterminer s'il faut ajouter la carte
    if (found) {
        //found contient une carte d'id cardId, on redirige vers la page du deck
        response.redirect('/deck');
    } else {
        //found vaut undefined, la carte n'a pas encore été ajoutée
        //on vérifie si le nombre de carte n'est pas déjà de 5
        if (request.session.deck.length < 5) {
            //on a encore de la place, on récupère la carte en BDD

            try {
                const card = await dataMapper.getCard(cardId);
                //pas d'erreur mais si on a passé un id de carte qui n'existe pas en BDD, le DM va placer la valeur undefined dans card
                //on le vérifie
                if (card) { // équivalent à if (card !== undefined)
                    //le paramètre card contient bien des infos, on peut ajouter la carte en session
                    request.session.deck.push(card);
                    //et rediriger vers page du deck
                    response.redirect('/deck');
                } else {
                    //pas d'erreur SQL mais on n'a réciupéré aucun enregistrement, on le signale au navigateur
                    response.status(404).send(`Card with id ${cardId} not found`);
                }
            } catch (error) {
                console.error(error);
                response.status(500).render('error');
            }

        } else {
            response.redirect('/deck');
        }
    }
}
```

Il nous reste à modifier la vue `cardList` pour associer les `[+]` à notre nouvelle route

```html
<div class="card">
    <a href="/card/<%= card.id %>">
        <img src="/visuals/<%= card.visual_name %>" alt="<%= card.name %> illustration">
        <p class="cardName"><%= card.name %></p>
    </a>
    <a class="link--addCard" title="Ajouter au deck" href="/deck/add/<%= card.id %>">[ + ]</a>
</div>
```

### 3.3 Une page pour visualiser le deck !

Un click sur le lien `Decks` du menu nous donne plusieurs infos :
- on doit créer une route `/deck` dans le routeur
- cette route utilisera la méthode http GET
- on devra ajouter une méthode dans le `deckController`
- on devra réutiliser la vue `cardList` et lui passer le tableau deck de la session pour affichage

On ajoute la route manquante dans le routeur

```js
router.get('/deck', deckController.showDeck);
```

On ajoute la méthode `showDeck` dans le `deckController`  
Cette méthode va faire un rendu de la vue cardList, en titre on indiquera `'Deck de cartes'`

```js
showDeck: async function (request, response) {
    response.render('cardList', {
        //on passe le tableau de cartes de la session dans la variable cards
        cards: request.session.deck,
        title: 'Deck de cartes'
    });
}
```

Petite modif d'UX : plutôt que de rediriger vers l'accueil dans la méthode `addCard`, on va plutôt rediriger vers la nouvelle route `/deck`

```js
addCard: async function (request, response) {
    const cardId = request.params.id;
    const found = request.session.deck.find(card => card.id === parseInt(cardId, 10));
    if (found) {
        response.redirect('/deck');
    } else {
        if (request.session.deck.length < 5) {
            dataMapper.getCard(cardId, (error, card) => {
                if (error) {
                    response.status(500).send(error);
                } else {
                    if (card) {
                        request.session.deck.push(card);
                        response.redirect('/deck');
                    } else {
                        response.status(404).send(`Card with id ${cardId} not found`);
                    }
                }
            });
        } else {
            response.redirect('/deck');
        }
    }
}
```

### 3.4 Supprimer une carte du deck

On va modifier la vue `cardList` et ajouter un `[-]` qui servira de bouton pour supprimer une carte  
On va faire pointer ce lien sur la route `/deck/remove/:id` qu'on va créer juste après

```html
<div class="card">
    <a href="/card/<%= card.id %>">
    <img src="/visuals/<%= card.visual_name %>" alt="<%= card.name %> illustration">
    <p class="cardName"><%= card.name %></p>
    </a>
    <a class="link--addCard" title="Ajouter au deck" href="/deck/add/<%= card.id %>">[ + ]</a>
    <a class="link--removeCard" title="Supprimer du deck" href="/deck/remove/<%=card.id %>">[ - ]</a>
</div>
```

Un peu de CSS n'a jamais tué personne, on ajoute une nouvelle class pour le lien remove

```css
.card .link--removeCard {
  position: absolute;
  top: 6%;
  right: 40%;
  color: black;
  font-weight: 900;
  text-decoration: none;
}
```

On ajoute la nouvelle route au routeur
```js
router.get('/deck/remove/:id', deckController.removeCard);
```

On ajoute une nouvelle méthode `removeCard` au  `deckController`  
Cette méthode devra :
- récupérer l'id de la carte à supprimer dans les paramètres de l'URL
- supprimer cette carte du tableau en session
- rediriger vers la page du deck

```js
removeCard: async function (request, response) {
        //on récupère l'id de la carte à ajouter
        const cardId = request.params.id;
        //on crée un nouveau tableau en filtrant le tableau stocké en session
        //on ne veut garder dans ce tableau ue les éléments ont un id différent de celui à supprimer
        const newDeck = request.session.deck.filter((card) => { 
            return card.id !== parseInt(cardId, 10);
        });
        //on remplace le tableau de la session par la version filtrée
        request.session.deck = newDeck;
        //on redirige vers la page du deck
        response.redirect('/deck');
}
```

---

## Bonus: finir les recherches

### Recherche par niveau

On valide le formulaire pour obtenir quelques infos :
- le formulaire est envoyé sur la route `/search/level`
- la méthode HTTP utilisée est GET
- on a une variable `level` transmise dans l'URL à la validation

On doit afficher les cartes dont le niveau sera exactement celui indiqué dans le formulaire  
On applique la démarche classique : DataMapper, Contrôleur, Routeur

#### Dans le DataMapper

On ajoute une nouvelle méthode `getCardsByLevel`
Cette méthode aura besoin du level indiqué dans le formulaire pour créer la requête SQL, elle doit recevoir cette info en paramètre

```js
getCardsByLevel: async function (level) {
    const query = {
      text: `SELECT * FROM "card" WHERE "level"=$1`,
      values: [level]
    };

    const results = await database.query(query);
    return results.rows;
}
```

#### Dans le contrôleur

On va (encore) réutiliser la vue `cardList` en passant dans cards les cartes envoyées par le DataMapper et dans title `'Liste des cartes de niveau X'`

```js
searchLevel: async function (request, response) {
    //on récupère le niveau à chercher depuis la queryString
       //on récupère le niveau à chercher depuis la queryString
    const level = parseInt(request.query.level, 10);

    try {

      const cards = await dataMapper.getCardsByLevel(level);
      console.log(cards);
      response.render('cardList', {
        cards,
        title: 'Liste des cartes de niveau ' + level
      });

    } catch (error) {
      console.error(error);
      response.status(500).render('error');

    }
}
```

#### Dans le routeur

On ajoute la route manquante

```js
router.get('/search/level', searchController.searchLevel);
```

### Recherche par valeur

Celle-là piquait un peu plus au niveau de la requête SQL ...

En validant le formulaire, on voit cette fois-ci qu'on récupère 2 infos à intégrer dans la requête :
- la direction
- la valeur de la direction

On devra aussi créer une route en GET sur `/search/values`

Le problème se pose quand on veut préparer la requête SQL : on n'est pas sensé mettre directement des valeurs venues de l'appli dans la string de la requête  
Malheureusement, on ne peut pas utiliser les $x pour les noms de champs, uniquement pour les valeurs !
```SQL
-- requête invalide ...
SELECT * FROM card WHERE $1=$2
```

Comment faire alors ?  
On a 3 solutions :

- On fait confiance au user (😱) et on injecte directement la direction dans la string
```js
`SELECT * FROM card WHERE ${direction}=$1`
```
- On injecte la direction mais en l'échappant nous-même (on va remplacer les `'` par `''`)
```js
`SELECT * FROM card WHERE ${direction.replace(/'/g, "''")}=$1`
```
- On applique une méthode SQL assez élégante trouvé par notre Jean préféré
```SQL
SELECT * FROM card WHERE
    -- on teste la valeur de $1, $1 = 'xxx' va renvoyer true ou false
    --si $1 vaut 'north', on ajoute un critère de filtre value_north
	$1 = 'north' AND value_north >= $2
    --sinon, si $1 vaut 'south', on ajoute un critère de filtre value_south
OR	$1 = 'south' AND value_south >= $2
    --sinon, si $1 vaut 'east', on ajoute un critère de filtre value_east
OR	$1 = 'east' AND value_east >= $2
    --sinon, si $1 vaut 'west', on ajoute un critère de filtre value_west
OR	$1 = 'west' AND value_west >= $2;'
```

Stylé non ? Et complètement secure pour le coup !

#### Dans le DataMapper

On utilise cette dernière requête dans le DataMapper, on lui ajoute une méthode `getCardsByValues`
Cette méthode aura besoin de la direction et de sa valeur, on doit lui mettre ces 2 infos en paramètre

```js
getCardsByValues: async function (direction, value) {
    const query = {
      //on recherche les cartes qui ont au moins la valeur indiquée, on utilise l'opérateur >= dans la requête
      text: `SELECT * FROM "card" WHERE 
      $1 = 'north' AND value_north >= $2
      OR $1 = 'south' AND value_south >= $2
      OR $1 = 'east' AND value_east >= $2
      OR $1 = 'west' AND value_west >= $2`,
      values: [direction, value]
    };

    const results = await database.query(query);
    return results.rows;
}
```

#### Dans le contrôleur

On va (toujours) utiliser la vue `cardList` avec les cartes du DataMapper et le titre `'Liste des cartes de valeur <direction> à au moins <value>'`

```js
searchValues: async function (request, response) {
    //on récupère la direction et la valeur depuis la queryString
    const direction = request.query.direction;
    const value = parseInt(request.query.value, 10);

    try {

      const cards = await dataMapper.getCardsByValues(direction, value);
      response.render('cardList', {
        cards,
        title: `Liste des cartes de valeur ${direction} à au moins ${value}`
      });

    } catch (error) {
      console.error(error);
      response.status(500).render('error');

    }
}
```

#### Dans le routeur

On ajoute la route manquante

```js
router.get('/search/values', searchController.searchValues);
```

### Par nom

On veut cette fois filtrer les cartes par nom en fonction d'un critère `name` reçu dans la queryString  
Le nom indiquer sur la carte devra contenir la valeur de `name` sans tenir compte de la casse

En testant le formulaire, on voit aussi qu'on devra ajouter une route `/search/name` en GET

#### Dans le DataMapper

En SQL, en va pouvoir utiliser l'opérateur `ILIKE` pour récupérer les cartes dont le nom contient la valeur de `name`  
COntrairement à `LIKE`, cet opérateur ne tiendra pas compte de la casse en étudiant la valeur des champs

```js
getCardsByName: async function (name) {
    const query = {
      //pour faire la requête sans prise en compte de la casse, on utilise ILIKE plutôt que LIKE
      text: `SELECT * FROM "card" WHERE "name" ILIKE $1`,
      values: [`%${name}%`]
    };

    const results = await database.query(query);
    return results.rows;
}
```

#### Dans le contrôleur

Toujours et encore notre vue `cardList` à rendre avec pour titre `'Liste des cartes dont le nom contient xxx'`

```js
searchName: async function (request, response) {
   //on récupère l'extrait du nom depuis la queryString
    const name = request.query.name;
    try {

      const cards = await dataMapper.getCardsByName(name);
      response.render('cardList', {
        cards,
        title: `Liste des cartes dont le nom contient ${name}`
      });

    } catch (error) {
      console.error(error);
      response.status(500).render('error');
    }
}
```

#### Dans le routeur

On ajoute la dernière route

```js
router.get('/search/name', searchController.searchName);
```

## VICTOIRE !!
