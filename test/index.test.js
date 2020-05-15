const chai = require('chai');
const jsdom = require('jsdom-global');
// const { JSDOM } = jsdom;
// const expect = require('expect');
const path = require('path');
const nock = require('nock');
const request = require('supertest');
// const http = require('http');
// const Mock = require('./utils/mock');
const app = require('../app');
const fs = require('fs');
const pug = require('pug');
// const config = require('../config/index.js');
// const pug = require('pug');
// const Vue = require('vue');
// const { PublisherTest, ContentTest, SignatureTest } = require('../models/index.js');
const { expect } = chai;
const nockBack = nock.back;
nockBack.fixtures = path.join(__dirname, '.', '__nock-fixtures__');

const cleanup = jsdom()
;// const recording = process.env.RECORD_ENV;
// const testing = process.env.TEST_ENV;
nockBack.setMode('record');

describe('API call', () => {
	let key, gp, agent;
	// eslint-disable-next-line no-undef
	before(async() => {
		nock.enableNetConnect('127.0.0.1');
		await app.listen(process.env.PORT, () => {
			console.log('connected');
			agent = request.agent(app)
			jsdom(app,
				{url: 'http://127.0.0.1:9098'}
			);

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
		// app.close(); 
		// cleanup()
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
			// const window = (new JSDOM(res.text, {url: 'http://localhost:9098'}));
			// const { localStorage } = window.window;
			// document.html = res.text;
			// const { localStorage, document } = window;
			// const uid = localStorage.getItem('__cardgame_uid__');
			// expect(uid).to.equal(null);
			// // await res.send(res.text);
			// // window.document = res.text;
			// // console.log(document.body)
			// document.innerHTML = res.text;
			// console.log(document)
			expect(document.html).to.equal(res.text)
			// expect(JSON.parse(JSON.stringify(window.document.body.innerHTML))).to.equal(res.text)
			// await agent
			// .post()
			// setTimeout(()=>{
			// 	expect(app.locals.cards).to.matchSnapshot()
			// },5000)
			
		})
	})
	
});
