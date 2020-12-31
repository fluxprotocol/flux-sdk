import { Market } from '../models/Market';
import { FilterQuery } from '../models/FilterQuery';
import { SdkConfig } from '../models/SdkConfig';
import fetchRequest, { graphQLRequest } from '../utils/fetchRequest';
import { FilledPriceCollection, LastFilledPrice } from '../models/FilledPrice';
import { MarketPrice } from '../models/MarketPrice';
import { ShareBalance } from '../models/ShareBalance';
import { Order, StrippedOrder } from '../models/Order';
import { AveragePrice } from '../models/AveragePrice';
import { Paginated } from '../models/Paginated';
import { GraphQLResponse } from '../models/GraphQLResponse';
import { ResolutionWindow } from '../models/ResolutionWindow';

/**
 * Fetches all markets withing the given filters
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {FilterQuery} filters
 * @return {Promise<Paginated<Market>>}
 */
export async function getMarketsApiCall(sdkConfig: SdkConfig, filters: FilterQuery = {}): Promise<Paginated<Market>> {
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query Markets($limit: Int, $offset: Int, $categories: [String]) {
            markets: getMarkets(filters: { expired: true, limit: $limit, offset: $offset, categories: $categories }) {
                total
                items {
                    volume
                    id
                    description
                    extra_info
                    creator
                    cap_creation_date
                    end_time
                    outcomes
                    outcomes_tags
                    categories
                    volume
                    creator_fee_percentage
                    resolution_fee_percentage
                    affiliate_fee_percentage
                    api_source
                    lastFilledPrices {
                        outcome
                        price
                    }
                }
            }
        }
    `, {
        limit: filters.limit || 0,
        offset: filters.offset || 0,
        categories: filters.filter?.categories || [],
    });

    const jsonData: GraphQLResponse<any> = await response.json();
    return jsonData.data.markets;
}

/**
 * Fetches a single market by it's id
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<Market>}
 */
export async function getMarketByIdApiCall(sdkConfig: SdkConfig, marketId: number): Promise<Market | null> {
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query Market($marketId: String!) {
            market: getMarket(id: $marketId) {
                volume
                id
                description
                extra_info
                creator
                cap_creation_date
                end_time
                outcomes
                outcomes_tags
                categories
                volume
                creator_fee_percentage
                resolution_fee_percentage
                affiliate_fee_percentage
                api_source
                lastFilledPrices {
                    outcome
                    price
                }
            }
        }
    `, {
        marketId: marketId.toString(),
    });

    const jsonData: GraphQLResponse<any> = await response.json();

    return jsonData.data.market;
}

/**
 * Fetches all resoluting markets
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {FilterQuery} filters
 * @return {Promise<Market[]>}
 */
export async function getResolutingMarketsApiCall(sdkConfig: SdkConfig): Promise<ResolutionWindow[]> {
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query ResolutingMarket {
            resoluting: getResoluting {
                round
                required_bond_size
                end_time
                market {
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
                    volume
                    state {
                        winning_outcome
                        finalized
                        disputed
                        resoluted
                    }
                }
            }
        }
    `, {});

    const jsonData: GraphQLResponse<any> = await response.json();

    if (!jsonData.data.resoluting) {
        return [];
    }

    return jsonData.data.resoluting;
}

/**
 * Gets the last filled prices for a single market
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<FilledPrice>}
 */
export async function getLastFilledPricesByMarketId(sdkConfig: SdkConfig, marketId: number): Promise<LastFilledPrice[]> {
    try {
        const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
            query Market($marketId: String!) {
                market: getMarket(id: $marketId) {
                    lastFilledPrices {
                        price
                        outcome
                    }
                }
            }
        `, {
            marketId: marketId.toString(),
        });

        const jsonData: GraphQLResponse<any> = await response.json();

        if (!jsonData.data.market) {
            return [];
        }

        return jsonData.data.market.lastFilledPrices;
    } catch (error) {
        console.error('[getLastFilledPricesByMarketId]', error);
        return [];
    }
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
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query MarketPrices($marketId: String!) {
            prices: getMarketPrices(marketId: $marketId) {
                price
                depth
                outcome
            }
        }
    `, {
        marketId: marketId.toString(),
    });

    const jsonData: GraphQLResponse<any> = await response.json();

    return jsonData.data.prices;
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
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query UserBalances($accountId: String!, $marketId: String!) {
            userBalances: getUserBalances(accountId: $accountId, marketId: $marketId) {
                id
                account_id
                market_id
                outcome
                shares_balance
                tokens_to_spend
                tokens_spent
                avg_price_per_share
            }
        }
    `, {
        marketId: marketId.toString(),
        accountId: accountId,
    });

    const jsonData: GraphQLResponse<any> = await response.json();
    return jsonData.data.userBalances;
}

/**
 * Fetch the current market prices by the market id
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @return {Promise<any>}
 */
export async function getOpenOrdersForMarketByAccount(sdkConfig: SdkConfig, marketId: number, accountId: string): Promise<Order[]> {
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query OpenOrders($marketId: String!, $accountId: String!) {
            openOrders: getOrdersForMarket(
                marketId: $marketId
                filters: { closed: false, creator: $accountId }
            ) {
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
    `, {
        marketId: marketId.toString(),
        accountId,
    });

    const jsonData: GraphQLResponse<any> = await response.json();
    return jsonData.data.openOrders;
}

/**
 * Gets the average price on that day
 * flux.getAvgPricesOnDate(5, 1607416200091);
 *
 * @export
 * @param {SdkConfig} sdkConfig
 * @param {number} marketId
 * @param {(string | number)} date Anything that represents a date (is converted on the backend with moment)
 * @return {Promise<StrippedOrder[]>}
 */
export async function getAveragePriceByDate(sdkConfig: SdkConfig, marketId: number, date: string | number): Promise<AveragePrice[]> {
    const response = await graphQLRequest(`${sdkConfig.indexNodeUrl}`, `
        query AveragePriceForDay($marketId: String!, $date: String!) {
            averagePrice: getAveragePriceForDay(marketId: $marketId, beginTimestamp: $date) {
                pointKey
                dataPoints {
                    outcome
                    price
                }
            }
        }
    `, {
        marketId: marketId.toString(),
        date: date.toString(),
    });

    const jsonData: GraphQLResponse<any> = await response.json();
    if (!jsonData.data.averagePrice) {
        return [];
    }

    return jsonData.data.averagePrice.dataPoints;
}
