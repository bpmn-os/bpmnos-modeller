# A BPMN 2.0 Modeler with execution properties

This modeller uses [bpmn-js](https://github.com/bpmn-io/bpmn-js) and [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel). It implements a BPMN 2.0 modeler that allows you to edit execution related properties via a properties panel and containes custom tasks for requesting and releasing resources.

## Usage

- For each process it is possible to define a status by specifying its attributes, their types, and (optional) initial values. The *Status*-Tab is only visible if no node is selected or, in case of collaborations, the respective pool (i.e. process participant) is selected.
- For each process, node, and sequence flow, it is possible to define restrictions on the status. Restrictions defined for processes and subprocesses apply to all intermediate statuses throughout the course of the (sub-)process. Restrictions defined for nodes and sequence flows only apply locally. The *Restrictions*-Tab is only visible if a process, node, or sequence flow is selected.
- For each node and message flow, it is possible to define a sequence of operators that modify the status. A set of status operators that can be selected can be specified in the file `app/modules/execution/statusOperators.json`. Each operator requires a set of parameters specified by name and value. The *Operators*-Tab is only visible if a node, or message flow is selected.

The modeller creates `bpmn:extensionElements` that contain the specified information.

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

Both tasks generate the distribution ready client-side modeler application into the `dist` folder.

Serve the application locally or via a web server (nginx, apache, embedded).
