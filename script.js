const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

async function geocode(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`,
  );
  const data = await res.json();
  if (!data.results) throw new Error("City not found");
  return data.results[0];
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}
&current_weather=true
&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,visibility,windspeed_10m,pressure_msl
&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset
&forecast_days=5
&timezone=auto`;

  const res = await fetch(url.replace(/\n/g, ""));
  return res.json();
}

async function getAQI(lat, lon) {
  const res = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5`,
  );
  return res.json();
}

function populate(data, place, aqiData) {
  const cur = data.current_weather;
  document.getElementById("temp").innerText =
    Math.round(cur.temperature) + "°C";
  document.getElementById("desc").innerText =
    "Weather Code: " + cur.weathercode;
  document.getElementById("place").innerText = place;
  document.getElementById("date").innerText = new Date().toLocaleString();

  const h = data.hourly;

  document.getElementById("humidity").innerText =
    h.relativehumidity_2m[0] + "%";
  document.getElementById("pressure").innerText = h.pressure_msl[0] + " hPa";
  document.getElementById("wind").innerText = cur.windspeed + " km/h";
  document.getElementById("visibility").innerText =
    h.visibility[0] / 1000 + " km";
  document.getElementById("feels").innerText =
    Math.round(h.apparent_temperature[0]) + "°C";

  document.getElementById("sunrise").innerText = new Date(
    data.daily.sunrise[0],
  ).toLocaleTimeString();

  document.getElementById("sunset").innerText = new Date(
    data.daily.sunset[0],
  ).toLocaleTimeString();

  if (aqiData && aqiData.hourly) {
    document.getElementById("aqi").innerText =
      aqiData.hourly.pm2_5[0].toFixed(1);
  }

  const dailyDiv = document.getElementById("daily");
  dailyDiv.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    dailyDiv.innerHTML += `
<div>
<span>${new Date(data.daily.time[i]).toLocaleDateString(undefined, { weekday: "short" })}</span>
<span>${Math.round(data.daily.temperature_2m_min[i])}° / ${Math.round(data.daily.temperature_2m_max[i])}°</span>
</div>
`;
  }

  const hourlyDiv = document.getElementById("hourly");
  hourlyDiv.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    hourlyDiv.innerHTML += `
<div class="hour-card">
<div>${new Date(h.time[i]).getHours()}:00</div>
<div>${Math.round(h.temperature_2m[i])}°C</div>
</div>
`;
  }
}

async function search(city) {
  try {
    const geo = await geocode(city);
    const weather = await getWeather(geo.latitude, geo.longitude);
    const aqi = await getAQI(geo.latitude, geo.longitude);
    populate(weather, geo.name + ", " + geo.country, aqi);
  } catch (err) {
    alert(err.message);
  }
}

searchBtn.addEventListener("click", () => {
  if (!cityInput.value) return alert("Enter city");
  search(cityInput.value);
});

locationBtn.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const weather = await getWeather(lat, lon);
    const aqi = await getAQI(lat, lon);
    populate(weather, "Current Location", aqi);
  });
});

search("New Delhi");
