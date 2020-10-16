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