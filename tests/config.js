
module.exports = function getConfig(contractId) {
	return {
		networkId: 'default',
		nodeUrl: 'https://rpc.nearprotocol.com',
		contractName: contractId,
		walletUrl: 'https://wallet.nearprotocol.com',
		initialBalance: 100000000
	};

};
