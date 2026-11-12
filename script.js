// ---------- Elements ----------
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const message = document.getElementById("message");
const card = document.getElementById("weather-card");
const placeName = document.getElementById("place-name");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");

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
  showWeather(place, weather); // M4
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


// ---------- 6. Weather code → words + icon ----------
// Codes come from the World Meteorological Organization (WMO).
const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️", nightIcon: "🌙" },
  1: { label: "Mainly clear", icon: "🌤️", nightIcon: "🌙" },
  2: { label: "Partly cloudy", icon: "⛅", nightIcon: "☁️" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Freezing fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  56: { label: "Freezing drizzle", icon: "🌧️" },
  57: { label: "Heavy freezing drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌧️" },
  67: { label: "Heavy freezing rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "🌨️" },
  80: { label: "Light showers", icon: "🌦️" },
  81: { label: "Showers", icon: "🌧️" },
  82: { label: "Violent showers", icon: "⛈️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Thunderstorm with heavy hail", icon: "⛈️" },
};

function describeWeather(code, isDay) {
  const info = WEATHER_CODES[code] ?? { label: "Unknown", icon: "🌡️" };
  const icon = !isDay && info.nightIcon ? info.nightIcon : info.icon;
  return { label: info.label, icon: icon };
}


// ---------- 7. Place → "Lagos, Nigeria" / "London, England, United Kingdom" ----------
function formatPlaceName(place) {
  const parts = [place.name];
  if (place.admin1 && place.admin1 !== place.name) parts.push(place.admin1);
  if (place.country) parts.push(place.country);
  return parts.join(", ");
}

// ---------- 8. Put the weather on the page ----------
function showWeather(place, weather) {
  const description = describeWeather(weather.weather_code, weather.is_day);

  placeName.textContent = formatPlaceName(place);
  weatherIcon.textContent = description.icon;
  temperature.textContent = `${Math.round(weather.temperature_2m)}°C`;
  condition.textContent = description.label;
  feelsLike.textContent = `${Math.round(weather.apparent_temperature)}°C`;
  humidity.textContent = `${weather.relative_humidity_2m}%`;
  wind.textContent = `${Math.round(weather.wind_speed_10m)} km/h`;

  message.textContent = "";  // clear the welcome message
  card.hidden = false;       // reveal the card
}

