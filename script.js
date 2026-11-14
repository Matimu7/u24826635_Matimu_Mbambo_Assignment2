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