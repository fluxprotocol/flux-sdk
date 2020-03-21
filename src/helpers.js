function Order(order) {
	this.id = order.id;
	this.outcome = order.outcome;
	this.price = order.price_per_share;
	this.sharesFilled = order.shares_filled;
	this.spend = order.spend;
	this.filled = order.filled;

	this.add = function (sharesFilled, spend, filled) {
		this.sharesFilled += sharesFilled;
		this.spend += spend;
		this.filled += filled;
	}
}
const filterUserOrders = (market, accountId) => {
	const filledOrderPrices = {};
	const openOrders= [];
	const filledOrders= [];
	
	for (const outcome in market.orderbooks) {
		const orderbook = market.orderbooks[outcome];
		if (!filledOrderPrices[outcome]) filledOrderPrices[outcome] = {};
		for (const orderId in orderbook.filled_orders) {
			const order = orderbook.filled_orders[orderId];
			if (order.creator === accountId) {
				if (filledOrderPrices[order.outcome][order.price_per_share] === undefined) {
					filledOrderPrices[order.outcome][order.price_per_share] = filledOrders.length;
					filledOrders.push(new Order(order));
				} else {
					const filledOrderPriceIndex = filledOrderPrices[order.outcome][order.price_per_share];
					filledOrders[filledOrderPriceIndex].add(order.shares_filled, order.spend, order.filled);
				}
			}
		}

		for (const orderId in orderbook.open_orders) {
			const order = orderbook.open_orders[orderId];
			if (order.creator === accountId) {
					openOrders.push(new Order(order));
			}
		}
	}

	return {openOrders, filledOrders};
}
module.exports = {
	filterUserOrders
}