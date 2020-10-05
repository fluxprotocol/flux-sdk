const FluxProvider = require('../src/FluxProvider');

const flux = new FluxProvider();

test("Is able to connect to the NEAR blockchain & initiate Flux smart contract instance", async () => {

	await flux.connect("flux-protocol-alpha", "flux-dev");

});

test("can get all markets from index node", async() => {
	const markets = await flux.getMarkets({}, 20, 0);
	const sportsMarkets = await flux.getMarkets({"categories": ["sports"]}, 20, 0);
	expect(sportsMarkets.length == 1);
	
	const firstMarket = await flux.getMarkets({}, 1);
	expect(firstMarket.length == 1);
	
	const secondMarket = await flux.getMarkets({}, 1, 1);
	expect(secondMarket.length == 1);
})

test("can get last filled prices for market subset ", async() => {
	const res = await flux.getLastFilledPrices({"categories": ["sports"]});
})

test("can get specific market ", async() => {
	const res = await flux.getMarket(2);
})

test("can get market prices for specific market ", async() => {
	const res = await flux.getMarketPrices(2);
})

test("can get average praces of a specific date", async() => {
	const res = await flux.getAvgPricesOnDate(2, "2020-07-17");
})

test("can get a users open orders for a specific market", async() => {
	const res = await flux.getOpenOrdersForUserForMarket(2, "flux-dev");
})

test("can get a user's outcome balance for a specific market", async() => {
	const res = await flux.getShareBalanceForUserForMarket(2, "flux-dev");
})

test("can get historic chart data", async() => {
	const res = await flux.getPriceHistory(0, "2020-07-20", "2020-07-28", ["day"]);
})

test("can get orderbook", async() => {
	const res = await flux.getOrderbook(2);
})

test("can get a user's affiliate earnings", async() => {
	const res = await flux.getAffiliateEarnings("flux-dev");
})

test("can get a user's open orders", async() => {
	const res = await flux.getOpenOrders("flux-dev");
})

test("can get a user's order history", async() => {
	const res = await flux.getOrderHistory("flux-dev");
})

test("can get all finalized markets that a user participated in", async() => {
	const res = await flux.getOrderHistory("flux-dev");
	expect(res.length == 0);
})

test("can all markets that are currently resoluting", async() => {
	const res = await flux.getOrderHistory();
	expect(res.length == 3);
})

test("can get resolution state", async() => {
	const res = await flux.getResolutionState();
})

test("can get trade earnings", async() => {
	const res = await flux.getTradeEarnings("flux-dev", 0);
})