# Testrumenter

Command line utility for testing, benchmarking and debugging JavaScript code instrumenter.
Install with:

```sh
npm install -g testrumenter
```

## Instrumenter File

An instrumenter file is a CommonJS module which exports a function transforming javascript code.
For instance, the instrumenter below replaces the literals `"foo"` by `"bar"`:

```
module.exports = (script) => script.replace(/"foo"/g, "\"bar\"");
```

An instrumenter directory is a directory where every `.js` file is an instrumenter file.

## Target File

Target file should contain plain JavaScript code.
To avoid interference between target files, they shoyld not have any effect on the global object.
So if variables are needed, you should use the module pattern `(function () { ... } ())` or `let/const`.
There exists shortcuts for accessing predefined targets:

* [:atom](suite/atom)
* [:octane-33](suite/octane-33)
* [:sunspider-1.0.2](suite/sunspider-1.0.2)

A target directory is a directory where every `.js` file is a target file.

## Commmand Line Interface

Testrumenter uses `stderr`, so `stdout` can be redirected to `/dev/null` to avoid poluting terminals logs.
Color scheme:
* cyan: information.
* green: test success.
* yellow: test failure, stop the execution (not for test suite). 
* majenta: failure due to instrumenter, stop the execution.

### Test

Test a instrumenter file on a target file.

```
testrumenter instrument.js target.js
```

### Test Suite

Test suite an instrumenter file on a target directory.
Errors thrown while evaluating instrumented targets do not preclude the test suite from finishing.

```
testrumenter instrument.js target
```

### Cross Tests

Cross-test an instrumenter directory on a target directory.
Each instrumenter will be required in its own process to avoid interferences through the global object.
Errors thrown while evaluating instrumented targets will stop the entire cross testing.

```
testrumenter instrument target
```

### Bundle

Generate a html page that will apply the instrumenter and the target and evaluate the instrumented code.
This is usefull to debug instrumenter on browsers with the [debugger statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/debugger).

```
testrumenter instrument.js target.js bundle.html
```
