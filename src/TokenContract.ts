import { Account, Contract } from "near-api-js";
import { TOKEN_CHANGE_METHODS, TOKEN_VIEW_METHODS } from "./constants";

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

    setAllowance(escrowAccountId: string, allowance: string): Promise<any> {
        // @ts-ignore
        return this.contract.set_allowance({
            escrow_account_id: escrowAccountId,
            allowance: allowance.toString(),
        });
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
