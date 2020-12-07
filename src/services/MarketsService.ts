import { Market } from '../models/Market';
import { FilterQuery } from '../models/FilterQuery';
import { SdkConfig } from '../models/SdkConfig';
import fetchRequest from '../utils/fetchRequest';
import { FilledPrice, FilledPriceCollection } from '../models/FilledPrice';
import { MarketPrice } from '../models/MarketPrice';
import { ShareBalance } from '../models/ShareBalance';
import { StrippedOrder } from '../models/Order';

/**
 * Fetches all markets withing the given filters
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {FilterQuery} filters
 * @return {Promise<Market[]>}
 */
export async function getMarketsApiCall(sdkConfig: SdkConfig, filters: FilterQuery): Promise<Market[]> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/markets/get`, {
        body: JSON.stringify({
            filter: filters.filter,
            limit: filters.limit,
            offset: filters.offset,
        }),
    });

    return response.json();
}

/**
 * Fetches a single market by it's id
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<Market>}
 */
export async function getMarketByIdApiCall(sdkConfig: SdkConfig, marketId: number): Promise<Market> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/market/get`, {
        body: JSON.stringify({
            marketId,
        }),
    });

    return response.json();
}

/**
 * Fetches all resoluting markets
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {FilterQuery} filters
 * @return {Promise<Market[]>}
 */
export async function getResolutingMarketsApiCall(sdkConfig: SdkConfig, filters: FilterQuery): Promise<Market[]> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/markets/get_resoluting`, {
        body: JSON.stringify({
            filter: filters.filter,
            limit: filters.limit,
            offset: filters.offset,
        }),
    });

    return response.json();
}

/**
 * Gets the last prices that where filled in all markets
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {FilterQuery} filters
 * @return {Promise<FilledPriceCollection>}
 */
export async function getLastFilledPrices(sdkConfig: SdkConfig, filters: FilterQuery): Promise<FilledPriceCollection> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/markets/last_filled_prices`, {
        body: JSON.stringify({
            filter: filters.filter,
            limit: filters.limit,
            offset: filters.offset,
        }),
    });

    return response.json();
}

/**
 * Gets the last filled prices for a single market
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<FilledPrice>}
 */
export async function getLastFilledPricesByMarketId(sdkConfig: SdkConfig, marketId: number): Promise<FilledPrice> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/market/last_filled_prices`, {
        body: JSON.stringify({
            marketId,
        }),
    });

    return response.json();
}

/**
 * Fetch the current market prices by the market id
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<any>}
 */
export async function getMarketPricesById(sdkConfig: SdkConfig, marketId: number): Promise<MarketPrice[]> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/market/market_prices`, {
        body: JSON.stringify({
            marketId,
        }),
    });

    return response.json();
}

/**
 * Fetch the current market prices by the market id
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<any>}
 */
export async function getShareBalanceForMarketByAccount(sdkConfig: SdkConfig, marketId: number, accountId: string): Promise<ShareBalance[]> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/market/get_share_balances_for_user`, {
        body: JSON.stringify({
            marketId,
            accountId,
        }),
    });

    return response.json();
}

/**
 * Fetch the current market prices by the market id
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<any>}
 */
export async function getOpenOrdersForMarketByAccount(sdkConfig: SdkConfig, marketId: number, accountId: string): Promise<StrippedOrder[]> {
    const response = await fetchRequest(`${sdkConfig.indexNodeUrl}/market/get_open_orders_for_user`, {
        body: JSON.stringify({
            marketId,
            accountId,
        }),
    });

    return response.json();
}
