// Copyright (c) 2023 Quinn Michaels. All rights reserved.
// the func file for Puppet Deva
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
        responseElement.innerHTML = '';
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
      Promise.reject(e)
    }
  },
  async items() {
    this.context('items');
    const  {selectors} = this.vars;
    const items = await this.modules.page.$$eval(this.vars.selectors.items, opts => {
      return opts.map(opt => {
        let role = 'client';
        if (opt.children.length) role = 'agent';
        const text = opt.textContent;
        const html = opt.innerHTML;
        opt.innerHTML = '';
        return {role,text,html};
      })
    });
    return items;
  },
}
