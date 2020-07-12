const BN = require('bn.js');
const {
    connect,
    WalletConnection,
    Contract,
    keyStores,
    utils
} = require('near-api-js');
const {
    tokenViewMethods,
    tokenChangeMethods
} = require('./../constants');
const helpers = require("./helpers");
const PREPAID_GAS = new BN("1000000000000000");
const ZERO = new BN("0");

class FluxFungible {
    constructor() {
        this.connected = false;
        this.near = null;
        this.contract = null;
        this.walletConnection = null;
        this.account = null;
        this.keyStores = keyStores;
    }

    async connect(contractId, keyStore, accountId) {
        this.near = await connect({...helpers.getConfig(contractId), deps: { keyStore: keyStore ? keyStore : new keyStores.BrowserLocalStorageKeyStore() } });
        if (typeof window !== 'undefined') {
            this.walletConnection = new WalletConnection(this.near, contractId);
            this.account = this.walletConnection.account();
            this.contract = new Contract(this.account, contractId, {
                tokenViewMethods,
                tokenChangeMethods,
                sender: this.walletConnection.getAccountId(),
            });
        } else {
            this.account = await this.near.account(accountId);
            this.contract = new Contract(this.account, contractId, {
                tokenViewMethods,
                tokenChangeMethods,
                sender: accountId,
            });
        }
        this.connected = true;
    }

    signIn() {
        if (!this.near) throw new Error("No connection to NEAR found");
        if (this.walletConnection.getAccountId()) throw new Error(`Already signedin with account: ${this.getAccountId()}`);
        this.walletConnection.requestSignIn(this.contract.contractId, "Flux-protocol");
    }

    signOut() {
        if (!this.near) throw new Error("No connection to NEAR found");
        if (!this.walletConnection.getAccountId()) throw new Error(`No signed in session found`);
        this.walletConnection.signOut();
    }

    async claimFdai() {
        if (!this.account) throw new Error("Need to sign in to perform this method");
        return this.account.functionCall(
            this.contract.contractId,
            "claim_fdai",
            {
                account_id: this.getAccountId(),
            },
            PREPAID_GAS,
            ZERO
        ).catch(err => {
            throw err
        })
    }

    async setAllowance(escrowAccountId, allowance) {
        if (!this.account) throw new Error("Need to sign in to perform this method");
        return this.account.functionCall(
            this.contract.contractId,
            "set_allowance",
            {
                escrow_account_id: escrowAccountId,
                allowance: allowance,
            },
            PREPAID_GAS,
            ZERO
        ).catch(err => {
            throw err
        })
    }

    async getTotalSupply() {
        return this.contract.get_total_supply();
    }

    async getBalance(ownerId) {
        return this.contract.get_balance({owner_id: ownerId})
    }

    async getAllowance(ownerId, escrowAccountId) {
        return this.contract.get_allowance({owner_id: ownerId, escrow_account_id: escrowAccountId});
    }

    getAccountId() {
        return this.walletConnection.getAccountId();
    }
    isSignedIn() {
        return this.walletConnection.isSignedIn();
    }

}

module.exports = FluxFungible;
