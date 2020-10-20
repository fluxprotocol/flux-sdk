export default function getConfig(env: string) {
	switch (env) {
	case 'production':
	case 'local':
			return {
					networkId: 'local',
					nodeUrl: 'http://localhost:3030',
					keyPath: `${process.env.HOME}/.near/validator_key.json`,
					walletUrl: 'http://localhost:4000/wallet',
			};
	case 'test':
	case 'ci':
			return {
					networkId: 'shared-test',
					nodeUrl: 'https://rpc.ci-testnet.near.org',
					masterAccount: 'test.near',
			};
	default:
			throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`);
	}
};