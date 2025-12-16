function showToast(msg){
    const toastEl = document.getElementById("successToast");
    const msgBox = document.getElementById("toastMsg");
    
    msgBox.textContent = msg;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function loadWarrantyTypes(selectElem, warrantyList){
    selectElem.innerHTML = '<option disabled selected value="">Select...</option>';
    selectElem.disabled = false;

    warrantyList.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w.warranty_type_id;
        opt.textContent = w.display_name;
        opt.title = w.type_name;
        selectElem.appendChild(opt);
    });
}

// modal rendering

function renderPurchaseForm() {
    document.getElementById("purchaseFormBody").innerHTML = `
        <label>Warranty Type</label>
        <select id="purchaseType" class="form-select mb-2"></select>

        <label>Expiration Date</label>
        <input type="date" id="purchaseExpireDate" class="form-control mb-2">

        <label>Expiration Mileage</label>
        <input type="number" id="purchaseExpireMiles" class="form-control">
    `;

    loadWarrantyTypes(document.getElementById("purchaseType"),PURCHASE_WARRANTIES);
}

function renderSubscriptionForm() {
    document.getElementById("subscriptionFormBody").innerHTML = `
        <label>Subscription Type</label>
        <select id="subscriptionType" class="form-select mb-2"></select>

        <label>Start Date</label>
        <input type="date" id="subStart" class="form-control mb-2">

        <label>Monthly Cost</label>
        <input type="number" step="0.01" id="subCost" class="form-control">
    `;

    loadWarrantyTypes(document.getElementById("subscriptionType"),SUBSCRIPTION_WARRANTIES);
}


// purchase subscription Save with modal
async function savePurchaseWarranty() {
    const modalEl = document.getElementById('purchaseWarrantyModal');
    const currentVehicleId = modalEl.dataset.vehicleId;

    const type = $('#purchaseType').val();
    const expireDate = $('#purchaseExpireDate').val();
    const expireMiles = $('#purchaseExpireMiles').val();

    console.log("savePurchaseWarranty() called");
    console.log("vehicleId from modal.dataset.vehicleId =", currentVehicleId);

    if (!currentVehicleId) {
        alert("Vehicle ID missing.");
        return;
    }

    if (!type) {
        alert("Please select warranty type.");
        return;
    }

    try {
        const res = await fetch('/api/warranties/purchase', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                vehicle_id: currentVehicleId,
                warranty_type: type,
                expire_date: expireDate || null,
                expire_miles: expireMiles || null,
                category: "purchase"
            })
        });

        const data = await res.json();

        if (data.success) {
            const modalEl = document.getElementById('purchaseWarrantyModal');
            bootstrap.Modal.getInstance(modalEl).hide();
            showToast(data.message);
            location.reload();
        } else {
            alert(data.message || "Add warranty failed");
        }

    } catch (err) {
        console.error(err);
        alert("Network error while adding warranty");
    }

}


// subscription Warranty Save with modal

async function saveSubscriptionWarranty() {
    const modalEl = document.getElementById('subscriptionWarrantyModal');
    const currentVehicleId = modalEl.dataset.vehicleId;

    const type = $('#subscriptionType').val();
    const startDate = $('#subStart').val();
    const cost = $('#subCost').val();
    
    if (!currentVehicleId) {
        alert("Vehicle ID missing.");
        return;
    }

    if (!type) {
        alert("Please select warranty type.");
        return;
    }

    try {
        const res = await fetch('/api/warranties/subscription', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                vehicle_id: currentVehicleId,
                warranty_type: type,
                start_date: startDate,
                monthly_cost: cost || null,
                category: "subscription"
            })
        });

        const data = await res.json();

        if (data.success) {
            const modalEl = document.getElementById('subscriptionWarrantyModal');
            bootstrap.Modal.getInstance(modalEl).hide();
            showToast(data.message);
            location.reload();
        } else {
            alert(data.message || "Add warranty failed");
        }

    } catch (err) {
        console.error(err);
        alert("Network error while adding warranty");
    }
}


$(document).on('click', '#btnSavePurchase', savePurchaseWarranty);
$(document).on('click', '#btnSaveSubscription', saveSubscriptionWarranty);
 
