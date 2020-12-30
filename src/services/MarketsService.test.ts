import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { SdkConfig } from "../models/SdkConfig";
import { getAveragePriceByDate, getLastFilledPricesByMarketId, getMarketByIdApiCall, getMarketPricesById, getMarketsApiCall, getOpenOrdersForMarketByAccount, getShareBalanceForMarketByAccount } from "./MarketsService";

describe("MarketsService", () => {
    let sdkConfig: SdkConfig = {
        indexNodeUrl: 'http://localhost:1337/graphql',
        keyStore: new InMemoryKeyStore(),
        network: 'localnet',
        protocolContractId: '',
        tokenContractId: '',
    };

    describe("getMarketsApiCall", () => {
        it("should be able to get markets", async () => {
            const result = await getMarketsApiCall(sdkConfig);

            expect(result.total).toBeGreaterThan(0);
            expect(result.items.length).toBeGreaterThan(0);
        });
    });

    describe("getMarketByIdApiCall", () => {
        it("should be able to get a single market", async () => {
            const result = await getMarketByIdApiCall(sdkConfig, 0);

            expect(result).not.toBeNull();
        });
    });

    describe("getLastFilledPricesByMarketId", () => {
        it("should be able to get the last filled prices", async () => {
            const result = await getLastFilledPricesByMarketId(sdkConfig, 0);

            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("getMarketPricesById", () => {
        it("should be able to get the market prices by an id", async () => {
            const result = await getMarketPricesById(sdkConfig, 0);

            expect(result).not.toBeNull();
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("getShareBalanceForMarketByAccount", () => {
        it("should be able to get the balance for a market", async () => {
            const result = await getShareBalanceForMarketByAccount(sdkConfig, 0, "test.near");

            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("getOpenOrdersForMarketByAccount", () => {
        it("should be able to get the open orders for a specific market", async () => {
            const result = await getOpenOrdersForMarketByAccount(sdkConfig, 0);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].id).not.toBe(null);
        });
    });

    describe("getAveragePriceByDate", () => {
        it("should be able to get the open orders for a specific market", async () => {
            const result = await getAveragePriceByDate(sdkConfig, 0, 1609311411798);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].outcome).not.toBeNull();
        });
    });
});
