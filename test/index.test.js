require('jsdom-global')({ resources: 'usable', runScripts: 'dangerously' });
const Fragment = require('vue-fragment');
const Vue = require('../public/scripts/vue.common.js');
// const { shallowMount, mount } = require('@vue/test-utils');
const { renderToString } = require('@vue/server-test-utils');
const { mount } = require('@vue/test-utils');
const chai = require('chai');
const path = require('path');
const nock = require('nock');
const request = require('supertest');
const app = require('../app');
const fs = require('fs');
const { expect } = chai;
const nockBack = nock.back;
nockBack.fixtures = path.join(__dirname, '.', '__nock-fixtures__');
const $ = require('jquery');
const cleanup = require('jsdom-global')();
const dataObj = require('../views/vue/dataObj.js')
//require(path.join(__dirname, '..', 'public/scripts/dataObj.js'));
const functions = require('../public/scripts/functions.js');
const pug = require('pug');
// const template = require('../views/vue/component.pug');
const pugStr = pug.renderFile(path.join(__dirname, '..', 'views/vue/component.pug')) + '';
// const template = '<template>'+pugStr+'</template>'
console.log(pugStr)
nockBack.setMode('record');
console.log(dataObj)
Vue.use(Fragment.Plugin);
var res = Vue.compile(pugStr);
Vue.prototype.dataObj = require(path.join(__dirname, '..', 'public/scripts/dataObj.js'));
Vue.prototype.functions = functions;
const frontEnd = new Vue({
	data: function() {
		var app = this;
		var info = 'testing';
		var players = ['player1'];
		var playerhands = {
			'player1': []
		};
		var busy = false;
		var appTitle = 'Cardgame';
		var cards = [];
		var discard = [];
		var localStorage = {
			getItem: function(item){
				return {}
			},
			setItem: function(item, setting) {
				return
			},
			removeItem: function(item) {
				return
			}
		};
		var inprogress = false;
		return {
			res: window.innerWidth < 600,
			api: null,
			info: (info === '' ? appTitle : info),
			players: players,
			playerhands: playerhands,
			busy: busy,
			hov: '',
			timeout: '',
			interval: '',
			appTitle: appTitle,
			wiw: window.innerWidth,
			wih: window.innerHeight,
			bubblesize: null,
			modal: false,
			suits: ['heart', 'club', 'diamond', 'spade'],
			cards: cards,
			decka: [],
			deckb: [],
			deckc: [],
			discard: discard,
			connection: null,
			room: null,
			localTracks: [],
			remoteTracks: {},
			isVideo: false,
			isJoined: false,
			isFirefox: (!navigator ? true : navigator.userAgent.includes('Firefox')),
			isSafari: /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification)),
			user: '',
			hand: [],
			uid: (!localStorage.getItem('__cardgame_uid__') ? null : localStorage.getItem('__cardgame_uid__')),
			whoseTurn: '',
			turnIndex: 0,
			teed: null,
			inprogress: inprogress,
			invite: [],
			guestlist: (!localStorage.getItem('__cardgame_guestlist__') ? [localStorage.getItem('__cardgame_uid__')] : localStorage.getItem('__cardgame_guestlist__') ),
			guestlistCollapse: true,
			ready: false

		}

		// var app = this;
		// var inf = 'testing';
		// var plyrs = ['player1'];
		// var plyrh = {
		// 	'player1': []
		// };
		// var bsy = false;
		// var apt = 'Cardgame';
		// var crds = [];
		// var dcrd = [];
		// var strg = {
		// 	getItem: function(item){
		// 		return {}
		// 	},
		// 	setItem: function(item, setting) {
		// 		return
		// 	},
		// 	removeItem: function(item) {
		// 		return
		// 	}
		// };
		// var inp = false;
		// return dataObj(
		// 	app,
		// 	inf,
		// 	plyrs,
		// 	plyrh,
		// 	bsy,
		// 	apt,
		// 	crds,
		// 	dcrd,
		// 	strg,
		// 	inp
		// )
	},
	render: res.render,
	// template: pugStr,
	methods: Object.assign({}, functions)
});

// const marked = require('marked');

describe('API call', () => {
	let key, gp, agent;
	// eslint-disable-next-line no-undef
	before(async() => {
		nock.enableNetConnect('127.0.0.1');
		await app.listen(process.env.PORT, () => {
			console.log('connected');
			agent = request.agent(app)
		})
	}, 5000);
	beforeEach(async() => {
		nockBack.setMode('record');
	});
	afterEach(async() => {
		// this ensures that consecutive tests don't use the snapshot created
		// by a previous test
		nockBack.setMode('wild');
		nock.cleanAll();
	});
	after(() => {
		console.log('disconnecting');
		cleanup()
	});

	key = 'should get a header';
	it(key, async () => {
		const { nockDone } = await nockBack(
			'app.header.json'
		);
		nock.enableNetConnect('127.0.0.1');
		await agent
		.get('/')
		.expect(200)
		// .expect('Location', '/home')
		.then((res)=>{
			header = res.header;
			expect(header).to.matchSnapshot();
		})
		nockDone()
	})
	
	key = 'should init game';
	it(key, async () => {
		nock.enableNetConnect('127.0.0.1');
		await agent
		.get('/')
		.expect(200)
		.then(async(res) => {
			// console.log(res)
			document.write(res.text);
			// console.log(Vue)
			const vueEl = document.getElementById('vue');
			// expect(window.vueEl.innerHTML).to.matchSnapshot();
			// const wrapper = await mount(renderToString(res.text))
			const wrapper = await mount(frontEnd)
			expect(wrapper.text()).to.not.equal(null);
			expect(wrapper.isVueInstance()).to.equal(true);
			expect(wrapper.text()).to.matchSnapshot()
		})
	});
  
  key = 'should deal cards';
  it(key, async() => {
		nock.enableNetConnect('127.0.0.1');
		agent.get('/')
		.expect(200)
		.then(async(response) => {
			
		})
  })
	
});
