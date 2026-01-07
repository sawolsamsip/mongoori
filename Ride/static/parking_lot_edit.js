$(document).ready(function () {
    let editingRow = null;

    const table = $('#parkingLotTable').DataTable({
        responsive: false,
        autoWidth: false,
        scrollX: true,

        ajax: {
            url: '/api/parking-lots',
            dataSrc: function (json) {
                if (!json.success) {
                    alert(json.message || 'Failed to load parking lots');
                    return [];
                }
                return json.data;
            }
        },
        columns: [
            { data: 'name' },
            { data: 'address_line1' },
            { data: 'city' },
            { data: 'state' },
            { data: 'zip_code' },
            {
                data: 'status',
                render: s => s === 'active' ? 'Active' : 'Inactive'
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: row => `
                    <button class="btn btn-sm btn-outline-secondary edit-parking-lot-btn"
                            data-id="${row.id}">
                        <i class="fa fa-pen"></i>
                    </button>
                `
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: row => `
                    <button class="btn btn-sm btn-outline-danger delete-parking-lot-btn"
                            data-id="${row.id}">
                        <i class="fa fa-trash"></i>
                    </button>
                `
            }
        ],
        order: [[0, 'asc']]
    });

    // edit
    $('#parkingLotTable').on('click', '.edit-parking-lot-btn', function () {

        if (editingRow) {
            alert('Finish editing the current row first.');
            return;
        }

        const tr = $(this).closest('tr');
        const row = table.row(tr);
        const data = row.data();
        const cells = tr.find('td');

        editingRow = row;

        // text form to input form
        cells.eq(0).html(`<input class="form-control form-control-sm" value="${data.name}">`);
        cells.eq(1).html(`<input class="form-control form-control-sm" value="${data.address_line1}">`);
        cells.eq(2).html(`<input class="form-control form-control-sm" value="${data.city}">`);
        cells.eq(3).html(`<input class="form-control form-control-sm" value="${data.state}">`);
        cells.eq(4).html(`<input class="form-control form-control-sm" value="${data.zip_code}">`);

        cells.eq(5).html(`
            <select class="form-select form-select-sm">
                <option value="active" ${data.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${data.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
        `);

        // Edit → Save / Cancel
        cells.eq(6).html(`
            <button class="btn btn-sm btn-success btn-save-cancel save-parking-lot-btn">Save</button>
            
        `);
        cells.eq(7).html(`
            <button class="btn btn-sm btn-secondary btn-save-cancel cancel-parking-lot-btn">Cancel</button>
        `);

        table.columns.adjust();
    });

    // cancel
    $('#parkingLotTable').on('click', '.cancel-parking-lot-btn', function () {
        editingRow = null;
        table.ajax.reload(null, false);
    });


    $(window).on('resize', function () {
        table.columns.adjust();
    });

    // update
    $('#parkingLotTable').on('click', '.save-parking-lot-btn', async function () {
        if (!editingRow) return;

        const btn = $(this);
        btn.prop('disabled', true);

        const tr = $(this).closest('tr');
        const rowData = editingRow.data();
        const id = rowData.id;
    
        const payload = {
            name: tr.find('td').eq(0).find('input').val().trim(),
            address_line1: tr.find('td').eq(1).find('input').val().trim(),
            city: tr.find('td').eq(2).find('input').val().trim(),
            state: tr.find('td').eq(3).find('input').val().trim(),
            zip_code: tr.find('td').eq(4).find('input').val().trim() || null,
            status: tr.find('td').eq(5).find('select').val()
        };
    
        try {
            const res = await fetch(`/api/parking-lots/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
    
            const data = await res.json();
    
            if (!res.ok) {
                alert(data.message || 'Update failed');
                return;
            }
    
            editingRow = null;
            table.ajax.reload(null, false);
    
        } catch (err) {
            console.error(err);
            alert('Network error');
        } finally {
            btn.prop('disabled', false);
        }
    });

    $('#parkingLotTable').on('click', '.delete-parking-lot-btn', async function () {
        if (editingRow) {
            alert('Finish editing before deleting.');
            return;
        }
    
        const id = $(this).data('id');
        if (!id) return;
    
        if (!confirm('Are you sure you want to delete this parking lot?')) return;
    
        try {
            const res = await fetch(`/api/parking-lots/${id}`, {
                method: 'DELETE'
            });
    
            const data = await res.json();
    
            if (!res.ok || !data.success) {
                alert(data.message || 'Delete failed');
                return;
            }
    
            showToast(data.message);
            table.ajax.reload(null, false);
    
        } catch (err) {
            console.error(err);
            alert('Network error while deleting parking lot');
        }
    });


});
