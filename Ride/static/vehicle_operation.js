$(document).ready(function () {
    const table = $('#vehicleTable').DataTable({
    responsive: false,
    autoWidth: false,
    scrollX: true,

    columnDefs: [
        {
            targets: 1, // Plate
            render: function (data, type, row) {
                const vin = row[2]; // VIN

                if (type === 'display') {
                    return `
                        <div>
                            <div class="fw-semibold">${data}</div>
                            <div class="text-muted small">${vin}</div>
                        </div>
                    `;
                }

                if (type === 'filter') {
                    // Plate + VIN for search
                    return `${data} ${vin}`;
                }

                return data;
            }
        },

        {
            targets: 10, // Operation Status
            render: function (data, type) {
                const v = (data || '').toString().trim().toUpperCase();

                if (type === 'display') {
                return v === 'ACTIVE'
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-secondary">Inactive</span>';
                }

                if (type === 'sort' || type === 'type') {
                // ACTIVE first
                return v === 'ACTIVE' ? 0 : 1;
                }

                if (type === 'filter') {
                // for search
                return v; // 'ACTIVE' or 'INACTIVE'
                }

                return v;
            }
        },

        {
            targets: 2,
            visible: false,
            searchable: true
        },

        { targets: 0, visible: false },
        {
            targets: [6, 7, 8, 9],   // Addr1, City, State, Zip
            visible: false,
            searchable: false,
            orderable: false
        }
        
    ],
    
    orderFixed: {
        pre: [[0, 'asc']]
      },

    order: [
        [10, 'asc'], // Operation Status
        [1, 'asc']  // Plate
        ],

    rowGroup: {
        dataSrc: 0,
        startRender: function (rows, group) {
            const name = group;

            const firstRow = rows.data()[0];
            const addr1 = firstRow[6];
            const city  = firstRow[7];
            const state = firstRow[8];
            const zip   = firstRow[9];

            const address = addr1
            ? `${addr1}, ${city}, ${state} ${zip}`
            : '';

            console.log(addr1, city, state, zip);

            return $('<tr class="group-row"/>')
                .append(
                `
                <td colspan="11" class="bg-light fw-bold">
                    <div class="d-flex flex-column">
                        <div>
                            <strong>${group || 'Unassigned'}</strong> (${rows.count()})
                        </div>
                        <div class="text-muted small">
                            ${address}
                        </div>
                    </div>
                </td>
            `
                );
        }
      }
    

    });

    let openedActionRow = null;

    $('#vehicleTable tbody').on('click', 'tr', function(){
        if ($(this).hasClass('group-row')) return;

        const vehicleId = $(this).data('id');
        const vin = $(this).data('vin');
        const plate = $(this).data('plate');

        if (!vehicleId) return;
        
        const row = table.row(this);

        //toggle
        if (openedActionRow && openedActionRow.index() === row.index()){
            row.child.hide();
            openedActionRow = null;
            return;
        }

        if(openedActionRow){
            openedActionRow.child.hide();
            openedActionRow = null;
        }
        
        // add action row
        
        const actionHtml = `
            <div class="d-flex gap-3 py-2">
            
            <button class="btn btn-sm btn-outline-secondary actManageFleet" data-id="${vehicleId}" data-vin="${vin}" data-plate="${plate}">
                Manage Fleet
            </button>

            <button class="btn btn-sm btn-outline-info actSetLocation" data-id="${vehicleId}">
                Set Location
            </button>

            <button class="btn btn-sm btn-outline-success actManageOperationFinance"
                data-id="${vehicleId}" data-vin="${vin}" data-plate="${plate}">
                Operation Finance
            </button>

        </div>
        `;
        
        row.child(actionHtml).show();

        openedActionRow = row;

    });

    // manage Fleet modal open
    $(document).on('click', '.actManageFleet', function () {
        const vehicleId = $(this).data('id');
        const vin = $(this).data('vin');
        const plate = $(this).data('plate');

        if (!vehicleId) return;

        const modalEl = document.getElementById('manageFleetModal');
        $(modalEl).data('vehicleId', vehicleId);

        $('#mfVin').text(vin || '-');
        $('#mfPlate').text(plate || '-');

        // initialize
        $('#activeFleetTable').html(`
            <tr class="text-muted">
            <td colspan="4" class="text-center">Loading...</td>
            </tr>
        `);
        $('#pastFleetTable').empty();
        $('#newFleetService').val('');
        $('#newFleetFrom').val('');

        const modal = new bootstrap.Modal(
            document.getElementById('manageFleetModal')
        );
        modal.show();
    });

    // set Location modal open
    $(document).on('click', '.actSetLocation', function(){
        const id = $(this).data('id');
        if (!id) return;

        const modalEl = document.getElementById('setLocationModal');
        modalEl.dataset.vehicleId = id;

        renderSetLocationForm(id);

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    });
    //
    // Operation Finance Manage modal
    $(document).on('click', '.actManageOperationFinance', function () {
        const vehicleId = $(this).data('id');
        const vin = $(this).data('vin');
        const plate = $(this).data('plate');

        if (!vehicleId) return;

        const modalEl = document.getElementById('manageOperationFinanceModal');
        $(modalEl).data('vehicleId', vehicleId);

        $('#opVin').text(vin || '-');
        $('#opPlate').text(plate || '-');

        // reset COST inputs
        $('#opCostCategory').val('');
        $('#opCostDate').val('');
        $('#opCostAmount').val('');
        $('#opCostNote').val('');

        // reset REVENUE inputs
        $('#opRevenueCategory').val('');
        $('#opRevenueDate').val('');
        $('#opRevenueAmount').val('');
        $('#opRevenueNote').val('');

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    });


    //
    $(window).on('resize', function () {
        table.columns.adjust();
    });

});

function onFleetChanged(vehicleId) {
    const table = $('#vehicleTable').DataTable();
    refreshVehicleRow(vehicleId, table);
}

// refresh vehicle row
async function refreshVehicleRow(vehicleId, table) {
    const res = await fetch(`/api/vehicles/${vehicleId}`);
    const data = await res.json();
    if (!data.success) return;

    const tr = $(`#vehicleTable tr[data-id="${vehicleId}"]`);
    if (!tr.length) return;

    // location
    const op = data.vehicle.operation_location;
    const locationName = op?.name ?? 'Unassigned';

    updateVehicleRow(tr, {
        parking_lot_id: op?.parking_lot_id ?? null,
        parking_lot_name: locationName
    });

    const row = table.row(tr);
    const rowData = row.data();

    rowData[0] = locationName; // location
    rowData[6] = data.vehicle.operation_status; // status

    row.data(rowData);

    //redraw
    table.draw(false);
}

function updateVehicleRow(tr, payload) {
    const locationId = payload.parking_lot_id ?? '';
    const locationName = payload.parking_lot_name ?? 'Unassigned';

    // source of truth
    tr.data('location-id', locationId);
    tr.data('location-name', locationName);

    // view update only
    tr.find('td.col-location').text(locationName);
}