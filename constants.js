const protocolViewMethods = ["get_all_markets","get_fdai_balance", "get_market","get_liquidity", "get_depth" ,"get_market_price", "get_best_prices" ,"get_owner", "get_claimable", "get_fdai_metrics", "get_active_resolution_window", "get_open_orders_len", "get_filled_orders_len", "get_market_volume", "get_market_sell_depth", "get_outcome_share_balance"];
const protocolChangeMethods = ["set_fun_token_account_id", "create_market", "claim_fdai", "place_order", "claim_earnings", "resolute_market", "dispute_market", "finalize_market", "withdraw_dispute_stake", "set_test", "add_to_creators_funds", "delete_market", "cancel_order", "claim_affiliate_earnings", "dynamic_market_sell"];
const tokenViewMethods = ['get_total_supply', 'get_balance', 'get_allowance'];
const tokenChangeMethods = ['claim_fdai', 'set_allowance', 'new'];

module.exports = {
	protocolViewMethods,
	protocolChangeMethods,
	tokenViewMethods,
	tokenChangeMethods
};
