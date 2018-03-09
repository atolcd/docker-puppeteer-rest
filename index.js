'use strict'

const puppeteer = require('puppeteer');
const fs = require('fs');
const resolve = require('path').resolve;
const app = require('express')();

const rootPath = process.env.ROOT_PATH || '';
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const resultBaseUrl = baseUrl + '/result';

const send = function (res, obj) {
  res.status(obj.status);
  for (let key in obj.headers) {
    res.setHeader(key, obj.headers[key]);
  }
  res.send(JSON.stringify(obj.body));
}

var browser = null;

if (!fs.existsSync(resolve(rootPath + '/result'))) {
  fs.mkdirSync(resolve(rootPath + '/result'));
}

app.listen(3000);

app.route('/pdf/:url/:output')
  .get(async (req, res) => {
    let result = {
      status: 200,
      body: {},
      headers: {}
    };
    const url = req.params.url;
    const filename = req.params.output;

    try {
      if (browser === null) { // Is there a better way to get only one instance of browser ?
        browser = await puppeteer.launch({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        });
      }
      const page = await browser.newPage();
      //TODO: Do we need more params ? 
      await page.emulateMedia('screen');
      await page.goto(url);
      await page.pdf({
        path: resolve(rootPath + '/result/' + filename), format: 'A4'
      });

      result.status = 200;
      result.body = {
        'url': resultBaseUrl + '/' + filename
      };
      result.headers = {
        "Content-Type": "application/json"
      };
    } catch (e) {
      result.status = 500;
      result.body = {
        'message': e.message
      };
      result.headers = {
        "Content-Type": "application/json"
      };
    }

    send(res, result);
  });

//TODO: Is there a better way ?
app.route('/result/:filename')
  .get((req, res) => {
    const filename = req.params.filename;

    res.sendFile(resolve(rootPath + '/result/' + filename));
  })
  .delete((req, res) => {
    fs.unlinkSync(resolve(rootPath + '/result/' + filename));

    send(res, {
      status: 200,
      body: { message: filename + ' was delete' },
      headers: { "Content-Type": "application/json" }
    });
  });