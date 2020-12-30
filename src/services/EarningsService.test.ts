import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { SdkConfig } from "../models/SdkConfig";
import { getTradeEarningsByAccount } from "./EarningsService";

describe("MarketsService", () => {
    let sdkConfig: SdkConfig = {
        indexNodeUrl: 'http://localhost:1337/graphql',
        keyStore: new InMemoryKeyStore(),
        network: 'localnet',
        protocolContractId: '',
        tokenContractId: '',
    };

    describe("getTradeEarningsByAccount", () => {
        it("should be able to get the earnings for a specific account", async () => {
            const result = await getTradeEarningsByAccount(sdkConfig, 0, "test.near");

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].outcome).not.toBeNull();
        });
    });
});
