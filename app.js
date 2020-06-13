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
app.use(helmet());
app.use(helmet.noCache());

dotenv.config()
const play = {
	name: '',
	currentPlay: ''
}

app.use((req, res, next)=> {
	req.app.locals.appUrl = (process.env.NODE_ENV==='production' ? process.env.APP_URL : `http://localhost:${process.env.PORT}`);
	app.locals.$ = jQuery;
	app.locals.appTitle = 'Cardgame';
	return next();
})

app.get('/unload', async (req, res, next) => {
	var keys = Object.keys(app.locals);
	console.log(keys);
	await keys.forEach((key) => {
		if (key !== 'settings' && key !== '$' && key !== 'guestlist') {
			delete app.locals[key]
		}
	})
	return res.redirect('/')
})

// app.post('/env', async(req, res, next) => {
// 	const v = process.env.V;
// 	return res.status(200).send(v);
// })

app.get('/invite/:uid', (req, res, next) => {
	var players = (!app.locals.players ? [] : app.locals.players);
	if (players.indexOf(req.params.uid) === -1) {
		players.push(req.params.uid);
	}
	app.locals.players = players;
	// console.log(app.locals.cards)
	return res.render('main', {
		players: app.locals.players,
		info: app.locals.info,
		play: app.locals.play,
		busy: false,
		cards: app.locals.cards,
		inprogress: app.locals.inprogress,
		guestlist: app.locals.guestlist,
		discard: app.locals.discard,
		turnIndex: app.locals.turnIndex,
		whoseTurn: app.locals.whoseTurn,
		teed: app.locals.teed,
		unteed: app.locals.unteed

		// avatar: app.locals.avatar
	})
	// const mailgun = require("mailgun-js");
	// const mg = mailgun({apiKey: process.env.MG_KEY, domain: process.env.MG_DOMAIN});
	// const list = 'tracey.bushman@gmail.com'//decodeURIComponent(req.params.list);
	// const gameurl = req.app.locals.appUrl
	// const data = {
	// 	from: 'Cardgame with family <tbushman@mg.bli.sh>',
	// 	to: list,
	// 	subject: 'Card game invite',
	// 	text: 'Join the game in progress: '+gameurl
	// 	//`<a href="${gameurl}" target="_blank">Click here to join the card game!</a>`
	// };
	// mg.messages().send(data, function (error, body) {
	// 	console.log(body);
	// });
})

app.post('/invite/:guestlist', async(req, res, next) => {
	const mailgun = require("mailgun-js");
	const mg = mailgun({apiKey: process.env.MG_KEY, domain: process.env.MG_DOMAIN});
	const list = decodeURIComponent(req.params.guestlist).split(/\,\s{0,3}/) //JSON.parse(JSON.stringify(decodeURIComponent(req.params.guestlist)));
	console.log(list);
	let b = null;
	await list.forEach((item) => {
		const gameurl = req.app.locals.appUrl + '/invite/' + encodeURIComponent(item)
		const data = {
			from: 'Cardgame with family <tbushman@mg.bli.sh>',
			to: item,
			subject: 'Card game invite',
			text: 'Join the game in progress: '+gameurl
			//`<a href="${gameurl}" target="_blank">Click here to join the card game!</a>`
		};
		mg.messages().send(data, function (error, body) {
			console.log(body);
			b = body;
		});
	})
	app.locals.guestlist = list.join(', ');
	app.locals.inprogress = true;
	return res.status(200).send('ok')

	
})
// app.get('/reset', (req, res, next) => {
// 	// redirected from 500 error
// 	delete app.locals.play;
// 	// app.locals.avatar = null;
// 	app.locals.busy = false;
// 	app.locals.info = 'Please try again.'
// 	return res.redirect(307, '/');
// })

app.get('/', (req, res, next) => {
	return res.render('main', {
		players: app.locals.players,
		info: app.locals.info,
		play: app.locals.play,
		busy: false,
		guestlist: app.locals.guestlist,
		cards: app.locals.cards,
		inprogress: app.locals.inprogress,
		playerhands: app.locals.playerhands,
		discard: app.locals.discard,
		turnIndex: app.locals.turnIndex,
		whoseTurn: app.locals.whoseTurn,
		teed: app.locals.teed,
		unteed: app.locals.unteed
		// avatar: app.locals.avatar
	})
})

// app.get('/deal', async (req, res, next) => {
//   return res.status(200).send('setup deal')
// })

app.post('/save/:cards', async(req,res,next)=>{
	if (!JSON.parse(decodeURIComponent(req.params.cards))) {
		return next(new Error('no cards to save'))
	}
	app.locals.cards = JSON.parse(decodeURIComponent(req.params.cards));
	return res.status(200).send(app.locals.cards)
})

app.post('/playerhands/:hands', async(req, res, next) => {
	if (!JSON.parse(decodeURIComponent(req.params.hands))) {
		return next(new Error('no playerhands to save'))
	}
	console.log(decodeURIComponent(req.params.hands))
	app.locals.playerhands = JSON.parse(decodeURIComponent(req.params.hands));
	return res.status(200).send(app.locals.playerhands)
})

app.post('/playerleave/:uid', async(req, res, next) => {
	console.log('player leaving');
	const players = app.locals.players;
	if (players && players.indexOf(req.params.uid) !== -1) {
		players.splice(players.indexOf(req.params.uid), 1);
	}
	console.log(req.params.uid)
	app.locals.players = players;
	return res.status(200).send(players);
})

app.post('/player/:uid', async(req, res, next) => {
	var players = (!app.locals.players ? [] : app.locals.players);
	if (players.indexOf(req.params.uid) === -1) {
		players.push(req.params.uid);
	}
	app.locals.players = players;
	return res.status(200).send(players)
})

// app.post('/play/:uid/:card', async(req, res, next) => {
// 	if (!app.locals.busy) {
// 		delete app.locals.info;
// 		app.locals.busy = true;
// 		// app.locals.avatar = req.params.uid;
// 		app.locals.play = {
// 			currentPlay: req.params.card,
// 			name: req.params.uid
// 		}
// 		app.locals.busy = false;
// 		return res.status(200).send({
// 			play: app.locals.play,
// 			busy: app.locals.busy
// 		});
// 	} else {
// 		return res.status(200).send(null
// 			/*{
// 			play: app.locals.play,
// 			busy: true
// 		}*/
// 		)
// 
// 	}
// })
// 
// polled in half-second increments for front-end reactive button state
app.post('/check/:locals', (req, res, next) => {
	const noParams = !req.params.locals || req.params.locals === 'null';
	const locals = (noParams ? app.locals : JSON.parse(decodeURIComponent(req.params.locals)));
	if (!noParams) {
		// console.log(locals);
		Object.keys(locals).forEach((l) => {
			app.locals[l] = locals[l]
		})
	}
	return res.status(200).send({
		busy: locals.busy,
		play: locals.play,
		players: locals.players,
		info: locals.info,
		cards: locals.cards,
		discard: locals.discard,
		guestlist: locals.guestlist,
		inprogress: locals.inprogress,
		playerhands: locals.playerhands,
		turnIndex: locals.turnIndex,
		whoseTurn: locals.whoseTurn,
		teed: locals.teed,
		unteed: locals.unteed
		// avatar: app.locals.avatar
	});
})

app.post('/inprogress/:bool', (req, res, next) => {
	if (req.params.bool === undefined) {
		return next(new Error('no inprogress status'))
	}
	app.locals.inprogress = Boolean(req.params.bool);
	return res.status(200).send(app.locals.inprogress)
})

// app.post('/notbusy', (req, res, next) => {
// 	app.locals.busy = false;
// 	// if (req.query.q) {
// 	// 	app.locals.avatar = decodeURIComponent(req.query.q) + '';
// 	// }
// 	return res.status(200).send('ok')
// })

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