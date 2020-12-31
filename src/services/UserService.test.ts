import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { SdkConfig } from "../models/SdkConfig";
import { getAllOpenOrdersByAccount, getFinalizedParticipatedMarketsByAccount, getOrderHistoryByAccount } from "./UserService";

describe("UserService", () => {
    let sdkConfig: SdkConfig = {
        indexNodeUrl: 'http://localhost:1337/graphql',
        keyStore: new InMemoryKeyStore(),
        network: 'localnet',
        protocolContractId: '',
        tokenContractId: '',
    };

    describe("getAllOpenOrdersByAccount", () => {
        it("should get all open orders by account", async () => {
            // Sadly due time frames this test is kind of hard to do with real data
            const result = await getAllOpenOrdersByAccount(sdkConfig, "test.near");

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("getFinalizedParticipatedMarketsByAccount", () => {
        it("should get all finalized markets for a specific account", async () => {
            // Sadly due time frames this test is kind of hard to do with real data
            const result = await getFinalizedParticipatedMarketsByAccount(sdkConfig, "test.near");

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("getOrderHistoryByAccount", () => {
        it("should get the order history of a user", async () => {
            const result = await getOrderHistoryByAccount(sdkConfig, "test.near");

            expect(result).toBeDefined();
            expect(result[0]).toBeDefined();
            expect(result[0].creator).toBe("test.near");
        });
    });
});
