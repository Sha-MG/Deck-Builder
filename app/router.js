const express = require('express');
const router = express.Router();

const mainController = require('./controllers/mainController');
const searchController = require('./controllers/searchController');
const deckController = require('./controllers/deckController');

router.get('/', mainController.homePage);

//détails d'une carte
router.get('/card/:id', mainController.cardDetails);

router.get('/search', searchController.searchPage);

//Recherche des cartes par élément
router.get('/search/element', searchController.searchElement);

//recherche des cartes par niveau
router.get('/search/level', searchController.searchLevel);

//recherche des cartes par direction et valeur
router.get('/search/values', searchController.searchValues);

//recherche des cartes par nom
router.get('/search/name', searchController.searchName);

//ajout d'une carte au deck
router.get('/deck/add/:id', deckController.addCard);

//affichage du deck
router.get('/deck', deckController.showDeck);

//supression d'une carte dans le deck
router.get('/deck/remove/:id', deckController.removeCard);


module.exports = router;