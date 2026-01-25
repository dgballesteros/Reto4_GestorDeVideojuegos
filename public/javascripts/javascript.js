const THEME_KEY = "gamecenter-theme";
const THEME_DARK = "dark";
const THEME_LIGHT = "light";

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY);
}

function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

function initTheme() {
  const stored = getStoredTheme();
  if (stored === THEME_LIGHT || stored === THEME_DARK) {
    applyTheme(stored);
  } else {
    applyTheme(THEME_DARK);
    setStoredTheme(THEME_DARK);
  }
}

initTheme();

const btnColorMode = document.getElementById("color-mode");
if (btnColorMode) {
  btnColorMode.addEventListener("click", (e) => {
    e.preventDefault();
    const current = document.documentElement.getAttribute("data-bs-theme");
    const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyTheme(next);
    setStoredTheme(next);
  });
}
