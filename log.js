const Chalk = require("chalk");
const chalk = new Chalk.constructor({level:1});
module.exports = (style, message) => {
  process.stderr.write(chalk[style](message));
};