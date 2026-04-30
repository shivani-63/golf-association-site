/*
  Clean Google Sheets version of app.js

  This version does NOT use:
  - backend/server.js
  - /api/data
  - localStorage fallback data
  - the old admin JSON editor for fixtures/results/league table

  Your public website will read directly from published Google Sheets CSV links.
*/

const DIVISION_CONFIG = {
  "division-1": {
    name: "Division 1",
    fixturesUrl:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTmYlIot2E396lxkaqJYWv-U7L02Yqx--PR2Odbao0ueRhOlB6zzlomWqB_BMnoxiP-9CK-2X-uGW68/pub?gid=2031441240&single=true&output=csv",
  },
  "division-2": {
    name: "Division 2",
    fixturesUrl:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTmYlIot2E396lxkaqJYWv-U7L02Yqx--PR2Odbao0ueRhOlB6zzlomWqB_BMnoxiP-9CK-2X-uGW68/pub?gid=125894295&single=true&output=csv",
  },
};

const TEAMS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTmYlIot2E396lxkaqJYWv-U7L02Yqx--PR2Odbao0ueRhOlB6zzlomWqB_BMnoxiP-9CK-2X-uGW68/pub?gid=0&single=true&output=csv";

const SITE_DATA = {
  logo: "./assets/league-logo.png",
  clubs: [
    {
      name: "Huddersfield Golf Club",
      image:
        "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Halifax Bradley Hall",
      image:
        "https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Low Moor Club",
      image:
        "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80",
    },
  ],
};

async function loadCSV(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load CSV: ${path}`);
  }

  const text = await response.text();
  const rows = text.trim().split(/\r?\n/);
  const headers = rows[0].split(",").map((header) => header.trim());

  return rows.slice(1).map((row) => {
    const values = row.split(",").map((value) => value.trim());
    const item = {};

    headers.forEach((header, index) => {
      item[header] = values[index] || "";
    });

    return item;
  });
}

function calculateLeagueTable(fixtures, teams, division) {
  const table = {};

  teams
    .filter((team) => team.division === division)
    .forEach((team) => {
      table[team.team] = {
        team: team.team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDiff: 0,
        points: 0,
      };
    });

  fixtures
    .filter((match) => match.played?.toUpperCase() === "TRUE")
    .forEach((match) => {
      const home = table[match.home];
      const away = table[match.away];

      if (!home || !away) return;

      const homeScore = Number(match.home_score);
      const awayScore = Number(match.away_score);

      if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return;

      home.played++;
      away.played++;

      home.pointsFor += homeScore;
      home.pointsAgainst += awayScore;

      away.pointsFor += awayScore;
      away.pointsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.won++;
        away.lost++;
        home.points += 2;
      } else if (homeScore < awayScore) {
        away.won++;
        home.lost++;
        away.points += 2;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }
    });

  return Object.values(table)
    .map((team) => ({
      ...team,
      pointsDiff: team.pointsFor - team.pointsAgainst,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.pointsDiff - a.pointsDiff ||
        b.pointsFor - a.pointsFor ||
        a.team.localeCompare(b.team),
    );
}

function sortByDateAscending(a, b) {
  return new Date(a.date) - new Date(b.date);
}

function sortByDateDescending(a, b) {
  return new Date(b.date) - new Date(a.date);
}

function createCell(text) {
  const td = document.createElement("td");
  td.textContent = text ?? "";
  return td;
}

function renderTableRows(tableBodyId, rows, cellOrder) {
  const tbody = document.getElementById(tableBodyId);
  if (!tbody) return;

  tbody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    cellOrder.forEach((cellKey) => tr.appendChild(createCell(row[cellKey])));
    tbody.appendChild(tr);
  });
}

function initialsFromName(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function renderClubFooter(clubs) {
  const footerList = document.getElementById("club-footer-list");
  if (!footerList) return;

  footerList.innerHTML = "";

  clubs.forEach((club) => {
    const item = document.createElement("article");
    item.className = "club-footer-item";

    const logoWrap = document.createElement("div");
    logoWrap.className = "club-footer-logo";

    if (club.image) {
      const image = document.createElement("img");
      image.src = club.image;
      image.alt = `${club.name} logo`;
      logoWrap.appendChild(image);
    } else {
      const fallback = document.createElement("span");
      fallback.textContent = initialsFromName(club.name);
      logoWrap.appendChild(fallback);
    }

    const name = document.createElement("p");
    name.className = "club-footer-name";
    name.textContent = club.name;

    item.appendChild(logoWrap);
    item.appendChild(name);
    footerList.appendChild(item);
  });
}

function setupMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("primary-navigation");

  const clearOpenSubmenus = () => {
    document.querySelectorAll(".has-submenu.submenu-open").forEach((item) => {
      item.classList.remove("submenu-open");
    });
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = mainNav?.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    document.body.classList.toggle("menu-open", Boolean(isOpen));

    if (!isOpen) clearOpenSubmenus();
  });

  mainNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      const parentItem = link.closest(".has-submenu");

      if (
        window.innerWidth <= 980 &&
        parentItem &&
        link.parentElement === parentItem
      ) {
        return;
      }

      clearOpenSubmenus();
      mainNav.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });

  document.querySelectorAll(".has-submenu > a").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      if (window.innerWidth > 980) return;

      event.preventDefault();
      const parent = anchor.parentElement;

      document
        .querySelectorAll(".has-submenu.submenu-open")
        .forEach((openItem) => {
          if (openItem !== parent) openItem.classList.remove("submenu-open");
        });

      parent?.classList.toggle("submenu-open");
    });
  });

  document.addEventListener("click", (event) => {
    if (!mainNav) return;

    const clickTarget = event.target;
    if (!(clickTarget instanceof Element)) return;

    const clickedInsideMenu = clickTarget.closest(
      "#primary-navigation, #menu-toggle",
    );
    if (!clickedInsideMenu) clearOpenSubmenus();
  });
}

function setupClubSlider(clubs) {
  let slideIndex = 0;

  const slideImage = document.getElementById("slide-image");
  const slideName = document.getElementById("slide-name");
  const dotsContainer = document.getElementById("slide-dots");
  const prevBtn = document.getElementById("prev-slide");
  const nextBtn = document.getElementById("next-slide");

  function renderDots() {
    if (!dotsContainer) return;

    dotsContainer.innerHTML = "";

    clubs.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = `dot${index === slideIndex ? " active" : ""}`;
      dot.type = "button";
      dot.addEventListener("click", () => {
        slideIndex = index;
        renderSlide();
      });

      dotsContainer.appendChild(dot);
    });
  }

  function renderSlide() {
    const club = clubs[slideIndex];
    if (!club || !slideImage || !slideName) return;

    slideImage.src = club.image;
    slideImage.alt = club.name;
    slideName.textContent = club.name;
    renderDots();
  }

  prevBtn?.addEventListener("click", () => {
    slideIndex = (slideIndex - 1 + clubs.length) % clubs.length;
    renderSlide();
  });

  nextBtn?.addEventListener("click", () => {
    slideIndex = (slideIndex + 1) % clubs.length;
    renderSlide();
  });

  renderSlide();
}

function showError(message) {
  console.error(message);

  const fixturesTable = document.getElementById("fixtures-table");
  const resultsTable = document.getElementById("results-table");
  const leagueTable = document.getElementById("league-table-body");

  [fixturesTable, resultsTable, leagueTable].forEach((tbody) => {
    if (!tbody) return;

    tbody.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 10;
    cell.textContent =
      "Could not load league data. Please check the Google Sheets CSV links.";
    row.appendChild(cell);
    tbody.appendChild(row);
  });
}

function getCurrentDivisionKey() {
  const pageDivision = document.body.dataset.division;

  if (pageDivision && DIVISION_CONFIG[pageDivision]) {
    return pageDivision;
  }

  const pagePath = window.location.pathname.toLowerCase();

  if (pagePath.includes("division-2") || pagePath.includes("division2")) {
    return "division-2";
  }

  return "division-1";
}

function initSiteChrome() {
  const logoEl = document.getElementById("site-logo");
  if (logoEl) logoEl.src = SITE_DATA.logo;

  setupMobileMenu();
  setupClubSlider(SITE_DATA.clubs);
  renderClubFooter(SITE_DATA.clubs);
}

async function initFixturesPage() {
  try {
    const divisionKey = getCurrentDivisionKey();
    const divisionConfig = DIVISION_CONFIG[divisionKey];

    const fixtures = await loadCSV(divisionConfig.fixturesUrl);

    const fixtureRows = fixtures.sort(sortByDateAscending).map((match) => ({
      date: match.date,
      home: match.home,
      result:
        match.played?.toUpperCase() === "TRUE"
          ? `${match.home_score} - ${match.away_score}`
          : "–",
      away: match.away,
    }));

    renderTableRows("fixtures-table", fixtureRows, [
      "date",
      "home",
      "result",
      "away",
    ]);
  } catch (error) {
    showError(error.message);
  }
}

async function initLeagueTablesPage() {
  try {
    const teams = await loadCSV(TEAMS_CSV_URL);
    const division1Fixtures = await loadCSV(
      DIVISION_CONFIG["division-1"].fixturesUrl,
    );
    const division2Fixtures = await loadCSV(
      DIVISION_CONFIG["division-2"].fixturesUrl,
    );

    const division1Table = calculateLeagueTable(
      division1Fixtures,
      teams,
      "Division 1",
    ).map((team) => ({
      team: team.team,
      p: team.played,
      w: team.won,
      d: team.drawn,
      l: team.lost,
      pf: team.pointsFor,
      pa: team.pointsAgainst,
      pd: team.pointsDiff,
      pts: team.points,
    }));

    const division2Table = calculateLeagueTable(
      division2Fixtures,
      teams,
      "Division 2",
    ).map((team) => ({
      team: team.team,
      p: team.played,
      w: team.won,
      d: team.drawn,
      l: team.lost,
      pf: team.pointsFor,
      pa: team.pointsAgainst,
      pd: team.pointsDiff,
      pts: team.points,
    }));

    renderTableRows("division-1-league-table-body", division1Table, [
      "team",
      "p",
      "w",
      "d",
      "l",
      "pf",
      "pa",
      "pd",
      "pts",
    ]);

    renderTableRows("division-2-league-table-body", division2Table, [
      "team",
      "p",
      "w",
      "d",
      "l",
      "pf",
      "pa",
      "pd",
      "pts",
    ]);
  } catch (error) {
    showError(error.message);
  }
}

async function initPage() {
  initSiteChrome();

  const pageType = document.body.dataset.page;

  if (pageType === "league-tables") {
    await initLeagueTablesPage();
  } else {
    await initFixturesPage();
  }
}

initPage();
