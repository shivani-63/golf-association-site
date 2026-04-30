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

function sortByDateAscending(a, b) {
  return new Date(a.date) - new Date(b.date);
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
        points: 0,
        awayPoints: 0,
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

      home.points += homeScore;
      away.points += awayScore;
      away.awayPoints += awayScore;

      if (homeScore > awayScore) {
        home.won++;
        away.lost++;
      } else if (homeScore < awayScore) {
        away.won++;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
      }
    });

  return Object.values(table).sort(
    (a, b) =>
      b.points - a.points ||
      b.awayPoints - a.awayPoints ||
      a.team.localeCompare(b.team),
  );
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

function setupMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("primary-navigation");

  if (!menuToggle || !mainNav) return;

  const closeSubmenus = () => {
    document.querySelectorAll(".has-submenu.submenu-open").forEach((item) => {
      item.classList.remove("submenu-open");
    });
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));

    if (!isOpen) closeSubmenus();
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
}

function setupClubSlider(clubs) {
  let slideIndex = 0;

  const slideImage = document.getElementById("slide-image");
  const slideName = document.getElementById("slide-name");
  const prevBtn = document.getElementById("prev-slide");
  const nextBtn = document.getElementById("next-slide");

  if (!slideImage || !slideName) return;

  function renderSlide() {
    const club = clubs[slideIndex];
    slideImage.src = club.image;
    slideImage.alt = club.name;
    slideName.textContent = club.name;
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

function initSiteChrome() {
  const logoEl = document.getElementById("site-logo");
  if (logoEl) logoEl.src = SITE_DATA.logo;

  setupMobileMenu();
}

function getCurrentDivisionKey() {
  const pageDivision = document.body.dataset.division;

  if (pageDivision && DIVISION_CONFIG[pageDivision]) {
    return pageDivision;
  }

  return "division-1";
}

async function initFixturesPage() {
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
}

async function initLeagueTablesPage() {
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
  ).map((team, index) => ({
    pos: index + 1,
    team: team.team,
    p: team.played,
    w: team.won,
    d: team.drawn,
    l: team.lost,
    pts: team.points,
  }));

  const division2Table = calculateLeagueTable(
    division2Fixtures,
    teams,
    "Division 2",
  ).map((team, index) => ({
    pos: index + 1,
    team: team.team,
    p: team.played,
    w: team.won,
    d: team.drawn,
    l: team.lost,
    pts: team.points,
  }));

  renderTableRows("division-1-league-table-body", division1Table, [
    "pos",
    "team",
    "p",
    "w",
    "d",
    "l",
    "pts",
  ]);

  renderTableRows("division-2-league-table-body", division2Table, [
    "pos",
    "team",
    "p",
    "w",
    "d",
    "l",
    "pts",
  ]);
}

async function initPage() {
  initSiteChrome();

  const pageType = document.body.dataset.page;

  try {
    if (pageType === "home") {
      setupClubSlider(SITE_DATA.clubs);
    } else if (pageType === "league-tables") {
      await initLeagueTablesPage();
    } else if (pageType === "fixtures") {
      await initFixturesPage();
    }
  } catch (error) {
    console.error(error);
  }
}

initPage();
