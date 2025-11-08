// load warraty types for selected category
function loadWarrantyTypes(categorySelect, typeSelect){
    const selected = categorySelect.value;
    const list = selected === "purchase" ? PURCHASE_WARRANTIES : SUBSCRIPTION_WARRANTIES;

    typeSelect.innerHTML = '<option disabled selected value="">Select...</option>';
    typeSelect.disabled = false;

    list.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w.warranty_type_id;
        opt.textContent = w.display_name;
        opt.title = w.type_name;

        typeSelect.appendChild(opt);
    });

}

function loadPurchaseWarrantyTypes(typeSelect){
    typeSelect.innerHTML = '<option disabled selected value="">Select...</option>';
    typeSelect.disabled = false;

    PURCHASE_WARRANTIES.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w.warranty_type_id;
        opt.textContent = w.display_name;
        typeSelect.appendChild(opt);
    });
}