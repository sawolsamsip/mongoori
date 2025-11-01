document.addEventListener("DOMContentLoaded", function () {
    const yearSelect = document.getElementById("year");
    const modelSelect = document.getElementById("model");
    const trimSelect = document.getElementById("trim");

    const exteriorSelect = document.getElementById("exterior");
    const interiorSelect = document.getElementById("interior");

    const softwareSelect = document.getElementById("software");

    //when editing, load existing values
    const selectedModel = modelSelect.dataset.selected;
    const selectedYear = yearSelect.dataset.selected;
    const selectedTrim = trimSelect.dataset.selected;
    const selectedExterior = exteriorSelect.dataset.selected;
    const selectedInterior = interiorSelect.dataset.selected;
    const selectedSoftware = softwareSelect.dataset.selected;

    if (selectedModel) {
        modelSelect.value = selectedModel;
    }
    
    if (selectedInterior) {
        interiorSelect.value = selectedInterior;
    }

    if (selectedSoftware) {
        softwareSelect.value = selectedSoftware;
    }

    const startYear = 2023;
    const endYear = new Date().getFullYear() + 1;

    for (let year = endYear; year >= startYear; year--){
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;

        if (String(year) === selectedYear){
            option.selected = true;
        }
        
        yearSelect.appendChild(option);
    }

    // get trim
    async function updateTrims(init = false) {
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

                        if (init && selectedTrim === t) opt.selected = true;

                        trimSelect.appendChild(opt);
                        
                    });
                    trimSelect.disabled = false;
                }

                if (init && selectedTrim) {
                    await updateExterior(true);
                }


            } catch(err){
                console.error("Error while loading trim: ", err);
            }
        }
    }

    // get exterior
    async function updateExterior(init = false) {
        const model = modelSelect.value;
        const year = yearSelect.value;
        const trim = trimSelect.value;

        exteriorSelect.innerHTML = '<option selected disabled value="">Choose...</option>';
        exteriorSelect.disabled = true;

        //
        if (model && year && trim){
            try{
                const res = await fetch(`/admin/get_exteriors?model_name=${encodeURIComponent(model)}&year=${year}&trim=${trim}`);
                const exteriors = await res.json();

                if (exteriors.length > 0){
                    exteriors.forEach(t => {
                        const opt = document.createElement("option");
                        opt.value = t;
                        opt.textContent = t;
                        
                        if (init && selectedExterior === t) opt.selected = true;

                        exteriorSelect.appendChild(opt);
                        
                    });
                    exteriorSelect.disabled = false;
                }
            } catch(err){
                console.error("Error while loading exteriors: ", err);
            }
        }
    }
    

    //

    modelSelect.addEventListener("change", ()=> updateTrims(false));
    yearSelect.addEventListener("change", ()=> updateTrims(false));
    trimSelect.addEventListener("change", ()=>updateExterior(false));

    if (selectedModel && selectedYear){
        updateTrims(true);
    }


    // Form submit with AJAX

    const form = document.getElementById("vehicleForm");
    if (!form) return;

    function clearErrors(){
        form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
        form.querySelectorAll(".invalid-feedback").forEach(el => el.remove());
    }

    function showFieldError(name, msg) {
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) return;
        input.classList.add("is-invalid");
        const fb = document.createElement("div");
        fb.className = "invalid-feedback";
        fb.textContent = msg;
        input.insertAdjacentElement("afterend", fb);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        const formData = new FormData(form);
        const msgBox = document.getElementById("toastMsg");

        const vin = (formData.get("vin") || "").trim().toUpperCase();
        if(!vin) {
            showFieldError("vin", "VIN is required.");
            msgBox.textContent = "input VIN";
            msgBox.className = "text-danger fw-bold mt-2";
            return;
        }

        if (vin.length !== 17){
            showFieldError("vin", "VIN must be 17 characters and numbers.");
            msgBox.textContent = "Incorrect VIN length";
            msgBox.className = "text-danger fw-bold mt-2";
            return;
        }
        try{
            const res = await fetch(form.action, {method: "POST", body: formData});
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.next_url){
                const toastEl = document.getElementById("successToast");
                const toast = new bootstrap.Toast(toastEl);

                msgBox.textContent = data.message || "Vehicle successfully added."
                toast.show();

                setTimeout(() => window.location.href = data.next_url, 1300);
                return ;
            }
            
            if (data.errors){
                Object.entries(data.errors).forEach(([field, msg]) => showFieldError(field, msg));
            }

            msgBox.textContent = data.message || "input error";
            msgBox.className = "text-danger fw-bold mt-2"

        } catch (err) {
            console.error("Network error", err);
            msgBox.textContent = "Network Error";
            msgBox.className = "text-warning fw-bold mt-2";

        }

    });



});

