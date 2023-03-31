const dataMapper = require('../dataMapper.js');

const mainController = {
  homePage: async function (req, res) {

    try {
      const cards = await dataMapper.getAllCards();
      
      res.render('cardList', {
        cards: cards,
        title: 'Liste des cartes'
      });

    } catch (error) {
      console.error(error);
      response.status(500).render('error');
    }
   
  },

  cardDetails: async function (request, response) {
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

};

module.exports = mainController;