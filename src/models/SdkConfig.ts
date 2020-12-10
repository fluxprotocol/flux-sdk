import {
    keyStores,
} from "near-api-js";

export interface SdkConfig {
    indexNodeUrl: string;
    protocolContractId: string;
    tokenContractId: string;
    network: string;
    keyStore: keyStores.BrowserLocalStorageKeyStore | keyStores.UnencryptedFileSystemKeyStore | keyStores.InMemoryKeyStore;
}
