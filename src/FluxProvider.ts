import BN from "bn.js";
import {
    Near,
    connect,
    WalletConnection,
    Account,
    Contract,
    keyStores,
} from "near-api-js";
import fetch from "node-fetch";

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

class ProtocolContract implements ProtocolContract {};

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
    
    getMarkets(filter: any, limit: number, offset: number): Promise<Array<Market>>;

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
    
    getAccountId() {
		return this.account?.accountId;
	}

	isSignedIn() {
		return this.walletConnection?.isSignedIn();
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

	async getTotalSupply() {
		return this.tokenContract.get_total_supply();
	}

	async getBalance(ownerId: string): Promise<string> {
		return this.tokenContract.get_balance({owner_id: ownerId})
	}

	async getAllowance(ownerId: string, escrowAccountId: string): Promise<string> {
		return this.tokenContract.get_allowance({owner_id: ownerId, escrow_account_id: escrowAccountId});
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