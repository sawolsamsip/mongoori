$(document).ready(function () {
    $('#parkingLotTable').DataTable({
        ajax: {
            url: '/api/parking-lots',
            dataSrc: ''
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
                    <button class="btn btn-sm btn-outline-danger delete-parking-lot-btn"
                            data-id="${row.id}">
                        <i class="fa fa-trash"></i>
                    </button>
                `
            }
        ],
        order: [[0, 'asc']]
    });
});