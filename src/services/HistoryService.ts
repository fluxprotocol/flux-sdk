import { SdkConfig } from "../models/SdkConfig";
import fetchRequest from "../utils/fetchRequest";

/**
 * Gets the price history of a given market
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @param {number} startDate
 * @param {number} endDate
 * @param {Array<string>} dateMetrics
 * @return {Promise<any>}
 */
export async function getPriceHistoryByMarket(sdkConfig: SdkConfig, marketId: number, startDate: number, endDate: number, dateMetrics: Array<string>): Promise<any> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/history/get_avg_price_per_date_metric`, {
        body: JSON.stringify({
            marketId,
            startDate,
            endDate,
            dateMetrics,
        }),
    });

    return response.json();
}
