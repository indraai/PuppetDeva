// Copyright (c) 2023 Quinn Michaels. All rights reserved.
// the func file for Puppet Deva
const fs = require('fs');
const path = require('path');

module.exports = {
  async chat(text) {
    this.context('chat_waiting');

    this.vars.resoonding = true;
    try {
      const  {selectors} = this.vars;

      await this.modules.page.type(selectors.textarea, ' ');

      const question = await this.modules.page.evaluate((opts) => {
        const textarea = document.querySelector(opts.selectors.textarea);
        textarea.value = opts.text;
      }, {text, selectors});

      await this.modules.page.waitForTimeout(1000);

      const submit = await this.modules.page.evaluate(selector => {
        const button = document.querySelector(selector);
        button.disabled = false;
        button.click();
      }, selectors.button);

      await this.modules.page.waitForTimeout(3000);

      this.context('chat_streaming');
      await this.modules.page.waitForSelector(this.vars.selectors.streaming, { hidden: true });

      this.context('chat_parsing');
      const answer = await this.modules.page.evaluate(prose => {
        const text = [];
        const ans = document.querySelectorAll(prose);
        const responseElement = ans[ans.length - 1];
        for (const child of responseElement.children) {
          text.push(child.textContent);
        }
        // responseElement.innerHTML = '';
        return text.join('\n\n');
      }, this.vars.selectors.prose);

      const response = {
        id: this.uid(true),
        text: this.utils.process(answer),
        created: Date.now(),
      };
      this.vars.response = response;
      this.vars.history.push(response);
      this.vars.resoonding = false;
      this.context('chat_answer');
      return Promise.resolve(response);
    } catch (e) {
      return Promise.reject(e)
    }
  },
  async items() {
    const  {selectors} = this.vars;
    const convo = await this.modules.page.url().split('/').pop();

    this.context('items_get');
    const items = await this.modules.page.$$eval(this.vars.selectors.items, opts => {
      return opts.map(opt => {
        let role = 'user';
        if (opt.innerHTML.includes('markdown prose')) role = 'chatgpt';
        try {
          let content, orig = opt.innerHTML;
          if (role === 'chatgpt') {
            content = opt.innerHTML.split('<div class="markdown prose w-full break-words dark:prose-invert light">')[1]
                        .split('</div></div></div>')[0];
          }
          else {
            content = opt.innerHTML.split('<div class="empty:hidden">')[1].split('</div>')[0]
          }
          return {role,content};
        } catch (e) {
          return {role, content:e};
        }
      })
    });
    this.context('items_assign');
    for (let x = 0; x < items.length; x++) {
      if (!items[x].content) continue;
      items[x].id = this.uid(true);
      items[x].logdate = Date.now();
      items[x].hash = this.hash(items[x].content, 'sha256');
    }
    return new Promise((resolve, reject) => {
      try {
        const data = {
          title: '#ChatGPT',
          date: this.formatDate(Date.now(), 'long', true),
          label: false,
          status: 'pending',
          convo,
          items,
        }
        // here we have the items that need to be written to a file.
        const logFile = path.join(this.config.dir, 'logs', 'convo', `${convo}.json`);
        this.context('items_write');
        fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
        this.context('items_return');
        return resolve(data);
      } catch (e) {
        reject(e);
      }
    });
  },
}
