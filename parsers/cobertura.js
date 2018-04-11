const parseXml = require('xml2js').parseString;
const path = require('path');
const checksum = require('checksum');

module.exports = {
  fileCheck: (input) => input.indexOf('cobertura'),
  parse: (input, callback) => {
    parseXml(input, (err, result) => {
      if (err) {
        callback(err);
        return;
      }

      const results = [];

      const sourcePath = result.coverage.sources[0].source[0];

      result.coverage.packages.forEach(classList => {
        classList.class.forEach(classDef => {
          const fileCheckSum = checksum(path.join(sourcePath, classDef.$.filename));
          var lineHits = []

          classDef.lines.forEach(lines => {
            lines.line.forEach(line => {
              lineHits.length = line.$.number;
              lineHits.fill(null, results.length, line.$.number - 1);
              lineHits[line.$.number - 1] = parseInt(line.$.hits);
            });
          });

          results.push({
            name: classDef.$.filename,
            source_digest: fileCheckSum,
            coverage: lineHits
          });
        });
      });

      callback(null, results);
    });
  }
};
