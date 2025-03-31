/**
 * Главный модуль калькулятора, который инициализируется после полной загрузки 
 * DOM-дерева страницы. Это гарантирует, что все HTML-элементы будут доступны 
 * для работы с ними через JavaScript.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Собираем все необходимые элементы интерфейса в переменные:
    const timeDisplay = document.getElementById('time');
    const themeToggle = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const toggleHistoryBtn = document.getElementById('toggle-history-btn');
    const expressionInput = document.getElementById('expression');
    const resultDisplay = document.getElementById('result');
    const buttons = document.querySelector('.buttons');
    const body = document.body;
    const container = document.querySelector('.container');

    /**
     * Объект с локализованными текстами интерфейса.
     */
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
            hideHistory: "Hide History",
            showHistory: "Show History"
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
            hideHistory: "Скрыть историю",
            showHistory: "Показать историю"
        }
    };

    // Переменные состояния приложения:
    let history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
    let isDarkMode = false;
    let currentLanguage = 'en';
    let isResultDisplayed = false;
    let isHistoryVisible = true;
    let matrixInterval = null;
    let selectedHistoryIndex = -1;
    let isMatrixEffectActive = false; // Флаг активности матричного эффекта

    /**
     * Сохраняет текущую историю в LocalStorage.
     */
    function saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(history));
    }

    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeDisplay.textContent = `${hours} : ${minutes}`;
    }

    function toggleTheme() {
        // Если активен матричный эффект - не переключаем тему
        if (isMatrixEffectActive) return;
        
        isDarkMode = !isDarkMode;
        body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.innerHTML = isDarkMode 
            ? `<i class="fas fa-sun"></i> <span id="theme-text">${translations[currentLanguage].lightMode}</span>` 
            : `<i class="fas fa-moon"></i> <span id="theme-text">${translations[currentLanguage].darkMode}</span>`;
    }

    function toggleHistory() {
        const historyPanel = document.querySelector('.history-panel');
        isHistoryVisible = !isHistoryVisible;
        
        if (isHistoryVisible) {
            historyPanel.style.display = 'block';
            historyPanel.style.animation = 'slideIn 0.3s forwards';
        } else {
            historyPanel.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                historyPanel.style.display = 'none';
            }, 300);
        }
        
        updateToggleButton();
    }

    function updateToggleButton() {
        const icon = document.querySelector('#toggle-history-btn i');
        const textSpan = document.getElementById('toggle-history-text');
        
        if (isHistoryVisible) {
            icon.className = 'fas fa-eye-slash';
            textSpan.textContent = translations[currentLanguage].hideHistory;
        } else {
            icon.className = 'fas fa-eye';
            textSpan.textContent = translations[currentLanguage].showHistory;
        }
    }

    function changeLanguage(lang) {
        currentLanguage = lang;
        document.getElementById('history-title').textContent = translations[lang].historyTitle;
        document.getElementById('clear-history-text').textContent = translations[lang].clearHistory;
        document.getElementById('theme-text').textContent = isDarkMode 
            ? translations[lang].lightMode 
            : translations[lang].darkMode;
        expressionInput.placeholder = translations[lang].placeholder;
        updateToggleButton();
    }

    /**
     * Добавляет запись в историю вычислений.
     */
    function addHistoryEntry(expression, result) {
        if (result.toString() === "10101") {
            startMatrixEffect();
        }
        
        const entry = {
            fullExpression: expression,
            fullResult: result.toString(),
            displayExpression: shortenExpression(expression),
            displayResult: shortenExpression(result.toString())
        };
        
        history.push(entry);
        if (history.length > 50) {
            history = history.slice(history.length - 50);
        }
        
        saveHistory();
        updateHistoryList();
    }

    /**
     * Сокращает выражение для отображения в истории.
     */
    function shortenExpression(str) {
        const maxLength = 8;
        if (str.length > maxLength) {
            return str.substring(0, maxLength) + '...';
        }
        return str;
    }

    function updateHistoryList() {
        historyList.innerHTML = '';
        
        history.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${entry.displayExpression} = ${entry.displayResult}`;
            
            if (index === selectedHistoryIndex) {
                listItem.classList.add('selected-history');
            }
            
            listItem.addEventListener('click', () => {
                expressionInput.value = entry.fullExpression;
                resultDisplay.textContent = '';
                selectedHistoryIndex = index;
                updateHistoryList();
                expressionInput.focus();
            });
            
            historyList.appendChild(listItem);
        });
    }

    function clearHistory() {
        history = [];
        selectedHistoryIndex = -1;
        saveHistory();
        updateHistoryList();
    }

    /**
     * Запускает матричный эффект с оптимизациями для производительности.
     */
    function startMatrixEffect() {
        if (isMatrixEffectActive) return;
        isMatrixEffectActive = true;
        
        const uiElements = [
            container,
            document.querySelector('.history-controls'),
            document.querySelector('.settings'),
            document.querySelector('.display'),
            document.querySelector('.buttons'),
            document.querySelector('.telegram-button')
        ].filter(el => el !== null);

        // Отключаем переходы для элементов интерфейса во время эффекта
        uiElements.forEach(el => {
            el.style.transition = 'none';
            el.style.willChange = 'opacity, transform, filter';
            el.style.opacity = '0';
            el.style.transform = 'scale(0.95)';
            el.style.filter = 'blur(2px)';
        });

        // Создаем контейнер для матричного эффекта
        const matrixBg = document.createElement('div');
        matrixBg.id = 'matrix-background';
        matrixBg.style.willChange = 'contents'; // Оптимизация для браузера
        document.body.appendChild(matrixBg);

        // Массив для хранения созданных цифр
        const digits = [];
        
        /**
         * Создает одну падающую цифру с оптимизацией.
         */
        function createDigit() {
            const digit = document.createElement('div');
            digit.className = 'matrix-digit';
            digit.textContent = Math.random() > 0.5 ? '1' : '0';
            digit.style.left = `${Math.random() * 100}%`;
            digit.style.animationDuration = `${Math.random() * 2 + 1}s`;
            digit.style.willChange = 'transform, opacity'; // Оптимизация анимации
            
            // Используем requestAnimationFrame для плавного добавления
            requestAnimationFrame(() => {
                matrixBg.appendChild(digit);
                digits.push(digit);
            });
        }

        // Запускаем интервал с использованием requestAnimationFrame
        let lastTime = 0;
        function matrixLoop(timestamp) {
            if (timestamp - lastTime > 50) {
                createDigit();
                lastTime = timestamp;
            }
            matrixInterval = requestAnimationFrame(matrixLoop);
        }
        matrixInterval = requestAnimationFrame(matrixLoop);

        // Очистка через 3 секунды
        setTimeout(() => {
            stopMatrixEffect();
            
            // Включаем переходы обратно и плавно возвращаем интерфейс
            uiElements.forEach(el => {
                el.style.transition = 'all 0.5s ease-out';
                el.style.willChange = '';
                el.style.opacity = '1';
                el.style.transform = 'scale(1)';
                el.style.filter = 'blur(0)';
            });
            
            // Запланированная очистка через 0.5 секунды (после завершения анимации)
            setTimeout(() => {
                uiElements.forEach(el => {
                    el.style.transition = '';
                });
            }, 500);
        }, 3000);
    }

    /**
     * Останавливает матричный эффект с оптимизированной очисткой.
     */
    function stopMatrixEffect() {
        if (!isMatrixEffectActive) return;
        isMatrixEffectActive = false;
        
        if (matrixInterval) {
            cancelAnimationFrame(matrixInterval);
            matrixInterval = null;
        }
        
        const matrixBg = document.getElementById('matrix-background');
        if (matrixBg) {
            // Используем requestAnimationFrame для плавного удаления
            requestAnimationFrame(() => {
                matrixBg.style.transition = 'opacity 0.5s ease-out';
                matrixBg.style.opacity = '0';
                
                // Удаляем через 0.5 секунды после завершения анимации
                setTimeout(() => {
                    matrixBg.remove();
                }, 500);
            });
        }
    }

    async function calculate() {
        try {
            const expression = expressionInput.value.trim();
            
            if (!expression) {
                resultDisplay.textContent = translations[currentLanguage].emptyExpression;
                return;
            }

            const response = await fetch("http://176.119.156.32:8080/api/v1/calculate", {
                method: "POST",
                mode: 'cors',
                body: JSON.stringify({ expression }),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(translations[currentLanguage].networkError);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            resultDisplay.textContent = result.result;
            isResultDisplayed = true;
            addHistoryEntry(expression, result.result);
            selectedHistoryIndex = -1;
            updateHistoryList();
            
        } catch (error) {
            console.error('Error:', error);
            resultDisplay.textContent = error.message || translations[currentLanguage].calculationError;
        }
    }

    // Назначаем обработчики событий:
    themeToggle.addEventListener('click', toggleTheme);
    languageSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    clearHistoryBtn.addEventListener('click', clearHistory);
    toggleHistoryBtn.addEventListener('click', toggleHistory);

    buttons.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const value = e.target.dataset.value;
            
            if (value) {
                stopMatrixEffect();
                
                if (isResultDisplayed || selectedHistoryIndex !== -1) {
                    expressionInput.value = value;
                    resultDisplay.textContent = '';
                    isResultDisplayed = false;
                    selectedHistoryIndex = -1;
                    updateHistoryList();
                } else {
                    expressionInput.value += value;
                }
            } else if (e.target.id === 'calculate') {
                calculate();
            } else if (e.target.id === 'clear') {
                stopMatrixEffect();
                expressionInput.value = '';
                resultDisplay.textContent = '';
                isResultDisplayed = false;
                selectedHistoryIndex = -1;
                updateHistoryList();
            } else if (e.target.id === 'backspace') {
                stopMatrixEffect();
                expressionInput.value = expressionInput.value.slice(0, -1);
                resultDisplay.textContent = '';
                isResultDisplayed = false;
                selectedHistoryIndex = -1;
                updateHistoryList();
            }
        }
    });

    expressionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            calculate();
            e.preventDefault();
        }
    });

    // Инициализация приложения:
    setInterval(updateTime, 1000);
    updateTime();
    updateHistoryList();
    changeLanguage(currentLanguage);
});
