module.exports = {
  default: {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    paths: ['src/test/features/**/*.feature'],
    require: ['src/test/steps/**/*.cucumber.steps.ts'],
    format: ['pretty'],
    publishQuiet: true,
    parallel: 0
  }
};
