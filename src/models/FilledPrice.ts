export interface FilledPrice {
    [optionIndex: string]: string;
}

export interface FilledPriceCollection {
    [marketId: string]: FilledPrice;
}

export interface LastFilledPrice {
    price: number;
    outcome: number;
}
