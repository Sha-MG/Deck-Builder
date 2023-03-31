const dataMapper = require('../dataMapper');

const deckController = {
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
    },

    showDeck: (request, response) => {
        response.render('cardList', {
            //on passe le tableau de cartes de la session dans la variable cards
            cards: request.session.deck,
            title: 'Deck de cartes'
        });
    },

    removeCard: (request, response) => {
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

};

module.exports = deckController;