document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("year");
    const startYear = 2023;
    const endYear = new Date().getFullYear() + 1;

    for (let year = endYear; year >= startYear; year--){
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        
        select.appendChild(option);
    }

});