const fs = require('fs');
const path = require('path');
module.exports = {
  translate(input) {
    return input.trim();
  },
  parse(input) {
    const regLabel = new RegExp('(.+):\s(.+)?');
    return input.split('\n\n').map(p => {
      if (regLabel.exec(p)) return p;
      else if (p.length && p !== '\n') return `p: ${p}`;
    }).join('\n\n');
  },
  process(input) {
    const theFile = fs.readFileSync(path.join(__dirname, 'data.json'));
    const theData = JSON.parse(theFile).DATA;
    const {cleaner} = theData;

    if (!Oject.keys(cleaner)) return input;
    
    const clean = input.split('\n\n').length ? input.split('\n\n') : input;
    const cleaned = [];

    // loop over paragraph text
    for (const x of clean) {
      let _clean = x;
      // loop cleaner data
      for (const y in cleaner) {
        const cReg = new RegExp(y, 'g');
        const isDirty = cReg.exec(_clean) || false;
        if (isDirty) _clean = _clean.replace(cReg, cleaner[y]);
      }
      cleaned.push(_clean)
    }
    return cleaned.join('\n\n');
  },
}
