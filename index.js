const fs = require('fs');
const argv = require('yargs').argv;

const cobertura = require('./parsers/cobertura');

const parsers = [cobertura];
let files = argv.i;
let output = [];
let parsedFiles = 0;

if (!Array.isArray(files)) {
  files = [files];
}


const onFileComplete = (result) => {
  output = output.concat(result);
  
  ++parsedFiles;
  allFilesComplete();
}


const allFilesComplete = () => {
  if (parsedFiles == files.length) {
    console.log(output);
  }
}

files.forEach(filename => {
  const fileContent = fs.readFileSync(filename, 'utf8');

  parsers.forEach(parser => {
    if (parser.fileCheck(fileContent)) {
      parser.parse(fileContent, (err, result) => {
        onFileComplete(result);
      });
    }
  });
});
