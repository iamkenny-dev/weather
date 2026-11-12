// ---------- Elements ----------
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const button = document.getElementById("search-button");
const message = document.getElementById("message");
const card = document.getElementById("weather-card");
const placeName = document.getElementById("place-name");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const localTime = document.getElementById("local-time");

// ---------- API addresses ----------
const PLACE_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

// ---------- 0. Fetch a URL and return its JSON, with friendly errors ----------
async function getJSON(url, serviceDownMessage) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    // fetch only fails like this when the request never reached the server
    throw new Error(
      "No internet connection. Check your connection and try again.",
    ); // Risk 2
  }
  if (!response.ok) throw new Error(serviceDownMessage); // Risk 3
  return response.json();
}

// ---------- 1. City name → list of matching places ----------
async function findPlaces(city) {
  const url = `${PLACE_API}?name=${encodeURIComponent(city)}&count=10`;
  const data = await getJSON(
    url,
    "The location service isn't responding. Try again in a minute.",
  );
  return data.results ?? [];
}

// ---------- 2. Coordinates → current weather ----------
async function getWeather(latitude, longitude) {
  const url =
    `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day" +
    "&timezone=auto";
  const data = await getJSON(
    url,
    "The weather service isn't responding. Try again in a minute.",
  );
  return data.current;
}

// ---------- 3. Split "Lagos, Nigeria" into city + country ----------
function parseSearch(text) {
  const parts = text.split(",");
  const city = parts[0].trim();
  const country = (parts[1] ?? "").trim();
  return { city, country };
}

// ---------- 4. Does the text contain at least one letter? ----------
function hasLetters(text) {
  return /\p{L}/u.test(text);
}

// ---------- 5. Keep only places matching the country (or region) typed ----------
const COUNTRY_ALIASES = {
  uk: "gb",
  britain: "gb",
  "great britain": "gb",
  usa: "us",
  america: "us",
  uae: "ae",
  drc: "cd",
};

function matchCountry(places, country) {
  if (country === "") return places;

  let wanted = country.toLowerCase();
  wanted = COUNTRY_ALIASES[wanted] ?? wanted;

  return places.filter(
    (place) =>
      place.country?.toLowerCase() === wanted ||
      place.country_code?.toLowerCase() === wanted ||
      place.admin1?.toLowerCase() === wanted,
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

// ---------- 6b. Weather code → which "sky" theme the page uses ----------
function skyFor(code, isDay) {
  if (code >= 95) return "storm"; // thunderstorms
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code === 45 || code === 48) return "fog";
  if (code === 3) return "cloudy";
  return isDay ? "day" : "night"; // clear or partly cloudy
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
  localTime.textContent = `Local time ${weather.time.slice(11, 16)}`; // "2026-11-13T00:30" → "00:30"

  document.body.dataset.sky = skyFor(weather.weather_code, weather.is_day); // CSS restyles the page

  message.textContent = ""; // clear any old message
  message.className = "";
  card.hidden = false; // reveal the card
}

// ---------- 9. Show a message (loading or error) instead of the card ----------
function showMessage(text, type) {
  message.textContent = text;
  message.className = type; // "loading" or "error" — CSS colours it
  card.hidden = true; // never leave an old result on screen
}

// ---------- 10. Turn the loading state on or off ----------
function setLoading(isLoading) {
  button.disabled = isLoading; // Risk 10: no rapid clicks
  button.textContent = isLoading ? "Searching…" : "Search";
}

// ---------- When the person searches ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (text === "") return; // Risk 4

  const search = parseSearch(text); // Risk 6

  if (!hasLetters(search.city)) {
    // Risk 5
    showMessage("Please type a city name, not numbers.", "error");
    return;
  }

  setLoading(true);
  showMessage("Loading…", "loading");

  try {
    const places = await findPlaces(search.city);
    if (places.length === 0) {
      // Risk 1
      throw new Error(
        `Couldn't find "${search.city}". Check the spelling or add the country, e.g. Lagos, Nigeria.`,
      );
    }

    const matches = matchCountry(places, search.country);
    if (matches.length === 0) {
      // Risk 9
      throw new Error(`Couldn't find "${search.city}" in ${search.country}.`);
    }

    const place = matches[0];
    const weather = await getWeather(place.latitude, place.longitude);
    showWeather(place, weather);
  } catch (error) {
    console.error(error); // full details for you, the developer
    // Our own errors are plain "Error"s. Anything else (TypeError…) is a bug: don't show its jargon.
    const friendly =
      error.name === "Error"
        ? error.message
        : "Something went wrong. Please try again.";
    showMessage(friendly, "error");
  } finally {
    setLoading(false); // ALWAYS runs: success or failure
  }
});
