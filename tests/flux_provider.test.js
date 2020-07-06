`use strict`
const FluxProvider = require('../src/FluxProvider');
const testUtils = require('./test_utils');
const BN = require("bn.js");
import 'whatwg-fetch';

let nearjs;
let contractId;
let testAccount;
let workingAccount;
let creatorAccount;
let workingCreatorAccount;
const INITIAL_BALANCE = new BN("1000000000000000000000000000");

let flux;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;

// TODO: Test liquidity per price
// TODO: Test if market methods aren't exposed (they shouldn't be)

beforeAll(async () => {
	nearjs = await testUtils.setUpTestConnection();

	contractId = testUtils.generateUniqueString('test');
	testAccount = await testUtils.createAccount(await nearjs.account(testUtils.testAccountName));
	workingAccount = await testUtils.createAccount(testAccount, { amount: INITIAL_BALANCE.div(new BN("2")), trials: 5 });
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

	await flux.connect("development", "flux_protocol_alpha");

	flux.near = near;
	flux.walletConnection = walletConnection;
	flux.account = workingAccount;
	flux.contract = contract;
});

test("Is able to retrieve the accountId ", () => {
	const accountId = flux.getAccountId();
	expect(accountId).toBe(workingAccount.accountId);
});

test("Is able to claim fdai", async () => {
	await flux.claimFDai()
});

test("Is able to retrieve fdai balance of caller", async () => {
	const balance = await flux.getFDaiBalance();
	expect(balance).toBeGreaterThan(0);
});

test("Is able to create a market", async () => {
	const endTime = (new Date().getTime() + 20000 );
	await flux.createBinaryMarket("This is a test binary market", "", [] ,endTime, 1);
	await flux.createCategoricalMarket("This is a test categorical market", "", 3, ["yes", "no", "maybe"],[] ,endTime, 1);
});

test("Is able to fetch all markets", async () => {
	const allMarkets = await flux.getAllMarkets();
	expect(Object.keys(allMarkets).length).toBe(2);
});

test("Is able to place a limit order", async () => {
	await flux.placeOrder(0, 0, 5000, 10);
	await flux.placeOrder(1, 0, 5000, 10);
});

test("Is able to fetch open limit orders", async () => {
	const openBinaryOrders = await flux.getOpenOrders(0, 0);
	const openCategoricalOrders = await flux.getOpenOrders(1, 0);
	expect(Object.keys(openBinaryOrders)).not.toBe(0);
	expect(Object.keys(openCategoricalOrders)).not.toBe(0);
});

test("Is able to cancel an order", async () => {
	await flux.cancelOrder(0, 0, 0);
	await flux.cancelOrder(1, 0, 0);
});

test("Is able to fill a limit order", async () => {
	await flux.placeOrder(0, 0, 100, 50);
	await flux.placeOrder(1, 1, 100, 50);
});

test("Is able to fill a market order", async () => {
	await flux.placeOrder(0, 0, 200, 50);
	await flux.placeOrder(1, 0, 200, 50);
	const binaryPrice = await flux.getMarketPrice(0, 1);
	const categoricalPrice = await flux.getMarketPrice(1, 1);
	await flux.placeOrder(0, 1, 200, binaryPrice);
	await flux.placeOrder(1, 1, 200, categoricalPrice);
});

test("Is able to calculate and get order depth", async () => {
	const liquidity = await flux.getLiquidity(0, 0, 50);
	expect(liquidity).toBe(2);
	const depth = await flux.getDepth(0, 1, 1000, 50);
	expect(depth).toBe(100);
});

test("Is able to fetch filled orders", async () => {
	const filledBinaryOrders = await flux.getFilledOrders(0, 0);
	const filledCategoricalOrders = await flux.getFilledOrders(1, 0);
	expect(Object.keys(filledBinaryOrders)).not.toBe(0);
	expect(Object.keys(filledCategoricalOrders)).not.toBe(0);
});

test("Is able to fetch all markets", async () => {
	const allMarkets = await flux.getAllMarkets();
	expect(Object.keys(allMarkets).length).toBe(2);
});

test("Is able to resolute a market", async () => {
	await flux.resolute(0, 0, 500000000000000001);
	await flux.resolute(1, 0, 500000000000000001);
	const market = await flux.getMarketsById([0]);
	const binaryClaimable = await flux.getClaimable(0);
	const categoricalClaimable = await flux.getClaimable(1);
	expect(Object.keys(binaryClaimable)).not.toBe(0);
	expect(Object.keys(categoricalClaimable)).not.toBe(0);
});

test("Can retrieve active resolution window", async () => {
	const window = await flux.getActiveResolutionWindow(0).then(window => { return window });
});

test("Is able to withdraw dispute on a market", async() => {
	await flux.dispute(1, 1, 10);
	await flux.withdrawDisputeStake(1, 1, 1);
});

test("Is able to dispute a market", async () => {
	await flux.dispute(0, 1, 1000000000000000005);
	await flux.dispute(1, 1, 1000000000000000005);
	});

test("Is able to finalize a market", async () => {
	await flux.setTest();
	await flux.finalize(0, 0);
	await flux.finalize(1, 1);
});

test("Is able to claim creator fee", async () => {
	await flux.claimCreatorFee(0);
	await flux.claimCreatorFee(1);
});

// test("Is able to fetch claimable fdai", async () => {
// 	 await new Promise ((resolve) => setTimeout(async() => {
// 		 await flux.resolute(0, 1);
// 		 await flux.resolute(1, 1);
// 		 const binaryClaimable = await flux.getClaimable(0);
// 		 const categoricalClaimable = await flux.getClaimable(0);
// 		 expect(Object.keys(binaryClaimable)).not.toBe(0);
// 		 expect(Object.keys(categoricalClaimable)).not.toBe(0);
// 		 resolve();
// 	 }, 20000))
// });
