const qrcode = require('qrcode-terminal');
const fs = require('fs');

const { Client } = require('whatsapp-web.js');
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr: any) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

type TMention = {
  pushname: string;
};
type TMsg = {
  body: string;
  getMentions: () => TMention[];
  reply: (msg: string) => void;
};

client.on('message', async (msg: TMsg) => {
  if (msg.body.includes('!jod')) {
    const mentions = await msg.getMentions();
    if (msg.body.includes('add')) {
      for (let contact of mentions) {
        msg.reply(`@${contact.pushname} has made a Joke of the Day!`);
        // create a json file with the name of the person and increment the count
        fs.readFile(
          'jokes.json',
          'utf8',
          function readFileCallback(err: unknown, data: any) {
            if (err) {
              console.log(err);
            } else {
              const obj = JSON.parse(data); //now it an object
              console.log({ obj });
              if (obj[contact.pushname] === undefined) {
                obj[contact.pushname] = 1;
              } else {
                obj[contact.pushname] = obj[contact.pushname] + 1;
              }
              console.log('added to obj!', obj);
              const json = JSON.stringify(obj); //convert it back to json
              fs.writeFile('jokes.json', json, 'utf8', function (err: unknown) {
                if (err) throw err;
                console.log('complete');
              }); // write it back
            }
          }
        );
      }
    } else {
      for (let contact of mentions) {
        console.log(`${contact.pushname} was mentioned`);

        fs.readFile(
          'jokes.json',
          'utf8',
          function readFileCallback(err: unknown, data: any) {
            if (err) {
              console.log(err);
            } else {
              const obj = JSON.parse(data); //now it an object
              console.log({ obj });
              if (obj[contact.pushname] !== undefined) {
                const num = obj[contact.pushname];
                msg.reply(`@${contact.pushname} has ${num} JODs`);
              } else {
                msg.reply(`@${contact.pushname} has 0 JODs. Sad in a way`);
              }
            }
          }
        );
      }
    }
  }
});

client.initialize();
