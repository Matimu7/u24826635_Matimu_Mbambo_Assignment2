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

    // Run dashboard update functions once they are added in later steps
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