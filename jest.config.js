module.exports = {
    transform: {'^.+\\.ts?$': 'ts-jest'},
    testEnvironment: 'node',
    testMatch: [
        '**/src/**/?(*.)+(spec|test).[jt]s?(x)',
    ],
    // testRegex: ,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
