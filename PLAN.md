# Weather App — Plan

Day 3 of my 60-app challenge. Written before any code.

## 1. Define

**Goal:** A web app where anyone can type a city (and optionally its country) and instantly see the current weather there.

### v1 — Minimum Viable Product
- [ ] Search by city name, or "city, country"
- [ ] Show the place's full name (city, region, country) so the person knows which one was found
- [ ] Show current temperature and condition (sunny, rain…) with a matching icon
- [ ] Show "feels like", humidity and wind speed
- [ ] Hint under the search box showing the format: `Lagos` or `Lagos, Nigeria`
- [ ] "Loading…" while waiting
- [ ] A friendly message for every error (see Risks)

### v2 — later
- [ ] "Use my location" button
- [ ] Remember the last city searched
- [ ] 7-day forecast
- [ ] °C / °F switch
- [ ] Background changes for day / night

## 2. Risks — what could go wrong, and how we handle it

| #   | Risk                                                                   | How the app handles it                                                                 |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | City doesn't exist or isn't in the database (typo, very small village) | Show: *Couldn't find "X". Check the spelling or add the country, e.g. Lagos, Nigeria.* |
| 2   | Internet is off or very slow                                           | Show: *No internet connection. Check your connection and try again.*                   |
| 3   | Weather service is down                                                | Show: *The weather service isn't responding. Try again in a minute.*                   |
| 4   | Search pressed with an empty box                                       | Do nothing: the box is required, and spaces-only input is ignored                      |
| 5   | Person types numbers instead of a name ("12345")                       | Show: *Please type a city name, not numbers.*                                          |
| 6   | Person types the city with its country ("Lagos, Nigeria")              | Split at the comma. Search the city, then pick the result in that country              |
| 7   | Person doesn't know what format to type                                | Hint text under the box: *Type a city, or city + country — e.g. Lagos, Nigeria*        |
| 8   | Two places share a name (London UK vs London, Canada)                  | Show the full place name in the result. The person can add the country to choose       |
| 9   | Country typed doesn't match any result ("Lagos, Japan")                | Show: *Couldn't find "Lagos" in Japan.*                                                |
| 10  | Person clicks Search many times quickly                                | Disable the button while loading                                                       |
| 11  | City has spaces or accents ("Port Harcourt", "São Paulo")              | Make the text URL-safe before sending it                                               |
| 12  | Very long text pasted into the box                                     | Limit the box to 80 characters                                                         |
13 Person types a nickname for a country (UK, USA, DRC) → translate it with a lookup table

## 3. Flow in plain English

1. Person opens the app.
2. App shows the search box, a hint about the format, and a welcome message: *Search for a city to see its weather.*
3. Person types a city (optionally ", country") and presses Search or Enter.
4. If the box is empty → do nothing.
5. If the text is only numbers → show the "type a city name" message and stop.
6. Split the text at the comma into **city** and **country** (country may be blank).
7. Disable the Search button and show "Loading…".
8. Ask the location service: *"Where are places called [city]?"*
9. If the internet is off → show the "no internet" message and stop.
10. If no places are found → show the "couldn't find" message and stop.
11. If a country was typed → keep only places in that country. If none are left → show the "couldn't find in that country" message and stop.
12. Take the best match and its **latitude and longitude**.
13. Ask the weather service: *"What's the weather right now at these coordinates?"*
14. If the weather service fails → show the "service not responding" message and stop.
15. Show the weather card: full place name, icon, temperature, condition, feels like, humidity and wind.
16. Re-enable the Search button. (Step 16 also happens after every "stop" above.)
17. Wait for the next search. A new search replaces the old result.

## 4. Screen (rough sketch)

```
┌──────────────────────────────────────┐
│  WEATHER                             │
│                                      │
│  [ Lagos, Nigeria          ][Search] │
│  Type a city, or city + country      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Lagos, Lagos, Nigeria          │  │
│  │                                │  │
│  │   ⛅  29°C                      │  │
│  │      Partly cloudy             │  │
│  │                                │  │
│  │ Feels like 33° │ Humidity 78% │ Wind 12 km/h │
│  └────────────────────────────────┘  │
│                                      │
│  (message area: welcome / loading /  │
│   error messages appear here)        │
└──────────────────────────────────────┘
```

## 5. Data — what the app needs

Unlike the to-do app, v1 doesn't need to **remember** anything (no localStorage), because every search starts fresh.

It **gets** this data from the internet:

| From                                    | Data                                                             | Used for                                  |
| --------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| Location service (Open-Meteo Geocoding) | name, region, country, latitude, longitude                       | Finding the place + showing its full name |
| Weather service (Open-Meteo Forecast)   | temperature, feels like, humidity, wind, weather code, day/night | The weather card                          |

The **weather code** is a number (e.g. 0 = clear sky, 61 = rain). We turn it into words and an icon with a lookup table.

## 6. Milestones — build order

Each milestone ends with something you can test in the browser.

| #   | Milestone                                           | Done when…                                               |
| --- | --------------------------------------------------- | -------------------------------------------------------- |
| M1  | HTML skeleton: form, hint, message area, empty card | Page shows the box, hint and welcome message             |
| M2  | Fetch place + weather, print to the Console         | Searching "Lagos" logs real data in DevTools             |
| M3  | Input checks: empty, numbers, "city, country"       | "12345" shows the message; "London, Canada" finds Canada |
| M4  | Show the weather card (code → words + icon)         | Card shows everything in the sketch                      |
| M5  | Loading, all error messages, disabled button        | Every risk in the table shows the right message          |
| M6  | Styling                                             | Looks good on phone and desktop                          |
| M7  | Ship: README, diagrams, GitHub Pages                | Live link works                                          |

## APIs

- Location: `https://geocoding-api.open-meteo.com/v1/search?name=CITY&count=10`
- Weather: `https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=auto`
- Free, no API key. Docs: https://open-meteo.com/en/docs