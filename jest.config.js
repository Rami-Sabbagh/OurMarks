module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src/', '<rootDir>/tests/'],

	collectCoverage: true,
	coverageDirectory: './coverage/',
};
