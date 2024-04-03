const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Command to start your local server
const startServerCommand = 'npm run start';

const args = process.argv.slice(2);
let fileName;
let outputDir = '.';

// Parse command-line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') {
    if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
      console.error('Error: Missing output directory after -o option');
      process.exit(1);
    }
    outputDir = args[i + 1];
    i++; // Skip the next argument (output directory)
  } else {
    fileName = args[i];
  }
}

// Check if a filename is provided
if (!fileName) {
  console.error('Usage: node bpmn2svg.js [-o <outputDir>] <BPMN filename>');
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

// Start the local server
const serverProcess = exec(startServerCommand);

serverProcess.on('error', (err) => {
  console.error('Error starting local server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
//  console.log('Local server process exited with code', code);
  process.exit(1);
});

let serverReady = false;
serverProcess.stdout.on('data', (data) => {
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
      bpmn2svg(serverURL);
    } else {
      console.error('Error: Failed to extract server URL.');
      process.exit(1);
    }
  }
});

/*
    // The server is ready, proceed with the rest of the script
console.log("ready:",data);
//    bpmn2svg();
*/

serverProcess.stderr.on('data', (data) => {
  console.error(`Server process error: ${data}`);
});

async function bpmn2svg(serverURL) {
  // Launch a headless browser
  // const browser = await puppeteer.launch({ headless: false }); // use to debug
  const browser = await puppeteer.launch({ headless: true });

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

  // save root diagram
  let svg = await page.evaluate(() => {
    return modeler.saveSVG({ format: true }).then((model) => {
      return model.svg;
    });
  });

  // Save the content of model.svg into a file named <baseName>.svg
  let outputFile = path.join(outputDir, baseName + '.svg');
  fs.writeFileSync(outputFile, svg, 'utf-8');

  // save diagrams of collapsed elements
  const collapsed = await page.evaluate(() => {
    let elementRegistry = modeler.get('elementRegistry');
    return elementRegistry.getAll().filter( (element) => { return element.collapsed; } );
  });
  
  for ( const element of collapsed ) {
    const id = element.id;

    await page.evaluate((element) => {
      let elementRegistry = modeler.get('elementRegistry');
      let canvas = modeler.get('canvas');
      canvas.setRootElement(elementRegistry.get(element.id + '_plane'));
    }, element);

    svg = await page.evaluate(() => {
      return modeler.saveSVG({ format: true }).then((model) => {
        return model.svg;
      });
    });

    // Save the content of model.svg into a file named <baseName>-<subprocessName>.svg
    outputFile = path.join(outputDir, baseName + '-' + id + '.svg');
    fs.writeFileSync(outputFile, svg, 'utf-8');
  }
  
  console.log("Saved " + (collapsed.length+1) + " diagrams to: " + outputDir);
  // Close the browser
  await browser.close();

  // Close the local server process
  serverProcess.kill();
}
