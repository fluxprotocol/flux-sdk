export interface FilledPrice {
    [optionIndex: string]: string;
}

export interface FilledPriceCollection {
    [marketId: string]: FilledPrice;
}
