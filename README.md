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

(async () => 
	const flux = await new Flux().connect("development", "flux-protocol-staging");
)();
```

### Methods

| Method        | Description           |
| ------------- |-------------:|
| connect(environment: string, fluxContractAddress: string)      | Connect to the NEAR blockchain and initiate a connection with the Flux contract  |
| createBinaryMarket(description: string, extraInfo: string, endTime: number)      | Create a binary (Yes/No) market   |
| createCategoricalMarket(description: string,  extraInfo: string, outcomes: number, outcomeTags: array<string>, endTime: number)      | Create a categorical market   |

	createCategoricalMarket(description, extraInfo, outcomes, outcomeTags, endTime) {

## Running tests

Clone the [nearcore](https://nodejs.org/en/) repo, in your prefered directory
```bash
git clone https://github.com/nearprotocol/nearcore.git
```

Run the docker image that has the unit-testable environment
```bash
cd ./nearcore
python ./scripts/start_unittest.py
```

When the image is up and running navigate to `/flux-sdk` and run the `npm test`


## Future work

* Adding market creator fee's
* Adding adding a value bearing stable unit of account as a trading principle (eg. Dai)
* Adding Flux Oracle as the only way to resolute markets
