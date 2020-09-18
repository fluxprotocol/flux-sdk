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
	tokenChangeMethods,
	NULL_CONTRACT
} = require('./../constants');
const helpers = require("./helpers");
const fetch = require("node-fetch");
const PREPAID_GAS = new BN("300000000000000");
const ZERO = new BN("0");

class FluxProvider {
	constructor(network = "testnet", indexNodeUrl = "https://api.flux.market", keyStore = new keyStores.BrowserLocalStorageKeyStore()) {
		this.connected = false;
		this.indexNodeUrl = indexNodeUrl;
		this.network = network;
		this.near = null;
		this.protocolContract = null;
		this.tokenContract = null;
		this.walletConnection = null;
		this.account = null;
		this.keyStore = keyStore;
	}

	async connect(protocolContractId, tokenContractId, near, accountId, customNodeUrl, customWalletUrl) {
		this.near = near || await connect({...helpers.getConfig(this.network, null, customNodeUrl, customWalletUrl), deps: { keyStore: this.keyStore } });

		this.walletConnection = new WalletConnection(this.near, NULL_CONTRACT);

		if (typeof window !== 'undefined') {
			this.account = this.walletConnection.account();
		} else {
			this.account = await this.near.account(accountId);
		}

		this.protocolContract = new Contract(this.account, protocolContractId, {
			viewMethods: protocolViewMethods,
			changeMethods: protocolChangeMethods,
		});
		this.tokenContract = new Contract(this.account, tokenContractId, {
			viewMethods: tokenViewMethods,
			changeMethods: tokenChangeMethods,
		});

		this.connected = true;
	}

	signIn() {
		if (!this.near) throw new Error("No connection to NEAR found");
		if (this.walletConnection.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);
		this.walletConnection.requestSignIn(NULL_CONTRACT, "Flux-protocol");	
	}

	oneClickTxSignIn() {
		if (!this.near) throw new Error("No connection to NEAR found");
		if (this.walletConnection.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);

		this.walletConnection = new WalletConnection(this.near, this.tokenContract.contractId);
		this.walletConnection.requestSignIn(this.protocolContract.contractId, "Flux-protocol");	
	}

	signOut() {
		if (!this.near) throw new Error("No connection to NEAR found");
		if (!this.walletConnection.getAccountId()) throw new Error(`No signed in session found`);
		this.walletConnection.signOut();
	}

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

	createBinaryMarket(description, extraInfo, categories, endTime, marketCreationFee, affiliateFeePercentage = 0, apiSource = "") {
		console.log(description, extraInfo, categories, endTime, marketCreationFee, affiliateFeePercentage, apiSource)
		return this.createMarket(description, extraInfo, "2", [], categories, endTime, marketCreationFee, affiliateFeePercentage, apiSource);
	}

	createCategoricalMarket(description, extraInfo, outcomes, outcomeTags, categories, endTime, marketCreationFee, affiliateFeePercentage = 0, apiSource) {
		if (outcomes < 3) throw new Error("Need more than two outcomes & outcome tags, otherwise create a binary market");
		return this.createMarket(description, extraInfo, outcomes, outcomeTags, categories, endTime, marketCreationFee, affiliateFeePercentage, apiSource);
	}

	async createMarket(description, extraInfo, outcomes, outcomeTags, categories, endTime, marketCreationFee, affiliateFeePercentage = 0, apiSource) {
		if (!this.account.accountId) throw new Error("Need to sign in to perform this method");
		if (affiliateFeePercentage >= 100 || affiliateFeePercentage < 0) throw new Error("Invalid affiliate fee percentage");
		console.log(endTime)
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
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async placeOrder(marketId, outcome, shares, pricePerShare, affiliateAccountId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (pricePerShare < 0 || pricePerShare > 99)  throw new Error("Invalid price, price needs to be between 1 and 99");
		if (pricePerShare < 0 ) throw new Error("Invalid price per share");

		return this.protocolContract.place_order(
			{
				market_id: marketId.toString(),
				outcome: outcome.toString(),
				shares: shares.toString(),
				price: pricePerShare.toString(),
				affiliate_account_id: affiliateAccountId,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		});
	}

	async cancelOrder(marketId, outcome, orderId, price) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (orderId < 0 )  throw new Error("Invalid order id");

		return this.protocolContract.cancel_order(
			{
				market_id: marketId.toString(),
				outcome: outcome.toString(),
				price: price.toString(),
				order_id: orderId.toString(),
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

		return this.protocolContract.resolute_market(
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
		return this.protocolContract.dispute_market(
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

		return this.protocolContract.withdraw_dispute_stake(
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

		return this.protocolContract.claim_earnings(
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
		return this.protocolContract.claim_affiliate_earnings(
			{
				account_id: accountId,
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async setAllowance(escrowAccountId, allowance) {
		console.log("trying to set allowance")
		if (!this.account) throw new Error("Need to sign in to perform this method");
		return this.tokenContract.set_allowance(
			{
				escrow_account_id: escrowAccountId,
				allowance: allowance.toString(),
			}
		).catch(err => {
			throw err
		})
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

	getAccountId() {
		return this.account.accountId;
	}

	// Helper function
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
		return await this.fetchState("user/get_open_orders", {accountId});
	}

	async getOrderHistory(accountId) {
		return await this.fetchState("user/get_order_history", {accountId});
	}

	async getFinalizedParticipatedMarkets(accountId) {
		return await this.fetchState("user/get_finalized_participated_markets", {accountId});
	}

	async getResolutingMarkets() {
		return await this.fetchState("markets/get_resoluting");
	}

	async getResolutionState() {
		return await this.fetchState("markets/get_resolution_state");
	}

	async getTradeEarnings(marketId, accountId) {
		return await this.fetchState("earnings/get_trading_earnings", {marketId, accountId});
	}

	async fetchState(endPoint, args) {
		const res = await fetch(`${this.indexNodeUrl}/${endPoint}`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(args)
		});

		return await res.json()
	}

		// Only for unittests
		async initProtocol(contractId, creator) {
			if (!this.account) throw new Error("Need to sign in to perform this method");
	
			return this.protocolContract.set_fun_token_account_id(
				{
					account_id: contractId,
					creator
				},
			).catch(err => {
				throw err
			})
		}
		async initTokenContract(totalSupply) {
			if (!this.account) throw new Error("Need to sign in to perform this method");
	
			return this.tokenContract.new(
				{
					owner_id: this.getAccountId(),
					total_supply: totalSupply,
				},
			).catch(err => {
				throw err
			})
		}
}

module.exports = FluxProvider;
