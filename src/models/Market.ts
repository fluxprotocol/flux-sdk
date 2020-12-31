interface LastFilledPrice {
    outcome: number;
    price: number;
}

export interface Market {
    id: string;
    creator: string;
    description: string;
    extra_info: string;
    outcomes: number
    outcomes_tags: string[];
    categories: string[];
    end_time: string;
    creator_fee_percentage: number
    resolution_fee_percentage: number
    affiliate_fee_percentage: number
    api_source: string
    cap_creation_date: string
    volume: string
    orderbooks?: any[];
    prices?: any[];
    lastFilledPrices: LastFilledPrice[];
    state: any[];
}
