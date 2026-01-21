let btnColorMode = document.getElementById("color-mode");

btnColorMode.addEventListener("click", () => {
    if (document.documentElement.getAttribute("data-bs-theme") === "light") {
        document.documentElement.setAttribute("data-bs-theme","dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme","light");
    }
})