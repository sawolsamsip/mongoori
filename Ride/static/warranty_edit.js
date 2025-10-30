// view for warranty_info
$(document).ready(function () {
    $.fn.dataTable.ext.order['warranty-type-order'] = function(sttings, col){
        const orderMap = {
            'Basic Vehicle' : 1,
            'Battery' : 2,
            'Drive Unit': 3
        };
    
        return this.api().column(col, { order: 'index'}).data().map(type => orderMap[type] || 99);
    };
    
    const table = $('#warrantyTable').DataTable({
        responsive: false,
        autoWidth: false,
        scrollX: true,
    
        order: [[3, 'asc'], [4, 'asc'], [5, 'asc']],
    
        columnDefs: [
            {targets: 3, orderDataType: 'warranty-type-order'},
            {targets: [0,1,2,3], visible: false}
        ],
    
        rowGroup: {
            dataSrc: 0,
            startRender: function (rows, group){
                const model = rows.data().pluck(1)[0];
                const year = rows.data().pluck(2)[0];
                const plate = rows.data().pluck(3)[0];
                const count = rows.count();
    
                return $('<tr/>').append(`
                    <td colspan="7" class = "bg-light fw-bold">
                        <div>VIN: ${group}</div>
                        <div class = "text-muted small ms-3">
                            ${model} (${year}) - Plate: ${plate}
                        </div>
                    </td>    
                `);
            }
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
            row.find("td:last").text(data.new_status);

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
}

// edit warranty
$(document).ready(function(){
    let selectedField = null;
    let selectedCell = null;

    const modal = new bootstrap.Modal(document.getElementById("editFieldModal"));

    $('#warrantyTable').on('click', '.warranty_type, .expire_date, .expire_miles', function(){
        selectedCell = $(this);
        const row = $(this).closest('tr');
        const warrantyId = row.data('warranty-id');
        selectedField = $(this).attr('class');
        
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

        // save button //todo
        $('#saveFieldBtn').off('click').on('click', function(){
            const newValue = $('#editFieldInput').val();
            updateWarrantyField(warrantyId, selectedField, newValue, selectedCell);
        })

        modal.show();
    });
});