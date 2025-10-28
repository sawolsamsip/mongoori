function addWarranty(){
    const container = document.getElementById("warranty-container");
    
    const row = document.createElement("div");
    row.className = "row g-2 mb-2"

    // Warranty type
    const col1 = document.createElement("div");
    col1.className = "col-md-4";
    
    const select = document.createElement("select");
    select.name = "warranty_type";
    select.className = "form-select";
    
    const options = ["", "Basic Vehicle", "Battery", "Drive Unit"];
    options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt === ""? "Choose...": opt;
        if (opt === ""){
            option.disabled = true;
            option.selected = true;
        }
        select.appendChild(option);
    });
    col1.appendChild(select);

    // Warranty expire date
    const col2 = document.createElement("div");
    col2.className = "col-md-3";
    const expireDate = document.createElement("input");
    expireDate.type = "date";
    expireDate.name = "warranty_expire_date";
    expireDate.className = "form-control";
    
    col2.appendChild(expireDate);

    // expire miles
    const col3 = document.createElement("div");
    col3.className = "col-md-3";
    const milesInput = document.createElement("input");
    milesInput.type = "number";
    milesInput.name = "warranty_expire_miles";
    milesInput.placeholder = "Miles";
    milesInput.className = "form-control";
    
    col3.appendChild(milesInput);

    // delete button
    const col4 = document.createElement("div");
    col4.className = "col-md-2 text-center";
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn btn-danger btn-sm";
    delBtn.innerHTML = '<i class="fa fa-minus-circle"></i>'
    delBtn.onclick = () => row.remove();
    col4.appendChild(delBtn);


    //row append
    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3);
    row.appendChild(col4);

    container.appendChild(row);
}