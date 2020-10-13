interface Config {
    networkId: string,
    nodeUrl: string,
    contractName: null,
    walletUrl: string,
    initialBalance: string
}


export function getConfig(networkName: string, nodeUrl?: string): Config {
    let network: Config;
	switch(networkName) {
		case "mainnet":
			network =  {
				networkId: 'mainnet',
				nodeUrl: nodeUrl || 'https://rpc.near.org',
				contractName: null,
				walletUrl: 'https://wallet.near.org',
				initialBalance: "100000000"
			};
			break;
		case "custom":
			network = {
				networkId: 'custom',
				nodeUrl: nodeUrl || 'https://rpc.near.org',
				contractName: null,
				walletUrl: 'https://wallet.near.org',
				initialBalance: "100000000"
			};
		default :
			network =  {
				networkId: 'testnet',
				nodeUrl: nodeUrl || 'https://rpc.testnet.near.org',
				contractName: null,
				walletUrl: 'https://wallet.testnet.near.org',
				initialBalance: "100000000"
			};
	}
	return network;
}