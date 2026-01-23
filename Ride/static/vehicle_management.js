$(document).ready(function () {
    const table = $('#vehicleTable').DataTable({
    responsive: false,
    autoWidth: false,
    scrollX: true,
    
    columnDefs: [
        // Plate column: show plate + small vin
        {
            targets: 0,
            render: function (data, type, row) {
                const vin = row[1]; // VIN column

                if (type === 'display') {
                    return `
                        <div>
                            <div class="fw-semibold">${data}</div>
                            <div class="text-muted small">${vin}</div>
                        </div>
                    `;
                }
                // for search / sort → include both
                return `${data} ${vin}`;
            }
        },
        // Hide VIN column itself
        {
            targets: 1,
            visible: false
        }
    ],
    
    // order by plate
    order: [[0, 'asc']]
    });

    let openedActionRow = null;

    $('#vehicleTable tbody').on('click', 'tr', function(){
        if ($(this).hasClass('group-row')) return;

        const vehicleId = $(this).data('id');
        if (!vehicleId) return;
        
        const row = table.row(this);

        //toggle same row
        if (openedActionRow && openedActionRow.index() === row.index()){
            row.child.hide();
            openedActionRow = null;
            return;
        }

        // close
        if(openedActionRow){
            openedActionRow.child.hide();
            openedActionRow = null;
        }
        
        // add action row
        
        const actionHtml = `
            <div class="d-flex gap-3 py-2">
            <button class="btn btn-sm btn-outline-secondary actManageExpense" data-id="${vehicleId}">
                Manage Expense
            </button>

            <button class="btn btn-sm btn-outline-info actManageWarranty" data-id="${vehicleId}">
                Manage Warranty
            </button>

            <button class="btn btn-sm btn-outline-secondary actEditVehicle" data-id="${vehicleId}">
                Detail
            </button>

            <button class="btn btn-sm btn-outline-danger actDeleteVehicle" data-id="${vehicleId}">
                Delete
            </button>

        </div>
        `;
        
        row.child(actionHtml).show();

        openedActionRow = row;

    });

    $(document).on('click', '.actEditVehicle', function(){
        const id = $(this).data('id');
        if (!id) return;
        window.location.href = `/admin/vehicles/${id}`;
    });

    // Delete
    $(document).on('click', '.actDeleteVehicle', async function(){
        const id = $(this).data('id');
        if (!id) return;

        if (!confirm("Are you sure you want to delete this vehicle?")) return;

        try {
            const res = await fetch(`/api/vehicles/${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                if (openedActionRow){
                    openedActionRow.child.hide();
                    openedActionRow = null;
                }
                const row = $(`#vehicleTable tr[data-id="${id}"]`);
                row.fadeOut(300, function(){ $(this).remove(); });
                showToast(data.message);
            } else {
                alert(data.message || "Delete failed");
            }
        } catch (err) {
            console.error(err);
            alert("Network error while deleting vehicle");
        }
    });


    //manage warranty
    $(document).on('click', '.actManageWarranty', function(){
        const vehicleId = $(this).data('id');

        // redirection to warranty purchase
        window.location.href = `/admin/warranties/purchase?vehicle_id=${vehicleId}`;
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

