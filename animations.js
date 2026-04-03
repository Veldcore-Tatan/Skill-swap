/**
 * ФАЙЛ: animations.js
 * Отвечает за плавные 60-FPS анимации и оптимизацию рендеринга.
 * Написан на чистом JavaScript (Vanilla JS).
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // =================================================================
    // 1. АППАРАТНО УСКОРЕННЫЕ СТИЛИ (GPU ACCELERATION)
    // =================================================================
    // Внедряем стили через JS, чтобы инкапсулировать логику анимаций
    const animationStyles = document.createElement('style');
    animationStyles.innerHTML = `
        /* Оптимизация переключения страниц */
        .page {
            /* Свойство will-change заранее предупреждает видеокарту (GPU) о том, что эти свойства изменятся */
            will-change: opacity, transform;
            transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), 
                        transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            opacity: 0;
            transform: translateY(15px) scale(0.98);
            position: absolute;
            width: 100%;
            pointer-events: none; /* Отключаем клики по скрытым страницам */
        }
        
        .page.active {
            opacity: 1;
            transform: translateY(0) scale(1);
            position: relative;
            pointer-events: all;
        }

        /* Плавное всплытие карточек постов и чатов при скролле */
        .post-card, .chat-user {
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            will-change: opacity, transform;
        }

        .post-card.visible, .chat-user.visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* Оптимизация анимации кнопок */
        button {
            transform: translateZ(0); /* Принудительно переносим расчеты кнопки на видеокарту */
            transition: transform 0.15s ease, background-color 0.3s ease;
        }
        
        button:active {
            transform: scale(0.95); /* Эффект "вдавливания" */
        }
    `;
    document.head.appendChild(animationStyles);

    // =================================================================
    // 2. ИНТЕЛЛЕКТУАЛЬНЫЙ РЕНДЕРИНГ (Intersection Observer)
    // =================================================================
    // Эта функция следит за тем, какие элементы видны на экране. 
    // Она анимирует посты только тогда, когда пользователь до них докрутил.
    
    const observerOptions = {
        root: null,       // Следим относительно всего окна браузера
        rootMargin: '0px', // Без отступов
        threshold: 0.1     // Анимация начнется, когда видно хотя бы 10% элемента
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // requestAnimationFrame синхронизирует анимацию с частотой обновления монитора (обычно 60 или 120 герц)
                window.requestAnimationFrame(() => {
                    entry.target.classList.add('visible');
                });
                
                // Перестаем следить за элементом после того, как он появился, чтобы не тратить память
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    // Делаем функцию глобальной, чтобы ее можно было вызывать при создании новых постов
    window.observeNewElements = function() {
        // Ищем все карточки, у которых еще нет класса .visible
        const newElements = document.querySelectorAll('.post-card:not(.visible), .chat-user:not(.visible)');
        newElements.forEach(el => scrollObserver.observe(el));
    };

    // Запускаем первичное сканирование страницы
    observeNewElements();
});

// =================================================================
// 3. УТИЛИТА ОПТИМИЗАЦИИ: DEBOUNCE (Подавление дребезга)
// =================================================================
// Если пользователь быстро печатает в "Поиске", браузер может зависнуть от частых запросов.
// Эта функция заставляет браузер ждать, пока пользователь не закончит печатать, и только потом искать.

window.optimizeInput = function(func, delay = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            // Используем requestAnimationFrame для плавной отрисовки результатов
            window.requestAnimationFrame(() => func.apply(this, args));
        }, delay);
    };
};

// Пример применения оптимизации к полю поиска из index.html
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', optimizeInput((event) => {
        console.log('Ищем: ', event.target.value);
        // Здесь в будущем будет логика поиска людей
    }, 400)); // Ждем 400 мс после последнего нажатия клавиши
}
