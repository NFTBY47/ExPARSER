document.addEventListener('DOMContentLoaded', () => {
    const timeDisplay = document.getElementById('time');
    const themeToggle = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const expressionInput = document.getElementById('expression');
    const resultDisplay = document.getElementById('result');
    const buttons = document.querySelector('.buttons');
    const body = document.body;

    const translations = {
        en: {
            historyTitle: "History",
            clearHistory: "Clear History",
            darkMode: "Dark Mode",
            lightMode: "Light Mode",
            placeholder: "Enter expression",
            emptyExpression: "Please enter an expression",
            calculationError: "Calculation error",
            networkError: "Network error",
            proxyError: "Proxy service unavailable"
        },
        ru: {
            historyTitle: "История",
            clearHistory: "Очистить историю",
            darkMode: "Темный режим",
            lightMode: "Светлый режим",
            placeholder: "Введите выражение",
            emptyExpression: "Пожалуйста, введите выражение",
            calculationError: "Ошибка вычисления",
            networkError: "Ошибка сети",
            proxyError: "Прокси-сервис недоступен"
        }
    };

    // Список доступных прокси-серверов
    const PROXY_SERVERS = [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ];
    let currentProxyIndex = 0;

    let history = [];
    let isDarkMode = false;
    let currentLanguage = 'en';
    let isResultDisplayed = false;

    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeDisplay.textContent = `${hours} : ${minutes}`;
    }

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.innerHTML = isDarkMode 
            ? `<i class="fas fa-sun"></i> <span id="theme-text">${translations[currentLanguage].lightMode}</span>` 
            : `<i class="fas fa-moon"></i> <span id="theme-text">${translations[currentLanguage].darkMode}</span>`;
    }

    function changeLanguage(lang) {
        currentLanguage = lang;
        document.getElementById('history-title').textContent = translations[lang].historyTitle;
        document.getElementById('clear-history-text').textContent = translations[lang].clearHistory;
        document.getElementById('theme-text').textContent = isDarkMode ? translations[lang].lightMode : translations[lang].darkMode;
        expressionInput.placeholder = translations[lang].placeholder;
    }

    function addHistoryEntry(expression, result) {
        const entry = `${expression} = ${result}`;
        history.push(entry);
        updateHistoryList();
    }

    function updateHistoryList() {
        historyList.innerHTML = '';
        history.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = entry;
            listItem.addEventListener('click', () => {
                const [expression] = entry.split('=').map(item => item.trim());
                expressionInput.value = expression;
                resultDisplay.textContent = '';
                expressionInput.focus();
            });
            historyList.appendChild(listItem);
        });
    }

    function clearHistory() {
        history = [];
        updateHistoryList();
    }

    async function tryWithProxy(apiUrl, options, retryCount = 0) {
        try {
            const proxyUrl = PROXY_SERVERS[currentProxyIndex % PROXY_SERVERS.length];
            const response = await fetch(proxyUrl + apiUrl, options);
            
            if (!response.ok) {
                throw new Error(translations[currentLanguage].networkError);
            }
            
            return response;
        } catch (error) {
            if (retryCount < PROXY_SERVERS.length - 1) {
                currentProxyIndex++;
                return tryWithProxy(apiUrl, options, retryCount + 1);
            }
            throw new Error(translations[currentLanguage].proxyError);
        }
    }

    async function calculate() {
        try {
            const expression = expressionInput.value.trim();
            if (!expression) {
                resultDisplay.textContent = translations[currentLanguage].emptyExpression;
                return;
            }

            const apiUrl = 'http://176.119.156.32:8080/api/v1/calculate';
            const options = {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ expression })
            };

            const response = await tryWithProxy(apiUrl, options);
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            resultDisplay.textContent = result.result;
            isResultDisplayed = true;
            addHistoryEntry(expression, result.result);
            
        } catch (error) {
            console.error('Error:', error);
            resultDisplay.textContent = error.message || translations[currentLanguage].calculationError;
        }
    }

    // Event listeners
    themeToggle.addEventListener('click', toggleTheme);
    languageSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    clearHistoryBtn.addEventListener('click', clearHistory);

    buttons.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const value = e.target.dataset.value;
            if (value) {
                if (isResultDisplayed) {
                    expressionInput.value = value;
                    resultDisplay.textContent = '';
                    isResultDisplayed = false;
                } else {
                    expressionInput.value += value;
                }
            } else if (e.target.id === 'calculate') {
                calculate();
            } else if (e.target.id === 'clear') {
                expressionInput.value = '';
                resultDisplay.textContent = '';
                isResultDisplayed = false;
            }
        }
    });

    expressionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            calculate();
            e.preventDefault();
        }
    });

    // Initialize
    setInterval(updateTime, 1000);
    updateTime();
    updateHistoryList();
    changeLanguage(currentLanguage);
});
