import { GraphQLResponse } from "../models/GraphQLResponse";
import { OpenOrder } from "../models/Order";
import { SdkConfig } from "../models/SdkConfig";
import { graphQLRequest } from "../utils/fetchRequest";

/**
 * Gets all open orderbooks from a market
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<OpenOrder[]>}
 */
export async function getOrderbooksByMarketId(sdkConfig: SdkConfig, marketId: number): Promise<OpenOrder[]> {
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query MarketPrice($marketId: String!) {
            market: getMarket(id: $marketId) {
                prices {
                    price
                    depth
                    outcome
                }
            }
        }
    `, {
        marketId: marketId.toString(),
    });

    const jsonData: GraphQLResponse<any> = await response.json();
    return jsonData.data.market.prices;
}
