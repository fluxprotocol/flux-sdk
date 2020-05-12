const viewMethods = ["get_all_markets", "get_markets_by_id" ,"get_fdai_balance", "get_market","get_liquidity", "get_depth" ,"get_market_price", "get_best_prices" ,"get_owner", "get_claimable", "get_open_orders", "get_filled_orders", "get_fdai_metrics", "get_active_resolution_window"];
const changeMethods = ["create_market", "claim_fdai", "place_order", "claim_earnings", "resolute_market", "dispute_market", "finalize_market", "withdraw_dispute_stake", "set_test"];

module.exports = {
	viewMethods,
	changeMethods
}