import { AveragePrice } from "./AveragePrice";

export interface PriceHistoryPoint {
    pointKey: string;
    dataPoints: AveragePrice[];
}
