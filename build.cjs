const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const files=['index.html','style.css','core.js','visual.js','app.js'];
for(const file of files){const text=fs.readFileSync(path.join(__dirname,file),'utf8');if(!text.trim())throw Error('Empty '+file);if(file.endsWith('.js'))new vm.Script(text);}
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
for(const file of ['style.css','core.js','visual.js','app.js'])if(!html.includes('"'+file+'"'))throw Error('Unlinked '+file);
fs.mkdirSync(path.join(__dirname,'dist'),{recursive:true});for(const file of files)fs.copyFileSync(path.join(__dirname,file),path.join(__dirname,'dist',file));
console.log('Built five self-contained static assets in dist/');
