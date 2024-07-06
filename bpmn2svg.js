#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { DOMParser, XMLSerializer } = require('xmldom');

const args = process.argv.slice(2);
let fileName;
let outputDir = '.';
let serverURL;

// Parse command-line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') {
    if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
      console.error('Error: Missing output directory after -o option');
      process.exit(1);
    }
    outputDir = args[i + 1];
    i++; // Skip the next argument (output directory)
  }
  else if (args[i] === '-s' || args[i] === '--server') {
    if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
      console.error('Error: Missing server URL after -s option');
      process.exit(1);
    }
    serverURL = args[i + 1];
    i++; // Skip the next argument (server URL)
  }
  else {
    fileName = args[i];
  }
}

// Check if a filename is provided
if (!fileName) {
  console.error('Usage: bpmn2svg [-s <serverURL>] [-o <outputDir>] <BPMN filename>');
  process.exit(1);
}


// Check if the file exists
if (!fs.existsSync(fileName)) {
  console.error('File does not exist:', fileName);
  process.exit(1);
}

// Check if the output directory exists; if not, create it
if (!fs.existsSync(outputDir)) {
  console.log('Output directory does not exist. Creating it...');
  try {
    fs.mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    console.error('Error: Unable to create output directory:', err);
    process.exit(1);
  }
}

const baseName = path.basename(fileName, path.extname(fileName));

if ( serverURL ) {
  // Convert BPMN to SVG
  bpmn2svg(serverURL);
}
else {
  // Start the local server
  const serverProcess = exec('npm run start', { cwd: __dirname });

  serverProcess.on('error', (err) => {
    console.error('Error starting local server:', err);
    process.exit(1);
  });

  serverProcess.on('exit', (code, signal) => {
    process.exit(0);
  });

  let serverReady = false;
  serverProcess.stdout.on('data', async (data) => {
    // Check if the stdout contains the message indicating that the server is ready
    if (data.includes('Your application is ready')) {
      serverReady = true;
    }
  
    if (serverReady && data.includes('http')) {
      // Extract the URL from the data
      const urlMatch = data.match(/(http\S+)/);
      if (urlMatch && urlMatch[1]) {
        serverURL = urlMatch[1];
        console.log('Server URL:', serverURL);
        // Convert BPMN to SVG
        await bpmn2svg(serverURL);
        // Close the local server process
        serverProcess.kill();
      } else {
        console.error('Error: Failed to extract server URL.');
        process.exit(1);
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server process error: ${data}`);
  });
}

async function bpmn2svg(serverURL) {
  // Launch a headless browser
  // const browser = await puppeteer.launch({ headless: false }); // use to debug
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disabled-setupid-sandbox"], headless: true });

  // Open a new page
  const page = await browser.newPage();

  // Navigate to the local webpage
  await page.goto(serverURL);

  // Read the content of the local file
  const diagram = fs.readFileSync(fileName, 'utf-8');

  
  // Pass the file content to the page context and call the "show" function
  await page.evaluate((diagram) => {
    modeler.importXML(diagram);
  }, diagram);

  // Get SVG of root diagram
  let svg = await page.evaluate(() => {
    return modeler.saveSVG({ format: true }).then((model) => {
      return model.svg;
    });
  });

  // Create the SVG file
  let outputFile = path.join(outputDir, baseName + '.svg');
  fs.writeFileSync(outputFile, addTooltips(svg), 'utf-8');

  // Find collapsed elements
  const collapsed = await page.evaluate(() => {
    let elementRegistry = modeler.get('elementRegistry');
    return elementRegistry.getAll().filter( (element) => { return element.collapsed; } );
  });
  
  for ( const element of collapsed ) {
    const id = element.id;

    // Expand collapsed element
    svg = await page.evaluate((element) => {
      let elementRegistry = modeler.get('elementRegistry');
      let canvas = modeler.get('canvas');
      let rootElement = elementRegistry.get(element.id + '_plane');
      if ( rootElement ) {
        canvas.setRootElement(rootElement);
        return modeler.saveSVG({ format: true }).then((model) => {
          return model.svg;
        });
      }
    }, element);

    if ( svg ) {
      // Create the SVG file
      outputFile = path.join(outputDir, baseName + '-' + id + '.svg');
      fs.writeFileSync(outputFile, addTooltips(svg), 'utf-8');
    }
  }
  
  console.log("Saved " + (collapsed.length+1) + " diagram(s) to: " + outputDir);
  // Close the browser
  await browser.close();
}

function addTooltips(svgContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const elements = doc.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.hasAttribute('data-element-id')) {
      const title = doc.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = element.getAttribute('data-element-id');
      element.appendChild(title);
    }
  }
  return new XMLSerializer().serializeToString(doc);
}
