const BN = require('bn.js');
const {
	connect,
	WalletConnection,
	Contract,
	keyStores,
	utils
} = require('near-api-js');
const {
	protocolViewMethods,
	protocolChangeMethods,
	tokenViewMethods,
	tokenChangeMethods
} = require('./../constants');
const helpers = require("./helpers");
const fetch = require("node-fetch");
const PREPAID_GAS = new BN("1000000000000000");
const ZERO = new BN("0");

class FluxProvider {
	constructor(network = "testnet", indexNodeUrl = "http://localhost:3001", keyStore = new keyStores.BrowserLocalStorageKeyStore()) {
		this.connected = false;
		this.indexNodeUrl = indexNodeUrl;
		this.network = network;
		this.near = null;
		this.protocolContract = null;
		this.tokenContract = null;
		this.protocolWalletConnection = null;
		this.tokenWalletConnection = null;
		this.account = null;
		this.keyStore = keyStore;
	}

	getConfig(networkName, contractId, walletUrl, nodeUrl) {
		let network;
		switch(networkName) {
			case "mainnet":
				network =  {
					networkId: 'mainnet',
					nodeUrl: 'https://rpcnear.org',
					contractName: contractId,
					walletUrl: 'https://wallet.near.org',
					initialBalance: 100000000
				};
				break;
			case "custom":
				network = {
					networkId: 'custom',
					nodeUrl,
					contractName: contractId,
					walletUrl,
					initialBalance: 100000000
				};
			default :
				network =  {
					networkId: 'testnet',
					nodeUrl: 'https://rpc.testnet.near.org',
					contractName: contractId,
					walletUrl: 'https://wallet.testnet.near.org',
					initialBalance: 100000000
				};
		}
		return network;
	};

	async connect(protocolContractId, tokenContractId, accountId, customNodeUrl, customWalletUrl) {
		this.near = await connect({...helpers.getConfig(this.network, contractId, customNodeUrl, customWalletUrl), deps: this.keyStore });

		if (typeof window !== 'undefined') {
			this.protocolWalletConnection = new WalletConnection(this.near, protocolContractId);
			this.tokenWalletConnection = new WalletConnection(this.near, tokenContractId);
			this.account = this.protocolWalletConnection.account();
			this.protocolContract = new Contract(this.account, protocolContractId, {
				protocolViewMethods,
				protocolChangeMethods,
				sender: this.protocolWalletConnection.getAccountId(),
			});
			this.tokenContract = new Contract(this.account, tokenContractId, {
				tokenViewMethods,
				tokenChangeMethods,
				sender: this.tokenWalletConnection.getAccountId(),
			});
		} else {
			this.account = await this.near.account(accountId);
			this.protocolContract = new Contract(this.account, protocolContractId, {
				protocolViewMethods,
				protocolChangeMethods,
				sender: this.protocolWalletConnection.getAccountId(),
			});
			this.tokenContract = new Contract(this.account, tokenContractId, {
				tokenViewMethods,
				tokenChangeMethods,
				sender: this.tokenWalletConnection.getAccountId(),
			});
		}
		this.connected = true;
	}

	signInProtocol() {
		if (!this.near) throw new Error("No connection to NEAR found");
		if (this.protocolWalletConnection.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);
		this.protocolWalletConnection.requestSignIn(this.protocolContract.contractId, "Flux-protocol");
	}

	signOutProtocol() {
		if (!this.near) throw new Error("No connection to NEAR found");
		if (!this.protocolWalletConnection.getAccountId()) throw new Error(`No signed in session found`);
		this.protocolWalletConnection.signOut();
	}

	signInToken() {
		if (!this.near) throw new Error("No connection to NEAR found");
		if (this.tokenWalletConnection.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);
		this.tokenWalletConnection.requestSignIn(this.tokenContract.contractId, "Flux-protocol");
	}

	signOutToken() {
		if (!this.near) throw new Error("No connection to NEAR found");
		if (!this.tokenWalletConnection.getAccountId()) throw new Error(`No signed in session found`);
		this.tokenWalletConnection.signOut();
	}

	// Protocol Change Methods

	async addToCreatorsFunds(amount) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (amount < 0) throw new Error("Amount id must be >= 0");
		return this.account.functionCall(
			this.protocolContract.contractId,
			"add_to_creators_funds",
			{
				amount,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	createBinaryMarket(description, extraInfo, categories, endTime, marketCreationFee, affiliateFeePercentage, apiSource) {
		return this.createMarket(description, extraInfo, "2", [], categories, endTime, marketCreationFee, affiliateFeePercentage, apiSource);
	}

	createCategoricalMarket(description, extraInfo, outcomes, outcomeTags, categories, endTime, marketCreationFee, affiliateFeePercentage, apiSource) {
		if (outcomes < 3) throw new Error("Need more than two outcomes & outcome tags, otherwise create a binary market");
		return this.createMarket(description, extraInfo, outcomes, outcomeTags, categories, endTime, marketCreationFee, affiliateFeePercentage, apiSource);
	}

	async createMarket(description, extraInfo, outcomes, outcomeTags, categories, endTime, marketCreationFee, affiliateFeePercentage, apiSource) {
		if (!this.account.accountId) throw new Error("Need to sign in to perform this method");
		if (affiliateFeePercentage >= 100 || affiliateFeePercentage < 0) throw new Error("Invalid affiliate fee percentage");
		if (endTime < new Date().getTime()) throw new Error("End time has already passed");
		return this.account.functionCall(
			this.protocolContract.contractId, // Target contract
			"create_market", // Method call
			{
				description,
				extra_info: extraInfo,
				outcomes,
				outcome_tags: outcomeTags,
				categories: categories,
				end_time: endTime,
				creator_fee_percentage: marketCreationFee,
				affiliate_fee_percentage: affiliateFeePercentage,
				api_source: ""
			},
			PREPAID_GAS, // Prepaid gas
			ZERO // NEAR deposit
		).catch(err => {
			throw err
		})
	}

	//// TODO: make absolete, just here for demo purposes
	//async claimFDai() {
	//	if (!this.account) throw new Error("Need to sign in to perform this method");
	       //
	//	return this.account.functionCall(
	//		this.protocolContract.contractId,
	//		"claim_fdai",
	//		{},
	//		PREPAID_GAS * 3,
	//		ZERO
	//	).catch(err => {
	//		throw err
	//	})
	//}

	async deleteMarket(marketId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Market id must be >= 0");
		return this.account.functionCall(
			this.protocolContract.contractId,
			"delete_market",
			{
				market_id: marketId,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async placeOrder(marketId, outcome, spend, pricePerShare, affiliateAccountId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (pricePerShare < 0 || pricePerShare > 99)  throw new Error("Invalid price, price needs to be between 1 and 99");
		if (pricePerShare < 0 ) throw new Error("Invalid price per share");

		return this.account.functionCall(
			this.protocolContract.contractId,
			"place_order",
			{
				market_id: marketId,
				outcome: outcome,
				spend: spend,
				price: pricePerShare,
				affiliate_account_id: affiliateAccountId,
			},
			PREPAID_GAS * 3,
			ZERO
		).catch(err => {
			throw err
		});
	}

	async cancelOrder(marketId, outcome, orderId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (orderId < 0 )  throw new Error("Invalid order id");

		return this.account.functionCall(
			this.protocolContract.contractId,
			"cancel_order",
			{
				market_id: marketId,
				outcome: outcome,
				order_id: orderId,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		});
	}

	async dynamicMarketSell(marketId, outcome, shares) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Market id must be >= 0");
		if (outcome < 0) throw new Error("Outcome must be >= 0");
		if (shares < 0) throw new Error("Shares must be >= 0");
		return this.account.functionCall(
			this.protocolContract.contractId,
			"dynamic_market_sell",
			{
				market_id: marketId,
				outcome,
				shares,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async resolute(marketId, winningOutcome, stake) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (winningOutcome < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");

		return this.account.functionCall(
			this.protocolContract.contractId,
			"resolute_market",
			{
				market_id: marketId,
				winning_outcome: winningOutcome,
				stake: stake
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async dispute(marketId, winningOutcome, stake) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (winningOutcome < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");
		return this.account.functionCall(
			this.protocolContract.contractId,
			"dispute_market",
			{
				market_id: marketId,
				winning_outcome: winningOutcome,
				stake: stake
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async withdrawDisputeStake(marketId, disputeRound, outcome) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (disputeRound < 0) throw new Error("Invalid dispute round");
		if (outcome < 0 && outcome !== null) throw new Error("Invalid outcome");

		return this.account.functionCall(
			this.protocolContract.contractId,
			"withdraw_dispute_stake",
			{
				market_id: marketId,
				dispute_round: disputeRound,
				outcome: outcome,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async finalize(marketId, winningOutcome) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0 || marketId === null) throw new Error("Invalid market id");
		if (winningOutcome < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");

		return this.account.functionCall(
			this.protocolContract.contractId,
			"finalize_market",
			{
				market_id: marketId,
				winning_outcome: winningOutcome
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async claimEarnings(marketId, accountId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");

		return this.account.functionCall(
			this.protocolContract.contractId,
			"claim_earnings",
			{
				market_id: marketId,
				account_id: accountId
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async claimAffiliateEarnings(accountId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		return this.account.functionCall(
			this.protocolContract.contractId,
			"claim_affiliate_earnings",
			{
				account_id: accountId,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async claimCreatorFee(marketId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		return this.account.functionCall(
			this.protocolContract.contractId,
			"claim_creator_fee",
			{
				market_id: marketId,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	// Token Change methods
	async claimFDai() {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		return this.account.functionCall(
			this.tokenContract.contractId,
			"claim_fdai",
			{
				account_id: this.getAccountId(),
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async setAllowance(escrowAccountId, allowance) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		return this.account.functionCall(
			this.tokenContract.contractId,
			"set_allowance",
			{
				escrow_account_id: escrowAccountId,
				allowance: allowance,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	// Protocol View Methods
	async getFDaiBalance() {
		return this.contract.get_fdai_balance({
			account_id: this.getAccountId()
		});
	}

	// TODO: Maybe modify fungible token contract to also get owner?
	async getOwner() {
		return this.protocolContract.get_owner();
	}

	async getClaimable(marketId, accountId = this.getAccountId()) {
		return this.protocolContract.get_claimable({
			market_id: marketId,
			account_id: accountId
		});
	}

	// Token View Methods

	async getTotalSupply() {
		return this.tokenContract.get_total_supply();
	}

	async getBalance(ownerId) {
		return this.tokenContract.get_balance({owner_id: ownerId})
	}

	async getAllowance(ownerId, escrowAccountId) {
		return this.tokenContract.get_allowance({owner_id: ownerId, escrow_account_id: escrowAccountId});
	}

	// General View Methods

	getAccountId() {
		return this.protocolWalletConnection.getAccountId();
	}

	isSignedInProtocol() {
		return this.protocolWalletConnection.isSignedIn();
	}

	isSignedInToken() {
		return this.tokenWalletConnection.isSignedIn();
	}

	// Helper functions
	isSignedIn() {
		return this.walletConnection.isSignedIn();
	}

	async getMarkets(filter, limit, offset) {
		return await this.fetchState("markets/get", {filter, limit, offset});
	}

	async getLastFilledPrices(filter, limit, offset) {
		return await this.fetchState("markets/last_filled_prices", {filter, limit, offset});
	}

	async getMarket(marketId) {
		return await this.fetchState("market/get", {marketId});
	}

	async getLastFilledPricesForMarket(marketId) {
		return await this.fetchState("market/last_filled_prices", {marketId});
	}

	async getMarketPrices(marketId) {
		return await this.fetchState("market/market_prices", {marketId});
	}

	async getAvgPricesOnDate(marketId, date) {
		return await this.fetchState("market/get_avg_prices_for_date", {marketId, date});
	}

	async getOpenOrdersForUserForMarket(marketId, accountId) {
		return await this.fetchState("market/get_open_orders_for_user", {marketId, accountId});
	}

	async getShareBalanceForUserForMarket(marketId, accountId) {
		return await this.fetchState("market/get_share_balances_for_user", {marketId, accountId});
	}

	async getPriceHistory(marketId, startDate, endDate, dateMetrics) {
		return await this.fetchState("history/get_avg_price_per_date_metric", {marketId, startDate, endDate, dateMetrics});
	}

	async getOrderbook(marketId) {
		return await this.fetchState("orderbook/get", {marketId});
	}

	async getAffiliateEarnings(accountId) {
		return await this.fetchState("user/get_affiliate_earnings", {accountId});
	}

	async getOpenOrders(accountId) {
		return await this.fetchState("user/get_order_history", {accountId});
	}

	async getOrderHistory(accountId) {
		return await this.fetchState("user/get_open_orders", {accountId});
	}

	async fetchState(endPoint, args) {
		const res = await fetch(`${this.indexNodeUrl}/${endPoint}`, {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(args)
		});
	}
}

module.exports = FluxProvider;
