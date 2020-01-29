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

	async createBinaryMarket(description, end_time) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (end_time < new Date().getTime()) throw new Error("End time has already passed");
		try {
			await this.account.functionCall(
				this.contract.contractId,
				"create_market",
				{
					outcomes: 2,
					description,
					end_time,
				},
				new BN("10000000000000"),
				new BN("0")
			)
		} catch(err) {
			throw new Error(err);
		}
	}

	async getAllMarkets() {
		return await this.contract.get_all_markets();
	}

	signIn() {
		this.walletAccount.requestSignIn();
	}
	getAccountId() {
		return this.walletAccount.getAccountId();
	}

}

module.exports = FluxProvider;