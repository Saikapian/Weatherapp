// Weather App JavaScript
class WeatherApp {
    constructor() {
        this.apiKey = '5f472b7acba333cd8a035ea85a0d4d4c'; // Free API key for testing
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.errorMessage = document.getElementById('error-message');
        
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

        // Load weather for a default city on page load
        window.addEventListener('load', () => {
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
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError('City not found. Please try again.');
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
}

// Initialize the weather app
const weatherApp = new WeatherApp();

// For demo purposes, you can use this free API key (limited requests)
// Replace 'YOUR_API_KEY' in the constructor with this key for testing:
// '5f472b7acba333cd8a035ea85a0d4d4c'

// To get your own free API key:
// 1. Go to https://openweathermap.org/
// 2. Sign up for a free account
// 3. Get your API key from your account dashboard
// 4. Replace 'YOUR_API_KEY' with your actual API key

// Note: The free tier allows 60 calls per minute and 1,000 calls per day 