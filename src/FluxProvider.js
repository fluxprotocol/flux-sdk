const nearlib = require('nearlib');
const BN = require('bn.js');

class FluxProvider {
	constructor(account = null) {
		this.connected = false;
		this.near = null;
		this.contract = null;
		this.walletAccount = null;
		this.account = account;
	}

	// Connects to deployed contract, stores in this.contract
	async connect(config, accountId) {
		this.near = await nearlib.connect(config);
		this.walletAccount = new nearlib.WalletAccount(this.near);

		this.contract = await this.near.loadContract(accountId, {
			viewMethods: ["get_all_markets", "get_fdai_balance", "get_market", "get_market_order", "get_owner", "get_earnings", "get_open_orders", "get_filled_orders", "get_fdai_metrics", "get_claimable", "get_market_price"],
			changeMethods: ["create_market", "claim_fdai" ,"delete_market", "place_order", "claim_earnings", "resolute", "cancel_order"],
			sender: this.walletAccount.getAccountId(),
		});
		if (this.walletAccount.isSignedIn()) this.account = await this.near.account(this.walletAccount.getAccountId());
	}

	async createBinaryMarket(description, endTime) {
		// Check if caller is signed in
		if (!this.account) throw new Error("Need to sign in to perform this method");
		// Check if the endTime provided hasn't already passed
		if (endTime < new Date().getTime()) throw new Error("End time has already passed");
			// This method has to be called through the account object - this is because we want to alter the gas amount attached to this method call
			// For all "change methods" (that cost gas because they alter state) we're using the account object for consistency's sake
			await this.account.functionCall(
				this.contract.contractId, // Contract you want to call
				"create_market", // Method you want to call
				// Params
				{
					outcomes: 2,
					description,
					extra_info: "",
					outcome_tags: [],
					end_time: endTime,
				},
				// Gas attached
				new BN("10000000000000"),
				// Near attached (deposit)
				new BN("0")
			).catch(err => {
				throw new Error(err)
			})
	}

	async createCategoricalMarket(description, outcome_tags, endTime) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (outcome_tags.length <=2) throw new Error("Need three or more outcome tags");
		if (endTime < new Date().getTime()) throw new Error("End time has already passed");
		await this.account.functionCall(
			this.contract.contractId,
			"create_market",
			// Params
			{
				outcomes: outcome_tags.length,
				description,
				extra_info: "",
				outcome_tags: outcome_tags,
				end_time: endTime,
			},
			// Gas attached
			new BN("10000000000000"),
			// Near attached (deposit)
			new BN("0")
		).catch(err => {
			throw new Error(err)
		})
	}

	async claimFDai() {
		if (!this.account) throw new Error("Need to sign in to perform this method");

		await this.account.functionCall(
			this.contract.contractId,
			"claim_fdai",
			{},
			new BN("10000000000000"),
			new BN("0")
		).catch(err => {
			throw new Error(err)
		})
	}

	async deleteMarket(market_id) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (market_id < 0) throw new Error("Invalid market id");

		await this.account.functionCall(
			this.contract.contractId,
			"delete_market",
			{
				market_id: market_id,
			},
			new BN("10000000000000"),
			new BN("0")
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
			new BN("10000000000000"),
			new BN("0")
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
			new BN("10000000000000"),
			new BN("0")
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
			new BN("10000000000000"),
			new BN("0")
		).catch(err => {
			throw new Error(err)
		})
	}

	async getAllMarkets() {
		// For this method call we can use the contract object because the method we're calling is a "view method" hence it won't cost gas. 
		// For methods that don't cost gas we don't need the account object
		return await this.contract.get_all_markets();
	}

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
		this.walletAccount.requestSignIn();
	}
	getAccountId() {
		// Get the id of the account that's currently signedIn - will return undefined if not signed in
		return this.walletAccount.getAccountId();
	}

}

module.exports = FluxProvider;