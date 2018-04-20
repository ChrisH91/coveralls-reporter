const parseXml = require('xml2js').parseString;
const path = require('path');
const checksum = require('checksum');
const slash = require('slash');

module.exports = {
  fileCheck: (input) => input.indexOf('cobertura') !== -1,
  parse: (input, opts, callback) => {
    parseXml(input, (err, result) => {
      if (err) {
        callback(err);
        return;
      }

      const results = [];

      const sourcePath = result.coverage.sources[0].source[0];

      result.coverage.packages.forEach(package => {
        package.package.forEach(packageList => {
          packageList.classes.forEach(classList => {
            classList.class.forEach(classDef => {
              const fileCheckSum = checksum(path.join(sourcePath, classDef.$.filename));
              var lineHits = []

              classDef.lines.forEach(lines => {
                lines.line.forEach(line => {
                  let counter = lineHits.length;

                  while(counter < line.$.number - 1) {
                    lineHits[counter] = null;
                    ++counter;
                  }

                  lineHits[line.$.number - 1] = parseInt(line.$.hits);
                });
              });

              results.push({
                name: slash(classDef.$.filename),
                source_digest: fileCheckSum,
                coverage: lineHits
              });
            });
          });
        });
      });

      callback(null, results);
    });
  }
};
