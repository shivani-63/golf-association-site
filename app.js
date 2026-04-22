const defaultData = {
  site: {
    title: "HEAVY WOOLLEN DISTRICT RABBITS GOLF LEAGUE",
    logo: "./assets/league-logo.png",
  },
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
  fixtures: [
    { date: "2026-05-01", home: "Huddersfield", away: "Low Moor", venue: "Huddersfield" },
    { date: "2026-05-08", home: "Halifax", away: "Huddersfield", venue: "Halifax" },
  ],
  results: [
    { date: "2026-04-12", fixture: "Low Moor vs Halifax", score: "4 - 3" },
    { date: "2026-04-19", fixture: "Huddersfield vs Halifax", score: "5 - 2" },
  ],
  leagueTable: [
    { team: "Huddersfield", p: 5, w: 4, d: 0, l: 1, pts: 12 },
    { team: "Halifax", p: 5, w: 3, d: 1, l: 1, pts: 10 },
    { team: "Low Moor", p: 5, w: 1, d: 1, l: 3, pts: 4 },
  ],
};

const STORAGE_KEY = "golf-association-data-v1";
const ADMIN_TOKEN_KEY = "golf-admin-token-v1";
const API_URL = "/api/data";
const LOGIN_URL = "/api/auth/login";

function mergeWithDefaults(rawData) {
  return {
    ...structuredClone(defaultData),
    ...(rawData || {}),
    site: { ...defaultData.site, ...((rawData && rawData.site) || {}) },
  };
}

function loadLocalFallback() {
  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (!fromStorage) return structuredClone(defaultData);
  try {
    return mergeWithDefaults(JSON.parse(fromStorage));
  } catch {
    return structuredClone(defaultData);
  }
}

function saveLocalFallback(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function loadData() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remoteData = await response.json();
    const merged = mergeWithDefaults(remoteData);
    saveLocalFallback(merged);
    return merged;
  } catch {
    return loadLocalFallback();
  }
}

async function saveDataToApi(data, token) {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.message || `Save failed (${response.status})`);
  }
  saveLocalFallback(data);
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

async function initHomePage() {
  const data = await loadData();
  const logoEl = document.getElementById("site-logo");
  const logoValue =
    !data.site.logo || data.site.logo.includes("placehold.co")
      ? "./assets/league-logo.png"
      : data.site.logo;
  if (logoEl) logoEl.src = logoValue;

  let slideIndex = 0;
  const slideImage = document.getElementById("slide-image");
  const slideName = document.getElementById("slide-name");
  const dotsContainer = document.getElementById("slide-dots");
  const prevBtn = document.getElementById("prev-slide");
  const nextBtn = document.getElementById("next-slide");
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
      if (window.innerWidth <= 980 && parentItem && link.parentElement === parentItem) {
        return;
      }
      clearOpenSubmenus();
      mainNav.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });

  const submenuParents = document.querySelectorAll(".has-submenu > a");
  submenuParents.forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      if (window.innerWidth > 980) return;
      event.preventDefault();
      const parent = anchor.parentElement;
      document.querySelectorAll(".has-submenu.submenu-open").forEach((openItem) => {
        if (openItem !== parent) openItem.classList.remove("submenu-open");
      });
      parent?.classList.toggle("submenu-open");
    });
  });

  document.addEventListener("click", (event) => {
    if (!mainNav) return;
    const clickTarget = event.target;
    if (!(clickTarget instanceof Element)) return;
    const clickedInsideMenu = clickTarget.closest("#primary-navigation, #menu-toggle");
    if (!clickedInsideMenu) clearOpenSubmenus();
  });

  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = "";
    data.clubs.forEach((_, index) => {
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
    const club = data.clubs[slideIndex];
    if (!club || !slideImage || !slideName) return;
    slideImage.src = club.image;
    slideImage.alt = club.name;
    slideName.textContent = club.name;
    renderDots();
  }

  prevBtn?.addEventListener("click", () => {
    slideIndex = (slideIndex - 1 + data.clubs.length) % data.clubs.length;
    renderSlide();
  });

  nextBtn?.addEventListener("click", () => {
    slideIndex = (slideIndex + 1) % data.clubs.length;
    renderSlide();
  });

  renderSlide();

  renderTableRows("fixtures-table", data.fixtures, ["date", "home", "away", "venue"]);
  renderTableRows("results-table", data.results, ["date", "fixture", "score"]);
  renderTableRows("league-table-body", data.leagueTable, ["team", "p", "w", "d", "l", "pts"]);
  renderClubFooter(data.clubs);
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function parseJson(textareaId, fallbackValue) {
  const textarea = document.getElementById(textareaId);
  if (!textarea) return fallbackValue;
  if (!textarea.value.trim()) return fallbackValue;
  return JSON.parse(textarea.value);
}

async function initAdminPage() {
  const titleInput = document.getElementById("site-title-input");
  const logoInput = document.getElementById("site-logo-input");
  const clubsInput = document.getElementById("clubs-input");
  const fixturesInput = document.getElementById("fixtures-input");
  const resultsInput = document.getElementById("results-input");
  const leagueInput = document.getElementById("league-input");
  const saveBtn = document.getElementById("save-btn");
  const exportBtn = document.getElementById("export-btn");
  const importInput = document.getElementById("import-file");
  const statusEl = document.getElementById("status-msg");
  const authStatusEl = document.getElementById("auth-status-msg");
  const loginBtn = document.getElementById("admin-login-btn");
  const logoutBtn = document.getElementById("admin-logout-btn");
  const passwordInput = document.getElementById("admin-password-input");
  const editorWrap = document.getElementById("admin-editor");

  let token = sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
  let currentData = await loadData();

  function fillForm(data) {
    if (titleInput) titleInput.value = data.site.title;
    if (logoInput) logoInput.value = data.site.logo;
    if (clubsInput) clubsInput.value = formatJson(data.clubs);
    if (fixturesInput) fixturesInput.value = formatJson(data.fixtures);
    if (resultsInput) resultsInput.value = formatJson(data.results);
    if (leagueInput) leagueInput.value = formatJson(data.leagueTable);
  }

  function updateAuthUi() {
    const isLoggedIn = Boolean(token);
    if (editorWrap) editorWrap.hidden = !isLoggedIn;
    if (authStatusEl) {
      authStatusEl.textContent = isLoggedIn
        ? "Signed in. You can now update website data."
        : "Not signed in.";
      authStatusEl.style.color = isLoggedIn ? "#175434" : "#7b2231";
    }
  }

  fillForm(currentData);
  updateAuthUi();

  loginBtn?.addEventListener("click", async () => {
    const password = passwordInput?.value?.trim();
    if (!password) {
      if (authStatusEl) {
        authStatusEl.textContent = "Enter your admin password first.";
        authStatusEl.style.color = "#7b2231";
      }
      return;
    }
    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error("Incorrect password.");
      const payload = await response.json();
      token = payload.token;
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      if (passwordInput) passwordInput.value = "";
      updateAuthUi();
    } catch (error) {
      if (authStatusEl) {
        authStatusEl.textContent = `Sign in failed: ${error.message}`;
        authStatusEl.style.color = "#7b2231";
      }
    }
  });

  logoutBtn?.addEventListener("click", () => {
    token = "";
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    updateAuthUi();
  });

  saveBtn?.addEventListener("click", async () => {
    try {
      if (!token) throw new Error("Sign in before saving.");
      const updated = {
        site: {
          title: titleInput?.value?.trim() || defaultData.site.title,
          logo: logoInput?.value?.trim() || defaultData.site.logo,
        },
        clubs: parseJson("clubs-input", defaultData.clubs),
        fixtures: parseJson("fixtures-input", []),
        results: parseJson("results-input", []),
        leagueTable: parseJson("league-input", []),
      };

      await saveDataToApi(updated, token);
      currentData = mergeWithDefaults(updated);
      if (statusEl) {
        statusEl.textContent = "Saved to backend successfully.";
        statusEl.style.color = "#175434";
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = `Save failed: ${err.message}`;
        statusEl.style.color = "#7b2231";
      }
    }
  });

  exportBtn?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "golf-site-data.json";
    link.click();
    URL.revokeObjectURL(link.href);
  });

  importInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      currentData = mergeWithDefaults(imported);
      fillForm(currentData);
      if (statusEl) {
        statusEl.textContent = "Imported to form. Click Save updates to publish.";
        statusEl.style.color = "#175434";
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = `Import failed: ${err.message}`;
        statusEl.style.color = "#7b2231";
      }
    }
  });
}

(async () => {
  if (document.body.dataset.page === "admin") {
    await initAdminPage();
  } else {
    await initHomePage();
  }
})();
