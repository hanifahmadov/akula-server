/* eslint-disable */
//: npm i chalk@4.1.2
//# DO NOT update the chalk because of the module (import) error
//# if you { type: module } in package.json, have to change all require into import 
//# thats a lot, no NEED extra work
const chalk = require('chalk');

const requestLogger = function (req, res, next) {
  console.log(chalk.bold.green('\n===== Incoming Request =====\n'))
  console.log(chalk.white(`${new Date()}`))
  console.log(chalk.white(`${req.method} ${req.url}`))
  console.log(chalk.white(`body ${JSON.stringify(req.body)}`))
  console.log(chalk.bold.green('\n============================\n'))
  next()
}

module.exports = requestLogger
