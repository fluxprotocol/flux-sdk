import { Near, WalletConnection } from "near-api-js";

export interface ConnectConfig {
    accountId?: string;
    nearInstance?: Near,
    walletInstance?: WalletConnection,
    customNodeUrl?: string
}
