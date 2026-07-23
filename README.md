> [!WARNING]
> **This repository is deprecated and has been superseded by
> [bpmn-workbench](https://github.com/bpmn-os/bpmn-workbench), [bpmnos-js](https://github.com/bpmn-os/bpmnos-js), and [bpmnos-workbench](https://github.com/bpmn-os/bpmnos-workbench).**
> It is no longer maintained.

# A BPMN 2.0 modeller for optimization and simulation

Implementation of a BPMN 2.0 modeler allowing to provide data relevant for optimization and simulation. The modeller is based on [bpmn-js](https://github.com/bpmn-io/bpmn-js), [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel), and [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation). 

## Building the modeller

You need a [NodeJS](http://nodejs.org) development stack with [npm](https://npmjs.org) installed to build the project.

To install all project dependencies execute

```
npm install
```

Build the modeller and start a local server via

```
npm run start
```

You may also build the modeller without starting a local server via

```
npm run bundle
```

Both tasks generate the distribution ready client-side modeller application into the `dist` folder.

Serve the application locally or via a web server (nginx, apache, embedded).

## Convert BPMN to SVG

Create a link to the diagram converter by
```
sudo npm link
```

After this, you can convert a BPMN model to SVG using

```
bpmn2svg <BPMN filename> [-o <outputDir>] [-s <serverURL>]
```

This command creates an SVG-file for the main diagram and each collapsed subprocesses and saves them in the specified output directory. If no output directory is specified the current folder is used. Tooltips for each BPMN element are automatically added.

