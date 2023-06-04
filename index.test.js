// Copyright (c)2023 Quinn Michaels
// Puppeteer Deva test file

const {expect} = require('chai')
const puttpet = require('./index.js');

describe(puttpet.me.name, () => {
  beforeEach(() => {
    return puttpet.init()
  });
  it('Check the DEVA Object', () => {
    expect(puttpet).to.be.an('object');
    expect(puttpet).to.have.property('agent');
    expect(puttpet).to.have.property('vars');
    expect(puttpet).to.have.property('listeners');
    expect(puttpet).to.have.property('methods');
    expect(puttpet).to.have.property('modules');
  });
})
