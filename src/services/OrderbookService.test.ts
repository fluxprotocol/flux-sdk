import { InMemoryKeyStore } from "near-api-js/lib/key_stores";
import { SdkConfig } from "../models/SdkConfig";
import { getOrderbooksByMarketId } from "./OrderbookService";

describe("OrderbookService", () => {
    let sdkConfig: SdkConfig = {
        indexNodeUrl: 'http://localhost:1337/graphql',
        keyStore: new InMemoryKeyStore(),
        network: 'localnet',
        protocolContractId: '',
        tokenContractId: '',
    };

    describe("getOrderbooksByMarketId", () => {
        it("should be able to get orderbooks and their prices", async () => {
            const result = await getOrderbooksByMarketId(sdkConfig, 0);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].outcome).not.toBeUndefined();
            expect(result[0].depth).not.toBeUndefined();
            expect(result[0].price).not.toBeUndefined();
        });
    });
});
