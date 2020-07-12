const fs = require('fs').promises;
const BN = require('bn.js');
const {
    utils,
    connect,
    keyStores,
    KeyPair,
    WalletConnection,
    Contract,
    Account
} = require('near-api-js');
const {
	protocolViewMethods,
	protocolChangeMethods,
    tokenViewMethods,
    tokenChangeMethods
} = require('./../constants');

const networkId = 'unittest';
const testAccountName = 'test.near';
const keyStore = new keyStores.BrowserLocalStorageKeyStore();

const INITIAL_BALANCE = new BN("1000000000000000000000000000");
const FLUX_WASM_PATH = './tests/flux_protocol.wasm';
const FLUX_FUNGIBLE_WASM_PATH = './tests/fungible_token.wasm';

async function setUpTestFluxConnection(workingAccount, protocolContractId, tokenContractId) {
    await keyStore.setKey(networkId, protocolContractId, utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
    await keyStore.setKey(networkId, tokenContractId, utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
	const config = Object.assign(require('./config')(process.env.NODE_ENV || 'test'), {
		networkId: networkId,
		deps: { keyStore },
    });

	let keyPair = KeyPair.fromRandom('ed25519');

    const near = await connect(config);
    const walletConnection = new WalletConnection(near, protocolContractId);
    walletConnection._authData = {
        allKeys: [ 'no_such_access_key', keyPair.publicKey.toString() ],
        accountId: workingAccount.accountId
    };

    const protocolContract = new Contract(workingAccount, protocolContractId, {
        protocolViewMethods,
        protocolChangeMethods,
        sender: walletConnection.getAccountId(),
    });

    const tokenContract = new Contract(workingAccount, tokenContractId, {
        tokenViewMethods,
        tokenChangeMethods,
        sender: walletConnection.getAccountId(),
    });

    return {
        near,
        walletConnection,
        protocolContract,
        tokenContract
    }
}

async function setUpTestConnection() {
    const keyStore = new keyStores.InMemoryKeyStore();
    await keyStore.setKey(networkId, testAccountName, utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
    const config = Object.assign(require('./config')('test'), {
        networkId: networkId,
        deps: { keyStore },
    });
    return connect(config);
}

// Generate some unique string with a given prefix using the alice nonce.
function generateUniqueString(prefix) {
    return prefix + Date.now() + Math.round(Math.random() * 1000);
}

async function createAccount(masterAccount, options = { amount: INITIAL_BALANCE, trials: 5 }) {
    await masterAccount.fetchState();
    const newAccountName = generateUniqueString('test');
    const newPublicKey = await masterAccount.connection.signer.createKey(newAccountName, networkId);
    await masterAccount.createAccount(newAccountName, newPublicKey, options.amount);
    return new Account(masterAccount.connection, newAccountName);
}

async function deployContract(workingAccount, contractId, contract_type, options = { amount: INITIAL_BALANCE.div(new BN(10)) }) {
    const newPublicKey = await workingAccount.connection.signer.createKey(contractId, networkId);
    let data;
    if (contract_type === "protocol") {
        data = [...(await fs.readFile(FLUX_WASM_PATH))];
    } else if (contract_type === "fungible") {
        data = [...(await fs.readFile(FLUX_FUNGIBLE_WASM_PATH))];
    }
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

module.exports = { setUpTestFluxConnection, setUpTestConnection, networkId, testAccountName, INITIAL_BALANCE,
    generateUniqueString, createAccount, deployContract, sleep, ensureDir };
