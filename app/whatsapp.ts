import { LocalAuth, GroupChat, NoAuth, MessageMedia } from 'whatsapp-web.js';
import { formatOrdinals } from './helpers';

import { writeFile, readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Client } from 'whatsapp-web.js';
import { getGif, getMovie, getProduct, getWeather } from './services';
const qrcode = require('qrcode-terminal');

dotenv.config();

let count = 0;
const prisma = new PrismaClient();

export const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'one', dataPath: './auth' }),
  puppeteer: {
    args: ['--no-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

// weather

client.on('message', async (msg) => {
  if (msg.body.includes("And that's ok!")) {
    const chat = await msg.getChat();
    if (chat.name === 'Hunkomania') {
      chat.sendMessage('🤖 is it, sis?');
    }
  }
});

client.on('message', async (msg) => {
  if (msg.body.includes('!kramer')) {
    const chat = await msg.getChat();
    const gif = await getGif();
    const media = await MessageMedia.fromUrl(gif);
    chat.sendMessage(media);
  }
});

client.on('message', async (msg) => {
  if (msg.body.includes('!gif')) {
    msg.react('📽');
    const query = msg.body.split('!gif')[1];
    console.log({ query });
    const chat = await msg.getChat();
    try {
      const gif = await getGif(query);
      const media = await MessageMedia.fromUrl(gif);
      chat.sendMessage(media);
    } catch {
      msg.reply('🤖 I could not find a gif for that');
    }
  }
});

client.on('message', async (msg) => {
  if (msg.body === '!weather') {
    const chat = await msg.getChat();
    msg.react('🌞');
    const { temp, condition } = await getWeather();
    chat.sendMessage(
      `🤖 The weather in New York is ${temp} degrees and ${condition}`
    );
  }
});

// bad movie reviews
const badReviews = [
  'Yikes. Not exactly the Godfather 😂',
  "I don't recommend it.",
  "I wouldn't go there if I were you.",
  'I would not recommend this movie.',
];

// average movie reviews
const averageReviews = [
  'It sounds ok.',
  'It sounds alright.',
  'It sounds good.',
  '...ok.',
];

// good movie reviews
const goodReviews = [
  'This sounds like a winner!',
  'I love this movie!',
  'I would watch this!',
  'I would recommend this movie.',
  'I would watch this movie again.',
  'I would watch this movie again and again.',
  'Definite Tuffies Contender',
];

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  if (msg.body.includes('!product')) {
    msg.react('🚀');
    const topTen = await getProduct();

    chat.sendMessage(
      `🤖 Here are the top ten products on Product Hunt today: \n\n${topTen}`
    );
  }
});

// movies
client.on('message', async (msg) => {
  const chat = await msg.getChat();
  if (msg.body.includes('!movies')) {
    msg.react('🍿');
    const { title, releaseDate, reviews } = await getMovie();
    if (reviews < 3) {
      chat.sendMessage(
        `🤖 ${title} came out on ${releaseDate} and has a rating of ${reviews}. ${
          badReviews[Math.floor(Math.random() * badReviews.length)]
        }`
      );
    } else if (reviews > 7) {
      console.log('movie is good');
      chat.sendMessage(
        `🤖 ${title} came out on ${releaseDate} and has a rating of ${reviews}. ${
          goodReviews[Math.floor(Math.random() * goodReviews.length)]
        }`
      );
    } else {
      chat.sendMessage(
        `🤖 How about ${title}? It has an average rating of ${reviews} and was released ${releaseDate}. ${
          averageReviews[Math.floor(Math.random() * averageReviews.length)]
        }`
      );
    }
  }
});

client.on('message', async (msg) => {
  if (msg.body.includes('!goodnight')) {
    msg.reply('🤖 Goodnight, sweet dreams!');
  }
});
// pickle ball
client.on('message', async (msg) => {
  console.log('MESSAGE RECEIVED', msg.body);
  if (msg.body.includes('!pickle')) {
    msg.react('🏓');
    const scores = await readFile('./data/scores.json', 'utf-8');
    const parsedScores = await JSON.parse(scores);
    const entries = Object.entries(parsedScores);
    msg.reply(
      `🤖 The scores are currently: ${entries
        .map(([name, score]) => `${name}: ${score}`)
        .join(', ')}`
    );
  }

  // pants alert
  if (msg.body.includes('!pants')) {
    msg.react('👖');

    const { author } = msg;

    if (author) {
      // find user in db and update pantsAlert
      const user = await prisma.user.findFirst({
        where: {
          name: author,
        },
      });
      let pantsCount = Number(user?.pantsAlert);
      if (!user) {
        await prisma.user.create({
          data: {
            name: author,
            pantsAlert: 1,
          },
        });
      } else {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            pantsAlert: (pantsCount += 1),
          },
        });

        setTimeout(() => {
          msg.reply(
            `🤖 This is ${user.name}'s ${formatOrdinals(
              pantsCount
            )} pants alert!`
          );
        }, 1000);
      }
    }

    const curChat = (await msg.getChat()) as GroupChat;
    if (curChat.isGroup) {
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
  }

  // Rob-ot
  if (msg.body.includes('!rob')) {
    count += 1;
    msg.reply('good morning rob 🤖. you have said hi ' + count + ' times');
  }

  // JOD
  if (msg.body.includes('!jod')) {
    const chat = await msg.getChat();
    const mentions = await msg.getMentions();
    if (msg.body.includes('add')) {
      for (let contact of mentions) {
        chat.sendMessage(`🤖 @${contact.id.user} has made a Joke of the Day!`, {
          mentions: [contact],
        });
        // create a json file with the name of the person and increment the count
        const user = await prisma.user.findFirst({
          where: {
            name: contact.id.user,
          },
        });
        let jodCount = Number(user?.jods);
        if (!user) {
          await prisma.user.create({
            data: {
              name: contact.id.user,
              jods: 1,
            },
          });
        } else {
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              jods: (jodCount += 1),
            },
          });
        }
      }
    } else {
      for (let contact of mentions) {
        console.log(`${contact.pushname} was mentioned`);
        const user = await prisma.user.findFirst({
          where: {
            name: contact.id.user,
          },
        });
        let jodCount = Number(user?.jods);
        if (!user) {
          await prisma.user.create({
            data: {
              name: contact.id.user,
              jods: 0,
            },
          });
        }

        if (jodCount) {
          chat.sendMessage(`🤖 @${contact.id.user} has ${jodCount} JODs`, {
            mentions: [contact],
          });
        } else {
          chat.sendMessage(`🤖 @${contact.id.user} has 0 JODs. Sad in a way`, {
            mentions: [contact],
          });
        }
      }
    }
  }
});
