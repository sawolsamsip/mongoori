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
                return `${data} ${vin}`;
            }
        },

        {
            targets: 2,
            visible: false
        },

        { targets: 0, visible: false }
    ],
    
    orderFixed: {
        pre: [[0, 'asc']]
      },

    order: [[1, 'asc']],

    rowGroup: {
        dataSrc: 0,
        startRender: function (rows, group) {
          const name = group;
          return $('<tr class="group-row"/>')
            .append(
              `<td colspan="6" class="bg-light fw-bold">
                <strong>${name}</strong> (${rows.count()})
              </td>`
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

            <button class="btn btn-sm btn-outline-info actSetParking" data-id="${vehicleId}">
                Set Location
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

        //debug
        console.log(this);

        if (!vehicleId) return;

        $('#manageFleetModal').data('vehicleId', vehicleId);
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

    // set parking modal open
    $(document).on('click', '.actSetParking', function(){
        const id = $(this).data('id');
        if (!id) return;

        const modalEl = document.getElementById('setParkingModal');
        modalEl.dataset.vehicleId = id;

        renderSetParkingForm(id);

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    });


    $(window).on('resize', function () {
        table.columns.adjust();
    });

});

