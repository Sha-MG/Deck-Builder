const dotenv = require('dotenv');
const express = require('express');
dotenv.config();

const PORT = process.env.PORT || 1234;
const router = require('./app/router');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'app/views');

app.use(express.static('public'));

//on met en place le système de session après l'installation du package express-session
const session = require('express-session');
app.use(session(
	{
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true
	}
));

//middleware maison pour initialiser le deck
app.use((request, response, next) => {
	//si la propriété deck de la session vaut undefined, on la crée
	if (!request.session.deck) {
		request.session.deck = []
	}
	//sinon, on fait rien ...
	//et on passe la main au middleware suivant
	next();
});
  

app.use(router);

app.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
});
