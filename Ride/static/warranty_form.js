function addWarranty(){
    const container = document.getElementById("warranty-container");
    
    const row = document.createElement("div");
    row.className = "row g-2 mb-2"
    
    // Warranty type (purchase only)
    const colType = document.createElement("div");
    colType.className = "col-md-4";

    const warrantySelect = document.createElement("select");
    warrantySelect.name = "warranty_type";
    warrantySelect.className = "form-select";
    warrantySelect.disabled = true

    colType.appendChild(warrantySelect);    

    loadPurchaseWarrantyTypes(warrantySelect);

    // Warranty expire date
    const colDate = document.createElement("div");
    colDate.className = "col-md-3";
    const expireDate = document.createElement("input");
    expireDate.type = "date";
    expireDate.name = "warranty_expire_date";
    expireDate.className = "form-control";
    
    colDate.appendChild(expireDate);

    // expire miles
    const colMiles = document.createElement("div");
    colMiles.className = "col-md-3";
    const milesInput = document.createElement("input");
    milesInput.type = "number";
    milesInput.name = "warranty_expire_miles";
    milesInput.placeholder = "Miles";
    milesInput.className = "form-control";
    
    colMiles.appendChild(milesInput);

    // delete button
    const colRemove = document.createElement("div");
    colRemove.className = "col-md-2 text-center";
    
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn btn-danger btn-sm";
    delBtn.innerHTML = '<i class="fa fa-minus-circle"></i>'
    delBtn.onclick = () => row.remove();
    colRemove.appendChild(delBtn);


    //row append
    row.appendChild(colType);
    row.appendChild(colDate);
    row.appendChild(colMiles);
    row.appendChild(colRemove);

    container.appendChild(row);
}