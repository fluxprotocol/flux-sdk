import nearlib from 'nearlib';
import BN from 'bn.js';
import getConfig from './../tests/config';

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
	async connect(environment, contractId) {
		this.near = await nearlib.connect(getConfig(environment));
		this.walletConnection = new nearlib.WalletConnection(this.near, contractId);
		this.account = this.walletConnection.account();
		this.contract = new nearlib.Contract(this.account, contractId, {
			viewMethods: ["get_all_markets", "get_fdai_balance", "get_market", "get_market_price", "get_owner", "get_claimable", "get_open_orders", "get_filled_orders", "get_fdai_metrics"],
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

		return this.account.functionCall(
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

		return this.account.functionCall(
			this.contract.contractId,
			"claim_fdai",
			{},
			PREPAID_GAS_BASE,
			ZERO
		).catch(err => {
			throw new Error(err)
		})
	}

	async placeOrder(marketId, outcome, spend, pricePerShare) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (spend < 0 )  throw new Error("Invalid spend");
		if (pricePerShare < 0 ) throw new Error("Invalid price per share");

		return this.account.functionCall(
			this.contract.contractId,
			"place_order",
			{
				market_id: marketId,
				outcome: outcome,
				spend: spend,
				price_per_share: pricePerShare,
			},
			PREPAID_GAS_BASE,
			ZERO
		).catch(err => {
			throw new Error(err)
		});
	}

	async cancelOrder(marketId, outcome, orderId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (outcome < 0) throw new Error("Invalid outcome id");
		if (orderId < 0 )  throw new Error("Invalid order id");

		return this.account.functionCall(
			this.contract.contractId,
			"cancel_order",
			{
				market_id: marketId,
				outcome: outcome,
				order_id: orderId,
			},
			PREPAID_GAS_BASE,
			ZERO
		).catch(err => {
			throw new Error(err)
		});
	}

	async resolute(marketId, winningOutcome) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Invalid market id");
		if (winningOutcome < 0) throw new Error("Invalid outcome id");

		return this.account.functionCall(
			this.contract.contractId,
			"resolute",
			{
				market_id: marketId,
				winning_outcome: winningOutcome,
			},
			PREPAID_GAS_BASE,
			ZERO
		).catch(err => {
			throw new Error(err)
		})
	}

	async getAllMarkets() {
		return this.contract.get_all_markets();
	}

	// TODO: make absolete, just here for demo purposes
	async getFDaiBalance() {
		return this.contract.get_fdai_balance({
			from: this.getAccountId()
		});
	}

	async getOpenOrders(marketId, outcome) {
		return this.contract.get_open_orders({
			market_id: marketId,
			outcome: outcome,
			from: this.getAccountId()
		});
	}

	async getFilledOrders(marketId, outcome) {
		return this.contract.get_filled_orders({
			market_id: marketId,
			outcome: outcome,
			from: this.getAccountId()
		});
	}

	async getClaimable(marketId) {
		return this.contract.get_claimable({
			market_id: marketId,
			from: this.getAccountId()
		});
	}

	async getMarketPrice(marketId, outcome) {
		return this.contract.get_market_price({
			market_id: marketId,
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