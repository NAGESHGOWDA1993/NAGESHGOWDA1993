const themeSelected = (e) => {
  const selectedTheme = e.target.value
  document.documentElement.setAttribute('data-theme', selectedTheme);
  localStorage.setItem('theme', selectedTheme);
}

// Respond to a different theme being selected from the dropdown
const themeDropdown = document.getElementById('theme-selector');
themeDropdown.addEventListener('change', themeSelected, false);

// Use the last theme the user selected.
const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : "blue";
document.documentElement.setAttribute('data-theme', currentTheme);
themeDropdown.value = currentTheme;