`use strict`
const FluxProvider = require('../src/FluxProvider');
const nearlib = require('nearlib');
const testUtils = require('./test_utils');
const BN = require("bn.js");
import 'whatwg-fetch';

const keyStore = new nearlib.keyStores.BrowserLocalStorageKeyStore();
let nearjs;
let contractId;
let testAccount; 
let workingAccount;

let flux;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;

beforeAll(async () => {
	nearjs = await testUtils.setUpTestConnection();
	contractId = testUtils.generateUniqueString('test');
	testAccount = await testUtils.createAccount(await nearjs.account(testUtils.testAccountName), { amount: testUtils.INITIAL_BALANCE.mul(new BN(100)), name:testUtils.generateUniqueString('test'), trials: 5 });
	workingAccount = await testUtils.createAccount(testAccount, {amount: new BN(100000000), trials: 5, name: testUtils.generateUniqueString('test') });
	await testUtils.deployContract(workingAccount, contractId);
})

test("Is able to connect to the NEAR blockchain & initiate Flux smart contract instance", async () => {
	flux = new FluxProvider(workingAccount);
	await keyStore.setKey(testUtils.networkId, contractId, nearlib.utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
	const config = Object.assign(require('./config')(process.env.NODE_ENV || 'test'), {
		networkId: testUtils.networkId,
		deps: { keyStore },
	});
	await flux.connect(config, contractId)
});

test("Is able to retrieve the accountId ", () => {
	const accountId = flux.getAccountId();
	expect(accountId).toBe("");
})

test("Is able to create a market", async () => {
	await flux.createBinaryMarket("This is a testmarket", new Date().getTime() + 10000);
});

test("Is able to fetch all markets", async () => {
	const allMarkets = await flux.getAllMarkets();
	expect(Object.keys(allMarkets).length).toBe(1);
});
