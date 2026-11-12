// ---------- Elements ----------
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");

// ---------- API addresses ----------
const PLACE_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

// ---------- 1. City name → list of matching places ----------
async function findPlaces(city) {
  const url = `${PLACE_API}?name=${encodeURIComponent(city)}&count=10`;

  const response = await fetch(url); // send the request and WAIT for the reply
  const data = await response.json(); // WAIT while the reply is turned into an object

  return data.results ?? []; // no matches? return an empty list
}

// ---------- 2. Coordinates → current weather ----------
async function getWeather(latitude, longitude) {
  const url =
    `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day" +
    "&timezone=auto";

  const response = await fetch(url);
  const data = await response.json();

  return data.current; // just the "current" part
}

// ---------- When the person searches ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page reloading

  const city = input.value.trim();
  if (city === "") return;

  const places = await findPlaces(city);
  console.log("Places found:", places);

  if (places.length === 0) {
    console.log("No places found");
    return;
  }

  const place = places[0]; // the first (best) match
  const weather = await getWeather(place.latitude, place.longitude);
  console.log("Weather:", weather);
});
