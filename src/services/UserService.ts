import { Order } from "../models/Order";
import { SdkConfig } from "../models/SdkConfig";
import fetchRequest from "../utils/fetchRequest";

/**
 * Gets the affiliate earnings for a specific account
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {string} accountId
 * @return {Promise<any>}
 */
export async function getAffiliateEarningsByAccount(sdkConfig: SdkConfig, accountId: string): Promise<any> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/user/get_affiliate_earnings`, {
        body: JSON.stringify({
            accountId,
        }),
    });

    return response.json();
}

/**
 * Gets all open order for a specific account
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {string} accountId
 * @return {Promise<Order[]>}
 */
export async function getAllOpenOrdersByAccount(sdkConfig: SdkConfig, accountId: string): Promise<Order[]> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/user/get_open_orders`, {
        body: JSON.stringify({
            accountId,
        }),
    });

    return response.json();
}

/**
 * Gets the order history of a specific account
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {string} accountId
 * @return {*}  {Promise<any>}
 */
export async function getOrderHistoryByAccount(sdkConfig: SdkConfig, accountId: string): Promise<any> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/user/get_order_history`, {
        body: JSON.stringify({
            accountId,
        }),
    });

    return response.json();
}

/**
 * Gets all participated market that are finalized for a specific account
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {string} accountId
 * @return {Promise<any>}
 */
export async function getFinalizedParticipatedMarketsByAccount(sdkConfig: SdkConfig, accountId: string): Promise<any> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/user/get_finalized_participated_markets`, {
        body: JSON.stringify({
            accountId,
        }),
    });

    return response.json();
}
