import { Market } from "./Market";

export interface ResolutionWindow {
    round: number;
    required_bond_size: string;
    end_time: string;
    market: Market;
}
