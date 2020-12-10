import FluxProvider from '../index';
import ProtocolContract from '../ProtocolContract';
import TokenContract from '../TokenContract';
import { Account, keyStores, Near } from 'near-api-js';
import {
    setUpTestConnection,
    generateUniqueString,
    createAccount,
    deployContracts,
    toDai
} from "./testUtils";
import BN from 'bn.js';

let near: Near;
let protocolContractId: string;
let tokenContractId: string;
let workingAccount: Account;

let flux: FluxProvider = new FluxProvider({
    network: "testnet",
    indexNodeUrl: "https://api.flux.market",
    keyStore: new keyStores.InMemoryKeyStore(),
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
const STORAGE_DEFAULT = new BN("13300000000000000000000");

beforeAll(async () => {
    near = await setUpTestConnection();
    protocolContractId = generateUniqueString('test');
    tokenContractId = generateUniqueString('tokn');
    workingAccount = await createAccount(near);
})

describe('chain tests', () => {

    it("correctly creates working account and can verify state", async () => {
        let status = await workingAccount.state();
	    expect(status.code_hash).toEqual('11111111111111111111111111111111');
    })

    it("Is able to connect to the NEAR blockchain & initiate Flux smart contract instance", async () => {
        const {
            protocolContract,
            tokenContract
        } = await deployContracts(workingAccount, protocolContractId, tokenContractId);

        flux.near = near;
        flux.account = workingAccount;
        flux.protocolContract = protocolContract;
        flux.tokenContract = tokenContract;
        flux.fluxProtocolContract = new ProtocolContract(workingAccount, protocolContractId);
        flux.fluxTokenContract = new TokenContract(workingAccount, tokenContractId);
    });

    it("Is able to retrieve the accountId ", () => {
        const accountId = flux.getAccountId();
        expect(accountId).toBe(workingAccount.accountId);
    });

    it('Is able to set an allowance', async () => {
        await flux.incAllowance(flux.protocolContract.contractId, '100000000000000000000000', STORAGE_DEFAULT);
        const allowance = await flux.getAllowance(workingAccount.accountId, flux.protocolContract.contractId);
        expect(allowance).toBe("100000000000000000000000");
    });

    it('Is able to get balance', async () => {
        const allowance = await flux.getBalance(workingAccount.accountId);
        expect(allowance).toBe("10000000000000000000000000000000000000");
    });


    it("Is able to create a market", async () => {
        const endTime = new Date().getTime() + 70000 ;
        await flux.createBinaryMarket("This is a test binary market", "", [] , endTime, 1, STORAGE_DEFAULT);
        await flux.createCategoricalMarket("This is a test categorical market", "", 3, ["yes", "no", "maybe"],[], endTime, 1, STORAGE_DEFAULT);
    });

    it("Is able to place a limit order", async () => {
        await flux.placeOrder(0, 0, "50000", 10, STORAGE_DEFAULT);
        await flux.placeOrder(1, 0, "50000", 10, STORAGE_DEFAULT);
    });

    it("Is able to cancel an order", async () => {
        await flux.cancelOrder(0, 0, 0, 10, STORAGE_DEFAULT);
        await flux.cancelOrder(1, 0, 0, 10, STORAGE_DEFAULT);
    });

    it("Is able to fill a limit order", async () => {
        await flux.placeOrder(0, 0, "10000", 50, STORAGE_DEFAULT);
        await flux.placeOrder(1, 1, "10000", 50, STORAGE_DEFAULT);
    });

    it("Is able to fill a market order", async () => {
        await flux.placeOrder(0, 0, "10000", 50, STORAGE_DEFAULT);
        await flux.placeOrder(1, 0, "10000", 50, STORAGE_DEFAULT);
        await flux.placeOrder(0, 1, "10000", 50, STORAGE_DEFAULT);
        await flux.placeOrder(1, 1, "10000", 50, STORAGE_DEFAULT);
    });

    it("Is able to dynamically sell to the market", async () => {
        const endTime = new Date().getTime() + 20000;
        await flux.createBinaryMarket("This is a test binary market", "", [], endTime, 1, STORAGE_DEFAULT);
        await flux.placeOrder(2, 0, "20000", 50, STORAGE_DEFAULT);
        await flux.placeOrder(2, 0, "20000", 50, STORAGE_DEFAULT);
        await flux.placeOrder(2, 1, "20000", 50, STORAGE_DEFAULT);
        const shareBalance = await flux.getShareBalanceForUserForMarket(2, flux.account!.accountId);
        await flux.dynamicMarketSell(2, 0, "50", 50, STORAGE_DEFAULT)
    });

    it("Is able to resolute a market", async () => {
        await flux.resolute(0, 0, toDai(5).toString());
        await flux.resolute(1, null, toDai(5).toString());
        const binaryClaimable = await flux.getClaimable(0);
        const categoricalClaimable = await flux.getClaimable(1);
        expect(Object.keys(binaryClaimable)).not.toBe(0);
        expect(Object.keys(categoricalClaimable)).not.toBe(0);
    });

    it("Is able to withdraw dispute on a market", async() => {
        await flux.dispute(1, 1, toDai(9).toString());
        await flux.withdrawDisputeStake(1, 1, 1);
    });

    it("Is able to dispute a market", async () => {
        await flux.dispute(0, 1, toDai(10).toString(), STORAGE_DEFAULT);
        await flux.dispute(1, 1, toDai(10).toString(), STORAGE_DEFAULT);
    });

    it("Is able to finalize a market", async () => {
        await flux.finalize(0, 0);
        await flux.finalize(1, 1);
    });

    it("Is able to claim earnings", async () => {
        const balance = await flux.getBalance(workingAccount.accountId);
        await flux.claimEarnings(0, flux.getAccountId()!, STORAGE_DEFAULT);
        const updatedBalance = await flux.getBalance(workingAccount.accountId);
        expect(parseInt(updatedBalance) > parseInt(balance));
    });
});
