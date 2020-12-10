// const BN = require("bn.js");
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
    MAX_GAS,
    ZERO,
    STORAGE_DEFAULT,
} from "./constants";
import { getConfig } from "./utils";
import { Market } from './models/Market';
import { FilledPrice, FilledPriceCollection } from "./models/FilledPrice";
import { SdkConfig } from "./models/SdkConfig";
import { getAveragePriceByDate, getLastFilledPrices, getLastFilledPricesByMarketId, getMarketByIdApiCall, getMarketPricesById, getMarketsApiCall, getOpenOrdersForMarketByAccount, getResolutingMarketsApiCall, getResolutionState, getShareBalanceForMarketByAccount } from "./services/MarketsService";
import { getOrderbooksByMarketId } from "./services/OrderbookService";
import { getAffiliateEarningsByAccount, getAllOpenOrdersByAccount, getOrderHistoryByAccount, getFinalizedParticipatedMarketsByAccount } from "./services/UserService";
import { MarketPrice } from "./models/MarketPrice";
import { OpenOrder, Order, StrippedOrder } from "./models/Order";
import { ShareBalance } from "./models/ShareBalance";
import ProtocolContract from "./ProtocolContract";
import TokenContract from "./TokenContract";
import { getTradeEarningsByAccount } from "./services/EarningsService";
import { Earnings } from "./models/Earnings";
import { getPriceHistoryByMarket } from "./services/HistoryService";
import { AveragePrice } from "./models/AveragePrice";
import BN from "bn.js";
import { toShares } from "./utils/conversionUtils";

class FluxProvider {
    /** @deprecated use sdkConfig.indexNodeUrl instead */
    indexNodeUrl: string;
    connected: boolean;
    network: string;
    near: Near | null;
    keyStore: keyStores.BrowserLocalStorageKeyStore | keyStores.UnencryptedFileSystemKeyStore | keyStores.InMemoryKeyStore;

    /** @deprecated use fluxProtocolContract instead */
    protocolContract: any;

    /** @deprecated use fluxTokenContract instead */
    tokenContract: any;

    fluxProtocolContract: ProtocolContract | null;
    fluxTokenContract: TokenContract | null;
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
        this.tokenContract = null;
        this.fluxProtocolContract = null;
        this.fluxTokenContract = null;
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
        this.near = nearInstance || await connect({ ...networkConfig, deps: { keyStore: this.keyStore }});

        if (typeof window !== 'undefined') {
            this.walletConnection = walletInstance || new WalletConnection(this.near, NULL_CONTRACT);
			this.account = this.walletConnection.account();
		} else if (accountId) {
			this.account = await this.near.account(accountId);
        }

        if (this.account === null) throw Error("account not initiated correctly")

        this.fluxProtocolContract = new ProtocolContract(this.account, protocolContractId);
        this.fluxTokenContract = new TokenContract(this.account, tokenContractId);

        // For backwards compatibility
        this.tokenContract = this.fluxTokenContract.contract;
        this.protocolContract = this.fluxProtocolContract.contract;

        this.connected = true;
    }

    /* Account management methods */
    signIn() {
        if (!this.walletConnection) throw new Error("Not yet connected");
		if (this.walletConnection.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);

        this.walletConnection.requestSignIn(NULL_CONTRACT, "Flux-protocol");
	}

	oneClickTxSignIn() {
        if (!this.walletConnection ||
            !this.fluxTokenContract ||
            !this.fluxProtocolContract ||
            !this.near
        ) {
            throw new Error("Not yet connected");
        }

		if (this.walletConnection.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);

        const walletConnection = new WalletConnection(this.near, this.fluxTokenContract.contract.contractId);
		walletConnection.requestSignIn(this.fluxProtocolContract.contract.contractId, "Flux-protocol");
        this.walletConnection = walletConnection;
	}

	signOut() {
		if (!this.near || !this.walletConnection) throw new Error("No connection to NEAR found");
		if (!this.walletConnection.getAccountId()) throw new Error(`No signed in session found`);

        this.walletConnection.signOut();
    }

    getAccountId(): string | undefined {
		return this.account?.accountId;
	}

	isSignedIn(): boolean {
        if (!this.walletConnection) return false;

		return this.walletConnection.isSignedIn();
    }

    /* Token contract on-chain methods */
	async getTotalSupply(): Promise<string>  {
        if (!this.fluxTokenContract) throw new Error('Not connected');

        return this.fluxTokenContract.getTotalSupply();
	}

	async getBalance(ownerId: string): Promise<string> {
        if (!this.fluxTokenContract) throw new Error('Not connected');

        return this.fluxTokenContract.getBalance(ownerId);
	}

	async getAllowance(ownerId: string, escrowAccountId: string): Promise<string> {
        if (!this.fluxTokenContract) throw new Error('Not connected');

        return this.fluxTokenContract.getAllowance(ownerId, escrowAccountId);
    }

    async incAllowance(escrowAccountId: string, amount: string, storageCost: BN = STORAGE_DEFAULT): Promise<any> {
        if (!this.fluxTokenContract) throw new Error('Not connected');

        return this.fluxTokenContract.incAllowance(escrowAccountId, amount, storageCost);
    }

    /* Flux protocol on-chain methods */
    async getClaimable(marketId: number, accountId: string | undefined = this.getAccountId()): Promise<string> {
        if (!this.fluxProtocolContract) throw new Error('Not connected');
        if (!accountId) throw new Error('accountId is required');

        return this.fluxProtocolContract.getClaimable(marketId, accountId);
    }

    async createBinaryMarket(
        description: string,
        extraInfo: string,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
        storageCost: BN = STORAGE_DEFAULT,
    ) : Promise<string>{
		return this.createMarket(
            description,
            extraInfo,
            2,
            [],
            categories,
            endTime,
            marketCreationFee,
            storageCost,
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
        storageCost: BN = STORAGE_DEFAULT,
    ) : Promise<string> {
		if (outcomes < 3) throw new Error("Need more than two outcomes & outcome tags, otherwise create a binary market");

        return this.createMarket(
            description,
            extraInfo,
            outcomes,
            outcomeTags,
            categories,
            endTime,
            marketCreationFee,
            storageCost,
        );
	}

	async createMarket(
        description: string,
        extraInfo: string,
        outcomes: number,
        outcomeTags: Array<string>,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
        storageCost: BN,
    ) : Promise<string> {
		if (!this.account || !this.account.accountId) throw new Error("Need to sign in to perform this method");
        if (!this.fluxProtocolContract) throw new Error('Not connected');

        return this.fluxProtocolContract.createMarket(
            description,
            extraInfo,
            outcomes,
            outcomeTags,
            categories,
            endTime,
            marketCreationFee,
            storageCost,
            0,
        );
    }

    async placeOrder(marketId: number, outcome: number, shares: string, price: number, storageCost: BN = STORAGE_DEFAULT): Promise<any> {
        if (!this.fluxProtocolContract) throw new Error("Not connected");

        return this.fluxProtocolContract.placeOrder(marketId, outcome, toShares(shares).toString(), price, storageCost);
	}

    async cancelOrder(marketId: number, outcome: number, orderId: number, price: number, storageCost: BN = STORAGE_DEFAULT): Promise<any> {
        if (!this.fluxProtocolContract) throw new Error("Not connected");

        return this.fluxProtocolContract.cancelOrder(marketId, outcome, orderId, price, storageCost);
    }

    async dynamicMarketSell(marketId: number, outcome: number, shares: string, minPrice: number, storageCost: BN = STORAGE_DEFAULT): Promise<any> {
        if (!this.fluxProtocolContract) throw new Error("Not connected");
        if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Market id must be >= 0");
		if (outcome < 0) throw new Error("Outcome must be >= 0");
		if (parseInt(shares) < 0) throw new Error("Shares must be >= 0");
        if (minPrice < 1 || minPrice > 99) throw new Error("Invalid min_price");

		return this.account.functionCall(
			this.fluxProtocolContract.contract.contractId,
			"dynamic_market_sell",
			{
                market_id: marketId.toString(),
				outcome,
				shares,
				min_price: minPrice,
			},
			MAX_GAS,
			storageCost,
        ).catch((err: Error) => {
            throw err
        });
	}

    async resolute(marketId: number, winningOutcome: number | null, stake: string, storageCost: BN = STORAGE_DEFAULT): Promise<any> {
        if (!this.fluxProtocolContract) throw new Error("Not connected");

        return this.fluxProtocolContract.resolute(marketId, winningOutcome, stake, storageCost);
	}

    async dispute(marketId: number, winningOutcome: number, stake: string, storageCost: BN = STORAGE_DEFAULT): Promise<any> {
        if (!this.fluxProtocolContract) throw new Error("Not connected");

        return this.fluxProtocolContract.dispute(marketId, winningOutcome, stake, storageCost);
	}

    async withdrawDisputeStake(marketId: number, disputeRound: number, outcome: number, storageCost: BN = STORAGE_DEFAULT): Promise<any> {
        if (!this.fluxProtocolContract) throw new Error("Not connected");

        return this.fluxProtocolContract.withdrawDisputeStake(marketId, disputeRound, outcome, storageCost);
    }

	async finalize(marketId: number, winningOutcome: number | null = null): Promise<any> {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0 || marketId === null) throw new Error("Invalid market id");
		if (winningOutcome! < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");
        if (!this.fluxProtocolContract) throw new Error("Not connected");

		return this.account.functionCall(
			this.fluxProtocolContract.contract.contractId,
			"finalize_market",
			{
				market_id: marketId.toString(),
                winning_outcome: winningOutcome,
			},
			MAX_GAS,
			ZERO
        ).catch((err: Error) => {
            throw err
        });
	}

    async claimEarnings(marketId: number, accountId: string, storageCost: BN = STORAGE_DEFAULT): Promise<any> {
		if (!this.fluxProtocolContract) throw new Error("Not connected");

		return this.fluxProtocolContract.claimEarnings(marketId, accountId, storageCost);
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

	async getAvgPricesOnDate(marketId: number, date: string | number): Promise<AveragePrice[]> {
        return getAveragePriceByDate(this.sdkConfig, marketId, date);
	}

    async getOpenOrdersForUserForMarket(marketId: number, accountId: string): Promise<StrippedOrder[]> {
        return getOpenOrdersForMarketByAccount(this.sdkConfig, marketId, accountId);
	}

	async getShareBalanceForUserForMarket(marketId: number, accountId: string): Promise<ShareBalance[]> {
        return getShareBalanceForMarketByAccount(this.sdkConfig, marketId, accountId);
    }

	async getPriceHistory(marketId: number, startDate: number, endDate: number, dateMetrics: Array<string>): Promise<any> {
        return getPriceHistoryByMarket(this.sdkConfig, marketId, startDate, endDate, dateMetrics);
	}

	async getOrderbook(marketId: number): Promise<OpenOrder[]> {
        return getOrderbooksByMarketId(this.sdkConfig, marketId);
	}

	async getAffiliateEarnings(accountId: string): Promise<any> {
        return getAffiliateEarningsByAccount(this.sdkConfig, accountId);
	}

	async getOpenOrders(accountId: string): Promise<Order[]> {
        return getAllOpenOrdersByAccount(this.sdkConfig, accountId);
	}

	async getOrderHistory(accountId: string): Promise<any> {
        return getOrderHistoryByAccount(this.sdkConfig, accountId);
	}

	async getFinalizedParticipatedMarkets(accountId: string): Promise<any> {
        return getFinalizedParticipatedMarketsByAccount(this.sdkConfig, accountId);
	}

	async getResolutionState(filter: any, limit: number, offset: number): Promise<any> {
        return getResolutionState(this.sdkConfig, {
            filter,
            limit,
            offset,
        });
	}

	async getTradeEarnings(marketId: number, accountId: string): Promise<Earnings[]> {
        return getTradeEarningsByAccount(this.sdkConfig, marketId, accountId);
	}
}

export default FluxProvider;
