const Fs = require("fs");
const ChildProcess = require("child_process");

const code = `
///////////////////////
// testrumenter edit //
///////////////////////
var __trestrumenter__run__;
function BenchmarkSuite(name, reference, benchmarks) {
  __trestrumenter__ = function () {
    for (var index = 0; index<benchmarks.length; index++) {
      benchmarks[index][0] && benchmarks[index][0]();
      benchmarks[index][1]();
      benchmarks[index][2] && benchmarks[index][2]();
    }
  };
  __trestrumenter__benchmarks__ = benchmarks;
};
function Benchmark(name, doWarmup, doDeterministic, deterministicIterations, run, setup, tearDown, rmsResult, minIterations) {
  return [setup, run, tearDown];
};
var __trestrumenter__random__ = Math.random;
var __trestrumenter__alert__ = typeof alert === "undefined" ? undefined : alert;
// Math.random from https://github.com/WebKit/webkit/blob/master/PerformanceTests/JetStream/Octane2/base.js
Math.random = (function() {
  var seed = 49734321;
  return function() {
    seed = ((seed + 0x7ed55d16) + (seed << 12))  & 0xffffffff;
    seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
    seed = ((seed + 0x165667b1) + (seed << 5))   & 0xffffffff;
    seed = ((seed + 0xd3a2646c) ^ (seed << 9))   & 0xffffffff;
    seed = ((seed + 0xfd7046c5) + (seed << 3))   & 0xffffffff;
    seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
    return (seed & 0xfffffff) / 0x10000000;
  };
})();
// alert from https://github.com/WebKit/webkit/blob/master/PerformanceTests/JetStream/Octane2/base.js
alert = function(s) {
  throw "Alert called with argument: " + s;
};
__trestrumenter__();
Math.random = __trestrumenter__random__;
alert = __trestrumenter__alert__;
`;

ChildProcess.execSync("rm -rf suite/octane");
ChildProcess.execSync("git clone https://github.com/chromium/octane.git suite/octane");
Fs.readdirSync("suite/octane").filter((name) => {
  if (!/\.js$/.test(name) || name === "base.js") {
    ChildProcess.execSync("rm -rf suite/octane/"+name);
  } else {
    Fs.appendFileSync("suite/octane/"+name, code);
  }
});
