import FluxProvider from '../index';
import { keyStores } from 'near-api-js';
import { Market } from '../types';

const flux: FluxProvider = new FluxProvider("testnet", "https://api.flux.market", new keyStores.InMemoryKeyStore());

describe('init', function() {
    it('connect', async function() {
      await flux.connect("u1f92b_u1f680.flux-dev", "flux-fun-token2.flux-dev", "flux-dev");
      expect(flux.connected).toEqual(true);
    });
});


describe("indexer", () => {
  it("can get active markets from index node", async () => {
    const markets: Array<Market> = await flux.getMarkets({}, 20, 0);
    
    const sportsMarkets: Array<Market> = await flux.getMarkets({categories: ["sports"]}, 1, 0);
    expect(sportsMarkets.length == 1);
    
    const firstMarket: Array<Market> = await flux.getMarkets({}, 1, 0);
    expect(firstMarket.length == 1);
  })
  
  it("can get all resoluting markets from index node", async () => {
    const markets: Array<Market> = await flux.getResolutingMarkets({}, 20, 0);
    
    const sportsMarkets: Array<Market> = await flux.getResolutingMarkets({categories: ["sports"]}, 1, 0);
    expect(sportsMarkets.length == 1);
    
    const firstMarket: Array<Market> = await flux.getResolutingMarkets({}, 1, 0);
    expect(firstMarket.length == 1);
  })
  
  it("test lastFilledPrices", async () => {
    const res: Array<any> = await flux.getLastFilledPrices({}, 10, 0);
  })
  
  it("can get specific market ", async() => {
    const res = await flux.getMarket(2);
  })
  
  it("can get market prices for specific market ", async() => {
    const res = await flux.getMarketPrices(2);
  })
  
  it("can get average praces of a specific date", async() => {
    const res = await flux.getAvgPricesOnDate(2, "2020-07-17");
  })
  
  it("can get a users open orders for a specific market", async() => {
    const res = await flux.getOpenOrdersForUserForMarket(2, "flux-dev");
  })
  
  it("can get a user's outcome balance for a specific market", async() => {
    const res = await flux.getShareBalanceForUserForMarket(2, "flux-dev");
  })
  
  it("can get historic chart data", async() => {
    const res = await flux.getPriceHistory(0, "2020-07-20", "2020-07-28", ["day"]);
  })
  
  it("can get orderbook", async() => {
    const res = await flux.getOrderbook(2);
  })
  
  it("can get a user's affiliate earnings", async() => {
    const res = await flux.getAffiliateEarnings("flux-dev");
  })
  
  it("can get a user's open orders", async() => {
    const res = await flux.getOpenOrders("flux-dev");
  })
  
  it("can get a user's order history", async() => {
    const res = await flux.getOrderHistory("flux-dev");
  })
  
  it("can get all finalized markets that a user participated in", async() => {
    const res = await flux.getOrderHistory("flux-dev");
    expect(res.length == 0);
  })
  
  it("can all markets that are currently resoluting", async() => {
    const res = await flux.getOrderHistory("flux-dev");
    expect(res.length == 3);
  })
  
  it("can get resolution state", async() => {
    const res = await flux.getResolutionState({}, 0, 1);
  })
  
  it("can get trade earnings", async() => {
    const res = await flux.getTradeEarnings(0, "flux-dev");
  })
})


describe("indexer", () => {
  it("can get active markets from index node", async () => {
    const markets: Array<Market> = await flux.getMarkets({}, 20, 0);
    
    const sportsMarkets: Array<Market> = await flux.getMarkets({categories: ["sports"]}, 1, 0);
    expect(sportsMarkets.length == 1);
    
    const firstMarket: Array<Market> = await flux.getMarkets({}, 1, 0);
    expect(firstMarket.length == 1);
  })
  
  it("can get all resoluting markets from index node", async () => {
    const markets: Array<Market> = await flux.getResolutingMarkets({}, 20, 0);
    
    const sportsMarkets: Array<Market> = await flux.getResolutingMarkets({categories: ["sports"]}, 1, 0);
    expect(sportsMarkets.length == 1);
    
    const firstMarket: Array<Market> = await flux.getResolutingMarkets({}, 1, 0);
    expect(firstMarket.length == 1);
  })
  
  it("test lastFilledPrices", async () => {
    const res: Array<any> = await flux.getLastFilledPrices({}, 10, 0);
  })
  
  it("can get specific market ", async() => {
    const res = await flux.getMarket(2);
  })
  
  it("can get market prices for specific market ", async() => {
    const res = await flux.getMarketPrices(2);
  })
  
  it("can get average praces of a specific date", async() => {
    const res = await flux.getAvgPricesOnDate(2, "2020-07-17");
  })
  
  it("can get a users open orders for a specific market", async() => {
    const res = await flux.getOpenOrdersForUserForMarket(2, "flux-dev");
  })
  
  it("can get a user's outcome balance for a specific market", async() => {
    const res = await flux.getShareBalanceForUserForMarket(2, "flux-dev");
  })
  
  it("can get historic chart data", async() => {
    const res = await flux.getPriceHistory(0, "2020-07-20", "2020-07-28", ["day"]);
  })
  
  it("can get orderbook", async() => {
    const res = await flux.getOrderbook(2);
  })
  
  it("can get a user's affiliate earnings", async() => {
    const res = await flux.getAffiliateEarnings("flux-dev");
  })
  
  it("can get a user's open orders", async() => {
    const res = await flux.getOpenOrders("flux-dev");
  })
  
  it("can get a user's order history", async() => {
    const res = await flux.getOrderHistory("flux-dev");
  })
  
  it("can get all finalized markets that a user participated in", async() => {
    const res = await flux.getOrderHistory("flux-dev");
    expect(res.length == 0);
  })
  
  it("can all markets that are currently resoluting", async() => {
    const res = await flux.getOrderHistory("flux-dev");
    expect(res.length == 3);
  })
  
  it("can get resolution state", async() => {
    const res = await flux.getResolutionState({}, 0, 1);
  })
  
  it("can get trade earnings", async() => {
    const res = await flux.getTradeEarnings(0, "flux-dev");
  })
})
