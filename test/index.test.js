require('jsdom-global')();

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
nockBack.setMode('record');

const marked = require('marked');

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
			console.log(res)
			document.write(res.text)
			expect(document.body.innerHTML).to.matchSnapshot();
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
