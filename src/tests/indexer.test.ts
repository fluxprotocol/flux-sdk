import FluxProvider from '../index';
import { keyStores } from 'near-api-js';
import { Market } from '../models/Market';
import { FilledPriceCollection } from '../models/FilledPrice';

const flux: FluxProvider = new FluxProvider("testnet", "https://api.flux.market", new keyStores.InMemoryKeyStore());

describe('init', function() {
    it('connect', async function() {
      await flux.connect("u1f92b_u1f680.flux-dev", "flux-fun-token2.flux-dev", "flux-dev");
      expect(flux.connected).toEqual(true);
    });
});


describe("indexer", () => {
  it("can get active markets from index node", async () => {
    const markets: Market[] = await flux.getMarkets({}, 20, 0);

    const sportsMarkets: Market[] = await flux.getMarkets({categories: ["sports"]}, 1, 0);
    expect(sportsMarkets.length == 1);

    const firstMarket: Market[] = await flux.getMarkets({}, 1, 0);
      console.log('[getMarkets] res -> ', firstMarket);
    expect(firstMarket.length == 1);
  })

  it("can get all resoluting markets from index node", async () => {
    const markets: Market[] = await flux.getResolutingMarkets({}, 20, 0);

    const sportsMarkets: Market[] = await flux.getResolutingMarkets({categories: ["sports"]}, 1, 0);
    expect(sportsMarkets.length == 1);

    const firstMarket: Market[] = await flux.getResolutingMarkets({}, 1, 0);
    expect(firstMarket.length == 1);
  })

  it("test lastFilledPrices", async () => {
    const res = await flux.getLastFilledPrices({}, 10, 0);
    console.log('[lastFilledPrices] res -> ', res);
  })

  it("can get specific market ", async () => {
    const res = await flux.getMarket(2);
    console.log('[getMarket] res -> ', res);
  })

  it("can get market prices for specific market ", async () => {
    const res = await flux.getMarketPrices(2);
    console.log('[getMarketPrices] res -> ', res);
  })

  it("can get average praces of a specific date", async () => {
    const res = await flux.getAvgPricesOnDate(2, "2020-07-17");
    console.log('[getAvgPricesOnDate] res -> ', res);
  })

  it("can get a users open orders for a specific market", async () => {
    const res = await flux.getOpenOrdersForUserForMarket(2, "flux-dev");
    console.log('[getOpenOrdersForUserForMarket] res -> ', res);
  })

  it("can get a user's outcome balance for a specific market", async () => {
    const res = await flux.getShareBalanceForUserForMarket(2, "flux-dev");
    console.log('[getShareBalanceForUserForMarket] res -> ', res);
  })

  it("can get historic chart data", async () => {
    const res = await flux.getPriceHistory(0, 1603367842, 1603371442, ["day"]);
    console.log('[getPriceHistory] res -> ', res);
  })

  it("can get orderbook", async () => {
    const res = await flux.getOrderbook(2);
      console.log('[getOrderbook] res -> ', res);
  })

  it("can get a user's affiliate earnings", async () => {
    const res = await flux.getAffiliateEarnings("flux-dev");
      console.log('[getAffiliateEarnings] res -> ', res);
  })

  it("can get a user's open orders", async () => {
    const res = await flux.getOpenOrders("flux-dev");
      console.log('[getOpenOrders] res -> ', res);
  })

  it("can get a user's order history", async () => {
    const res = await flux.getOrderHistory("flux-dev");
    console.log('[getOrderHistory] res -> ', res);
  })

  it("can get all finalized markets that a user participated in", async () => {
    const res = await flux.getOrderHistory("flux-dev");
    expect(res.length == 0);
  })

  it("can all markets that are currently resoluting", async () => {
    const res = await flux.getOrderHistory("flux-dev");
    expect(res.length == 3);
  })

  it("can get resolution state", async () => {
    const res = await flux.getResolutionState({}, 0, 1);
    console.log('[getResolutionState] res -> ', res);
  })

  it("can get trade earnings", async () => {
    const res = await flux.getTradeEarnings(0, "flux-dev");
    console.log('[getTradeEarnings] res -> ', res);
  })
})
