const BN = require("bn.js");
import {
    Near,
    connect,
    WalletConnection,
    Account,
    Contract,
    keyStores,
} from "near-api-js";
import nodeFetch from "node-fetch";

let fetch: any;
if (typeof window !== 'undefined') {
	fetch = window.fetch;
} else {
	fetch = nodeFetch;
}

import {
    NULL_CONTRACT,
    PROTOCOL_CHANGE_METHODS,
    PROTOCOL_VIEW_METHODS,
    TOKEN_CHANGE_METHODS,
    TOKEN_VIEW_METHODS
} from "./constants";
import { getConfig } from "./utils";
import { Market } from './models/Market';
import { FilledPrice, FilledPriceCollection } from "./models/FilledPrice";
import { SdkConfig } from "./models/SdkConfig";
import { getLastFilledPrices, getLastFilledPricesByMarketId, getMarketByIdApiCall, getMarketPricesById, getMarketsApiCall, getOpenOrdersForMarketByAccount, getResolutingMarketsApiCall, getShareBalanceForMarketByAccount } from "./services/MarketsService";
import { getOrderbooksByMarketId } from "./services/OrderbookService";
import { getAffiliateEarningsByAccount, getOpenOrdersByAccount, getOrderHistoryByAccount } from "./services/UserService";
import { MarketPrice } from "./models/MarketPrice";
import { Order, StrippedOrder } from "./models/Order";
import { ShareBalance } from "./models/ShareBalance";

const ZERO = new BN("0");
const MAX_GAS = new BN("300000000000000");
class FluxProvider {
    /** @deprecated use sdkConfig.indexNodeUrl instead */
    indexNodeUrl: string;
    connected: boolean;
    network: string;
    near: Near | null;
    keyStore: keyStores.BrowserLocalStorageKeyStore | keyStores.UnencryptedFileSystemKeyStore | keyStores.InMemoryKeyStore;
    protocolContract: any;
    tokenContract: any;
    walletConnection: WalletConnection | null;
    account: Account | null;
    sdkConfig: SdkConfig;

    constructor(
        network: string = "testnet",
        indexNodeUrl: string = "https://api.flux.market",
        keyStore: keyStores.BrowserLocalStorageKeyStore | keyStores.UnencryptedFileSystemKeyStore | keyStores.InMemoryKeyStore = new keyStores.BrowserLocalStorageKeyStore()
    ) {
        this.connected = false;
        this.indexNodeUrl = indexNodeUrl;
        this.network = network;
        this.keyStore = keyStore;
        this.near = null;
        this.protocolContract = null;
        this.walletConnection = null;
        this.account = null;
        this.sdkConfig = {
            indexNodeUrl,
        };
    }

    async connect(
        protocolContractId: string,
        tokenContractId: string,
        accountId?: string,
        nearInstance?: Near,
        walletInstance?: WalletConnection,
        customNodeUrl?: string
    ) {
        const networkConfig = getConfig("testnet", customNodeUrl);
        this.near = nearInstance || await connect({...networkConfig, deps: {keyStore: this.keyStore}});

        if (typeof window !== 'undefined') {
            this.walletConnection = walletInstance || new WalletConnection(this.near, NULL_CONTRACT);
			this.account = this.walletConnection.account();
		} else if (accountId) {
			this.account = await this.near.account(accountId);
        }

        if (this.account === null) throw Error("account not initiated correctly")

        this.protocolContract = new Contract(this.account, protocolContractId, {
            viewMethods: PROTOCOL_VIEW_METHODS,
            changeMethods: PROTOCOL_CHANGE_METHODS
        });

        this.tokenContract = new Contract(this.account, tokenContractId, {
            viewMethods: TOKEN_VIEW_METHODS,
            changeMethods: TOKEN_CHANGE_METHODS
        });

        this.connected = true;
    }

    /* Account management methods */
    signIn() {
        if (!this.connected) throw new Error("Not yet connected");
		if (this.walletConnection!.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);
		this.walletConnection!.requestSignIn(NULL_CONTRACT, "Flux-protocol");
	}

	oneClickTxSignIn() {
        if (!this.connected) throw new Error("Not yet connected");
		if (this.walletConnection!.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);
        const walletConnection = new WalletConnection(this.near!, this.tokenContract!.contractId);
		walletConnection.requestSignIn(this.protocolContract!.contractId, "Flux-protocol");
        this.walletConnection = walletConnection;
	}

	signOut() {
		if (!this.near) throw new Error("No connection to NEAR found");
		if (!this.walletConnection!.getAccountId()) throw new Error(`No signed in session found`);
		this.walletConnection!.signOut();
    }

    getAccountId(): string | undefined {
		return this.account?.accountId;
	}

	isSignedIn(): boolean {
		return this.walletConnection!.isSignedIn();
    }

    /* Token contract on-chain methods */
    async setAllowance(escrowAccountId: string, allowance: string): Promise<any> {
        if (!this.account) throw new Error("Need to sign in to perform this method");

		return this.tokenContract.set_allowance({
            escrow_account_id: escrowAccountId,
            allowance: allowance.toString(),
        }).catch((err: Error) => {
			throw err
		})
	}

	async getTotalSupply(): Promise<string>  {
		return this.tokenContract.get_total_supply();
	}

	async getBalance(ownerId: string): Promise<string> {
		return this.tokenContract.get_balance({owner_id: ownerId})
	}

	async getAllowance(ownerId: string, escrowAccountId: string): Promise<string> {
		return this.tokenContract.get_allowance({owner_id: ownerId, escrow_account_id: escrowAccountId});
    }

    /* Flux protocol on-chain methods */
    async getClaimable(marketId: number, accountId: string | undefined = this.getAccountId()): Promise<string> {
		return this.protocolContract.get_claimable({
			market_id: marketId.toString(),
			account_id: accountId
		});
    }

    async createBinaryMarket(
        description: string,
        extraInfo: string,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
        affiliateFeePercentage: number = 0,
    ) : Promise<string>{
		return this.createMarket(
            description,
            extraInfo,
            2,
            [],
            categories,
            endTime,
            marketCreationFee,
            affiliateFeePercentage,
        );
	}

	async createCategoricalMarket(
        description: string,
        extraInfo: string,
        outcomes: number,
        outcomeTags: Array<string>,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
    ) : Promise<string> {
		if (outcomes < 3) throw new Error("Need more than two outcomes & outcome tags, otherwise create a binary market");
		return this.createMarket(description, extraInfo, outcomes, outcomeTags, categories, endTime, marketCreationFee);
	}

	async createMarket(
        description: string,
        extraInfo: string,
        outcomes: number,
        outcomeTags: Array<string>,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
        affiliateFeePercentage: number = 0,
    ) : Promise<string> {
		if (!this.account!.accountId) throw new Error("Need to sign in to perform this method");
		if (endTime < new Date().getTime()) throw new Error("End time has already passed");

		return this.protocolContract.create_market(
			{
				description,
				extra_info: extraInfo,
				outcomes: outcomes.toString(),
				outcome_tags: outcomeTags,
				categories: categories,
				end_time: endTime.toString(),
				creator_fee_percentage: marketCreationFee.toString(),
				affiliate_fee_percentage: affiliateFeePercentage.toString(),
				api_source: ""
			},
			MAX_GAS,
			ZERO
		).catch((err: Error) => {
			throw err
		})
    }

    async placeOrder(marketId: number, outcome: number, shares: string, price: number): Promise<any>{
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (price < 0 || price > 99)  throw new Error("Invalid price, price needs to be between 1 and 99");

		return this.protocolContract.place_order(
			{
				market_id: marketId.toString(),
				outcome: outcome.toString(),
				shares: shares.toString(),
				price: price.toString(),
				affiliate_account_id: null,
			},
			MAX_GAS,
			ZERO
		).catch((err: Error) => {
			throw err
		});
	}

    async cancelOrder(marketId: number, outcome: number, orderId: number, price: number): Promise<any> {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (orderId < 0 )  throw new Error("Invalid order id");
		if (price < 1 || price > 99) throw new Error("Invalid price");

		return this.protocolContract.cancel_order(
			{
				market_id: marketId.toString(),
				outcome: outcome.toString(),
				price: price.toString(),
				order_id: orderId.toString(),
			},
			MAX_GAS,
			ZERO
        ).catch((err: Error) => {
            throw err
        });
    }


    async dynamicMarketSell(marketId: number, outcome: number, shares: string, minPrice: number): Promise<any> {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Market id must be >= 0");
		if (outcome < 0) throw new Error("Outcome must be >= 0");
		if (parseInt(shares) < 0) throw new Error("Shares must be >= 0");
		if (minPrice < 1 || minPrice > 99) throw new Error("Invalid min_price");

		return this.account.functionCall(
			this.protocolContract.contractId,
			"dynamic_market_sell",
			{
                market_id: marketId.toString(),
				outcome: outcome.toString(),
				shares,
				min_price: minPrice.toString()
			},
			MAX_GAS,
			ZERO
        ).catch((err: Error) => {
            throw err
        });
	}

	async resolute(marketId: number, winningOutcome: number | null, stake: string): Promise<any> {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (winningOutcome! < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");

		return this.protocolContract.resolute_market(
			{
                market_id: marketId.toString(),
				winning_outcome: winningOutcome === null ? winningOutcome : winningOutcome!.toString(),
				stake: stake
			},
			MAX_GAS,
			ZERO
        ).catch((err: Error) => {
            throw err
        });
	}

	async dispute(marketId: number, winningOutcome: number, stake: string): Promise<any> {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (winningOutcome < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");
		return this.protocolContract.dispute_market(
			{
				market_id: marketId.toString(),
				winning_outcome: winningOutcome.toString(),
				stake: stake
			},
			MAX_GAS,
			ZERO
        ).catch((err: Error) => {
            throw err
        });
	}

	async withdrawDisputeStake(marketId: number, disputeRound: number, outcome: number): Promise<any> {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (disputeRound < 0) throw new Error("Invalid dispute round");
		if (outcome < 0 && outcome !== null) throw new Error("Invalid outcome");

		return this.protocolContract.withdraw_dispute_stake(
			{
				market_id: marketId.toString(),
				dispute_round: disputeRound.toString(),
				outcome: outcome.toString(),
			},
			MAX_GAS,
			ZERO
        ).catch((err: Error) => {
            throw err
        });
    }

	async finalize(marketId: number, winningOutcome: number | null): Promise<any> {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0 || marketId === null) throw new Error("Invalid market id");
		if (winningOutcome! < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");

		return this.account.functionCall(
			this.protocolContract.contractId,
			"finalize_market",
			{
				market_id: marketId.toString(),
				winning_outcome: winningOutcome === null ? winningOutcome : winningOutcome!.toString(),
			},
			MAX_GAS,
			ZERO
        ).catch((err: Error) => {
            throw err
        });
	}

	async claimEarnings(marketId: number, accountId: string): Promise<any> {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");

		return this.protocolContract.claim_earnings(
			{
				market_id: marketId.toString(),
				account_id: accountId
			},
			MAX_GAS,
			ZERO
        ).catch((err: Error) => {
            throw err
        });
	}

    /* Indexer view methods */
    async getMarkets(filter: any, limit: number, offset: number): Promise<Market[]> {
        return getMarketsApiCall(this.sdkConfig, {
            filter,
            limit,
            offset,
        });
    }

    async getResolutingMarkets(filter: any, limit: number, offset: number): Promise<Market[]> {
        return getResolutingMarketsApiCall(this.sdkConfig, {
            filter,
            limit,
            offset,
        });
    }

    async getLastFilledPrices(filter: any, limit: number, offset: number): Promise<FilledPriceCollection> {
        return getLastFilledPrices(this.sdkConfig, {
            filter,
            limit,
            offset,
        });
    }

    async getMarket(marketId: number): Promise<Market> {
        return getMarketByIdApiCall(this.sdkConfig, marketId);
    }

    async getLastFilledPricesForMarket(marketId: number): Promise<FilledPrice> {
        return getLastFilledPricesByMarketId(this.sdkConfig, marketId);
	}

	async getMarketPrices(marketId: number): Promise<MarketPrice[]>{
        return getMarketPricesById(this.sdkConfig, marketId);
	}

	async getAvgPricesOnDate(marketId: number, date: string): Promise<any> {
		return await this.fetchState("market/get_avg_prices_for_date", {marketId, date});
	}

    async getOpenOrdersForUserForMarket(marketId: number, accountId: string): Promise<StrippedOrder[]> {
        return getOpenOrdersForMarketByAccount(this.sdkConfig, marketId, accountId);
	}

	async getShareBalanceForUserForMarket(marketId: number, accountId: string): Promise<ShareBalance[]> {
        return getShareBalanceForMarketByAccount(this.sdkConfig, marketId, accountId);
    }

	async getPriceHistory(marketId: number, startDate: number, endDate: number, dateMetrics: Array<string>): Promise<any> {
		return await this.fetchState("history/get_avg_price_per_date_metric", {marketId, startDate, endDate, dateMetrics});
	}

	async getOrderbook(marketId: number): Promise<any> {
        return getOrderbooksByMarketId(this.sdkConfig, marketId);
	}

	async getAffiliateEarnings(accountId: string): Promise<any> {
        return getAffiliateEarningsByAccount(this.sdkConfig, accountId);
	}

	async getOpenOrders(accountId: string): Promise<Order[]> {
        return getOpenOrdersByAccount(this.sdkConfig, accountId);
	}

	async getOrderHistory(accountId: string): Promise<any> {
        return getOrderHistoryByAccount(this.sdkConfig, accountId);
	}

	async getFinalizedParticipatedMarkets(accountId: string): Promise<any> {
		return await this.fetchState("user/get_finalized_participated_markets", {accountId});
	}

	async getResolutionState(filter: any, limit: number, offset: number): Promise<any> {
		return await this.fetchState("markets/get_resolution_state", {filter, limit, offset});
	}

	async getTradeEarnings(marketId: number, accountId: string): Promise<any> {
		return await this.fetchState("earnings/get_trading_earnings", {marketId, accountId});
	}

    /* Indexer generic fetch interface */
    async fetchState(endPoint: string, args: any): Promise<any> {
		const res = await fetch(`${this.indexNodeUrl}/${endPoint}`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(args)
		});

		return await res.json();
	}
}

export default FluxProvider;
