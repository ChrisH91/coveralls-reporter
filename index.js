#!/usr/bin/env node
const fs = require('fs');
const argv = require('yargs').argv;

const cobertura = require('./parsers/cobertura');
const openCover = require('./parsers/open-cover');
const publish = require('./publish');

const parsers = [cobertura, openCover];

let serviceName = argv.service_name || 'Coveralls Reporter';
let coverallsEndpoint = argv.endpoint;
let buildNumber = argv.build_number;
let repoToken = argv.repo_token;
let commitHash = argv.commit_hash;
let committerName = argv.committer_name;
let committerEmail = argv.committer_email;
let commitMessage = argv.commit_message;
let gitBranch = argv.git_branch;
let sourceFolder = argv.source_folder;
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
    const result = {
      repo_token: repoToken,
      service_name: serviceName,
      service_job_id: buildNumber,
      source_files: output,
      git: {
        head: {
          id: commitHash,
          committer_name: committerName,
          committer_email: committerEmail,
          message: commitMessage
        },
        branch: gitBranch
      }
    };

    publish(result, coverallsEndpoint);
  }
}

files.forEach(filename => {
  const fileContent = fs.readFileSync(filename, 'utf8');

  parsers.forEach(parser => {
    if (parser.fileCheck(fileContent)) {
      parser.parse(fileContent, { sourceFolder }, (err, result) => {
        onFileComplete(result);
      });
    }
  });
});
