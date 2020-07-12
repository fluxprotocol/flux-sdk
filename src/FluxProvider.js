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
	protocolChangeMethods
} = require('./../constants');
const helpers = require("./helpers");
const PREPAID_GAS = new BN("1000000000000000");
const ZERO = new BN("0");

class FluxProvider {
	constructor() {
		this.connected = false;
		this.near = null;
		this.contract = null;
		this.walletConnection = null;
		this.account = null;
		this.keyStores = keyStores;
	}

	async connect(contractId, keyStore, accountId) {
		this.near = await connect({...helpers.getConfig(contractId), deps: { keyStore: keyStore ? keyStore : new keyStores.BrowserLocalStorageKeyStore() } });
		if (typeof window !== 'undefined') {
			this.walletConnection = new WalletConnection(this.near, contractId);
			this.account = this.walletConnection.account();
			this.contract = new Contract(this.account, contractId, {
				protocolViewMethods,
				protocolChangeMethods,
				sender: this.walletConnection.getAccountId(),
			});
		} else {
			this.account = await this.near.account(accountId);
			this.contract = new Contract(this.account, contractId, {
				protocolViewMethods,
				protocolChangeMethods,
				sender: accountId,
			});
		}
		this.connected = true;
	}

	signIn() {
		if (!this.near) throw new Error("No connection to NEAR found")
		if (this.walletConnection.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);
		this.walletConnection.requestSignIn(this.contract.contractId, "Flux-protocol");
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
			this.contract.contractId,
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
			this.contract.contractId, // Target contract
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

	// TODO: make absolete, just here for demo purposes
	async claimFDai() {
		if (!this.account) throw new Error("Need to sign in to perform this method");

		return this.account.functionCall(
			this.contract.contractId,
			"claim_fdai",
			{},
			PREPAID_GAS * 3,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async deleteMarket(marketId) {
		if (!this.account) throw new Error("Need to sign in to perform this method");
		if (marketId < 0) throw new Error("Market id must be >= 0");
		return this.account.functionCall(
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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
			this.contract.contractId,
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

	async setTest() {
		return this.account.functionCall(
			this.contract.contractId,
			"set_test",
			{
			},
			PREPAID_GAS,
			ZERO
		).catch(err => {
			throw err
		})
	}

	async getAllMarkets() {
		// const provider = this.account.connection.provider;
		// const res = await provider.sendJsonRpc('query', {"request_type": "view_state", "finality": "final", "account_id": this.contract.contractId, "prefix_base64": ""})
		// const state = res.values[0].value;

		return this.contract.get_all_markets();
	}

	async getMarketsById(ids) {
		return this.contract.get_markets_by_id({market_ids: ids})
	}

	async getMarket(id) {
		return this.contract.get_market({id});
	}

	async getMarketVolume(marketId) {
		return this.contract.get_market_volume({
			market_id: marketId,
		});
	}

	async getMarketSellDepth(marketId, outcome, shares) {
		return this.contract.get_market_sell_depth({
			market_id: marketId,
			outcome,
			shares
		});
	}

	async getFDaiBalance() {
		return this.contract.get_fdai_balance({
			account_id: this.getAccountId()
		});
	}

	async getFDaiMetrics() {
		return this.contract.get_fdai_metrics();
	}

	async getLiquidity(marketId, outcome, price) {
		return this.contract.get_liquidity({"market_id": marketId, outcome, price})
	}

	async getOutcomeShareBalance(marketId, outcome) {
		return this.contract.get_outcome_share_balance({
			account_id: this.getAccountId(),
			market_id: marketId,
			outcome
		});
	}

	async getDepth(marketId, outcome, price, spend) {
		return this.contract.get_depth({
			market_id: marketId,
			outcome,
			spend,
			price
		})
	}

	async getOwner() {
		return this.contract.get_owner();
	}

	async getOpenOrdersLen(marketId, outcome) {
		return this.contract.get_open_orders_len({
			market_id: marketId,
			outcome: outcome
		});
	}

	async getFilledOrdersLen(marketId, outcome) {
		return this.contract.get_filled_orders_len({
			market_id: marketId,
			outcome: outcome
		});
	}

	async getClaimable(marketId, accountId = this.getAccountId()) {
		return this.contract.get_claimable({
			market_id: marketId,
			account_id: accountId
		});
	}

	async getMarketPrice(marketId, outcome) {
		return this.contract.get_market_price({
			market_id: marketId,
			outcome: outcome,
		});
	}

	async getActiveResolutionWindow(marketId){
		return this.contract.get_active_resolution_window({
			market_id: marketId
		});
	}

	getAccountId() {
		return this.walletConnection.getAccountId();
	}
	isSignedIn() {
		return this.walletConnection.isSignedIn();
	}

	// Helper functions
	formatMarkets(marketsObj) {
		const formattedMarkets = Object.keys(marketsObj).map(key => {
			let market = marketsObj[key];
			market.getMarketPrices = () => this.contract.get_best_prices({market_id: market.id});
			market.getOrderbooks = async () => {
				const updatedMarkets = await this.getMarketsById([market.id]);
				return updatedMarkets[market.id.toString()].orderbooks;
			};
			return market;
		});

		formattedMarkets.sort((a, b) => b.liquidity - a.liquidity);

		return formattedMarkets
	}

	filterUserOrders(orders, creator) {
		return helpers.filterUserOrders(orders, creator);
	}

}

module.exports = FluxProvider;
