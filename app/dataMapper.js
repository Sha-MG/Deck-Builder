const database = require('./database');

const dataMapper = {

  getAllCards: async function () {
    const query = {
      text: `SELECT * FROM "card"`
    };
    const results = await database.query(query);
    return results.rows;
  },

  getCard: async function (cardId) {
    const query = {
      text: `SELECT * FROM "card" WHERE "id"=$1`,
      values: [cardId]
    };
    const results = await database.query(query);
    return results.rows[0];
  },

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
  },

  getCardsByLevel: async function (level) {
    const query = {
      text: `SELECT * FROM "card" WHERE "level"=$1`,
      values: [level]
    };

    const results = await database.query(query);
    return results.rows;
  },

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

  },

  getCardsByName: async function (name) {
    const query = {
      //pour faire la requête sans prise en compte de la casse, on utilise ILIKE plutôt que LIKE
      text: `SELECT * FROM "card" WHERE "name" ILIKE $1`,
      values: [`%${name}%`]
    };

    const results = await database.query(query);
    return results.rows;

  }



};


module.exports = dataMapper;