const dotenv = require('dotenv');
const helmet = require('helmet');
const jQuery = require('jquery');
const express = require('express');
const request = require('request-promise-native');
const favicon = require('serve-favicon');
const path = require('path');
const url = require('url');
const http = require('http');
const app = express();
const initLocals = {
	busy: false,
	players: [],
	playerhands: {},
	cards: [],
	discard: [],
	info: '',
	inprogress: false,
	teed: {
		card: null,
		index: null
	},
	whoseTurn: '',
	turnIndex: 0,
	guestlist: app.locals.guestlist
}
const localKeys = ['busy', 'players', 'playerhands', 'cards', 'discard', 'info', 'inprogress', 'teed', 'whoseTurn', 'turnIndex'];
app.set('views', path.join('.', 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join('.', 'public')));
app.use(favicon(path.join('.', 'public/img', 'favicon.ico')));
app.use(helmet());
app.use(helmet.noCache());

dotenv.config()

function ensureVars(req, res, next) {
	// console.log('these vars')
	// console.log(app.locals.vars)
	if (!app.locals.vars) {
		app.locals.vars = initLocals
	}
	return next()
}

app.get('*', ensureVars)

app.use((req, res, next)=> {
	app.locals.appUrl = (process.env.NODE_ENV==='production' ? process.env.APP_URL : `http://localhost:${process.env.PORT}`);
	// app.locals.$ = jQuery;
	app.locals.appTitle = 'Cardgame';
	app.locals.production = (process.env.NODE_ENV === 'production')
	return next();
})

app.get('/unload', async (req, res, next) => {
	var keys = Object.keys(app.locals.vars);
	console.log(keys);
	await keys.forEach((key) => {
		if (key !== 'settings' && key !== '$') {
			delete app.locals.vars[key]
		}
	})
	return res.redirect('/')
})

app.get('/invite/:uid', (req, res, next) => {
	var vars = app.locals.vars;
	if (!vars) {
		app.locals.vars = {}
	}
	var players = (!vars ? [] : vars.players);
	var uid = decodeURIComponent(req.params.uid);
	if (players.indexOf(uid) === -1) {
		players.push(uid)
	}
	console.log('invited guest joined: ')
	console.log(uid)
	console.log(players)
	app.locals.vars.players = players;
	// io.emit('changed state', app.locals.vars);
	return res.render('main', {
		players: players,
		guestlist: app.locals.vars.guestlist,
		whoseTurn: app.locals.whoseTurn,
		turnIndex: app.locals.turnIndex
	})
})

app.post('/invite/:guestlist', async(req, res, next) => {
	const mailgun = require("mailgun-js");
	const mg = mailgun({apiKey: process.env.MG_KEY, domain: process.env.MG_DOMAIN});
	const list = decodeURIComponent(req.params.guestlist).split(/\,\s{0,3}/) //JSON.parse(JSON.stringify(decodeURIComponent(req.params.guestlist)));
	console.log(list);
	let b = null;
	await list.forEach((item) => {
		const gameurl = app.locals.appUrl + '/invite/' + encodeURIComponent(item)
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
	app.locals.vars.guestlist = list.join(', ');
	app.locals.vars.inprogress = true;
	io.emit('change state', app.locals.vars);
	return res.status(200).send('ok')

	
})

app.get('/', (req, res, next) => {
	return res.render('main', {
		players: app.locals.vars.players,
		guestlist: app.locals.vars.guestlist,
		whoseTurn: app.locals.whoseTurn,
		turnIndex: app.locals.turnIndex
	})
})

app.post('/whoseturn', (req, res, next) => {
	return res.status(200).send(app.locals.vars.whoseTurn)
})

app.use((err, req, res, next) => {
	const stringErr = JSON.stringify(err)
	const parseErr = JSON.parse(stringErr);
	const is500Err = (parseErr.statusCode === 500);
	if (
		is500Err
	) {
		app.locals.vars.busy = false;
		app.locals.vars.info = 'Please try again.'
		return res.status(500).end(err)
	} else {
		return next(err)
	}
})

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', { error: err })
})
/**
* Get port from environment and store in Express.
*/
var port = normalizePort(process.env.PORT || '9098');
app.set('port', port);

/**
* Create HTTP server.
*/
var server = http.createServer(app);
/**
* Listen on provided port, on all network interfaces.
*/
const io = require('socket.io')(server);
io.on('connection', handleWs);

server.listen(port);

server.on('error', onError);
server.on('listening', onListening);

function handleWs(socket) {
	
	socket.on('get state', () => {
		// console.log('getting state: ')
		// console.log(app.locals.vars.players);
		if (app.locals.vars) {
			io.emit('changed state', app.locals.vars)
		}
	})
	
	socket.on('change state', data => {
		// console.log('state change')
		// console.log(data.players)
		if (data && data !== '') {
			app.locals.vars = data
			io.emit('changed state', data)
		}
	});
	socket.on('disconnect', () => {
		app.locals.vars = initLocals
		io.emit('changed state', app.locals.vars)
	})
}


/**
* Normalize a port into a number, string, or false.
*/

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
* Event listener for HTTP server "error" event.
*/

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
* Event listener for HTTP server "listening" event.
*/

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
 	console.log('Listening on '+ bind);
}

// module.exports = app;