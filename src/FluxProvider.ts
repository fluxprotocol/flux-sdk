import BN from "bn.js";
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
import { Market } from './types';

const ZERO = new BN("0");
const MAX_GAS = new BN("300000000000000");

interface FluxProvider {
    connected: Boolean;
    indexNodeUrl: string;
    network: string;
    near: Near | null;
    keyStore: keyStores.BrowserLocalStorageKeyStore | keyStores.UnencryptedFileSystemKeyStore | keyStores.InMemoryKeyStore;
    protocolContract: any;
    tokenContract: any;
    walletConnection: WalletConnection | null;
	account: Account | null;
	
    connect(
        protocolContractId: string, 
        tokenContractId: string, 
        accountId?: string, 
        nearInstance?: Near, 
        walletInstance?: WalletConnection, 
        customNodeUrl?: string 
    ): void;
    signIn(): void;
    oneClickTxSignIn(): void;
    signOut(): void;
    getAccountId(): string;
    isSignedIn(): boolean;
    setAllowance(escrowAccountId: string, allowance: string): void;
    getTotalSupply(): Promise<string>;
    getBalance(ownerId: string): Promise<string>;
    getAllowance(ownerId: string, escrowAccountId: string): Promise<string>;

    createBinaryMarket(
        description: string,
        extraInfo: string,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
        affiliateFeePercentage: number,
    ) : Promise<string>;

    createCategoricalMarket(
        description: string,
        extraInfo: string,
        outcomes: number, 
        outcomeTags: Array<string>,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
    ) : Promise<string>;

    createMarket(
        description: string,
        extraInfo: string,
        outcomes: number, 
        outcomeTags: Array<string>,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
        affiliateFeePercentage: number,
    ) : Promise<string>;

    getClaimable(marketId: number, accountId: string | undefined): Promise<string>;
    placeOrder(marketId: number, outcome: number, shares: string, price: number): Promise<any>;
    cancelOrder(marketId: number, outcome: number, orderId: number, price: number): Promise<any>;
    dynamicMarketSell(marketId: number, outcome: number, shares: string, minPrice: number): Promise<any>;
    resolute(marketId: number, winningOutcome: number, stake: string): Promise<any>;
    dispute(marketId: number, winningOutcome: number, stake: string): Promise<any>;
    withdrawDisputeStake(marketId: number, disputeRound: number, outcome: number): Promise<any>;
    finalize(marketId: number, winningOutcome: number | null): Promise<any>;
    claimEarnings(marketId: number, accountId: string): Promise<any>;
    getMarkets(filter: any, limit: number, offset: number): Promise<Array<Market>>;
    getResolutingMarkets(filter: any, limit: number, offset: number): Promise<Array<Market>>;
    getLastFilledPrices(filter: any, limit: number, offset: number): Promise<any>;
    getMarket(marketId: number): Promise<Market>;
    getLastFilledPricesForMarket(marketId: number): Promise<any>;
	getMarketPrices(marketId: number): Promise<any>;
	getAvgPricesOnDate(marketId: number, date: string): Promise<any>;
	getOpenOrdersForUserForMarket(marketId: number, accountId: string): Promise<any>;
	getShareBalanceForUserForMarket(marketId: number, accountId: string): Promise<any>;
	getPriceHistory(marketId: number, startDate: string, endDate: string, dateMetrics: Array<string>): Promise<any>;
	getOrderbook(marketId: number): Promise<any>;
	getAffiliateEarnings(accountId: string): Promise<any>;
	getOpenOrders(accountId: string): Promise<any>;
	getOrderHistory(accountId: string): Promise<any>;
	getFinalizedParticipatedMarkets(accountId: string): Promise<any>;
	getResolutionState(filter: any, limit: number, offset: number): Promise<any>;
	getTradeEarnings(marketId: number, accountId: string): Promise<any>;
    fetchState(endPoint: string, args: any): Promise<any>;
}

class FluxProvider implements FluxProvider{
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
        
		return this.tokenContract.set_allowance(
			{
				escrow_account_id: escrowAccountId,
				allowance: allowance.toString(),
			}
		).catch((err: Error) => {
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
    ) : Promise<string>{
		return this.createMarket(description, extraInfo, 2, [], categories, endTime, marketCreationFee, 0);
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
				affiliate_fee_percentage: "0",
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
    async getMarkets(filter: any, limit: number, offset: number): Promise<Array<Market>> {
        return this.fetchState("markets/get", {filter, limit, offset});
    }

    async getResolutingMarkets(filter: any, limit: number, offset: number): Promise<Array<Market>> {
        return this.fetchState("markets/get_resoluting", {filter, limit, offset});
    }

    async getLastFilledPrices(filter: any, limit: number, offset: number): Promise<any> {
        return this.fetchState("markets/last_filled_prices", {filter, limit, offset});
    }

    async getMarket(marketId: number): Promise<Market> {
        return this.fetchState("market/get", {marketId});
    }

    async getLastFilledPricesForMarket(marketId: number): Promise<any> {
		return await this.fetchState("market/last_filled_prices", {marketId});
	}

	async getMarketPrices(marketId: number): Promise<any>{
		return await this.fetchState("market/market_prices", {marketId});
	}

	async getAvgPricesOnDate(marketId: number, date: string): Promise<any> {
		return await this.fetchState("market/get_avg_prices_for_date", {marketId, date});
	}

	async getOpenOrdersForUserForMarket(marketId: number, accountId: string): Promise<any> {
		return await this.fetchState("market/get_open_orders_for_user", {marketId, accountId});
	}

	async getShareBalanceForUserForMarket(marketId: number, accountId: string): Promise<any> {
		return await this.fetchState("market/get_share_balances_for_user", {marketId, accountId});
    }
    
	async getPriceHistory(marketId: number, startDate: string, endDate: string, dateMetrics: Array<string>): Promise<any> {
		return await this.fetchState("history/get_avg_price_per_date_metric", {marketId, startDate, endDate, dateMetrics});
	}

	async getOrderbook(marketId: number): Promise<any> {
		return await this.fetchState("orderbook/get", {marketId});
	}

	async getAffiliateEarnings(accountId: string): Promise<any> {
		return await this.fetchState("user/get_affiliate_earnings", {accountId});
	}

	async getOpenOrders(accountId: string): Promise<any> {
		return await this.fetchState("user/get_open_orders", {accountId});
	}

	async getOrderHistory(accountId: string): Promise<any> {
		return await this.fetchState("user/get_order_history", {accountId});
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

		return await res.json()
	}

}  

export default FluxProvider;