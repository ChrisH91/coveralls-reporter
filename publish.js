const unirest = require('unirest');
const stream = require('stream');
const fs = require('fs');

module.exports = (results, endpoint) => {

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  unirest.post('https://coveralls.engr.loopup.com/api/v1/jobs')
    .headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
    .send(`json=${JSON.stringify(results)}`)
    .end(response => console.log(response.body));
}