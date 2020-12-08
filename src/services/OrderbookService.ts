import { OpenOrder } from "../models/Order";
import { SdkConfig } from "../models/SdkConfig";
import fetchRequest from "../utils/fetchRequest";

/**
 * Gets all open orderbooks from a market
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<OpenOrder[]>}
 */
export async function getOrderbooksByMarketId(sdkConfig: SdkConfig, marketId: number): Promise<OpenOrder[]> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/orderbook/get`, {
        body: JSON.stringify({
            marketId,
        }),
    });

    return response.json();
}
