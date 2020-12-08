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

export interface Order extends StrippedOrder {
    affiliate_account_id: string;
    closed: boolean;
    creation_time: number;
    creator: string;
    filled: string;
    market_id: string;
    outcome_tags: string[];
    spend: string;
}
