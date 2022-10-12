module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "tests/.*\\.test\\.ts$",
  collectCoverageFrom: ["src/**/*.ts"],
  // automock: true,
  moduleFileExtensions: ["ts", "js", "json"],

  moduleNameMapper: {
    "^@libs/(.*)$": "<rootDir>/src/libs/$1",
    "^@src/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/tests/setEnvVars.js"],
};
