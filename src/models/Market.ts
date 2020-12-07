export interface Market {
    volume: string;
    id: string;
    description: string;
    extra_info: string;
    creator: string;
    creation_date: string;
    end_date_time: string;
    outcomes: number;
    outcome_tags: Array<string>,
    categories: Array<string>,
    winning_outcome: number | null;
    resoluted: boolean;
    resolute_bond: string;
    filled_volume: string;
    disputed: boolean;
    finalized: boolean;
    creator_fee_percentage: number;
    resolution_fee_percentage: number;
    affiliate_fee_percentage: number;
    api_source: string;
    validity_bond_claimed: boolean;
    creation_timestamp: number;
    end_timestamp: number;
}

export interface MarketApiParams {
    description: string;
    extra_info: string;
    outcomes: string;
    outcome_tags: string[];
    categories: string[];
    end_time: string;
    creator_fee_percentage: string;
    affiliate_fee_percentage: string;
    api_source: string;
}
