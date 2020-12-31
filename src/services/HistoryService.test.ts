import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { SdkConfig } from "../models/SdkConfig";
import { getPriceHistoryByMarket } from "./HistoryService";

describe("HistoryService", () => {
    let sdkConfig: SdkConfig = {
        indexNodeUrl: 'http://localhost:1337/graphql',
        keyStore: new InMemoryKeyStore(),
        network: 'localnet',
        protocolContractId: '',
        tokenContractId: '',
    };

    describe("getPriceHistoryByMarket", () => {
        it("should get the full price history", async () => {
            const result = await getPriceHistoryByMarket(sdkConfig, 0, 1599164967779);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].pointKey).not.toBeUndefined();
            expect(result[0].dataPoints[0]).not.toBeUndefined();
            expect(result[0].dataPoints[0].outcome).not.toBeUndefined();
        });
    });
});
