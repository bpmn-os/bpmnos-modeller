// Watch the standalone Less stylesheet(s) and rebuild dist/app.css on change.
// Dependency-free (uses lessc, already a devDependency). Module .less files imported from
// JS are handled by webpack's less-loader under `webpack --watch`, so this only needs to
// cover src/app.less (and anything it @imports).
import { watch } from 'node:fs';
import { exec } from 'node:child_process';

let building = false;
let pending = false;

function build() {
  if (building) { pending = true; return; }
  building = true;
  exec('lessc src/app.less dist/app.css', (err, _stdout, stderr) => {
    building = false;
    if (err) console.error('[watch:css] lessc error:\n' + stderr);
    else console.log('[watch:css] rebuilt dist/app.css');
    if (pending) { pending = false; build(); }
  });
}

build(); // initial build

try {
  watch('src', { recursive: true }, (_event, file) => {
    if (file && file.endsWith('.less')) build();
  });
  console.log('[watch:css] watching src/**/*.less');
} catch {
  // recursive watch unsupported on this platform — fall back to the entry stylesheet
  watch('src/app.less', () => build());
  console.log('[watch:css] watching src/app.less');
}
