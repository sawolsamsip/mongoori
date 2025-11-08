$(document).ready(function () {
    // view for warranty_info
        
    const table = $('#warrantyTable').DataTable({
        responsive: false,
        autoWidth: false,
        scrollX: true,
    
        order: [[3, 'asc'], [4, 'asc'], [5, 'asc']],
    
        columnDefs: [
            {targets: 3, orderDataType: 'warranty-type-order'},
            {targets: [0,1,2,3], visible: false},
            { targets: 8, title: "", orderable: false, searchable: false }
        ],
    
        rowGroup: {
            dataSrc: 0,
            startRender: function (rows, group){
                const model = rows.data().pluck(1)[0];
                const year = rows.data().pluck(2)[0];
                const plate = rows.data().pluck(3)[0];
                const count = rows.count();
                
                const vehicleId = rows.nodes().to$().first().data('vehicle-id');
    
                return $('<tr/>').append(`
                    <td colspan="7" class = "bg-light fw-bold">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>VIN: ${group}<br>
                            <small class="text-muted">${model} (${year}) Plate: ${plate}</small>
                            </div>
                            <button class = "btn btn-sm btn-success add-warranty-btn" data-vehicle-id="${vehicleId}">
                                <i class="fa fa-plus-circle"></i> add
                            </button>
                        </div>
                    </td>    
                `);
            }
        }
    });
    // edit cell
    let selectedField = null;
    let selectedCell = null;

    const modal = new bootstrap.Modal(document.getElementById("editFieldModal"));

    $('#warrantyTable').on('click', '.warranty_type, .expire_date, .expire_miles', function(){
        selectedCell = $(this);
        const row = $(this).closest('tr');
        const warrantyId = row.data('warranty-id');
        
        selectedField = $(this).hasClass("warranty_type") ? "warranty_type"
                        : $(this).hasClass("expire_date") ? "expire_date"
                        : "expire_miles";
        
        let inputHTML = '';
        
        if(selectedField === 'warranty_type'){
            $('#modalTitle').text('Edit Warranty Type');
            inputHTML = `
                <select id = "editFieldInput" class="form-select">
                    <option>Basic Vehicle</option>
                    <option>Battery</option>
                    <option>Drive Unit</option>
                </select>
            `;
        }
        else if (selectedField === 'expire_date'){
            $('#modalTitle').text('Edit Expire Date');
            inputHTML = `<input type="date" id="editFieldInput" class="form-control">`;
        }
        else if (selectedField === 'expire_miles') {
            $('#modalTitle').text('Edit Expire Miles');
            inputHTML = `<input type="number" id="editFieldInput" class="form-control" placeholder="Enter miles">`;
        }

        $('#modalBody').html(inputHTML);
        $('#editFieldInput').val(selectedCell.text().trim() === '-' ? '' : selectedCell.text().trim());

        // save button
        $('#saveFieldBtn').off('click').on('click', function(){
            const newValue = $('#editFieldInput').val();
            updateWarrantyField(warrantyId, selectedField, newValue, selectedCell);
        })

        modal.show();
    });

    // add warranty
    $('#warrantyTable').on('click', '.add-warranty-btn', function(){
        const vehicleId = $(this).data('vehicle-id');

        const modal = new bootstrap.Modal(document.getElementById("editFieldModal"));

        $('#modalTitle').text('Add New Warranty');
        $('#modalBody').html(`
            <div class="mb-2">
                <label class="form-label">Warranty Type</label>
                <select id="newWarrantyType" class="form-select">
                    <option>Basic Vehicle</option>
                    <option>Battery</option>
                    <option>Drive Unit</option>
                </select>
            </div>
            <div class="mb-2">
                <label class="form-label">Expire Date</label>
                <input type="date" id="newExpireDate" class="form-control">
            </div>
            <div class="mb-2">
                <label class="form-label">Expire Miles</label>
                <input type="number" id="newExpireMiles" class = "form-control">
            </div>
            `);
        $('#saveFieldBtn').off('click').on('click', async function(){
            const warrantyType = $('#newWarrantyType').val();
            const expireDate = $('#newExpireDate').val();
            const expireMiles = $('#newExpireMiles').val();

            try {
                const res = await fetch('/admin/add_warranty', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        vehicle_id: vehicleId,
                        warranty_type: warrantyType,
                        expire_date: expireDate,
                        expire_miles: expireMiles
                    }),
                });
                
                const data = await res.json();
                if (data.success) {
                    modal.hide();
                    location.reload();
                } else{
                    alert(data.message || 'Failed to add warranty');
                }

            } catch (err) {
                console.error('Error adding warranty:', err);
                alert('Network error while adding warranty');
            }
        });

        modal.show();
    });

    //remove
    $('#warrantyTable').on('click', '.delete-warranty-btn', async function(){
        if(!confirm('Delete this warranty?')) return;

        const row = $(this).closest('tr');
        const warrantyId = row.data('warranty-id');

        try{
            const res = await fetch('/admin/delete_warranty', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ warranty_id: warrantyId }),
            });

            const data = await res.json();
            if (data.success){
                row.fadeOut(300, function(){$(this).remove(); });
            } else {
                alert(data.message || 'Failed to delete warranty');
            }
        } catch (err) {
            console.error('Error deleting warranty:', err);
            alert('Network error while deleting warranty');
        }
    });


});

async function updateWarrantyField(warrantyId, field, newValue,  selectedCell){
    try {
        const res = await fetch('/admin/update_warranty', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                warranty_id: warrantyId,
                field: field,
                value: newValue
            }),
        });
        console.log("HTTP status:", res.status)

        const text = await res.text();
        console.log("Raw response:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (err){
            console.error("JSON parse error:", err);
            alert("Invalid JSON returned from server");
        }

        if (data.success) {
            selectedCell.text(newValue || "-");

            const row = selectedCell.closest("tr");
            row.find("td.status").text(data.new_status);
            //close modal
            const modalEl = document.getElementById("editFieldModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        } else {
            alert(data.message || "Update failed");
        }
    } catch (err) {
        console.error("Network error while updating warranty:", err);
        alert("Network error while updating warranty");
    }
};