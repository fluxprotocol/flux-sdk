import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { SdkConfig } from "../models/SdkConfig";
import { getAffiliateEarningsByAccount, getAllOpenOrdersByAccount, getFinalizedParticipatedMarketsByAccount } from "./UserService";

describe("UserService", () => {
    let sdkConfig: SdkConfig = {
        indexNodeUrl: 'http://localhost:1337/graphql',
        keyStore: new InMemoryKeyStore(),
        network: 'localnet',
        protocolContractId: '',
        tokenContractId: '',
    };

    describe.skip("getAffiliateEarningsByAccount", () => {
        it("should be able to get affiliate earnings", async () => {
            const result = await getAffiliateEarningsByAccount(sdkConfig, "test.near");

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].outcome).not.toBeUndefined();
            expect(result[0].depth).not.toBeUndefined();
            expect(result[0].price).not.toBeUndefined();
        });
    });

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
});
