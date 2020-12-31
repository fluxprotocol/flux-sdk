import { DateMetric } from "../models/DateMetric";
import { GraphQLResponse } from "../models/GraphQLResponse";
import { PriceHistoryPoint } from "../models/PriceHistoryPoint";
import { SdkConfig } from "../models/SdkConfig";
import { graphQLRequest } from "../utils/fetchRequest";


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
export async function getPriceHistoryByMarket(sdkConfig: SdkConfig, marketId: number, startDate: number, dateMetric = DateMetric.hour, endDate?: number): Promise<PriceHistoryPoint[]> {
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query PriceHistory($marketId: String!, $startDate: String!, $endDate: String, $dateMetric: DateMetric!) {
            prices: getAveragePriceHistory(marketId: $marketId, beginTimestamp: $startDate, endTimestamp: $endDate, dateMetric: $dateMetric) {
                pointKey
                dataPoints {
                    outcome
                    price
                }
            }
        }
    `, {
        marketId: marketId.toString(),
        startDate: startDate.toString(),
        dateMetric: dateMetric,
        endDate: endDate?.toString(),
    });

    const jsonData: GraphQLResponse<any> = await response.json();
    return jsonData.data.prices;
}
