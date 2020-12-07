import { SdkConfig } from "../models/SdkConfig";
import fetchRequest from "../utils/fetchRequest";

export async function getOrderbooksByMarketId(sdkConfig: SdkConfig, marketId: number): Promise<any> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/orderbook/get`, {
        body: JSON.stringify({
            marketId,
        }),
    });

    return response.json();
}
