
const Os = require("os");
const Fs = require("fs");
const Path = require("path");
const Stream = require("stream");
const ChildProcess = require("child_process");
const Browserify = require("browserify");
const Log = require("./log.js");

const print = (value) => {
  if (typeof value === "function") 
    return "function";
  if (Array.isArray(value))
    return "array";
  if (value && typeof value === "object")
    return "object";
  return String(value);
};

const instrument = (instrumenter, tpath) => {
  const script = Fs.readFileSync(tpath, "utf8");
  try {
    return instrumenter(script);
  } catch (error) {
    Log("bgMagenta", "Error while instrumenting "+Path.basename(tpath)+":\n");
    Log("magenta", error.stack + "\n");
    process.exit(1);
  }
};

const childeren = (path) => Fs.readdirSync(path)
  .sort()
  .filter((filename) => filename.endsWith(".js"))
  .map((filename) => Path.join(path, filename));

const baseline = (tpath) => {
  Log("bgCyan", "\n\n\nBaseline Suite:\n");
  const suite = exports.suite((script) => script, tpath);
  for (let key in suite) {
    if (suite[key][0] === null) {
      Log("bgMagenta", "Error while evaluating the baseline:\n");
      Log("magenta", suite[key][1]+"\n");
      process.exit(1);
    }
    suite[key][2] = {};
  }
  return suite;
};

exports.test = (instrumenter, tpath) => {
  const original = Fs.readFileSync(tpath, "utf8");
  Log("bgCyan", "\nOriginal:\n");
  Log("cyan", original+"\n");
  let instrumented;
  try {
    instrumented = instrumenter(original);
  } catch (error) {
    Log("bgMagenta", "Error while instrumenting "+Path.basename(tpath)+":\n");
    Log("magenta", error.stack + "\n");
    process.exit(1);
  }
  Log("bgCyan", "\nInstrumented:\n");
  Log("cyan", instrumented+"\n");
  try {
    Log("green", print(global.eval(instrumented))+"\n");
    return true;
  } catch (error) {
    Log("bgYellow", "Error while evaluating the instrumented code of "+Path.basename(tpath)+":\n");
    Log("yellow", (error instanceof Error ? error.stack : print(error)) + "\n");
    return false;
  }
};

exports.suite = (instrumenter, tpath) => childeren(tpath).reduce((suite, child) => {
  Log("cyan", Path.basename(child, ".js") + "... ");
  const original = Fs.readFileSync(child, "utf8");
  let instrumented;
  try {
    instrumented = instrumenter(original);
  } catch (error) {
    Log("bgMagenta", "Error while instrumenting "+Path.basename(child)+":\n");
    Log("magenta", error.stack + "\n");
    process.exit(1);
  }
  let time = process.hrtime();
  try {
    const value = global.eval(instrumented);
    time = process.hrtime(time);
    const string = print(value);
    Log("green", string + "\n");
    suite[Path.basename(child, ".js")] = [
      time[0] * 1e6 + Math.ceil(time[1] / 1e3),
      string
    ];
  } catch (error) {
    Log("bgYellow", "Error while evaluating the instrumented code of "+Path.basename(child)+":\n");
    Log("yellow", (error instanceof Error ? error.stack : print(error)) + "\n");
    suite[Path.basename(child, ".js")] = [
      null,
      error instanceof Error ? error.name +": " + error.message : print(error),
    ];
  }
  return suite;
}, {});

exports.cross = (ipath, tpath) => childeren(ipath).reduce((cross, child) => {
  Log("bgCyan", "\n"+Path.basename(child, ".js")+" suite:\n");
  const opath = Path.join(Os.tmpdir(), "testrumenter"+Math.random().toString(36).substring(2)+".json");
  ChildProcess.spawnSync("node", [
    Path.join(__dirname, "child.js"),
    child,
    tpath,
    opath
  ], {stdio:[0,1,2]});
  const suite = JSON.parse(Fs.readFileSync(opath, "utf8"));
  Fs.unlinkSync(opath);
  Object.keys(suite).sort().forEach((key) => {
    cross[key][2][Path.basename(child, ".js")] = (
      suite[key][0] === null ?
      suite[key][1] :
      (
        suite[key][1] !== cross[key][1] ?
        "Result mismatch; expected: "+cross[key][1]+", got: "+suite[key][1] :
        suite[key][0]));
  });
  return cross;
}, baseline(tpath));

exports.bundle = (ipath, tpath, bpath) => {
  const readable = new Stream.Readable();
  readable.push("console.dir(global.eval(require("+JSON.stringify(Path.resolve(ipath))+")("+JSON.stringify(Fs.readFileSync(tpath, "utf8"))+")));");
  readable.push(null);
  Browserify(readable).bundle((error, buffer) => {
    if (error)
      throw error;
    Fs.writeFileSync(bpath, [
      "<!DOCTYPE html>",
      "<html>",
      "  <head>",
      "    <title>"+Path.basename(ipath, ".js")+"("+Path.basename(tpath, ".js")+") @"+(new Date()).toLocaleTimeString()+"</title>",
      "  </head>",
      "  <body>",
      "  <script>",
      buffer.toString("utf8").replace(/<\/script>/g, "<\\/script>"),
      "  </script>",
      "  </body>",
      "</html>"
    ].join("\n"), "utf8");
  });
};
