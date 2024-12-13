import { addSeconds, fromUnixTime } from 'date-fns';

const api = (() => {
  const API_KEY = 'CDGN6KCXUAT6KSN683JPUEQKE';

  // Process the data returned by Visual Crossing
  async function processData(data) {
    const { locationData, forecastData, units } = data;
    
    console.log(); 

    const processedData = {
      city: forecastData.resolvedAddress.split(',')[0].trim(), // Extract the city from `resolvedAddress` 
      country: forecastData.resolvedAddress.split(',').pop().trim(), // Extract the country from `resolvedAddress`
      current: {
        temp: Math.round(forecastData.currentConditions.temp), // Visual Crossing returns `temp` under `currentConditions`
        feelsLike: Math.round(forecastData.currentConditions.feelslike),
        humidity: forecastData.currentConditions.humidity,
        clouds: forecastData.currentConditions.cloudcover,
        uvi: Math.round(forecastData.currentConditions.uvindex),
        visibility: forecastData.currentConditions.visibility / 1000, // Convert from meters to kilometers
        windSpeed: forecastData.currentConditions.windspeed,
        windDegree: forecastData.currentConditions.winddir,
        tempDescription: forecastData.currentConditions.conditions, // Weather description
        icon: forecastData.currentConditions.icon, // Icon for the weather
        chanceOfRain: Math.round(forecastData.days[0].precipprob), // Chance of rain from `days`
        sunriseTime: parseTimeToDate(forecastData.currentConditions.sunrise, forecastData.tzoffset),
        sunsetTime: parseTimeToDate(forecastData.currentConditions.sunset, forecastData.tzoffset),
        time: new Date(),
      },
      daily: [],
      hourly: [],
    };

    console.log(processedData.city);
  
    // Process daily forecast data (up to 7 days)
    for (let i = 0; i < 7; i++) {
      if (forecastData.days[i]) {
        processedData.daily[i] = {
          date: addSeconds(fromUnixTime(forecastData.days[i].datetimeEpoch), forecastData.tzoffset),
          icon: forecastData.days[i].icon,
          tempDescription: forecastData.days[i].conditions,
          dayTemp: Math.round(forecastData.days[i].tempmax),
          nightTemp: Math.round(forecastData.days[i].tempmin),
          windDegree: forecastData.days[i].wdir,
          windSpeed: forecastData.days[i].windspeed,
        };
  
        // Process hourly forecast data for this day
        if (forecastData.days[i].hours) {
          for (let j = 0; j < forecastData.days[i].hours.length; j++) {
            processedData.hourly.push({
              date: addSeconds(fromUnixTime(forecastData.days[i].hours[j].datetimeEpoch), forecastData.tzoffset),
              icon: forecastData.days[i].hours[j].icon,
              tempDescription: forecastData.days[i].hours[j].conditions,
              temp: forecastData.days[i].hours[j].temp,
              windDegree: forecastData.days[i].hours[j].wdir,
              windSpeed: forecastData.days[i].hours[j].windspeed,
            });
          }
        }
      }
    }   
  
    return processedData;
  }

  // Function to parse time string (e.g., "15:51:21") to a Date object
  function parseTimeToDate(timeString, timezoneOffset) {
    // Assume timeString is in "HH:mm:ss" format
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const currentDate = new Date();
    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);
    currentDate.setSeconds(seconds);
    currentDate.setMilliseconds(0); // Ensure milliseconds are reset
  
    // Adjust by the timezone offset
    const adjustedTime = new Date(currentDate.getTime() + timezoneOffset * 60 * 1000);
    
    return adjustedTime;
  }

  // Fetch location data based on city name (query)
  async function getLocData(query, units = 'metric') {
    try {
        const response = await fetch(
          `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${query}?unitGroup=${units}&key=CDGN6KCXUAT6KSN683JPUEQKE&contentType=json`,
          { mode: 'cors' }
        );
        const forecastData = await response.json();
        console.log(forecastData); // Log the response to check its structure
        return processData({ locationData: { address: location }, forecastData, units });
      } catch (error) {
        return { cod: error.name, message: error.message };
      }
  }  

  return {
    getLocData,
  };
})();

export default api;
