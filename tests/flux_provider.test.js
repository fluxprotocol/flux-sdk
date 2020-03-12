`use strict`
const FluxProvider = require('../src/FluxProvider');
const nearlib = require('nearlib');
const testUtils = require('./test_utils');
const BN = require("bn.js");
import 'whatwg-fetch';

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
});

test("Is able to connect to the NEAR blockchain & initiate Flux smart contract instance", async () => {
	flux = new FluxProvider();
	const {        
		near,
		walletConnection,
		account,
		contract
	} = await testUtils.setUpTestFluxConnection(workingAccount, contractId);

	flux.near = near;
	flux.walletConnection = walletConnection, 
	flux.account = workingAccount,
	flux.contract = contract;
});

test("Is able to retrieve the accountId ", () => {
	const accountId = flux.getAccountId();
	expect(accountId).toBe(workingAccount.accountId);
});

test("Is able to create a market", async () => {
	await flux.createBinaryMarket("This is a test market", "", new Date().getTime() + 10000);
});

test("Is able to fetch all markets", async () => {
	const allMarkets = await flux.getAllMarkets();
	expect(Object.keys(allMarkets).length).toBe(1);
});

// TODO: make fdai methods absolete, This is only for demo purposes
test("Is able to claim_fdai", async () => {
	await flux.claimFDai();
})
test("Is able to retrieve fdai balance", async () => {
	const balance = await flux.getFDaiBalance();
	expect(balance).not.toBe(0);
})


test("Is able to place an order", async () => {
	await flux.placeOrder(0, 0, 5000, 10);
});

test("Is able to fetch open orders", async () => {
	const openOrders = await flux.getOpenOrders();
	expect(Object.keys(openOrders)).not.toBe(0);
});

// test("Is able to fetch filled orders", async () => {
// 	// TODO: Fill order
// 	const filledOrders = await flux.getFilledOrders();
// 	expect(Object.keys(filledOrders)).not.toBe(0);
// });

// test("Is able to fetch claimable orders", async () => {
// 	// TODO: Ensure an order filled, resolve market
// 	const claimable = await flux.getClaimable();
// 	expect(Object.keys(claimable)).not.toBe(0);
// });