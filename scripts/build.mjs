import fs from 'node:fs';
import {root,catalog,destinations} from './check.mjs';
fs.rmSync(root+'dist',{recursive:true,force:true});
fs.cpSync(root+'public',root+'dist',{recursive:true});
fs.writeFileSync(root+'dist/data.js','window.TRAVEL_DATA = '+JSON.stringify({catalog,destinations}).replaceAll('<','\\u003c')+';\n');
fs.writeFileSync(root+'dist/.nojekyll','');
console.log('Built dist/ for JaiJai Travel');
