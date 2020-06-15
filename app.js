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
const localKeys = ['busy', 'players', 'playerhands', 'cards', 'discard', 'info', 'inprogress', 'teed', 'whoseTurn', 'turnIndex'];
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
	turnIndex: 0
}

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
		if (key !== 'settings' && key !== '$') {
			delete app.locals[key]
		}
	})
	return res.redirect('/')
})

app.get('/invite/:uid', (req, res, next) => {
	return res.render('main')
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

app.get('/', (req, res, next) => {
	return res.render('main')
})

app.post('/whoseturn', (req, res, next) => {
	return res.status(200).send(app.locals.whoseTurn)
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
	socket.on('new player', data => {
		console.log('new player');
		console.log(data);
		if (data && data !== '') {
			io.emit('changed players', data)
		}
	})
	socket.on('change state', data => {
		console.log('state change')
		console.log(data)
		if (data && data !== '') {
			io.emit('changed state', data)
		}
	});
	socket.on('whose turn', data => {
		console.log('whose turn?')
		console.log(data)
		if (data && data !== '') {
			io.emit('new turn', data)
		}
	});
	socket.on('disconnect', () => {
		
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