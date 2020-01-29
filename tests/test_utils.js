const fs = require('fs').promises;
const BN = require('bn.js');

const nearlib = require('nearlib');

const networkId = 'unittest';
const testAccountName = 'test.near';

const INITIAL_BALANCE = new BN(100000000000);
const HELLO_WASM_PATH = './tests/flux_protocol.wasm';

async function setUpTestConnection() {
    const keyStore = new nearlib.keyStores.InMemoryKeyStore();
    await keyStore.setKey(networkId, testAccountName, nearlib.utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
    const config = Object.assign(require('./config')('test'), {
        networkId: networkId,
        deps: { keyStore },
    });

    return nearlib.connect(config);
}

// Generate some unique string with a given prefix using the alice nonce.
function generateUniqueString(prefix) {
    return prefix + Date.now() + Math.round(Math.random() * 1000);
}

async function createAccount(masterAccount, options = { amount: INITIAL_BALANCE, trials: 5, name: generateUniqueString('test') }) {
    await masterAccount.fetchState();

    const newPublicKey = await masterAccount.connection.signer.createKey(options.name, networkId);
    await masterAccount.createAccount(options.name, newPublicKey, options.amount);
    return new nearlib.Account(masterAccount.connection, options.name);
}

async function deployContract(workingAccount, contractId, options = { amount: new BN(10000000) }) {
    const newPublicKey = await workingAccount.connection.signer.createKey(contractId, networkId);
    const data = [...(await fs.readFile(HELLO_WASM_PATH))];
    await workingAccount.createAndDeployContract(contractId, newPublicKey, data, options.amount);
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

module.exports = { setUpTestConnection, networkId, testAccountName, INITIAL_BALANCE,
    generateUniqueString, createAccount, deployContract, sleep, ensureDir };
