import { Earnings } from "../models/Earnings";
import { SdkConfig } from "../models/SdkConfig";
import fetchRequest from "../utils/fetchRequest";

/**
 * Get's all trading earnings for a specific user
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @param {string} accountId
 * @return {Promise<Earnings[]>}
 */
export async function getTradeEarningsByAccount(sdkConfig: SdkConfig, marketId: number, accountId: string): Promise<Earnings[]> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/earnings/get_trading_earnings`, {
        body: JSON.stringify({
            marketId,
            accountId,
        }),
    });

    return response.json();
}
