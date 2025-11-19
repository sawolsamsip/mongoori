
function loadWarrantyTypes(selectElem, warrantyList){
    selectElem.innerHTML = '<option disabled selected value="">Select...</option>';
    selectElem.disabled = false;

    warrantyList.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w.warranty_type_id;
        opt.textContent = w.display_name;
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

        <label>End Date</label>
        <input type="date" id="subEnd" class="form-control mb-2">

        <label>Monthly Cost</label>
        <input type="number" step="0.01" id="subCost" class="form-control">
    `;

    loadWarrantyTypes(document.getElementById("subscriptionType"),SUBSCRIPTION_WARRANTIES);
}
