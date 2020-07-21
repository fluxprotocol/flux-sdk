const fs = require('fs').promises;
const BN = require('bn.js');
const nearApi = require('near-api-js');
const {
	protocolViewMethods,
	protocolChangeMethods,
    tokenViewMethods,
    tokenChangeMethods
} = require('./../constants');

const networkId = 'unittest';
const testAccountName = 'test.near';

const FLUX_WASM_PATH = './tests/flux_protocol.wasm';
const FLUX_FUNGIBLE_WASM_PATH = './tests/fungible_token.wasm';
const BALANCE = new BN('200000000000000000000000000');

async function deployContracts(workingAccount, protocolContractId, tokenContractId) {
    const protocolContract = await deployProtocolContract(workingAccount, protocolContractId)
    const tokenContract = await deployTokenContract(workingAccount, tokenContractId)

    return {
        protocolContract,
        tokenContract
    }
}

async function setUpTestConnection() {
    const keyStore = new nearApi.keyStores.InMemoryKeyStore();
    const config = Object.assign(require('./config')(process.env.NODE_ENV || 'test'), {
        networkId: networkId,
        deps: { keyStore },
    });

    if (config.masterAccount) {
        await keyStore.setKey(networkId, config.masterAccount, nearApi.utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
    }

    return nearApi.connect(config);
}

// Generate some unique string with a given prefix using the alice nonce.
function generateUniqueString(prefix) {
    return prefix + Date.now() + Math.round(Math.random() * 1000);
}

async function createAccount(near) {
    const newAccountName = generateUniqueString('test');
    const newPublicKey = await near.connection.signer.createKey(newAccountName, networkId);
    await near.createAccount(newAccountName, newPublicKey);
    const account = new nearApi.Account(near.connection, newAccountName);
    return account;
}

async function deployTokenContract(workingAccount, contractId) {
    const newPublicKey = await workingAccount.connection.signer.createKey(contractId, networkId);
    const data = [...(await fs.readFile(FLUX_FUNGIBLE_WASM_PATH))];
    await workingAccount.createAndDeployContract(contractId, newPublicKey, data, BALANCE);
    return new nearApi.Contract(workingAccount, contractId, {
        viewMethods: tokenViewMethods,
        changeMethods: tokenChangeMethods
    });
}
async function deployProtocolContract(workingAccount, contractId) {
    const newPublicKey = await workingAccount.connection.signer.createKey(contractId, networkId);
    const data = [...(await fs.readFile(FLUX_WASM_PATH))];
    await workingAccount.createAndDeployContract(contractId, newPublicKey, data, BALANCE);
    return new nearApi.Contract(workingAccount, contractId, {
        viewMethods: protocolViewMethods,
        changeMethods: protocolChangeMethods
    });
}

function sleep(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

async function ensureDir(dirpath) {
    try {
        await fs.mkdir(dirpath, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

function toDai(amt) {
    return amt * 10 ** 18;
}

module.exports = { 
    toDai,
    deployContracts,
    setUpTestConnection, 
    networkId, 
    testAccountName, 
    generateUniqueString, 
    createAccount, 
    sleep, 
    ensureDir 
};
