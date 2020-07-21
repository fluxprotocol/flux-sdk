`use strict`
const FluxProvider = require('../src/FluxProvider');
const testUtils = require('./test_utils');
const BN = require("bn.js");
import 'whatwg-fetch';

let nearjs;
let protocolContractId;
let tokenContractId;
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

	// Contract ID = random string
	protocolContractId = testUtils.generateUniqueString('test');
	tokenContractId = testUtils.generateUniqueString('tokn');
	testAccount = await testUtils.createAccount(await nearjs.account(testUtils.testAccountName));
	workingAccount = await testUtils.createAccount(testAccount, { amount: INITIAL_BALANCE.div(new BN("2")), trials: 5 });
	await testUtils.deployContract(workingAccount, protocolContractId, "protocol");
	await testUtils.deployContract(workingAccount, tokenContractId, "fungible");
});

test("Is able to connect to the NEAR blockchain & initiate Flux smart contract instance", async () => {
	flux = new FluxProvider('custom');
	const {
		near,
		protocolWalletConnection,
		tokenWalletConnection,
		protocolContract,
		tokenContract
	} = await testUtils.setUpTestFluxConnection(workingAccount, protocolContractId, tokenContractId);

	await flux.connect(protocolContractId, tokenContractId, workingAccount, 'http://localhost:3030');

	flux.near = near;
	flux.account = workingAccount;
	flux.protocolWalletConnection = protocolWalletConnection;
	flux.protocolContract = protocolContract;
	flux.tokenWalletConnection = tokenWalletConnection;
	flux.tokenContract = tokenContract;
	await flux.initTokenContract("1000000000000000000000");
});

test("Is able to retrieve the accountId ", () => {
	const accountId = flux.getAccountId();
	expect(accountId).toBe(workingAccount.accountId);
});

test("Is able to claim fdai", async () => {
	await flux.claimFDai();
	const balance = await flux.getBalance(workingAccount.accountId);
	expect(balance).toBeGreaterThan(0);
});

test('Is able to set an allowance', async () => {
	await flux.setAllowance(workingAccount.accountId, '100000000');
});

test("Is able to create a market", async () => {
	const endTime = (new Date().getTime() + 20000 ).toString();
	await flux.createBinaryMarket("This is a test binary market", "", [] , endTime, "1", "5", "");
	await flux.createCategoricalMarket("This is a test categorical market", "", "3", ["yes", "no", "maybe"],[], endTime, "1", "5", "");
});

// NOTE: I changed format of spend & pricePerShare to strings -- not sure if this affects things down the line
test("Is able to place a limit order", async () => {
	await flux.placeOrder("0", "0", "5000", "10", flux.getAccountId());
	await flux.placeOrder("1", "0", "5000", "10", flux.getAccountId());
});

test("Is able to cancel an order", async () => {
	await flux.cancelOrder("0", "0", "0");
	await flux.cancelOrder("1", "0", "0");
});

test("Is able to fill a limit order", async () => {
	await flux.placeOrder("0","0", "100", "50", flux.getAccountId());
	await flux.placeOrder("1", "1", "100", "50", flux.getAccountId());
});

test("Is able to fill a market order", async () => {
	await flux.placeOrder("0", "0", "200", "50");
	await flux.placeOrder("1", "0", "200", "50");
	const binaryPrice = await flux.getMarketPrice("0", "1");
	const categoricalPrice = await flux.getMarketPrice("1", "1");
	await flux.placeOrder("0", "1", "200", binaryPrice.toString());
	await flux.placeOrder("1", "1", "200", categoricalPrice.toString());
});

test("Is able to delete market", async () => {
	const endTime = (new Date().getTime() + 20000 ).toString();
	await flux.createBinaryMarket("This is a test binary market", "", [], endTime, "1", "5", "");
	await flux.deleteMarket(2);
});


test("Is able to dynamically sell to the market", async () => {
	const endTime = (new Date().getTime() + 20000 ).toString();
	await flux.createBinaryMarket("This is a test binary market", "", [], endTime, "1", "5", "");
	await flux.placeOrder("2", "0", "200", "50");
	await flux.placeOrder("2", "1", "200", "50");
	const shareBalance = await flux.getOutcomeShareBalance("2", "0");
	expect(shareBalance).toBeGreaterThan(0);
	const sellDepth = await flux.getMarketSellDepth("2", "0", "1");
	expect(sellDepth).toBeGreaterThan(0);
	await flux.dynamicMarketSell("2", "0", "1")
});

test("Is able to resolute a market", async () => {
	await flux.resolute("0", "0", "500000000000000001");
	await flux.resolute("1", "0", "500000000000000001");
	const market = await flux.getMarketsById([0]);
	const binaryClaimable = await flux.getClaimable("0");
	const categoricalClaimable = await flux.getClaimable("1");
	expect(Object.keys(binaryClaimable)).not.toBe(0);
	expect(Object.keys(categoricalClaimable)).not.toBe(0);
});

test("Is able to withdraw dispute on a market", async() => {
	await flux.dispute("1", "1", "10");
	await flux.withdrawDisputeStake("1", "1", "1");
});

test("Is able to dispute a market", async () => {
	await flux.dispute("0", "1", "1000000000000000005");
	await flux.dispute("1", "1", "1000000000000000005");
	});

//test("Is able to finalize a market", async () => {
	// TODO: Find way to advance blocks
//	await flux.finalize("0", "0");
//	await flux.finalize("1", "1");
//});

test("Is able to claim affiliate earnings", async () => {
	await flux.claimAffiliateEarnings(flux.getAccountId());
});
