import { LocalAuth, GroupChat } from 'whatsapp-web.js';
import { formatOrdinals } from './helpers';

import { writeFile, readFile } from 'node:fs/promises';
import * as dotenv from 'dotenv';
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

console.log(process.env.API_KEY);
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

// movies
client.on('message', async (msg) => {
  const chat = await msg.getChat();

  if (msg.body.includes('!movies')) {
    msg.react('🍿');
    // function to get random year between 1970 and 2022
    function getRandomYear() {
      return Math.floor(Math.random() * (2022 - 1950 + 1) + 1951);
    }
    const randomYear = getRandomYear();
    const randomPage = Math.floor(Math.random() * 100 + 1);
    const movies = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.MOVIE_KEY}&language=en-US&sort_by=popularity.inc&include_adult=false&include_video=false&page=${randomPage}&with_genres=27&release_date.gte=${randomYear}-01-01`
    );
    const moviesJson = await movies.json();
    const randomMovie =
      moviesJson.results[Math.floor(Math.random() * moviesJson.results.length)];
    const date = randomMovie.release_date;
    const [year, month, day] = date.split('-');

    const result = [month, day, year].join('/');
    if (randomMovie.vote_average < 3) {
      chat.sendMessage(
        `🤖 ${randomMovie.title} came out on ${result} and has a rating of ${randomMovie.vote_average}. I don't recommend it.`
      );
    } else {
      chat.sendMessage(
        `🤖 How about ${randomMovie.original_title}? It has an average rating of ${randomMovie.vote_average} and was released ${result}`
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
    const scores = await readFile('scores.json', 'utf-8');
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
    const chat = await msg.getChat();
    const mentions = await msg.getMentions();
    if (msg.body.includes('add')) {
      for (let contact of mentions) {
        chat.sendMessage(`🤖 @${contact.id.user} has made a Joke of the Day!`, {
          mentions: [contact],
        });
        // create a json file with the name of the person and increment the count
        const data = await readFile('jokes.json', 'utf8');

        const obj = JSON.parse(data);

        if (obj[contact.pushname] === undefined) {
          obj[contact.pushname] = 1;
        } else {
          obj[contact.pushname] = obj[contact.pushname] + 1;
        }

        const json = JSON.stringify(obj); //convert it back to json
        await writeFile('jokes.json', json, 'utf8');
      }
    } else {
      for (let contact of mentions) {
        console.log(`${contact.pushname} was mentioned`);
        const data = await readFile('jokes.json', 'utf8');
        const obj = JSON.parse(data);

        if (obj[contact.pushname] !== undefined) {
          const num = obj[contact.pushname];
          chat.sendMessage(`🤖 @${contact.id.user} has ${num} JODs`, {
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
