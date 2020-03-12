const nearlib = require('nearlib');
const BN = require('bn.js');

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
			changeMethods: ["create_market", "claim_fdai" ,"delete_market", "place_order", "claim_earnings", "resolute_market"],
			sender: this.walletConnection.getAccountId(),
		});
	}

	createBinaryMarket(description, extraInfo, endTime) {
		return this.createMarket(description, extraInfo, 2, [], endTime);
	}

	createCategoricalMarket(description, extraInfo, outcomes, outcomeTags, endTime) {
		return this.createMarket(description, extraInfo, outcomes, outcomeTags, endTime);
	}

	async createMarket(description, extraInfo, outcomes, outcomeTags, endTime) {
		// Check if caller is signed in
		if (!this.account.accountId) throw new Error("Need to sign in to perform this method");
		// Check if the endTime provided hasn't already passed
		if (endTime < new Date().getTime()) throw new Error("End time has already passed");
			// This method has to be called through the account object - this is because we want to alter the gas amount attached to this method call
			// For all "change methods" (that cost gas because they alter state) we're using the account object for consistency's sake
			await this.account.functionCall(
				this.contract.contractId, // Contract you want to call
				"create_market", // Method you want to call
				// Params
				{
					description,
					extra_info: extraInfo,
					outcomes,
					outcome_tags: outcomeTags,
					end_time: endTime
				},
				// Gas attached
				new BN("10000000000000"),
				// Near attached (deposit)
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
				market_id,
				outcome,
				spend,
				price_per_share
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

	async getOpenOrders(market_id, outcome) {
		return await this.contract.get_open_orders(market_id, outcome, this.getAccountId());
	}

	async getFilledOrders(market_id, outcome) {
		return await this.contract.get_filled_orders(market_id, outcome, this.getAccountId());
	}

	async getClaimable(market_id) {
		return await this.contract.get_claimable(market_id, this.getAccountId());
	}

	signIn() {
		this.walletConnection.requestSignIn();
	}
	getAccountId() {
		// Get the id of the account that's currently signedIn - will return undefined if not signed in
		return this.walletConnection.getAccountId();
	}

	// TODO: make these methods absolete, only needed for demo purposes
	async claimFDai() {
		return this.contract.claim_fdai();
	}
	async getFDaiBalance() {
		return this.contract.get_fdai_balance();
	}

}

module.exports = FluxProvider;