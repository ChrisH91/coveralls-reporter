const parseXml = require('xml2js').parseString;
const path = require('path');
const checksum = require('checksum');
const slash = require('slash');

const buildFileList = (module) => {
  let files = {};

  module.Files[0].File.forEach(file => {
    files[file.$.uid] = file.$.fullPath;
  });

  return files;
}

const reduceClassList = (module) => {
  let sequencePoints = [];

  module.Classes[0].Class.forEach(c => {
    if (c.Methods[0] === '') {
      return;
    }
    
    c.Methods[0].Method.forEach(m => {
      if (m.SequencePoints[0] === '') {
        return;
      }

      m.SequencePoints[0].SequencePoint.forEach(s => {
        sequencePoints.push({ fileId: s.$.fileid, lineNumber: s.$.sl, hits: s.$.vc });
      });
    });
  });

  return sequencePoints;
}

const parseSequencePoints = (fileList, sequencePoints, sourceFolder) => {
  const result = [];
  const coverage = [];

  let currentFileId = sequencePoints[0].fileId;
  
  var fileSequencePoints = sequencePoints.reduce((acc, current) => {
    if (!acc[current.fileId]) {
      acc[current.fileId] = [];
    }

    let counter = acc[current.fileId];

    while(counter < current.lineNumber - 1) {
      acc[current.fileId][counter] = null;
      ++counter;
    }

    acc[current.fileId][current.lineNumber - 1] = current.hits;
    return acc;
  }, {});

  Object.keys(fileSequencePoints).forEach(key => {
    result.push({
      name: slash(path.relative(sourceFolder, fileList[key])),
      sourceDigest: checksum(fileList[key]),
      coverage: fileSequencePoints[key]
    });
  });

  return result;
};

module.exports = {
  fileCheck: (input) => input.indexOf('<CoverageSession') !== -1,
  parse: (input, opts, callback) => {
    parseXml(input, (err, result) => {
      if (err) {
        callback(err);
        return;
      }

      let results;

      result.CoverageSession.Modules[0].Module.forEach(module => {
        if (module.$.skippedDueTo) {
          return;
        }

        const files = buildFileList(module);
        const sequencePoints = reduceClassList(module);

        results = parseSequencePoints(files, sequencePoints, opts.sourceFolder);
      });

      callback(null, results);
    });
  }
};
