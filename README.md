# A BPMN 2.0 modeller for optimization and simulation

This modeller uses [bpmn-js](https://github.com/bpmn-io/bpmn-js) and [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel). It implements a BPMN 2.0 modeler that allows you to edit execution related properties via a properties panel.

## Building the modeller

You need a [NodeJS](http://nodejs.org) development stack with [npm](https://npmjs.org) and installed to build the project.

To install all project dependencies execute

```
npm install
```

Build the example using [browserify](http://browserify.org) via

```
npm run all
```

You may also spawn a development setup by executing

```
npm run dev
```

Both tasks generate the distribution ready client-side modeller application into the `dist` folder.

Serve the application locally or via a web server (nginx, apache, embedded).

## Convert BPMN to SVG

You can convert a BPMN model to SVG using

```
node bpmn2svg.js <BPMN filename> [-o <outputDir>] [-s <serverURL>]
```
or

```
./bpmn2svg.js <BPMN filename> [-o <outputDir>] [-s <serverURL>]
```

This command creates an SVG-file for the main diagram and each collapsed subprocesses and saves them in the specified output directory. If no output directory is specified the current folder is used. Tooltips for each BPMN element are automatically added.

<!--
In order to use this command `xmldom` and `puppeteer` must be installed

```
npm install xmldom
npm install puppeteer
```

Please note that `npm install puppeteer` may hang on certain internet connections (see https://github.com/puppeteer/puppeteer/issues/5611).
-->
