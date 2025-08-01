// Weather App JavaScript
class WeatherApp {
    constructor() {
        this.apiKey = '5f472b7acba333cd8a035ea85a0d4d4c'; // Free API key for testing
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.geoBtn = document.getElementById('geo-btn'); // Geolocation button
        this.errorMessage = document.getElementById('error-message');
        this.favoriteCitiesContainer = document.getElementById('favorite-cities');
        this.hourlyForecastContainer = document.getElementById('hourly-forecast-container');
        this.starBtn = null; // Will be created dynamically
        this.favorites = [];
        this.lastSearchedCity = null;
        this.initializeEventListeners();
        this.setCurrentDate();
    }

    initializeEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchWeather());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWeather();
            }
        });
        // Geolocation button event
        this.geoBtn.addEventListener('click', () => this.getWeatherByGeolocation());
        // Load weather for a default city on page load
        window.addEventListener('load', () => {
            this.loadFavoriteCities();
            this.searchWeather('London');
        });
    }

    setCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('date').textContent = now.toLocaleDateString('en-US', options);
    }

    async searchWeather(city = null) {
        const searchCity = city || this.searchInput.value.trim();
        
        if (!searchCity) {
            this.showError('Please enter a city name');
            return;
        }

        this.showLoading();
        this.hideError();

        try {
            const weatherData = await this.getWeatherData(searchCity);
            const forecastData = await this.getForecastData(searchCity);
            
            this.displayWeather(weatherData);
            this.displayForecast(forecastData);
            this.displayHourlyForecast(forecastData);
            // Rain alarm notification system
            this.checkRainAlarm(forecastData);
            // Update star button and last searched city
            this.lastSearchedCity = weatherData.name;
            this.renderStarButton(weatherData.name);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError('City not found. Please try again.');
        } finally {
            this.hideLoading(); // Always hide loading spinner
        }
    }

    async getWeatherData(city) {
        const response = await fetch(
            `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        return await response.json();
    }

    async getForecastData(city) {
        const response = await fetch(
            `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Forecast data not available');
        }
        
        return await response.json();
    }

    // Geolocation-based weather fetch
    getWeatherByGeolocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser.');
            return;
        }
        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                    const weatherData = await this.getWeatherDataByCoords(lat, lon);
                    const forecastData = await this.getForecastDataByCoords(lat, lon);
                    this.displayWeather(weatherData);
                    this.displayForecast(forecastData);
                    this.displayHourlyForecast(forecastData);
                    this.checkRainAlarm(forecastData);
                } catch (error) {
                    this.showError('Unable to fetch weather for your location.');
                } finally {
                    this.hideLoading();
                }
            },
            (error) => {
                this.showError('Unable to retrieve your location.');
                this.hideLoading();
            }
        );
    }
    // Fetch weather by coordinates
    async getWeatherDataByCoords(lat, lon) {
        const response = await fetch(
            `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
        );
        if (!response.ok) throw new Error('Location weather not found');
        return await response.json();
    }
    async getForecastDataByCoords(lat, lon) {
        const response = await fetch(
            `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
        );
        if (!response.ok) throw new Error('Location forecast not found');
        return await response.json();
    }

    displayWeather(data) {
        // Update city name
        document.getElementById('city').textContent = data.name + ', ' + data.sys.country;
        
        // Update temperature
        document.getElementById('temp').textContent = Math.round(data.main.temp);
        
        // Update weather description
        document.getElementById('description').textContent = data.weather[0].description;
        
        // Update weather icon
        const weatherIcon = document.getElementById('weather-icon');
        weatherIcon.className = this.getWeatherIcon(data.weather[0].main, data.weather[0].description);
        
        // Update weather stats
        document.getElementById('feels-like').textContent = Math.round(data.main.feels_like) + '°C';
        document.getElementById('humidity').textContent = data.main.humidity + '%';
        document.getElementById('wind-speed').textContent = Math.round(data.wind.speed * 3.6) + ' km/h'; // Convert m/s to km/h
        document.getElementById('visibility').textContent = (data.visibility / 1000).toFixed(1) + ' km';

        // Alarm based on current weather
        this.currentWeatherAlarm(data);
    }

    displayForecast(data) {
        const forecastContainer = document.getElementById('forecast-container');
        forecastContainer.innerHTML = '';

        // Get daily forecasts (every 24 hours)
        const dailyForecasts = data.list.filter((item, index) => index % 8 === 0).slice(1, 6);

        dailyForecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const temp = Math.round(forecast.main.temp);
            const weatherMain = forecast.weather[0].main;
            const weatherDesc = forecast.weather[0].description;

            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day">${day}</div>
                <div class="forecast-icon">
                    <i class="${this.getWeatherIcon(weatherMain, weatherDesc)}"></i>
                </div>
                <div class="forecast-temp">${temp}°C</div>
            `;

            forecastContainer.appendChild(forecastItem);
        });
    }

    // Hourly forecast rendering (next 24 hours)
    displayHourlyForecast(forecastData) {
        if (!forecastData || !forecastData.list) return;
        this.hourlyForecastContainer.innerHTML = '';
        // OpenWeatherMap gives 3-hour intervals, show next 24 hours (8 intervals)
        const now = new Date();
        const nextHours = forecastData.list.slice(0, 8);
        nextHours.forEach(item => {
            const date = new Date(item.dt * 1000);
            const hour = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
            const temp = Math.round(item.main.temp);
            const weatherMain = item.weather[0].main;
            const weatherDesc = item.weather[0].description;
            const iconClass = this.getWeatherIcon(weatherMain, weatherDesc);
            const el = document.createElement('div');
            el.className = 'hourly-forecast-item';
            // Highlight current hour
            if (date.getHours() === now.getHours()) {
                el.classList.add('current-hour');
            }
            el.innerHTML = `
                <div class="hour">${hour}</div>
                <div class="icon"><i class="${iconClass}"></i></div>
                <div class="temp">${temp}°C</div>
                <div class="desc">${weatherDesc}</div>
            `;
            this.hourlyForecastContainer.appendChild(el);
        });
    }

    getWeatherIcon(weatherMain, weatherDesc) {
        const weatherIcons = {
            'Clear': 'fas fa-sun',
            'Clouds': weatherDesc.includes('scattered') ? 'fas fa-cloud-sun' : 'fas fa-cloud',
            'Rain': weatherDesc.includes('light') ? 'fas fa-cloud-rain' : 'fas fa-cloud-showers-heavy',
            'Drizzle': 'fas fa-cloud-rain',
            'Thunderstorm': 'fas fa-bolt',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Smoke': 'fas fa-smog',
            'Haze': 'fas fa-smog',
            'Dust': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Sand': 'fas fa-smog',
            'Ash': 'fas fa-smog',
            'Squall': 'fas fa-wind',
            'Tornado': 'fas fa-wind'
        };

        return weatherIcons[weatherMain] || 'fas fa-cloud';
    }

    showLoading() {
        this.searchBtn.innerHTML = '<div class="loading"></div>';
        this.searchBtn.disabled = true;
    }

    hideLoading() {
        this.searchBtn.innerHTML = '<i class="fas fa-search"></i>';
        this.searchBtn.disabled = false;
    }

    showError(message) {
        this.errorMessage.querySelector('span').textContent = message;
        this.errorMessage.classList.add('show');
        this.hideLoading();
    }

    hideError() {
        this.errorMessage.classList.remove('show');
    }

    // Favorite cities logic (skeleton)
    // Render star button for favorite toggle
    renderStarButton(city) {
        let locationDiv = document.querySelector('.location');
        if (!locationDiv) return;
        // Remove old star if exists
        if (this.starBtn) {
            this.starBtn.remove();
        }
        this.starBtn = document.createElement('button');
        this.starBtn.className = 'star-btn';
        this.starBtn.title = 'Add/Remove Favorite';
        this.starBtn.innerHTML = this.isFavorite(city) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        this.starBtn.onclick = () => this.toggleFavorite(city);
        locationDiv.appendChild(this.starBtn);
    }
    // Toggle favorite city
    toggleFavorite(city) {
        if (this.isFavorite(city)) {
            this.favorites = this.favorites.filter(c => c !== city);
        } else {
            this.favorites.push(city);
        }
        this.saveFavorites();
        this.renderFavoriteCities();
        this.renderStarButton(city);
    }
    // Check if city is favorite
    isFavorite(city) {
        return this.favorites.includes(city);
    }
    // Save favorites to localStorage
    saveFavorites() {
        localStorage.setItem('weatherAppFavorites', JSON.stringify(this.favorites));
    }
    // Load favorites from localStorage
    loadFavoriteCities() {
        const favs = localStorage.getItem('weatherAppFavorites');
        this.favorites = favs ? JSON.parse(favs) : [];
        this.renderFavoriteCities();
    }
    // Render favorite cities as buttons
    renderFavoriteCities() {
        const listDiv = document.getElementById('favorite-cities-list');
        if (!listDiv) return;
        listDiv.innerHTML = '';
        if (this.favorites.length === 0) {
            listDiv.innerHTML = '<div class="no-fav">No favorite cities yet.</div>';
            return;
        }
        this.favorites.forEach(city => {
            const btn = document.createElement('button');
            btn.className = 'favorite-city-btn';
            btn.textContent = city;
            btn.onclick = () => this.searchWeather(city);
            listDiv.appendChild(btn);
        });
    }

    // Show alert banner in UI for severe weather
    showAlertBanner(eventType, message) {
        // Remove existing banner if any
        let oldBanner = document.getElementById('weather-alert-banner');
        if (oldBanner) oldBanner.remove();
        const banner = document.createElement('div');
        banner.className = 'weather-alert-banner';
        banner.id = 'weather-alert-banner';
        banner.innerHTML = `<i class='fas fa-exclamation-triangle'></i> ${message}`;
        document.querySelector('.container').prepend(banner);
        // Play sound for severe alerts
        if (['storm','thunderstorm','snow'].includes(eventType.toLowerCase())) {
            try {
                const audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c7b.mp3');
                audio.play();
            } catch (e) {}
        }
    }
    hideAlertBanner() {
        let oldBanner = document.getElementById('weather-alert-banner');
        if (oldBanner) oldBanner.remove();
    }

    // Rain alarm notification system
    async checkRainAlarm(forecastData) {
        // Cancel any previous rain notification
        if (this.rainAlarmTimeout) {
            clearTimeout(this.rainAlarmTimeout);
            this.rainAlarmTimeout = null;
        }
        // Request notification permission if not already granted
        if (Notification && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
        if (!forecastData || !forecastData.list) return;

        // Find the soonest rain or severe event in the next 6 hours (2 forecast intervals)
        const now = Date.now();
        let alertForecast = null;
        for (let i = 0; i < Math.min(2, forecastData.list.length); i++) { // Next 6 hours
            const item = forecastData.list[i];
            // Check for rain, storm, snow, thunderstorm, etc.
            if (item.weather.some(w => ['rain','storm','snow','thunderstorm'].some(type => w.main.toLowerCase().includes(type)))) {
                alertForecast = item;
                break;
            }
        }
        if (alertForecast && Notification && Notification.permission === 'granted') {
            // Schedule notification for 1 hour before the event
            const forecastTime = alertForecast.dt * 1000;
            const delay = forecastTime - now - 60 * 60 * 1000; // 1 hour before
            if (delay > 0 && delay < 6 * 60 * 60 * 1000) { // Only schedule if within 6 hours
                this.rainAlarmTimeout = setTimeout(() => {
                    const eventType = alertForecast.weather[0].main;
                    this.showAlertBanner(eventType, `${eventType} is expected in 1 hour. Stay prepared!`);
                    // Play sound for severe alerts
                    if (['storm','thunderstorm','snow'].includes(eventType.toLowerCase())) {
                        try {
                            const audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c7b.mp3');
                            audio.play();
                        } catch (e) {}
                    }
                    new Notification('Weather Alert', {
                        body: `${eventType} is expected in 1 hour. Stay prepared!`,
                    });
                    this.rainAlarmTimeout = null;
                }, delay);
            }
        }
    }

    // Alarm for current weather (immediate notification)
    async currentWeatherAlarm(data) {
        if (!data || !data.weather || !Array.isArray(data.weather)) return;
        const severeTypes = ['rain', 'storm', 'snow', 'thunderstorm'];
        const event = data.weather.find(w => severeTypes.some(type => w.main.toLowerCase().includes(type)));
        if (event) {
            this.showAlertBanner(event.main, `Current weather: ${event.main}. Stay prepared!`);
        } else {
            this.hideAlertBanner();
        }
        if (event && Notification && Notification.permission === 'granted') {
            // Avoid duplicate notifications for the same event (per session)
            if (this.lastNotifiedEvent !== event.main) {
                new Notification('Weather Alert', {
                    body: `Current weather: ${event.main}. Stay prepared!`,
                });
                this.lastNotifiedEvent = event.main;
            }
        }
    }
}

// Initialize the weather app
const weatherApp = new WeatherApp();
