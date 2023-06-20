// Copyright (c)2023 Quinn Michaels
// Puppeteer Deva
const Deva = require('@indra.ai/deva');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  version: package.version,
  describe: package.description,
  dir: __dirname,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  license: package.license,
  author: package.author,
  copyright: package.copyright,
};

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).DATA;

const PUTTPET = new Deva({
  info,
  agent,
  vars,
  utils: require('./_utils.js'),
  listeners: {},
  modules: {
    browser: false,
    page: false,
  },
  func: require('./_func.js'),
  methods: require('./_methods.js'),
  async onDone(data) {
    const services = this.services();
    this.modules.browser = await puppeteer.connect({
        browserWSEndpoint: services.personal.browser,
    });
    this.modules.page = await this.modules.browser.newPage();
    await this.modules.page.setViewport({
      width: services.personal.viewport.width,
      height: services.personal.viewport.height,
      deviceScaleFactor: services.personal.viewport.scale,
    });
    this.modules.page.goto(services.personal.url);
    return Promise.resolve(data);
  }
});
module.exports = PUTTPET
