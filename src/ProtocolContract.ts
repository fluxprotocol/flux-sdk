import { Account, Contract } from "near-api-js";
import { PROTOCOL_CHANGE_METHODS, PROTOCOL_VIEW_METHODS } from "./constants";
import { MAX_GAS, ZERO } from './constants';

class ProtocolContract {
    contract: Contract;

    constructor(account: Account, contractId: string) {
        this.contract = new Contract(account, contractId, {
            viewMethods: PROTOCOL_VIEW_METHODS,
            changeMethods: PROTOCOL_CHANGE_METHODS
        });
    }

    createMarket(
        description: string,
        extraInfo: string,
        outcomes: number,
        outcomeTags: Array<string>,
        categories: Array<string>,
        endTime: number,
        marketCreationFee: number,
        affiliateFeePercentage: number = 0,
        apiSource = "",
    ): Promise<string> {
        if (endTime < new Date().getTime()) throw new Error("End time has already passed");

        // @ts-ignore
        return this.contract.create_market(
            {
                description,
                extra_info: extraInfo,
                outcomes: outcomes.toString(),
                outcome_tags: outcomeTags,
                categories: categories,
                end_time: endTime.toString(),
                creator_fee_percentage: marketCreationFee.toString(),
                affiliate_fee_percentage: affiliateFeePercentage.toString(),
                api_source: apiSource,
            },
            MAX_GAS,
            ZERO
        );
    }

    placeOrder(
        marketId: number,
        outcome: number,
        shares: string,
        price: number
    ): Promise<any> {
        if (marketId < 0) throw new Error("Invalid market id");
        if (outcome < 0) throw new Error("Invalid outcome id");
        if (price < 0 || price > 99) throw new Error("Invalid price, price needs to be between 1 and 99");

        // @ts-ignore
        return this.contract.place_order(
            {
                market_id: marketId.toString(),
                outcome: outcome.toString(),
                shares: shares,
                price: price.toString(),
                affiliate_account_id: null,
            },
            MAX_GAS,
            ZERO
        );
    }

    cancelOrder(
        marketId: number,
        outcome: number,
        orderId: number,
        price: number
    ): Promise<any> {
        if (marketId < 0) throw new Error("Invalid market id");
        if (outcome < 0) throw new Error("Invalid outcome id");
        if (orderId < 0) throw new Error("Invalid order id");
        if (price < 1 || price > 99) throw new Error("Invalid price");

        console.log('Test 1 2 3');

        // @ts-ignore
        return this.contract.cancel_order(
            {
                market_id: marketId.toString(),
                outcome: outcome.toString(),
                price: price.toString(),
                order_id: orderId.toString(),
            },
            MAX_GAS,
            ZERO
        );
    }
}

export default ProtocolContract;
