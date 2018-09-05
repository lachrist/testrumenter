const Os = require("os");
const Fs = require("fs");
const Path = require("path");
const Testrumenter = require("./main.js");
const Log = require("./log.js");
let Instrument;
try {
  Instrument = require(Path.resolve(process.argv[2]));
} catch (error) {
  Log("bgMagenta", "Error while requiring the instrumenter:\n");
  Log("magenta", error.stack + "\n");
  process.exit(1);
}
Fs.writeFileSync(
  process.argv[4],
  JSON.stringify(Testrumenter.suite(Instrument, process.argv[3])),
  "utf8");