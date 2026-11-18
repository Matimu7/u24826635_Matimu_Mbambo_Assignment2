// ===== NAVIGATION & VIEW SWITCHING =====

const navHome = document.getElementById("nav-home");
const navAnalysis = document.getElementById("nav-analysis");
const startButton = document.getElementById("start-button");

const allViews = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll(".topnav a");

function showPage(pageId) {
  for (let i = 0; i < allViews.length; i++) {
    allViews[i].classList.remove("active-view");
  }

  for (let i = 0; i < navLinks.length; i++) {
    navLinks[i].classList.remove("active");
  }

  const targetSection = document.getElementById(pageId);
  if (targetSection) {
    targetSection.classList.add("active-view");
  }

  if (pageId === "home") {
    navHome.classList.add("active");
  } else if (pageId === "analysis") {
    navAnalysis.classList.add("active");
  }

  window.scrollTo(0, 0);
}

// ===== CLICK EVENTS =====

navHome.addEventListener("click", function (event) {
  event.preventDefault();
  showPage("home");
  history.pushState(null, "", "#home");
});

navAnalysis.addEventListener("click", function (event) {
  event.preventDefault();
  showPage("analysis");
  history.pushState(null, "", "#analysis");
});

startButton.addEventListener("click", function (event) {
  event.preventDefault();
  showPage("analysis");
  history.pushState(null, "", "#analysis");
});

// ===== BROWSER HISTORY & HASH HANDLING =====

window.addEventListener("load", function () {
  const currentHash = window.location.hash.replace("#", "");
  if (currentHash === "analysis") {
    showPage("analysis");
  } else {
    showPage("home");
  }
});

window.addEventListener("hashchange", function () {
  const currentHash = window.location.hash.replace("#", "");
  if (currentHash === "analysis") {
    showPage("analysis");
  } else {
    showPage("home");
  }
});


// ===== LOAD CSV DATASET & POPULATE DROPDOWNS =====

let dataset = [];
let yearsList = [];
let indicatorsList = [];
let countriesList = [];

const indicatorSelect = document.getElementById("indicator-select");
const countrySelect = document.getElementById("country-select");
const yearSelect = document.getElementById("year-select");

// Fetch and parse the World Bank CSV file
fetch("WDI_Southern_Africa_Data.csv")
  .then(function (response) {
    return response.text();
  })
  .then(function (csvText) {
    parseCSVData(csvText);
    populateDropdowns();

    if (typeof updateSummaryIndicators === "function") {
      updateSummaryIndicators();
    }
    if (typeof updateAllCharts === "function") {
      updateAllCharts();
    }
  })
  .catch(function (error) {
    console.error("Error loading CSV file:", error);
  });

// Convert raw CSV text into clean JavaScript objects
function parseCSVData(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");

  // Extract year numbers from headers like "2000 [YR2000]"
  yearsList = [];
  for (let i = 4; i < headers.length; i++) {
    const cleanYear = headers[i].trim().substring(0, 4);
    yearsList.push(cleanYear);
  }

  // Loop through data rows and skip empty/footer rows
  dataset = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (row === "" || row.startsWith("Data from") || row.startsWith("Last Updated")) {
      continue;
    }

    const cols = row.split(",");
    const countryName = cols[0] ? cols[0].trim() : "";
    const seriesName = cols[2] ? cols[2].trim() : "";

    if (!countryName || !seriesName) {
      continue;
    }

    // Store yearly values in an object mapped by year
    let yearlyValues = {};
    for (let j = 4; j < headers.length; j++) {
      const yr = headers[j].trim().substring(0, 4);
      const val = parseFloat(cols[j]);
      yearlyValues[yr] = isNaN(val) ? null : val;
    }

    dataset.push({
      country: countryName,
      indicator: seriesName,
      values: yearlyValues
    });

    // Track unique countries and indicators
    if (countriesList.indexOf(countryName) === -1) {
      countriesList.push(countryName);
    }
    if (indicatorsList.indexOf(seriesName) === -1) {
      indicatorsList.push(seriesName);
    }
  }
}

// Fill the three HTML select dropdowns
function populateDropdowns() {
  indicatorSelect.innerHTML = "";
  for (let i = 0; i < indicatorsList.length; i++) {
    const opt = document.createElement("option");
    opt.value = indicatorsList[i];
    opt.textContent = indicatorsList[i];
    indicatorSelect.appendChild(opt);
  }

  countrySelect.innerHTML = '<option value="all">All countries</option>';
  for (let i = 0; i < countriesList.length; i++) {
    const opt = document.createElement("option");
    opt.value = countriesList[i];
    opt.textContent = countriesList[i];
    countrySelect.appendChild(opt);
  }

  yearSelect.innerHTML = "";
  for (let i = 0; i < yearsList.length; i++) {
    const opt = document.createElement("option");
    opt.value = yearsList[i];
    opt.textContent = yearsList[i];
    yearSelect.appendChild(opt);
  }

  // Default year to 2023
  yearSelect.value = "2023";
}


// ===== SUMMARY STATISTICS & KPI CARDS =====

function getIndicatorUnit(indicatorName) {
  if (indicatorName.indexOf("US$") !== -1) {
    return "US$";
  } else if (indicatorName.indexOf("%") !== -1) {
    return "%";
  }
  return "";
}

function updateSummaryIndicators() {
  const selectedIndicator = indicatorSelect.value;
  const selectedCountry = countrySelect.value;
  const unit = getIndicatorUnit(selectedIndicator);

  // Filter records for the chosen indicator
  const matchingRecords = dataset.filter(function (item) {
    if (selectedCountry === "all") {
      return item.indicator === selectedIndicator;
    }
    return item.indicator === selectedIndicator && item.country === selectedCountry;
  });

  if (matchingRecords.length === 0) {
    return;
  }

  // 1. Calculate Mean (Average value from 2000 to 2023)
  let sum = 0;
  let count = 0;

  for (let i = 0; i < matchingRecords.length; i++) {
    for (let j = 0; j < yearsList.length; j++) {
      const yr = yearsList[j];
      const val = matchingRecords[i].values[yr];
      if (val !== null) {
        sum += val;
        count++;
      }
    }
  }

  const averageVal = count > 0 ? (sum / count).toFixed(2) : "-";

  // 2. Calculate Percentage Change (2000 vs 2023)
  let totalStart2000 = 0;
  let totalEnd2023 = 0;

  for (let i = 0; i < matchingRecords.length; i++) {
    totalStart2000 += matchingRecords[i].values["2000"] || 0;
    totalEnd2023 += matchingRecords[i].values["2023"] || 0;
  }

  let percentChange = "-";
  if (totalStart2000 !== 0) {
    const diff = ((totalEnd2023 - totalStart2000) / Math.abs(totalStart2000)) * 100;
    const sign = diff > 0 ? "+" : "";
    percentChange = sign + diff.toFixed(1) + "%";
  }

  // Update the DOM elements on the dashboard
  document.getElementById("average-value").textContent = averageVal + " " + unit;
  document.getElementById("change-value").textContent = percentChange;

  if (selectedCountry === "all") {
    document.getElementById("average-note").textContent = "Regional mean across 5 countries (2000–2023)";
    document.getElementById("change-note").textContent = "Regional shift from 2000 to 2023";
  } else {
    document.getElementById("average-note").textContent = selectedCountry + " mean (2000–2023)";
    document.getElementById("change-note").textContent = selectedCountry + " change from 2000 to 2023";
  }
}


// ===== CHART.JS VISUALIZATIONS (LINE, BAR & DOUGHNUT) =====

let lineChart = null;
let barChart = null;
let doughnutChart = null;

// High-contrast colors matching the dashboard theme
const paletteColors = ["#d4f035", "#38bdf8", "#f97316", "#a855f7", "#22c55e"];

function updateChartTitles(indicator, country, year) {
  const scopeLabel = country === "all" ? "All 5 Countries" : country;

  document.getElementById("line-chart-title").textContent =
    indicator + " — " + scopeLabel + " (2000–2023)";

  document.getElementById("bar-chart-title").textContent =
    "Country Comparison: " + indicator + " (" + year + ")";

  document.getElementById("third-chart-title").textContent =
    "Regional Breakdown: " + indicator + " (" + year + ")";
}

function updateAllCharts() {
  const selectedIndicator = indicatorSelect.value;
  const selectedCountry = countrySelect.value;
  const selectedYear = yearSelect.value;

  updateChartTitles(selectedIndicator, selectedCountry, selectedYear);

  const indicatorRecords = dataset.filter(function (item) {
    return item.indicator === selectedIndicator;
  });

  if (indicatorRecords.length === 0) {
    return;
  }

  // --- CHART 1: LINE CHART (TREND OVER TIME 2000-2023) ---
  let lineDatasets = [];
  for (let i = 0; i < indicatorRecords.length; i++) {
    const rec = indicatorRecords[i];
    if (selectedCountry === "all" || rec.country === selectedCountry) {
      let dataPoints = [];
      for (let j = 0; j < yearsList.length; j++) {
        dataPoints.push(rec.values[yearsList[j]]);
      }

      lineDatasets.push({
        label: rec.country,
        data: dataPoints,
        borderColor: paletteColors[i % paletteColors.length],
        backgroundColor: paletteColors[i % paletteColors.length],
        borderWidth: 2,
        tension: 0.25,
        fill: false
      });
    }
  }

  if (lineChart) {
    lineChart.destroy();
  }

  const lineCtx = document.getElementById("line-chart").getContext("2d");
  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: yearsList,
      datasets: lineDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#ffffff" } }
      },
      scales: {
        x: { ticks: { color: "#9fa396" }, grid: { color: "#262920" } },
        y: { ticks: { color: "#9fa396" }, grid: { color: "#262920" } }
      }
    }
  });

  // --- CHART 2: BAR CHART (COUNTRY COMPARISON IN SELECTED YEAR) ---
  let barLabels = [];
  let barValues = [];
  let barColors = [];

  for (let i = 0; i < indicatorRecords.length; i++) {
    const rec = indicatorRecords[i];
    barLabels.push(rec.country);
    barValues.push(rec.values[selectedYear]);

    // Highlight selected country in Volt Lime, mute others if filtered
    if (selectedCountry === "all") {
      barColors.push(paletteColors[i % paletteColors.length]);
    } else if (rec.country === selectedCountry) {
      barColors.push("#d4f035");
    } else {
      barColors.push("#323729");
    }
  }

  if (barChart) {
    barChart.destroy();
  }

  const barCtx = document.getElementById("bar-chart").getContext("2d");
  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: barLabels,
      datasets: [{
        label: selectedIndicator + " (" + selectedYear + ")",
        data: barValues,
        backgroundColor: barColors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#ffffff" } }
      },
      scales: {
        x: { ticks: { color: "#9fa396" }, grid: { display: false } },
        y: { ticks: { color: "#9fa396" }, grid: { color: "#262920" } }
      }
    }
  });

  // --- CHART 3: DOUGHNUT CHART (COUNTRY SHARE IN SELECTED YEAR) ---
  if (doughnutChart) {
    doughnutChart.destroy();
  }

  const doughnutCtx = document.getElementById("third-chart").getContext("2d");
  doughnutChart = new Chart(doughnutCtx, {
    type: "doughnut",
    data: {
      labels: barLabels,
      datasets: [{
        label: selectedYear,
        data: barValues,
        backgroundColor: paletteColors,
        borderColor: "#171913",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: "#ffffff" }
        }
      }
    }
  });
}

// ===== DYNAMIC FILTERS & RESET CONTROLS =====

const resetButton = document.getElementById("reset-button");

function refreshDashboard() {
  updateSummaryIndicators();
  updateAllCharts();
}

// Listen for changes on any dropdown filter
indicatorSelect.addEventListener("change", refreshDashboard);
countrySelect.addEventListener("change", refreshDashboard);
yearSelect.addEventListener("change", refreshDashboard);

// Reset all filters back to default values
resetButton.addEventListener("click", function () {
  if (indicatorsList.length > 0) {
    indicatorSelect.value = indicatorsList[0];
  }
  countrySelect.value = "all";
  yearSelect.value = "2023";
  refreshDashboard();
});
