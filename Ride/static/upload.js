document.addEventListener("DOMContentLoaded", function () {
    const yearSelect = document.getElementById("year");
    const modelSelect = document.getElementById("model");
    const trimSelect = document.getElementById("trim");

    const exteriorSelect = document.getElementById("exterior");

    const startYear = 2023;
    const endYear = new Date().getFullYear() + 1;

    for (let year = endYear; year >= startYear; year--){
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        
        yearSelect.appendChild(option);
    }

    // get trim
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

    // get exterior
    async function updateExterior() {
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

    modelSelect.addEventListener("change", updateTrims);
    yearSelect.addEventListener("change", updateTrims);
    trimSelect.addEventListener("change", updateExterior);

});

function addWarranty(){
    const container = document.getElementById("warranty-container");
    
    const row = document.createElement("div");
    row.className = "row g-2 mb-2"

    // Warranty type
    const col1 = document.createElement("div");
    col1.className = "col-md-4";
    
    const select = document.createElement("select");
    select.name = "warranty_type[]";
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
    expireDate.name = "warranty_expire[]";
    expireDate.className = "form-control";
    
    col2.appendChild(expireDate);

    // expire miles
    const col3 = document.createElement("div");
    col3.className = "col-md-3";
    const milesInput = document.createElement("input");
    milesInput.type = "number";
    milesInput.name = "warranty_miles[]";
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