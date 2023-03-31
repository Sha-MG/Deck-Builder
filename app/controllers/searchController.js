const dataMapper = require('../dataMapper');

const searchController = {
  searchPage: (req, res) => {
    res.render('search');
  },

  //recherche par élément
  searchElement: async function (request, response) {
    //on récupère l'élément à chercher depuis la queryString de l'URL
    const element = request.query.element;
    try {

      const cards = await dataMapper.getCardsByElement(element);

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
  },

  //recheche par niveau
  searchLevel: async function (request, response) {
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

  },

  //recherche par valeur
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

  },

  //recherche par nom
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
};

module.exports = searchController;