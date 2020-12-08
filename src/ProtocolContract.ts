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

    getClaimable(marketId: number, accountId: string): Promise<string> {
        // @ts-ignore
        return this.contract.get_claimable({
            market_id: marketId.toString(),
            account_id: accountId
        });
    }

    resolute(marketId: number, winningOutcome: number | null, stake: string): Promise<any> {
        if (marketId < 0) throw new Error("Invalid market id");
        if (winningOutcome! < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");

        // @ts-ignore
        return this.contract.resolute_market(
            {
                market_id: marketId.toString(),
                winning_outcome: winningOutcome === null ? winningOutcome : winningOutcome.toString(),
                stake: stake
            },
            MAX_GAS,
            ZERO
        );
    }

    dispute(marketId: number, winningOutcome: number, stake: string): Promise<any> {
        if (marketId < 0) throw new Error("Invalid market id");
        if (winningOutcome < 0 && winningOutcome !== null) throw new Error("Invalid outcome id");

        // @ts-ignore
        return this.contract.dispute_market(
            {
                market_id: marketId.toString(),
                winning_outcome: winningOutcome.toString(),
                stake: stake
            },
            MAX_GAS,
            ZERO
        );
    }

    withdrawDisputeStake(marketId: number, disputeRound: number, outcome: number): Promise<any> {
        if (marketId < 0) throw new Error("Invalid market id");
        if (disputeRound < 0) throw new Error("Invalid dispute round");
        if (outcome < 0 && outcome !== null) throw new Error("Invalid outcome");

        // @ts-ignore
        return this.contract.withdraw_dispute_stake(
            {
                market_id: marketId.toString(),
                dispute_round: disputeRound.toString(),
                outcome: outcome.toString(),
            },
            MAX_GAS,
            ZERO
        );
    }

    claimEarnings(marketId: number, accountId: string): Promise<any> {
        if (marketId < 0) throw new Error("Invalid market id");

        // @ts-ignore
        return this.contract.claim_earnings(
            {
                market_id: marketId.toString(),
                account_id: accountId
            },
            MAX_GAS,
            ZERO
        );
    }
}

export default ProtocolContract;
