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
	viewMethods,
	changeMethods
} = require('./../constants');

const networkId = 'unittest';
const testAccountName = 'test.near';
const keyStore = new keyStores.BrowserLocalStorageKeyStore();

const INITIAL_BALANCE = new BN("1000000000000000000000000000");
const HELLO_WASM_PATH = './tests/flux_protocol.wasm';

async function setUpTestFluxConnection(workingAccount, contractId) {
    await keyStore.setKey(networkId, contractId, utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
	const config = Object.assign(require('./config')(process.env.NODE_ENV || 'test'), {
		networkId: networkId,
		deps: { keyStore },
    });

	let keyPair = KeyPair.fromRandom('ed25519');
    
    const near = await connect(config);
    const walletConnection = new WalletConnection(near, contractId);
    walletConnection._authData = {
        allKeys: [ 'no_such_access_key', keyPair.publicKey.toString() ],
        accountId: workingAccount.accountId
    };

    const contract = new Contract(workingAccount, contractId, {
        viewMethods,
        changeMethods,
        sender: walletConnection.getAccountId(),
    });

    return {
        near,
        walletConnection,
        contract
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

async function deployContract(workingAccount, contractId, options = { amount: INITIAL_BALANCE.div(new BN(10)) }) {
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

module.exports = { setUpTestFluxConnection, setUpTestConnection, networkId, testAccountName, INITIAL_BALANCE,
    generateUniqueString, createAccount, deployContract, sleep, ensureDir };
