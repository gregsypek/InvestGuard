const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
	testEnvironment: "node",
	transform: {
		...tsJestTransformCfg,
	},
	// Dodajemy mapowanie ścieżek
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
};
