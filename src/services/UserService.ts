import { GraphQLResponse } from "../models/GraphQLResponse";
import { Market } from "../models/Market";
import { Order } from "../models/Order";
import { SdkConfig } from "../models/SdkConfig";
import { graphQLRequest } from "../utils/fetchRequest";

/**
 * Gets all open order for a specific account
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {string} accountId
 * @return {Promise<Order[]>}
 */
export async function getAllOpenOrdersByAccount(sdkConfig: SdkConfig, accountId: string): Promise<Order[]> {
    try {
        const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
            query AccountInfo($accountId: String!) {
                account: getAccountInfo(accountId: $accountId) {
                    openOrders {
                        id
                        order_id
                        market_id
                        creator
                        outcome
                        spend
                        shares
                        fill_price
                        price
                        filled
                        shares_filling
                        shares_filled
                        affiliate_account_id
                        block_height
                        closed
                        cap_creation_date
                    }
                }
            }
        `, {
            accountId: accountId.toString(),
        });

        const jsonData: GraphQLResponse<any> = await response.json();

        if (!jsonData.data.account) {
            return [];
        }

        return jsonData.data.account.openOrders;
    } catch (error) {
        console.error('[getAllOpenOrdersByAccount]', error);
        return [];
    }
}

/**
 * Gets all participated market that are finalized for a specific account
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {string} accountId
 * @return {Promise<any>}
 */
export async function getFinalizedParticipatedMarketsByAccount(sdkConfig: SdkConfig, accountId: string): Promise<Market[]> {
    try {
        const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
            query ParticipatedMarkets($accountId: String!) {
                markets: getFinalizedParticipatedMarkets(accountId: $accountId) {
                    id
                    creator
                    description
                    extra_info
                    outcomes
                    outcomes_tags
                    categories
                    end_time
                    creator_fee_percentage
                    resolution_fee_percentage
                    affiliate_fee_percentage
                    api_source
                    cap_creation_date
                }
            }
        `, {
            accountId: accountId.toString(),
        });

        const jsonData: GraphQLResponse<any> = await response.json();

        return jsonData.data.markets;
    } catch (error) {
        console.error('[getFinalizedParticipatedMarketsByAccount]', error);
        return [];
    }
}
