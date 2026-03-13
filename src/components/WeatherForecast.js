import React, { useState, useEffect } from "react";

// WMO weather code descriptions
const WMO_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ slight hail",
  99: "Thunderstorm w/ heavy hail",
};

function isUSVenue(lat, lon) {
  return lat > 24 && lat < 50 && lon > -130 && lon < -60;
}

function NWSForecast({ lat, lon }) {
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const pointsRes = await fetch(
          `https://api.weather.gov/points/${lat},${lon}`,
          { headers: { "User-Agent": "RDMGolfPool/1.0" } }
        );
        if (!pointsRes.ok) throw new Error("NWS points failed");
        const pointsData = await pointsRes.json();
        const forecastUrl = pointsData.properties.forecast;

        const forecastRes = await fetch(forecastUrl, {
          headers: { "User-Agent": "RDMGolfPool/1.0" },
        });
        if (!forecastRes.ok) throw new Error("NWS forecast failed");
        const forecastData = await forecastRes.json();

        if (!cancelled) {
          setForecast(forecastData.properties.periods.slice(0, 6));
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [lat, lon]);

  if (error) {
    return <p className="text-gray-400 text-sm">Weather unavailable.</p>;
  }

  if (!forecast) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-500" />
        Loading forecast...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {forecast.map((period) => (
        <div key={period.number} className="bg-white/5 rounded p-3">
          <p className="text-xs text-gold-400 font-heading uppercase mb-1">
            {period.name}
          </p>
          <p className="text-lg font-bold">{period.temperature}&deg;{period.temperatureUnit}</p>
          <p className="text-xs text-gray-300 mt-1">{period.shortForecast}</p>
          {period.probabilityOfPrecipitation?.value > 0 && (
            <p className="text-xs text-blue-300 mt-1">
              {period.probabilityOfPrecipitation.value}% precip
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function OpenMeteoForecast({ lat, lon }) {
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=4`
        );
        if (!res.ok) throw new Error("Open-Meteo failed");
        const data = await res.json();
        if (!cancelled) setForecast(data.daily);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [lat, lon]);

  if (error) {
    return <p className="text-gray-400 text-sm">Weather unavailable.</p>;
  }

  if (!forecast) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-500" />
        Loading forecast...
      </div>
    );
  }

  const days = forecast.time.map((date, i) => ({
    date,
    high: forecast.temperature_2m_max[i],
    low: forecast.temperature_2m_min[i],
    precip: forecast.precipitation_probability_max[i],
    code: forecast.weathercode[i],
  }));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {days.map((day) => (
        <div key={day.date} className="bg-white/5 rounded p-3">
          <p className="text-xs text-gold-400 font-heading uppercase mb-1">
            {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-sm font-bold">
            {Math.round(day.high)}&deg; / {Math.round(day.low)}&deg;C
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {WMO_CODES[day.code] || "Unknown"}
          </p>
          {day.precip > 0 && (
            <p className="text-xs text-blue-300 mt-1">{day.precip}% precip</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function WeatherForecast({ coordinates, location }) {
  if (!coordinates?.lat || !coordinates?.lon) {
    return <p className="text-gray-400 text-sm">No coordinates set for weather.</p>;
  }

  const us = isUSVenue(coordinates.lat, coordinates.lon);

  return (
    <div>
      <h3 className="text-sm font-heading text-gold-400 uppercase mb-3">
        Weather Forecast — {location}
      </h3>
      {us ? (
        <NWSForecast lat={coordinates.lat} lon={coordinates.lon} />
      ) : (
        <OpenMeteoForecast lat={coordinates.lat} lon={coordinates.lon} />
      )}
    </div>
  );
}
