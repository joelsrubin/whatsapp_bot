import WAWebJS, {
  LocalAuth,
  GroupNotification,
  GroupChat,
} from 'whatsapp-web.js';
import { formatOrdinals } from './helpers';

import { writeFile, readFile } from 'node:fs/promises';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { Client } from 'whatsapp-web.js';

dotenv.config();
let count = 0;
export const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('ready', () => {
  console.log('Client is ready!');
});

type TMention = {
  pushname: string;
};

const msgsWithReactions: {
  [key: string]: number;
} = {};

// client.on('message_reaction', async (rx) => {
//   const { msgId, id } = rx;
//   const idxId = String(msgId._serialized);
//   if (msgsWithReactions[idxId]) {
//     console.log('msgsWithReactions[idxId]', msgsWithReactions[idxId]);
//     msgsWithReactions[idxId] = msgsWithReactions[idxId] + 1;
//   } else {
//     console.log("reaction doesn't exist");
//     msgsWithReactions[idxId] = 1;
//   }

//   if (msgsWithReactions[idxId] === 3) {
//     const chats = await client.getChats();
//     console.log(chats);
//     const chat = chats.find((c) => c.id._serialized === id._serialized);
//     console.log(chat);
//     chat && client.sendMessage(chat?.id._serialized, '3 reactions, nice!');
//   }
// });
// function addMinutes(date: Date, minutes: number) {
//   return new Date(date.getTime() + minutes * 60000);
// }
// client.on('message', async (msg) => {
//   if (msg.body === '!muting') {
//     msg.react('🤫');
//     msg.reply('Muting for 1 hour');
//     await client.muteChat(msg.from);
//   }
// });

// weather
client.on('message', async (msg) => {
  if (msg.body === '!weather') {
    const weather = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=${process.env.API_KEY}`
    );
    const weatherJson = await weather.json();

    //function convertin kelvin to fahrenheit
    function convertKelvinToFahrenheit(kelvin: number) {
      return Math.round((kelvin - 273.15) * 1.8 + 32);
    }
    msg.reply(
      `🤖 The weather in New York is ${convertKelvinToFahrenheit(
        weatherJson.main.feels_like
      )} degrees and ${weatherJson.weather[0].main}`
    );

    msg.react('🌞');
  }
});

// pickle ball
client.on('message', async (msg) => {
  console.log('MESSAGE RECEIVED', msg.body);
  if (msg.body.includes('!pickle')) {
    msg.react('🏓');
    const scores = await readFile('scores.json', 'utf-8');
    const parsedScores = await JSON.parse(scores);
    const entries = Object.entries(parsedScores);
    msg.reply(
      `🤖 The scores are currently: ${entries
        .map(([name, score]) => `${name}: ${score}`)
        .join(', ')}`
    );
  }
  if (msg.body.includes('!pants')) {
    msg.react('👖');

    const { author } = msg;

    const data = await readFile('pants.json', 'utf8');
    const obj = JSON.parse(data);

    console.log({ obj });
    if (author) {
      const { name } = await client.getContactById(author);
      if (name) {
        if (obj[name] === undefined) {
          obj[name] = 1;
        } else {
          obj[name] = obj[name] + 1;
        }
        console.log('added to obj!', obj);
        setTimeout(() => {
          msg.reply(
            `🤖 This is ${name}'s ${formatOrdinals(obj[name])} pants alert!`
          );
        }, 1000);
      }
    }

    const json = JSON.stringify(obj); //convert it back to json
    await writeFile('pants.json', json, 'utf8');

    console.log('complete');

    const curChat = (await msg.getChat()) as GroupChat;
    const { participants } = curChat;
    let mentions = [];
    let text = '🤖 Pants Alert 🚨! ';
    for (let participant of participants) {
      const contact = await client.getContactById(participant.id._serialized);

      mentions.push(contact);
      text += `@${participant.id.user} `;
    }

    await curChat.sendMessage(text, { mentions });
  }

  // Rob-ot
  if (msg.body.includes('!rob')) {
    count += 1;
    msg.reply('good morning rob 🤖. you have said hi ' + count + ' times');
  }

  // JOD
  if (msg.body.includes('!jod')) {
    const mentions = await msg.getMentions();
    if (msg.body.includes('add')) {
      for (let contact of mentions) {
        msg.reply(`🤖 @${contact.pushname} has made a Joke of the Day!`);
        // create a json file with the name of the person and increment the count
        const data = await readFile('jokes.json', 'utf8');

        const obj = JSON.parse(data);

        console.log({ obj });
        if (obj[contact.pushname] === undefined) {
          obj[contact.pushname] = 1;
        } else {
          obj[contact.pushname] = obj[contact.pushname] + 1;
        }
        console.log('added to obj!', obj);
        const json = JSON.stringify(obj); //convert it back to json
        await writeFile('jokes.json', json, 'utf8');
      }
    } else {
      for (let contact of mentions) {
        console.log(`${contact.pushname} was mentioned`);
        const data = await readFile('jokes.json', 'utf8');
        const obj = JSON.parse(data);
        console.log({ obj });
        if (obj[contact.pushname] !== undefined) {
          const num = obj[contact.pushname];
          msg.reply(`🤖 @${contact.pushname} has ${num} JODs`);
        } else {
          msg.reply(`🤖 @${contact.pushname} has 0 JODs. Sad in a way`);
        }
      }
    }
  }
});
