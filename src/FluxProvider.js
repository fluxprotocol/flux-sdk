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
	
	async connect(config, accountId) {
		this.near = await nearlib.connect(config);
		this.walletAccount = new nearlib.WalletAccount(this.near);

		this.contract = await this.near.loadContract(accountId, {
			viewMethods: ["get_all_markets", "get_fdai_balance", "get_market", "get_market_order", "get_owner", "get_earnings", "get_open_orders", "get_filled_orders", "get_fdai_metrics"],
			changeMethods: ["create_market", "claim_fdai" ,"delete_market", "place_order", "claim_earnings", "resolute_market"],
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

	async getAllMarkets() {
		// For this method call we can use the contract object because the method we're calling is a "view method" hence it won't cost gas. 
		// For methods that don't cost gas we don't need the account object
		return await this.contract.get_all_markets();
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