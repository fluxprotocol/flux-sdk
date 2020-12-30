import { Earnings } from "../models/Earnings";
import { GraphQLResponse } from "../models/GraphQLResponse";
import { SdkConfig } from "../models/SdkConfig";
import fetchRequest, { graphQLRequest } from "../utils/fetchRequest";

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
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query Earnings($accountId: String!, $marketId: String!) {
            earnings: getEarningsForMarket(marketId: $marketId, accountId: $accountId) {
                outcome
                earnings
            }
        }
    `, {
        marketId: marketId.toString(),
        accountId: accountId,
    });

    const jsonData: GraphQLResponse<any> = await response.json();
    return jsonData.data.earnings;
}
