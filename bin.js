#!/usr/bin/env node

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
      const failures = Object.keys(suite).filter((key) => suite[key][0] === null).map((key) => "  - "+key+" >> "+suite[key][1]+"\n");
      if (failures.length) {
        Log("yellow", JSON.stringify(suite)+"\n");
        Log("bgYellow", Object.keys(suite).length+" tests done, got "+failures.length+" failures:\n");
        Log("yellow", failures.join(""));
      } else {
        Log("green", JSON.stringify(suite)+"\n");
        Log("bgGreen", Object.keys(suite).length+" tests done, all passed\n");
      }
    }
  } else {
    const cross = Testrumenter.cross(ipath, tpath);
    let counter = 0;
    const failures = [];
    for (let tname in cross) {
      for (let iname in cross[tname][2]) {
        counter++;
        if (typeof cross[tname][2][iname] !== "number") {
          failures.push("  - "+iname+"("+tname+") >> "+cross[tname][2][iname]+"\n");
        }
      }
    }
    if (failures.length) {
      Log("yellow", "\n"+JSON.stringify(cross)+"\n");
      Log("bgYellow", "\n"+counter+" test done, got "+failures.length+" failures:\n");
      Log("yellow", failures.join(""));
    } else {
      Log("green", "\n"+JSON.stringify(cross)+"\n");
      Log("bgGreen", "\n"+counter+" tests done, all passed\n");
    }
  }
}