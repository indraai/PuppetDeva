module.exports = {
  /**************
  method: click
  params: packet
  describe: click the latest conversation and collecte data.
  ***************/
  async click(packet) {
    this.context('click');

    this.context('click_waiting');
    await this.modules.page.waitForSelector(this.vars.selectors.conversation);
    await this.modules.page.click(this.vars.selectors.conversation);

    // here we are going to setup getting the conversation informaton
    // "chatId":"(.+?)"
    // "user":{"id":"(.+?)","name":"(.+?)"
    // script id="__NEXT_DATA__"

    await this.modules.page.waitForSelector(this.vars.selectors.prose);
    const convoId = await this.modules.page.url().split('/').pop();

    this.context('click_conversation');
    this.vars.conversation.id = convoId;

    this.context('click_collect');

    const items = await this.func.items();

    this.context('click_done');
    return Promise.resolve(this.vars.messages.click)
  },
  /**************
  method: regenerate
  params: packet
  describe: regenerate the latest conversation and collecte data.
  ***************/
  async regenerate(packet) {
    const agent = this.agent();
    this.context('regenerate');

    await this.modules.page.waitForSelector(this.vars.selectors.conversation);
    await this.modules.page.click(this.vars.selectors.regenerate);
    this.vars.resoonding = true;

    this.context('regenerate_waiting');
    await this.modules.page.waitForTimeout(3000);

    this.context('regenerate_streaming');
    await this.modules.page.waitForSelector(this.vars.selectors.streaming, { hidden: true });

    this.context('regenerate_parsing');
    const answer = await this.modules.page.evaluate(() => {
      const text = [], html = [];
      const ans = document.querySelectorAll(this.vars.selectors.prose);
      const responseElement = ans[ans.length - 1];
      for (const child of responseElement.children) {
        text.push(child.textContent);
        html.push(child.innerHTML);
      }
      responseElement.innerHTML = '';
      return {
        text: text.join('\n\n'),
        html: html.join('\n\n'),
      };
    });
    return new Promise((resolve, reject) => {
      this.vars.response = {
        id: this.uid(true),
        text: this.utils.process(answer.text),
        html: answer.html,
        created: Date.now(),
      };
      this.vars.history.push(this.vars.response);
      this.vars.resoonding = false;

      this.context('regenerate_feecting');
      this.question(`#feecting parse:${agent.key} ${this.vars.response.text}`).then(feecting => {
        this.context('regenerate_done');
        return resolve({
          text: answer.a.text,
          html: answer.a.html,
          data: {
            response: this.vars.response,
            feecting: feecting.a.data
          },
        });
      }).catch(err => {
        return this.error(err, packet, reject);
      });
    });
  },

  /**************
  method: chat
  params: packet
  describe: chat with the user interface AI
  ***************/
  chat(packet) {
    this.context('chat');
    const agent  = this.agent();
    const data = {};
    return new Promise((resolve, reject) => {

      const role = packet.q.meta.params[1] || this.vars.role;
      const from = role === 'user' ? this.client().profile.name : packet.q.agent.profile.name;
      const content = [
        `id: ${packet.id}`,
        `from: ${from}`,
        `date: ${this.formatDate(Date.now(), 'long', true)}`,
        `::begin:content:${packet.id}`,
        packet.q.text,
        `::end:content:${packet.q.meta.hash}`,
        // `date: ${this.formatDate(Date.now(), 'long', true)}`,
      ].join('\n');

      this.prompt(`chatt get here ${role}`);

      this.func.chat(content).then(chat => {
        const text = [
          `::begin:${agent.key}:${packet.id}`,
          this.utils.parse(chat.text),
          `::end:${agent.key}:${this.hash(chat.text)}`,
        ].join('\n');
        this.context('chat_feecting');
        return this.question(`#feecting parse ${text}`);
      }).then(feecting => {
        data.feecting = feecting.a.data;
        this.context('chat_done');
        return resolve({
          text: feecting.a.text,
          html: feecting.a.html,
          data: {
            response: this.vars.response,
            feecting: feecting.a.data
          },
        });
      }).catch(err => {
        return this.error(err, packet, reject);
      })
    });
  },

  /**************
  func: relay
  params: packet
  describe: the relay method provides a data relay without formatting.
  ***************/
  relay(packet) {
    this.context('relay');
    const agent  = this.agent();
    return new Promise((resolve, reject) => {
      this.func.chat(packet.q.text).then(response => {
        return resolve({
          text: this.utils.parse(response.text),
          html: false,
          data: response,
        });
      }).catch(err => {
        return this.error(err, packet, reject);
      })
    });
  },

  /**************
  func: shuttle
  params: packet
  describe: shuttle a response to the open deva.
  ***************/
  shuttle(packet) {
    this.context('shuttle');
    return Promise.resolve({text:this.vars.response.text});
  },

  /**************
  method: items
  params: packet
  describe: collect imtes from current puppet chat and write to a local json file.
  ***************/
  items(packet) {
    return new Promise((resolve, reject) => {
      this.context('items');
      this.func.items().then(items => {
        this.context('items_done');
        return resolve({
          text: items.convo,
          html: items.convo,
          data: items,
        });
      }).catch(err => {
        return this.error(err, packet, reject);
      })
    });
  }
}
