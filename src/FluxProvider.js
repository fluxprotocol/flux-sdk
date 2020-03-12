const nearlib = require('nearlib');
const BN = require('bn.js');

const PREPAID_GAS_BASE = new BN("10000000000000000000");
const ZERO = new BN("0");

class FluxProvider {
	constructor() {
		this.near = null;
		this.contract = null;
		this.walletConnection = null;
		this.account = null;
	}

	// Connects to deployed contract, stores in this.contract
	async connect(config, contractId) {
		this.near = await nearlib.connect(config);
		this.walletConnection = new nearlib.WalletConnection(this.near, contractId);
		this.account = this.walletConnection.account();
		this.contract = new nearlib.Contract(this.account, contractId, {
			viewMethods: ["get_all_markets", "get_fdai_balance", "get_market", "get_market_order", "get_owner", "get_claimable", "get_open_orders", "get_filled_orders", "get_fdai_metrics"],
			changeMethods: ["create_market", "claim_fdai", "place_order", "claim_earnings", "resolute_market"],
			sender: this.walletConnection.getAccountId(),
		});
	}

	createBinaryMarket(description, extraInfo, endTime) {
		return this.createMarket(description, extraInfo, 2, [], endTime);
	}

	createCategoricalMarket(description, extraInfo, outcomes, outcomeTags, endTime) {
		if (outcomes < 3) throw new Error("Need more than two outcomes & outcome tags, otherwise create a binary market");
		return this.createMarket(description, extraInfo, outcomes, outcomeTags, endTime);
	}

	async createMarket(description, extraInfo, outcomes, outcomeTags, endTime) {
		if (!this.account.accountId) throw new Error("Need to sign in to perform this method");
		if (endTime < new Date().getTime()) throw new Error("End time has already passed");

		await this.account.functionCall(
			this.contract.contractId, // Target contract
			"create_market", // Method call
			{
				description,
				extra_info: extraInfo,
				outcomes,
				outcome_tags: outcomeTags,
				end_time: endTime
			},
			PREPAID_GAS_BASE, // Prepaid gas
			ZERO // NEAR deposit
		).catch(err => {
			throw new Error(err)
		})
	}

	// TODO: make absolete, just here for demo purposes
	async claimFDai() {
		if (!this.account) throw new Error("Need to sign in to perform this method");

		await this.account.functionCall(
			this.contract.contractId,
			"claim_fdai",
			{},
			PREPAID_GAS_BASE,
			ZERO
		).catch(err => {
			throw new Error(err)
		})
	}

	async placeOrder(market_id, outcome, spend, price_per_share) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (market_id < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (spend < 0 )  throw new Error("Invalid spend");
		if (price_per_share < 0 ) throw new Error("Invalid price per share");

		await this.account.functionCall(
			this.contract.contractId,
			"place_order",
			{
				market_id: market_id,
				outcome: outcome,
				spend: spend,
				price_per_share: price_per_share,
			},
			PREPAID_GAS_BASE,
			ZERO
		).catch(err => {
			throw new Error(err)
		});
	}

	async cancelOrder(market_id, outcome, order_id) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (market_id < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (order_id < 0 )  throw new Error("Invalid order id");

		await this.account.functionCall(
			this.contract.contractId,
			"cancel_order",
			{
				market_id: market_id,
				outcome: outcome,
				order_id: order_id,
			},
			PREPAID_GAS_BASE,
			ZERO
		).catch(err => {
			throw new Error(err)
		});
	}

	async resolute(market_id, winning_outcome) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (market_id < 0) throw new Error("Invalid market id");
		if (winning_outcome < 0) throw new Error("Invalid outcome id");

		await this.account.functionCall(
			this.contract.contractId,
			"resolute",
			{
				market_id: market_id,
				winning_outcome: winning_outcome,
			},
			PREPAID_GAS_BASE,
			ZERO
		).catch(err => {
			throw new Error(err)
		})
	}

	async getAllMarkets() {
		return await this.contract.get_all_markets();
	}

	// TODO: make absolete, just here for demo purposes
	async getFDaiBalance() {
		return await this.contract.get_fdai_balance({
			from: this.getAccountId()
		});
	}

	async getOpenOrders(market_id, outcome) {
		return await this.contract.get_open_orders({
			market_id: market_id,
			outcome: outcome,
			from: this.getAccountId()
		});
	}

	async getFilledOrders(market_id, outcome) {
		return await this.contract.get_filled_orders({
			market_id: market_id,
			outcome: outcome,
			from: this.getAccountId()
		});
	}

	async getClaimable(market_id) {
		return await this.contract.get_claimable({
			market_id: market_id,
			from: this.getAccountId()
		});
	}

	async getMarketOrder(market_id, outcome) {
		return await this.contract.get_market_order({
			market_id: market_id,
			outcome: outcome,
		});
	}

	async getMarketPrice(market_id, outcome) {
		return await this.contract.get_market_price({
			market_id: market_id,
			outcome: outcome,
		});
	}

	signIn() {
		this.walletConnection.requestSignIn();
	}
	getAccountId() {
		return this.walletConnection.getAccountId();
	}

}

module.exports = FluxProvider;