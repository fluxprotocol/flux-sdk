export default function getConfig(env: string) {
	switch (env) {
	case 'production':
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