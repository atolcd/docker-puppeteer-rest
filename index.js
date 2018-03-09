'use strict'

const puppeteer = require('puppeteer');
const fs = require('fs');
const resolve = require('path').resolve;
const app = require('express')();

const resultDir = '/result';
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const resultBaseUrl = baseUrl + resultDir;

var browser = null;

fs.mkdirSync(resolve(resultDir));

app.listen(3000);

app.route('/pdf/:url/:output')
  .get(async (req, res) => {
    const url = req.params.url;
    const filename = req.params.output;

    if (browser === null) { // Is there a better way to get only one instance of browser ?
      browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });
    }
    const page = await browser.newPage();

    // Do we need more params ? 
    await page.emulateMedia('screen');
    await page.goto(url);
    await page.pdf({
      path: resolve(resultDir + '/' + filename), format: 'A4'
    });

    //TODO: Add some error handling
    res.send(JSON.stringify({
      'url': resultBaseUrl + '/' + filename
    }));
  });

//TODO: Is there a better way ?
app.route(resultDir + '/:filename')
  .get((req, res) => {
    const filename = req.params.filename;

    res.sendFile(resolve(resultDir + '/' + filename));
  });