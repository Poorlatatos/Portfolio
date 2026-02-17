const mainDropdown = document.getElementById('main-dropdown');
const subDropdown = document.getElementById('sub-dropdown');

// Example sub-options for each main option
const subOptions = {
    "2025": ["Diary 1", "Diary 2"],
    "2024": ["Diary A", "Diary B"],
    "2023": ["Entry X", "Entry Y"],
    "2022": ["Note 1", "Note 2"]
};

mainDropdown.addEventListener('change', function() {
    const value = mainDropdown.value;
    if (subOptions[value]) {
        subDropdown.innerHTML = subOptions[value].map(opt => `<option>${opt}</option>`).join('');
        subDropdown.style.display = 'block';
    } else {
        subDropdown.style.display = 'none';
    }
});