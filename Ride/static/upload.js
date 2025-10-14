document.addEventListener("DOMContentLoaded", function () {
    const yearSelect = document.getElementById("year");
    const modelSelect = document.getElementById("model");
    const trimSelect = document.getElementById("trim");

    const startYear = 2023;
    const endYear = new Date().getFullYear() + 1;

    for (let year = endYear; year >= startYear; year--){
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        
        yearSelect.appendChild(option);
    }

    //
    async function updateTrims() {
        const model = modelSelect.value;
        const year = yearSelect.value;

        trimSelect.innerHTML = '<option selected disabled value="">Choose...</option>';
        trimSelect.disabled = true;

        //
        if (model && year){
            try{
                const res = await fetch(`/admin/get_trims?model_name=${encodeURIComponent(model)}&year=${year}`);
                const trims = await res.json();

                if (trims.length > 0){
                    trims.forEach(t => {
                        const opt = document.createElement("option");
                        opt.value = t;
                        opt.textContent = t;
                        trimSelect.appendChild(opt);
                        
                    });
                    trimSelect.disabled = false;
                }
            } catch(err){
                console.error("Error while loading trim: ", err);
            }
        }
    }

    modelSelect.addEventListener("change", updateTrims);
    yearSelect.addEventListener("change", updateTrims);
});

