const apiKey = "e43893c6ec99c5346a0d15f93cc51a51";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?&units=metric&lang=pl";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".searchButton");
const locationBtn = document.querySelector(".locationButton");
const weatherIcon = document.querySelector(".weatherIcon");
const weatherOption = document.querySelector(".weatherModeSwitch");
const darkModeOption = document.querySelector(".darkModeSwitch");
const citySevenDaysText = document.querySelector(".citySevenDays");
let lat;
let lon;

//  Otwarcie "Bazy"
function openDb(nameDb) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(nameDb, 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            db.createObjectStore('weather', {keyPath: 'city'});
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Zapisanie do "Bazy"
function saveWeatherData(city, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['weather'], 'readwrite');
        const store = transaction.objectStore('weather');
        const request = store.put({city, data});

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Odczyt z "Bazy"

function getWeatherData(city) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['weather'], 'readonly');
        const store = transaction.objectStore('weather');
        const request = store.get(city);

        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result) {
                console.log(`Data for city "${city}" retrieved from IndexedDB:`, result.data);
                resolve(result.data);
            } else {
                console.log(`No data found for city "${city}" in IndexedDB.`);
                resolve(null);
            }
        };

        request.onerror = (event) => {
            console.error('Error retrieving data:', event.target.error);
            reject(event.target.error);
        };
    });
}

async function fetchCoordinates() {
    const city = searchBox.value;
    if (navigator.onLine) {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
        try {
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            if (data.length > 0) {
                lat = data[0].lat;
                lon = data[0].lon;
                console.log('Latitude:', lat, 'Longitude:', lon);
                citySevenDaysText.textContent = searchBox.value;

            } else {
                console.error('No results found for the city:', city);
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error);
        }
    }
    await checkWeatherForSevenDays();
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successPosition);
    } else {
        document.querySelector(".error").style.display = "block";
        document.querySelector(".error").innerHTML = "Geolocation is not supported by this browser.";
    }
}

async function successPosition(position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    const response = await fetch(apiUrl + "&lat=" + lat + "&lon=" + lon + `&appid=${apiKey}`);
    let data = await response.json();
    console.log(data);
    searchBox.value = data.name;
}

async function fetchGeolocation() {
    try {

        const ipcRenderer = window.electron.ipcRenderer;
        const data = await ipcRenderer.invoke('get-geolocation');
        console.log('Geolocation data:', data);
        let lat = data.location.lat;
        let lon = data.location.lng;
        const response = await fetch(apiUrl + "&lat=" + lat + "&lon=" + lon + `&appid=${apiKey}`);
        let location = await response.json();
        searchBox.value = location.name;
    } catch (error) {
        console.error('Error fetching geolocation data:', error);
    }
}

function displayOneDayWeather(data) {
    console.log(data);

    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.floor(data.main.temp) + "°C";
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed + "km/h";
    document.querySelector(".weatherCondition").innerHTML = data.weather[0].description;

    let iconId = data.weather[0].icon;
    weatherIcon.src = "./images/" + iconId + ".png";
}

// via Miasto
async function checkWeatherForOneDay(city) {
    await openDb("oneDayWeatherData");
    let response
    if (navigator.onLine) {
        response = await fetch(apiUrl + "&q=" + city + `&appid=${apiKey}`);
        if (response.status === 404 || response.status === 400) {
            document.querySelector(".error").style.display = "block";
        }
    }
    let data;
    if (navigator.onLine) {
        data = await response.json();
        await saveWeatherData(city, data);
    } else {
        data = await getWeatherData(city);
        if (data === null) {
            alert("Brak dostępu do internetu, a podany rekord nie znajduje sie w bazie.");
            return;
        }
    }
    document.querySelector(".currentWeather").style.display = "block";
    displayOneDayWeather(data);
    document.querySelector(".error").style.display = "none";
    document.querySelector(".sevenDaysWeather").style.display = "none";
}

function displaySevenDaysWeather(data) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weatherIcons = {
        0: 'images/01d.png', // Clear sky
        1: 'images/01d.png', // Mainly clear
        2: 'images/02d.png', // Partly cloudy
        3: 'images/03d.png', // Overcast
        45: 'images/50d.png', // Fog
        48: 'images/50d.png', // Depositing rime fog
        51: 'images/09d.png', // Drizzle: Light
        53: 'images/09d.png', // Drizzle: Moderate
        55: 'images/09d.png', // Drizzle: Dense intensity
        56: 'images/09d.png', // Freezing Drizzle: Light
        57: 'images/09d.png', // Freezing Drizzle: Dense intensity
        61: 'images/10d.png', // Rain: Slight
        63: 'images/10d.png', // Rain: Moderate
        65: 'images/10d.png', // Rain: Heavy intensity
        66: 'images/13d.png', // Freezing Rain: Light
        67: 'images/13d.png', // Freezing Rain: Heavy intensity
        71: 'images/13d.png', // Snow fall: Slight
        73: 'images/13d.png', // Snow fall: Moderate
        75: 'images/13d.png', // Snow fall: Heavy intensity
        77: 'images/13d.png', // Snow grains
        80: 'images/10d.png', // Rain showers: Slight
        81: 'images/10d.png', // Rain showers: Moderate
        82: 'images/10d.png', // Rain showers: Violent
        85: 'images/13d.png', // Snow showers slight
        86: 'images/13d.png', // Snow showers heavy
        95: 'images/11d.png', // Thunderstorm: Slight or moderate
        96: 'images/11d.png', // Thunderstorm with slight hail
        99: 'images/11d.png', // Thunderstorm with heavy hail
    }
    const weatherData = data.daily;
    for (let i = 0; i < 7; i++) {
        let date = new Date(weatherData.time[i]);
        let dayOfWeek = daysOfWeek[date.getDay()];
        document.getElementById(`day${i + 1}`).textContent = dayOfWeek;
        document.getElementById(`temperature${i + 1}`).textContent = `${Math.round(weatherData.temperature_2m_max[i])}°C / ${Math.round(weatherData.temperature_2m_min[i])}°C`;
        document.getElementById(`icon${i + 1}`).src = weatherIcons[weatherData.weather_code[i]];
    }
    citySevenDaysText.textContent = searchBox.value;
}

async function checkWeatherForSevenDays() {
    await openDb("sevenDaysWeatherData");
    let response;
    let data;
    if (navigator.onLine) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe/Berlin`;
        response = await fetch(url);
        if (response.status === 404 || response.status === 400) {
            document.querySelector(".error").style.display = "block";
            return;
        }
        data = await response.json();
        await saveWeatherData(searchBox.value, data);
    } else {
        data = await getWeatherData(searchBox.value);
        if (data === null) {
            alert("Brak dostępu do internetu, a podany rekord nie znajduje sie w bazie.");
            return;
        }
    }
    displaySevenDaysWeather(data);
    console.log(data);
    document.querySelector(".error").style.display = "none";
    document.querySelector(".currentWeather").style.display = "none";
    document.querySelector(".sevenDaysWeather").style.display = "block";
}

locationBtn.addEventListener("click", () => {
    if (window.electron) {
        fetchGeolocation();
    } else {
        getLocation();
    }
});
searchBtn.addEventListener("click", () => {
    if (weatherOption.checked) {
        fetchCoordinates();
    } else {
        checkWeatherForOneDay(searchBox.value);
    }
});
darkModeOption.addEventListener('change', function () {
    document.body.classList.toggle('dark-mode', this.checked);
});

document.addEventListener('DOMContentLoaded', (event) => {
    const darkModeSwitch = document.querySelector(".darkModeSwitch");
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';

    document.body.classList.toggle('dark-mode', isDarkMode);
    darkModeSwitch.checked = isDarkMode;

    darkModeSwitch.addEventListener('change', function () {
        const isChecked = this.checked;
        document.body.classList.toggle('dark-mode', isChecked);
        localStorage.setItem('dark-mode', isChecked);
    });
});