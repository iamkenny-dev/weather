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
  event.preventDefault();

  const text = input.value.trim();
  if (text === "") return; // Risk 4: empty box

  const search = parseSearch(text); // Risk 6: "city, country"

  if (!hasLetters(search.city)) {
    // Risk 5: numbers only
    console.log("Please type a city name, not numbers.");
    return;
  }

  const places = await findPlaces(search.city);
  if (places.length === 0) {
    // Risk 1: not found
    console.log(
      `Couldn't find "${search.city}". Check the spelling or add the country.`,
    );
    return;
  }

  const matches = matchCountry(places, search.country);
  if (matches.length === 0) {
    // Risk 9: wrong country
    console.log(`Couldn't find "${search.city}" in ${search.country}.`);
    return;
  }

  const place = matches[0];
  console.log("Place:", place.name, "|", place.admin1, "|", place.country); // Risk 8: full name

  const weather = await getWeather(place.latitude, place.longitude);
  console.log("Weather:", weather);
});


// ---------- 3. Split "Lagos, Nigeria" into city + country ----------
function parseSearch(text) {
  const parts = text.split(",");            // "Lagos, Nigeria" → ["Lagos", " Nigeria"]
  const city = parts[0].trim();             // "Lagos"
  const country = (parts[1] ?? "").trim();  // "Nigeria", or "" if no comma
  return { city, country };
}

// ---------- 4. Does the text contain at least one letter? ----------
function hasLetters(text) {
  return /\p{L}/u.test(text);  // any letter, in any language
}

// ---------- 5. Keep only the places in the country the person typed ----------
// Nicknames people type → the official country code in the data
const COUNTRY_ALIASES = {
  uk: "gb",
  britain: "gb",
  "great britain": "gb",
  usa: "us",
  america: "us",
  uae: "ae",
  drc: "cd",
};

// ---------- 5. Keep only places matching the country (or region) typed ----------
function matchCountry(places, country) {
  if (country === "") return places;

  let wanted = country.toLowerCase();             // "UK" → "uk"
  wanted = COUNTRY_ALIASES[wanted] ?? wanted;     // "uk" → "gb" (or unchanged if no nickname)

  return places.filter(
    (place) =>
      place.country?.toLowerCase() === wanted ||       // "nigeria"
      place.country_code?.toLowerCase() === wanted ||  // "gb"
      place.admin1?.toLowerCase() === wanted           // region: "england", "ontario", "lagos"
  );
}