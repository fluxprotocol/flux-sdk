# Flux SDK
Effortlessly create and interact with financial markets.

## Prerequisites
* [Node.js](https://nodejs.org/en/)

## Installation
Install flux-sdk
```bash
npm install --save flux-sdk
```

## Usage

### Initialization

```js
import Flux from "flux-sdk";

(async () => {
  const flux = new Flux();
  await flux.connect("fluxprotocol-phase-point-two");
})();
```

### Methods

| Method        | Description           |
| ------------- |-------------|
| **connect**(environment: string, fluxContractAddress: string)      | Connect to the NEAR blockchain and initiate a connection with the Flux contract  |
| **signIn**(environment: string, fluxContractAddress: string)      | Request a sign-in to the NEAR wallet  |
| **claimFDai**()      | Claims $100 of fdai (fake dai) for current account, only works if this account hasn't claimed fdai before  |
| **signOut**(environment: string, fluxContractAddress: string)      | Request a sign-out to the NEAR wallet  |
| **createBinaryMarket**(description: string, extraInfo: string, endTime: number, marketCreationFee: number)      | Create a binary (Yes/No) market. endTime is denomincated in miliseconds. marketCreationFee is denominated in full procentpoints and has an upper bound of 5% |
| **createCategoricalMarket**(description: string,  extraInfo: string, outcomes: number, outcomeTags: array<string>, endTime: number, marketCreationFee: number)      | Create a categorical market. endTime is denomincated in miliseconds. marketCreationFee is denominated in full procentpoints and has an upper bound of 5%   |
| **placeOrder**(marketId: number, outcome: number, spend: number, pricePerShare: number)       | Place order for a market specified by `marketId` and `outcome`. `spend` is the amount the user wants to spend in total and `pricePerShare` is the amount each share will cost (between 1 - 99)    |
| **cancelOrder**(marketId: number, outcome: number, orderId: number)       | Cancel an order for a specific market and outcome by orderId    |
| **resolute**(marketId: number, winningOutcome: number)       | Resolute a specific market `winningOutcome` being the index of the winning outcome.     |
| **getAllMarkets**()       | Returns all markets     |
| **getMarketsById**(marketIds: Array<number>)       | Returns markets by ids  |
| **getFDaiBalance**()       | Returns users principle balance     |
| **getOpenOrders**(marketId: number, outcome: number)       | Returns user's open orders for a specific market and outcome     |
| **getFilledOrders**(marketId: number, outcome: number)       | Returns user's filled orders for a specific market and outcome     |
| **getClaimable**(marketId: number)       | Returns how much money the user can claim     |
| **getMarketPrice**(marketId: number, outcome: number)       | Returns best available price specific market and outcome    |
| **getAccountId**()       | Returns accountId of signed in user    |
| **isSignedIn**()       | Returns whether user is signed in    |
| **getDepth**(marketId: number, outcome: number, price: number, spend: number)       | Returns available depth up until a certain spend   |

## Running tests

Clone the [nearcore](https://nodejs.org/en/) repo, in your prefered directory
```bash
git clone https://github.com/nearprotocol/nearcore.git
```

Run the docker image that has the unit-testable environment
```bash
cd ./nearcore
python start_unittest.py --image=nearprotocol/nearcore:master
```

When the image is up and running navigate to `/flux-sdk` and run the `npm test`


## Future work

* Adding getter for specific marketIds
* Better Error handling on protocol side
* Adding market creator fee's
* Adding adding a value bearing stable unit of account as a trading principle (eg. Dai)
* Adding Flux Oracle as the only way to resolute markets
* Adding trade history
