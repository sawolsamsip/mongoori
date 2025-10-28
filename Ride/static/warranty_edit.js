$(document).ready(function(){
    let selectedVehicleId = null;
    let selectedType = null;
    let selectedField = null;
    let selectedCell = null;

    const modal = new bootstrap.Modal(document.getElementById("editFieldModal"));

    $('#warrantyTable').on('click', '.edit-type, .edit-date, .edit-miles', function(){
        selectedCell = $(this);
        const row = $(this).closest('tr');
        selectedVehicleId = row.data('id');
        selectedType = row.data('type');
        selectedField = $(this).attr('class').split(' ')[0].replace('edit-', '');

        let inputHTML = '';
        
        if(selectedField === 'type'){
            $('#modalTitle').text('Edit Warranty Type');
            inputHTML = `
                <select id = "editFieldInput" class="form-select">
                    <option>Basic Vehicle</option>
                    <option>Battery</option>
                    <option>Drive Unit</option>
                </select>
            `;
            $('#modalBody').html(inputHTML);
            $('#editFieldInput').val(selectedCell.text().trim());
        }
        else if (selectedField === 'date'){
            $('#modalTitle').text('Edit Expire Date');
            inputHTML = `<input type="date" id="editFieldInput" class="form-control">`;
            $('#modalBody').html(inputHTML);
            $('#editFieldInput').val(selectedCell.text().trim() === '-' ? '' : selectedCell.text().trim());
        }
        else if (selectedField === 'miles') {
            $('#modalTitle').text('Edit Expire Miles');
            inputHTML = `<input type="number" id="editFieldInput" class="form-control" placeholder="Enter miles">`;
            $('#modalBody').html(inputHTML);
            $('#editFieldInput').val(selectedCell.text().trim() === '-' ? '' : selectedCell.text().trim());
        }
        
        modal.show();
    });
    
    

});