const API_URL =
    "https://script.google.com/macros/s/AKfycby-vZKWmdFH1T8ec6ZJht-7S7z4xeC6eAgitJXVcOUiu6-nvw0Ze8aARDfHHiFd7ep4eg/exec";

const SHEETS = {
    ours: "ourBalls",
    theirs: "guestBalls",
};

const CACHE_KEY = "ball_price_cache_v1";

let currentSheet = SHEETS.ours;
let allData = [];
let filteredData = [];

const catalog = document.getElementById("catalog");
const searchInput = document.getElementById("searchInput");
const tabs = document.querySelectorAll(".tab");
const template = document.getElementById("cardTemplate");
const loader = document.getElementById("loader");
const warningBanner = document.getElementById("warningBanner");

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

        if (cache[sheetName]) {
            allData = cache[sheetName];
            filteredData = [...allData];

            toggleWarning(sheetName);
            render();
            hideLoader();
            return;
        }

        const res = await fetch(`${API_URL}?sheet=${sheetName}`);
        const data = await res.json();

        allData = data.map((item) => ({
            name: item.name ?? "",
            price: item.price ?? "",
        }));

        cache[sheetName] = allData;
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
    if (sheet === SHEETS.theirs) {
        warningBanner.classList.remove("hidden");
        warningBanner.textContent =
            "Услуга по надуванию шаров покупателей производится при полной предоплате...";
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

    filteredData.forEach((item) => {
        const card = template.content.cloneNode(true);
        card.querySelector(".ball-name").textContent = item.name;
        card.querySelector(".value").textContent = item.price;
        catalog.appendChild(card);
    });
}
