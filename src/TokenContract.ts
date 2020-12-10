import BN from "bn.js";
import { Account, Contract } from "near-api-js";
import { MAX_GAS, TOKEN_CHANGE_METHODS, TOKEN_VIEW_METHODS } from "./constants";

class TokenContract {
    contract: Contract;

    constructor(account: Account, contractId: string) {
        this.contract = new Contract(account, contractId, {
            viewMethods: TOKEN_VIEW_METHODS,
            changeMethods: TOKEN_CHANGE_METHODS
        });
    }

    getTotalSupply(): Promise<string> {
        // @ts-ignore
        return this.contract.get_total_supply();
    }

    incAllowance(escrowAccountId: string, amount: string, storageCost: BN): Promise<any> {
        // @ts-ignore
        return this.contract.inc_allowance({
            escrow_account_id: escrowAccountId,
            amount,
        }, MAX_GAS, storageCost);
    }

    getAllowance(ownerId: string, escrowAccountId: string): Promise<string> {
        // @ts-ignore
        return this.contract.get_allowance({
            owner_id: ownerId,
            escrow_account_id: escrowAccountId
        });
    }

    getBalance(ownerId: string): Promise<string> {
        // @ts-ignore
        return this.contract.get_balance({
            owner_id: ownerId
        });
    }
}

export default TokenContract;
