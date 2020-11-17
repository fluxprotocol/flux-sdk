import fs from 'fs';
import BN from 'bn.js';

import { 
    keyStores, 
    connect, 
    utils, 
    Account, 
    Contract,
    Near
} from 'near-api-js';

import { 
    PROTOCOL_CHANGE_METHODS, 
    PROTOCOL_VIEW_METHODS, 
    TOKEN_CHANGE_METHODS, 
    TOKEN_VIEW_METHODS
} from '../constants';
import getConfig from './config';

const networkId = 'unittest';
const testAccountName = 'test.near';

const FLUX_WASM_PATH = './src/tests/flux_protocol.wasm';
const FLUX_FUNGIBLE_WASM_PATH = './src/tests/fungible_token.wasm';
const BALANCE = new BN('200000000000000000000000000');

export function generateUniqueString(prefix: string) {
    return prefix + Date.now() + Math.round(Math.random() * 1000);
}

export async function createAccount(near: Near): Promise<Account> {
    const newAccountName = generateUniqueString('test');
    const newPublicKey = await near.connection.signer.createKey(newAccountName, networkId);
    await near.createAccount(newAccountName, newPublicKey);
    const account = new Account(near.connection, newAccountName);
    return account;
}

export async function deployContracts(workingAccount: Account, protocolContractId: string, tokenContractId: string): Promise<any> {
    const protocolContract = await deployProtocolContract(workingAccount, protocolContractId, tokenContractId)
    const tokenContract = await deployTokenContract(workingAccount, tokenContractId)

    return {
        protocolContract,
        tokenContract
    }
}

export async function setUpTestConnection() {
    const keyStore = new keyStores.InMemoryKeyStore();
    const config = Object.assign(getConfig(process.env.NODE_ENV || 'test'), {
        networkId: networkId,
        deps: { keyStore },
    });

    if (config.masterAccount) {
        await keyStore.setKey(networkId, config.masterAccount, utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
    }

    return connect(config);
}


export function toDai(amt: number): number {
    return amt * 10 ** 18
}

async function deployTokenContract(workingAccount: Account, contractId: string): Promise<Contract> {
    const newPublicKey = await workingAccount.connection.signer.createKey(contractId, networkId);
    const data = await fs.promises.readFile(FLUX_FUNGIBLE_WASM_PATH);

    await workingAccount.createAndDeployContract(contractId, newPublicKey, data, BALANCE);

    const contract: any = new Contract(workingAccount, contractId, {
        viewMethods: TOKEN_VIEW_METHODS,
        changeMethods: TOKEN_CHANGE_METHODS
    });

    await contract.new(
        {owner_id: workingAccount.accountId, total_supply: "10000000000000000000000000000000000000"},
        new BN("300000000000000"),
        new BN('0')
    )

    return contract;
}

async function deployProtocolContract(workingAccount: Account, contractId: string, tokenContractId: string): Promise<Contract> {
    const newPublicKey = await workingAccount.connection.signer.createKey(contractId, networkId);
    const data = await fs.promises.readFile(FLUX_WASM_PATH);
    await workingAccount.createAndDeployContract(contractId, newPublicKey, data, BALANCE);
    
    const contract: any =  new Contract(workingAccount, contractId, {
        viewMethods: PROTOCOL_VIEW_METHODS,
        changeMethods: PROTOCOL_CHANGE_METHODS
    });

    await contract.init(
        {owner: workingAccount.accountId, fun_token_account_id: tokenContractId},
        new BN("300000000000000"),
        new BN('0')
    )

    return contract
}
