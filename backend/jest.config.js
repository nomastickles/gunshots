module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "tests/.*\\.test\\.ts$",
  collectCoverageFrom: ["src/**/*.ts"],
  // automock: true,
  moduleFileExtensions: ["ts", "js", "json"],
  setupFiles: ["<rootDir>/tests/setEnvVars.js"],
  resetMocks: true,
  restoreMocks: true,
  modulePathIgnorePatterns: ["<rootDir>/scratch/"],
};
