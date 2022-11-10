import * as dotenv from 'dotenv';

dotenv.config();

export async function getGif(query: string = 'kramer') {
  console.log({ query });
  const result = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIF_KEY}&q=${query}&limit=25&offset=0&rating=g&lang=en`
  );
  const data = await result.json();
  const random = Math.floor(Math.random() * data.data.length);
  const gif = data.data[random].images.original.url;
  return gif;
}

export async function getWeather() {
  const weather = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=${process.env.API_KEY}`
  );
  const weatherJson = await weather.json();

  //function convertin kelvin to fahrenheit
  function convertKelvinToFahrenheit(kelvin: number) {
    return Math.round((kelvin - 273.15) * 1.8 + 32);
  }
  return {
    temp: convertKelvinToFahrenheit(weatherJson.main.feels_like),
    condition: convertKelvinToFahrenheit(weatherJson.weather[0].main),
  };
}

export async function getProduct() {
  const data = await fetch('https://api.producthunt.com/v1/posts', {
    headers: {
      Authorization: `Bearer ${process.env.PRODUCT_HUNT_KEY}`,
    },
  });
  const dataJson = await data.json();
  const products = dataJson.posts;
  // map over products and return the top ten by votes_count
  const topTen = products
    .sort((a: any, b: any) => b.votes_count - a.votes_count)
    .slice(0, 10)
    .map(
      (product: any, idx: number) =>
        `${idx + 1}. ${product.name} - ${product.tagline} - ${
          product.votes_count
        } votes`
    )
    .join('\n');
  return topTen;
}

export async function getMovie() {
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
  return {
    title: randomMovie.original_title,
    releaseDate: result,
    reviews: randomMovie.vote_average,
  };
}
