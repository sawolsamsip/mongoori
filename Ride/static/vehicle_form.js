let isEditMode = false;

function updateFooterButtons(isEdit) {
    const actions = document.getElementById("formActions");
    if (!actions) return;

    if(isEdit) {
        actions.innerHTML = `
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-secondary" id="cancelEditBtn">
                Cancel
            </button>
        `;

        document.getElementById("cancelEditBtn")
        ?.addEventListener("click", () => {
            window.location.reload();
        });

    } else {
        actions.innerHTML = `
            <button type="button" class="btn btn-secondary" id="backBtn">
                Back to List
            </button>
        `;

        document.getElementById("backBtn")
            ?.addEventListener("click", () => {
                window.location.href = "/admin/vehicles";
            });
    }
}

function setEditMode(next){
    isEditMode = next;

    const toggle = document.getElementById("modeToggle");
    if (toggle) {
        toggle.checked = isEditMode;
    }

    document.querySelectorAll(".editable").forEach(el => {
        if (el.tagName === "SELECT") {
            el.disabled = !isEditMode;
        } else {
            el.readOnly = !isEditMode;
        }
    });

    updateFooterButtons(isEditMode);
}


document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("vehicleForm");
    const toggle = document.getElementById("modeToggle");

    if (!form) return;

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
        if (form.dataset.mode === "detail" && !isEditMode && !init) return;

        const model = modelSelect.value;
        const year = yearSelect.value;

        trimSelect.innerHTML = '<option selected disabled value="">Choose...</option>';
        trimSelect.disabled = true;

        //
        if (model && year){
            try{
                const res = await fetch(`/api/vehicles/trims?model_name=${encodeURIComponent(model)}&year=${year}`);
                const data = await res.json();
                const trims = data.trims;

                if (trims.length > 0){
                    trims.forEach(t => {
                        const opt = document.createElement("option");
                        opt.value = t;
                        opt.textContent = t;

                        if (init && selectedTrim === t) opt.selected = true;

                        trimSelect.appendChild(opt);
                        
                    });
                    trimSelect.disabled = (form.dataset.mode === "detail" && !isEditMode);
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
        if (form.dataset.mode === "detail" && !isEditMode && !init) return;
        const model = modelSelect.value;
        const year = yearSelect.value;
        const trim = trimSelect.value;

        exteriorSelect.innerHTML = '<option selected disabled value="">Choose...</option>';
        exteriorSelect.disabled = true;

        //
        if (model && year && trim){
            try{
                const res = await fetch(`/api/vehicles/exteriors?model_name=${encodeURIComponent(model)}&year=${year}&trim=${trim}`);
                const data = await res.json();
                const exteriors = data.exteriors;

                if (exteriors.length > 0){
                    exteriors.forEach(t => {
                        const opt = document.createElement("option");
                        opt.value = t;
                        opt.textContent = t;
                        
                        if (init && selectedExterior === t) opt.selected = true;

                        exteriorSelect.appendChild(opt);
                        
                    });
                    exteriorSelect.disabled = (form.dataset.mode === "detail" && !isEditMode);
                }
            } catch(err){
                console.error("Error while loading exteriors: ", err);
            }
        }
    }
    

    //

    modelSelect.addEventListener("change", () => {
        if (form.dataset.mode === "detail" && !isEditMode) return;
        updateTrims(false);
    });
    
    yearSelect.addEventListener("change", () => {
        if (form.dataset.mode === "detail" && !isEditMode) return;
        updateTrims(false);
    });
    
    trimSelect.addEventListener("change", () => {
        if (form.dataset.mode === "detail" && !isEditMode) return;
        updateExterior(false);
    });

    if (selectedModel && selectedYear){
        updateTrims(true);
    }


    // Form submit


    if (form.dataset.mode === "detail") {
        setEditMode(false);
    }

    toggle?.addEventListener("change", (e) => {
        setEditMode(e.target.checked);
    });


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

        const mode = form.dataset.mode;

        if (mode === "detail" && !isEditMode) {
            return;
        }

        let url, method;
        if (mode === "detail"){
            url = form.dataset.updateUrl;
            method = "PUT"
        }else {
            url = form.dataset.createUrl;
            method = "POST"
        }


        // JSON payload
        const payload = {
            vin: form.vin.value.trim().toUpperCase(),
            make: form.make.value.trim(),
            model: form.model.value.trim(),
            year: form.year.value,
            trim: form.trim.value,
            exterior: form.exterior.value,
            interior: form.interior.value,
            plate_number: form.plate_number.value.trim().toUpperCase(),
            mileage: form.mileage.value,
            software: form.software.value
        };        
        
        // warranty info
        if (mode === "add") {
            const warrantyRows = document.querySelectorAll("#warranty-container .row");
            const warranties = [];
        
            warrantyRows.forEach(row => {
                const type = row.querySelector('[name="warranty_type"]').value;
                const expireDate = row.querySelector('[name="warranty_expire_date"]').value;
                const expireMiles = row.querySelector('[name="warranty_expire_miles"]').value;
        
                if (type) {
                    warranties.push({
                        type: type,
                        expire_date: expireDate,
                        expire_miles: expireMiles
                    });
                }
            });
        
            payload.warranties = warranties;
        }
        
        //
        if(!payload.vin) {
            showFieldError("vin", "VIN is required.");
            showToast("VIN is required.");
            return;
        }

        if (payload.vin.length !== 17){
            showFieldError("vin", "VIN must be 17 characters and numbers.");
            showToast("VIN must be 17 characters.");
            return;
        }

        try{
            const res = await fetch(url, {method, headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success){
                showToast(
                    data.message || (mode === "detail"
                        ? "Vehicle successfully updated."
                        : "Vehicle successfully added.")
                );

                if (mode === "add") {
                    setTimeout(() => {
                        window.location.href = "/admin/vehicles";
                    }, 800);
                } else {
                    setTimeout(() => {
                        setEditMode(false);
                    }, 800);
                }
            }
            
            if (data.errors){
                Object.entries(data.errors).forEach(([field, msg]) => showFieldError(field, msg));
            }

            if (data.errors){
                Object.entries(data.errors).forEach(([field, msg]) => showFieldError(field, msg));
                showToast(data.message || "Validation error");
            }

        } catch (err) {
            console.error("Network error", err);
            showToast("Network error");
        }

    });



});

// status update

const updateStatusBtn = document.getElementById("updateVehicleStatusBtn");

if (updateStatusBtn) {
    updateStatusBtn.addEventListener("click", async () => {
        const statusSelect = document.getElementById("vehicleStatusSelect");
        const newStatus = statusSelect.value;

        const form = document.getElementById("vehicleForm");
        const updateUrl = form.dataset.updateUrl;

        if (!newStatus) {
            showToast("Please select a status.");
            return;
        }

        try {
            const res = await fetch(updateUrl + "/status", {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    vehicle_status: newStatus
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast("Vehicle status updated.");
            } else {
                showToast(data.message || "Status update failed.");
            }

        } catch (err) {
            console.error("Status update error:", err);
            showToast("Network error while updating status.");
        }
    });
}