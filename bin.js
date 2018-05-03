
const Fs = require("fs");
const Path = require("path");
const Log = require("./log.js")
const Testrumenter = require("./main.js");

if (process.argv.length !== 5 && process.argv.length !== 4) {
  process.stderr.write([
    "Usage: ",
    "1) Test:   testrumenter instrumenter.js target.js",
    "1) Suite:  testrumenter instrumenter.js target",
    "2) Cross:  testrumenter instrumenter    target[.js]",
    "3) Bundle: testrumenter instrumenter.js target.js   bundle.html"
  ].join("\n")+"\n");
}

const ipath = process.argv[2];
const tpath = process.argv[3][0] === ":" ? Path.join(__dirname, "suite", process.argv[3].substring(1)) : process.argv[3];

if (process.argv.length === 5) {
  Testrumenter.bundle(ipath, tpath, process.argv[4]);
} else {
  if (ipath.endsWith(".js")) {
    let instrumenter;
    try {
      instrumenter = require(Path.resolve(ipath));
    } catch (error) {
      Log("bgMagenta", "Error while requiring the instrumenter:\n");
      Log("magenta", error.stack + "\n");
      process.exit(1);
    }
    if (tpath.endsWith(".js")) {
      Testrumenter.test(instrumenter, tpath);
    } else {
      const suite = Testrumenter.suite(instrumenter, tpath, true);
      const failures = Object.keys(suite).filter((key) => suite[key].time === null);
      if (failures.length) {
        Log("yellow", JSON.stringify(suite)+"\n");
        Log("bgYellow", Object.keys(suite).length+" tests done, got "+failures.length+" failures:\n");
        failures.forEach((key) => { Log("bgYellow", "  - "+key+" >> "+suite[key].output+"\n") });
      } else {
        Log("green", JSON.stringify(suite)+"\n");
        Log("bgGreen", Object.keys(suite).length+" tests done, all passed\n");
      }
    }
  } else {
    const cross = Testrumenter.cross(ipath, tpath);
    Log("green", "\n"+JSON.stringify(cross)+"\n");
    const tlength = Object.keys(cross).length;
    const ilength = tlength ? Object.keys(cross[Object.keys(cross)[0]].times).length : 0;
    Log("bgGreen", "\n"+(ilength*tlength)+" tests done ("+ilength+" instrumenters X "+tlength+" targets), all passed\n");
  }
}