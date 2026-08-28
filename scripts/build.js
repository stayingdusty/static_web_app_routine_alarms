import {cp,rm,mkdir} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const file of ['index.html','styles.css','app.js','alarm-sounds.js','routine-core.js','manifest.webmanifest','sw.js','icons'])await cp(file,`dist/${file}`,{recursive:true});
console.log('Static site built in dist/');
