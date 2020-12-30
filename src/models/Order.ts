/**
 * Currently the model Order is stripped alot.
 * Maybe we have to return a consistent order object on de back-end side.
 */
export interface OpenOrder {
    depth: string;
    outcome: string;
    price: string;
}

export interface StrippedOrder {
    id: string;
    outcome: string;
    price: string;
    shares: string;
    shares_filled: string;
}

export interface LegacyOrder extends StrippedOrder {
    affiliate_account_id: string;
    closed: boolean;
    creation_time: number;
    creator: string;
    filled: string;
    market_id: string;
    outcome_tags: string[];
    spend: string;
}

export interface Order {
    id: string
    order_id: string
    market_id: string
    creator: string
    outcome: number
    spend: string
    shares: string
    fill_price: number
    price: number
    filled: string
    shares_filling: string
    shares_filled: string
    affiliate_account_id: string
    block_height: string
    closed: boolean
    cap_creation_date: string
}
