const API_URL =
    "https://script.google.com/macros/s/AKfycby-vZKWmdFH1T8ec6ZJht-7S7z4xeC6eAgitJXVcOUiu6-nvw0Ze8aARDfHHiFd7ep4eg/exec";

// названия листов
const SHEETS = {
    ours: "ourBalls",
    theirs: "guestBalls",
};

// =======================
// CACHE
// =======================

const CACHE_KEY = "ball_price_cache_v1";

// =======================
// STATE
// =======================

let currentSheet = SHEETS.ours;
let allData = [];
let filteredData = [];

// =======================
// ELEMENTS
// =======================

const catalog = document.getElementById("catalog");
const statusEl = document.getElementById("status");
const emptyEl = document.getElementById("empty");
const searchInput = document.getElementById("searchInput");
const tabs = document.querySelectorAll(".tab");
const template = document.getElementById("cardTemplate");

// 🔴 WARNING BANNER
const warningBanner = document.getElementById("warningBanner");

// =======================
// INIT
// =======================

init();

function init() {
    bindEvents();
    loadData(currentSheet);
}

// =======================
// EVENTS
// =======================

function bindEvents() {
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            currentSheet = tab.dataset.sheet;
            loadData(currentSheet);
        });
    });

    searchInput.addEventListener("input", (e) => {
        filterData(e.target.value.toLowerCase());
        render();
    });
}

// =======================
// DATA LOAD (WITH CACHE)
// =======================

async function loadData(sheetName) {
    status("Загрузка...");
    catalog.innerHTML = "";

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cache = cached ? JSON.parse(cached) : {};

        // 1. CACHE HIT
        if (cache[sheetName]) {
            allData = cache[sheetName];
            filteredData = [...allData];

            toggleWarning(sheetName);

            status("");
            render();
            return;
        }

        // 2. FETCH API
        const res = await fetch(
            `${API_URL}?sheet=${encodeURIComponent(sheetName)}`,
        );

        const data = await res.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid API response");
        }

        allData = data.map((item) => ({
            name: item.name ?? "",
            price: item.price ?? "",
        }));

        filteredData = [...allData];

        // 3. SAVE CACHE
        cache[sheetName] = allData;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        toggleWarning(sheetName);

        status("");
        render();
    } catch (e) {
        console.error("LOAD ERROR:", e);
        status("Ошибка загрузки данных");
    }
}

// =======================
// WARNING LOGIC
// =======================

function toggleWarning(sheetName) {
    if (!warningBanner) return;

    if (sheetName === SHEETS.theirs) {
        warningBanner.textContent =
            "Услуга по надуванию шаров покупателей производится при полной предоплате по данному прейскуранту. Магазин не несет ответственности за сохранность целостности шаров покупателя. В случае, если шар лопнет или повредится в процессе надувания или не взлетит после надувания гелием, услуга все равно оплачивается в полном размере.";

        warningBanner.classList.remove("hidden");
    } else {
        warningBanner.classList.add("hidden");
    }
}

// =======================
// FILTER
// =======================

function filterData(query) {
    if (!query) {
        filteredData = allData;
        return;
    }

    filteredData = allData.filter((item) =>
        (item.name || "").toLowerCase().includes(query),
    );
}

// =======================
// RENDER
// =======================

function render() {
    catalog.innerHTML = "";

    if (!filteredData.length) {
        emptyEl.classList.remove("hidden");
        return;
    } else {
        emptyEl.classList.add("hidden");
    }

    filteredData.forEach((item) => {
        const card = template.content.cloneNode(true);

        card.querySelector(".ball-name").textContent = item.name;
        card.querySelector(".value").textContent = item.price;

        catalog.appendChild(card);
    });
}

// =======================
// STATUS
// =======================

function status(text) {
    statusEl.textContent = text;
}
