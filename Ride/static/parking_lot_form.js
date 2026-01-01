document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("parkingForm");
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

        const mode = form.dataset.mode;

        const msgBox = document.getElementById("toastMsg");

        // JSON payload
        const payload = {
            name: form.name.value.trim(),
            address_line1: form.address_line1.value.trim(),
            city: form.city.value.trim(),
            state: form.state.value,
            zip_code: form.zip_code.value.trim(),
            status: form.status.value
        };
        
        if (!payload.name) {
            showFieldError("name", "Parking lot name is required.");
            return;
        }

        if (!payload.address_line1) {
            showFieldError("address_line1", "Street address is required.");
            return;
        }

        if (!payload.city) {
            showFieldError("city", "City is required.");
            return;
        }

        if (!payload.state) {
            showFieldError("state", "State is required.");
            return;
        }
        
        
        // API call

        try {
            const res = await fetch("/api/parking-lots", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                const toastEl = document.getElementById("successToast");
                if (toastEl) {
                    const toast = new bootstrap.Toast(toastEl);
                    toast.show();
                }

                
                window.location.href = "/admin/parking-lots";
                return;
            }

            if (data.errors) {
                Object.entries(data.errors)
                    .forEach(([field, msg]) => showFieldError(field, msg));
                return;
            }

            alert(data.message || "Failed to create parking lot.");

        } catch (err) {
            console.error("Network error", err);
            alert("Network error occurred.");
        }

        

    });
});