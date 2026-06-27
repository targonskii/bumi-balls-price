const API_URL =
    "https://script.google.com/macros/s/AKfycby-vZKWmdFH1T8ec6ZJht-7S7z4xeC6eAgitJXVcOUiu6-nvw0Ze8aARDfHHiFd7ep4eg/exec";

const SHEETS = {
    ours: "ourBalls",
    theirs: "guestBalls",
};

const CACHE_KEY = "ball_price_cache_v1";
const CACHE_TTL = 60 * 1000; // 60 секунд

let currentSheet = SHEETS.ours;
let allData = [];
let filteredData = [];

const catalog = document.getElementById("catalog");
const searchInput = document.getElementById("searchInput");
const tabs = document.querySelectorAll(".tab");
const template = document.getElementById("cardTemplate");
const loader = document.getElementById("loader");
const warningBanner = document.getElementById("warningBanner");
const emptyBlock = document.getElementById("empty");

init();

function init() {
    bindEvents();
    loadData(currentSheet);
}

function bindEvents() {
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            currentSheet = tab.dataset.sheet;
            showLoader();
            loadData(currentSheet);
        });
    });

    searchInput.addEventListener("input", (e) => {
        filterData(e.target.value.toLowerCase());
        render();
    });
}

function showLoader() {
    loader.classList.remove("hide");
    loader.style.display = "flex";
}

function hideLoader() {
    loader.classList.add("hide");
    setTimeout(() => {
        loader.style.display = "none";
    }, 300);
}

async function loadData(sheetName) {
    catalog.innerHTML = "";

    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        const cached = cache[sheetName];

        const now = Date.now();

        // 🔥 проверка TTL кеша
        if (cached && now - cached.timestamp < CACHE_TTL) {
            allData = cached.data;
            filteredData = [...allData];

            toggleWarning(sheetName);
            render();
            hideLoader();
            return;
        }

        // ❗ иначе грузим свежие данные
        const res = await fetch(`${API_URL}?sheet=${sheetName}&t=${now}`);
        const data = await res.json();

        allData = (data || []).map((item) => ({
            name: item.name ?? "",
            price: item.price ?? "",
        }));

        // 💾 сохраняем с timestamp
        cache[sheetName] = {
            timestamp: now,
            data: allData,
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        filteredData = [...allData];

        toggleWarning(sheetName);
        render();
        hideLoader();
    } catch (e) {
        console.log(e);
        hideLoader();
    }
}

function toggleWarning(sheet) {
    if (!warningBanner) return;

    if (sheet === SHEETS.theirs) {
        warningBanner.classList.remove("hidden");
    } else {
        warningBanner.classList.add("hidden");
    }
}

function filterData(q) {
    if (!q) {
        filteredData = allData;
        return;
    }

    filteredData = allData.filter((i) => i.name.toLowerCase().includes(q));
}

function render() {
    catalog.innerHTML = "";

    if (!filteredData.length) {
        if (emptyBlock) emptyBlock.classList.remove("hidden");
        return;
    } else {
        if (emptyBlock) emptyBlock.classList.add("hidden");
    }

    filteredData.forEach((item) => {
        const card = template.content.cloneNode(true);

        card.querySelector(".ball-name").textContent = item.name;
        card.querySelector(".value").textContent = item.price;

        catalog.appendChild(card);
    });
}
