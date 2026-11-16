const form = document.querySelector('#search-form');
const cityInput = document.querySelector('#city');
const button = document.querySelector('#search-button');
const statusMessage = document.querySelector('#status');
const results = document.querySelector('#results');

const weatherDescriptions = {
  0: ['Clear sky', '☀️'], 1: ['Mostly clear', '🌤️'], 2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'], 45: ['Foggy', '🌫️'], 48: ['Foggy', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'],
  80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Heavy showers', '🌧️'],
  95: ['Thunderstorms', '⛈️'], 96: ['Thunderstorms', '⛈️'], 99: ['Thunderstorms', '⛈️']
};
function describe(code) { return weatherDescriptions[code] || ['Variable conditions', '🌤️']; }
function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}
async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather service unavailable. Please try again.');
  return response.json();
}
function planningTip(weather) {
  const code = weather.current.weather_code;
  const temp = weather.current.temperature_2m;
  if ([95, 96, 99].includes(code)) return 'Thunderstorms are possible. Check local alerts before outdoor activities.';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Consider bringing an umbrella or rain jacket.';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snowy conditions may affect travel. Dress warmly and check road conditions.';
  if (temp >= 86) return 'It is warm outside. Carry water and plan breaks in the shade.';
  if (temp <= 40) return 'It is chilly outside. Bring a warm jacket.';
  return 'Conditions look reasonable for getting outside. Check the daily forecast before leaving.';
}
function renderWeather(place, weather) {
  document.querySelector('#location-title').textContent = `${place.name}, ${place.country}`;
  document.querySelector('#condition').textContent = describe(weather.current.weather_code)[0];
  document.querySelector('#temperature').textContent = `${Math.round(weather.current.temperature_2m)}°F`;
  document.querySelector('#details').textContent = `Feels like ${Math.round(weather.current.apparent_temperature)}°F · Wind ${Math.round(weather.current.wind_speed_10m)} mph`;
  const forecast = document.querySelector('#forecast');
  forecast.replaceChildren();
  weather.daily.time.forEach((date, i) => {
    const card = document.createElement('div');
    card.className = 'day';
    const name = document.createElement('strong');
    name.textContent = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
    const symbol = document.createElement('span');
    symbol.className = 'symbol';
    symbol.textContent = describe(weather.daily.weather_code[i])[1];
    const temp = document.createElement('span');
    temp.textContent = `${Math.round(weather.daily.temperature_2m_max[i])}° / ${Math.round(weather.daily.temperature_2m_min[i])}°`;
    const rain = document.createElement('small');
    rain.textContent = `Rain: ${weather.daily.precipitation_probability_max[i] ?? '—'}%`;
    card.append(name, symbol, temp, rain);
    forecast.append(card);
  });
  document.querySelector('#tip').textContent = planningTip(weather);
  results.hidden = false;
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  button.disabled = true;
  results.hidden = true;
  setStatus('Loading forecast…');
  try {
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geo = await getJSON(geoURL);
    if (!geo.results?.length) throw new Error('City not found. Try another city name.');
    const place = geo.results[0];
    const params = new URLSearchParams({
      latitude: place.latitude, longitude: place.longitude,
      current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      temperature_unit: 'fahrenheit', wind_speed_unit: 'mph', timezone: 'auto', forecast_days: '5'
    });
    const weather = await getJSON(`https://api.open-meteo.com/v1/forecast?${params}`);
    renderWeather(place, weather);
    setStatus('Forecast updated.');
  } catch (error) {
    setStatus(error.message || 'Unable to load the forecast.', true);
  } finally {
    button.disabled = false;
  }
});
