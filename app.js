var dotenv = require('dotenv');
const helmet = require('helmet');
const jQuery = require('jquery');
const express = require('express');
const request = require('request-promise-native');
const favicon = require('serve-favicon');
const path = require('path');
const url = require('url');
const http = require('http');
const app = express();
app.set('views', path.join('.', 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join('.', 'public')));
app.use(favicon(path.join('.', 'public/img', 'favicon.ico')));
app.locals.$ = jQuery;
app.locals.appTitle = 'Cardgame';
app.locals.appUrl = (process.env.NODE_ENV==='production' ? process.env.APP_URL : `http://localhost:${process.env.PORT}`);
app.use(helmet());
app.use(helmet.noCache());

dotenv.config()
const play = {
	name: '',
	currentPlay: ''
}

app.get('/reset', (req, res, next) => {
	// redirected from 500 error
	delete app.locals.play;
	// app.locals.avatar = null;
	app.locals.busy = false;
	app.locals.info = 'Please try again.'
	return res.redirect(307, '/');
})

app.get('/', (req, res, next) => {
	return res.render('main', {
		info: app.locals.info,
		play: app.locals.play,
		busy: false,
		cards: app.locals.cards
		// avatar: app.locals.avatar
	})
})

app.post('/save/:cards', async(req,res,next)=>{
	console.log(decodeURIComponent(req.params.cards))
	app.locals.cards = JSON.parse(decodeURIComponent(req.params.cards));
	return res.status(200).send(app.locals.cards)
})

app.post('/play/:uid/:card', async(req, res, next) => {
	if (!app.locals.busy) {
		delete app.locals.info;
		app.locals.busy = true;
		// app.locals.avatar = req.params.uid;
		app.locals.play = {
			currentPlay: req.params.card,
			name: req.params.uid
		}
		app.locals.busy = false;
		return res.status(200).send({
			play: app.locals.play,
			busy: app.locals.busy
		});
	} else {
		return res.status(200).send(null
			/*{
			play: app.locals.play,
			busy: true
		}*/
		)

	}
})

// polled in half-second increments for front-end reactive button state
app.post('/check', (req, res, next) => {
	if (app.locals.busy) {
		return res.status(200).send({
			busy: app.locals.busy,
			play: app.locals.play,
			// avatar: app.locals.avatar
		});
	} else {
		return res.status(200).send({
			busy: false,
			play: app.locals.play,
			// avatar: app.locals.avatar
		});
	}
})

app.post('/notbusy', (req, res, next) => {
	app.locals.busy = false;
	// if (req.query.q) {
	// 	app.locals.avatar = decodeURIComponent(req.query.q) + '';
	// }
	return res.status(200).send('ok')
})

app.use((err, req, res, next) => {
	const stringErr = JSON.stringify(err)
	const parseErr = JSON.parse(stringErr);
	const is500Err = (parseErr.statusCode === 500);
	if (
		is500Err
	) {
		delete app.locals.play;
		app.locals.busy = false;
		app.locals.info = 'Please try again.'
		return res.status(500).end(err)
	} else {
		return next(err)
	}
})

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', { error: err })
})

app.set('port', process.env.PORT);
if (!process.env.TEST_ENV) {
	const server = http.createServer(app);
	server.listen(process.env.PORT)//, onListening);
	server.on('error', (error) => {throw error});
	server.on('listening', onListening);
	function onListening() {
		console.log(`listening on ${process.env.PORT}`)
	}
}

module.exports = app;