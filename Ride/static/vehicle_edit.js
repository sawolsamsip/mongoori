$(document).ready(function () {
    const table = $('#vehicleTable').DataTable({
    responsive: false,
    autoWidth: false,
    scrollX: true,
    });

    let openedActionRow = null;

    $('#vehicleTable tbody').on('click', 'tr', function(){
        const vehicleId = $(this).data('id');
        if (!vehicleId) return;

        if(openedActionRow){
            openedActionRow.child.hide();
            openedActionRow = null;
        }
        
        // add action row
        
        const actionHtml = `
            <div class="d-flex gap-3 py-2">

            <button class="btn btn-sm btn-outline-primary actAddPurchase" data-id="${vehicleId}">
                + Purchase Warranty
            </button>

            <button class="btn btn-sm btn-outline-primary actAddSubscription" data-id="${vehicleId}">
                + Subscription Warranty
            </button>

            <button class="btn btn-sm btn-outline-secondary actEditVehicle" data-id="${vehicleId}">
                Edit
            </button>

            <button class="btn btn-sm btn-outline-danger actDeleteVehicle" data-id="${vehicleId}">
                Delete
            </button>

        </div>
        `;
        
        const row = table.row(this);
        row.child(actionHtml).show();

        openedActionRow = row;

    });

    $(document).on('click', '.actEditVehicle', function(){
        const id = $(this).data('id');
        if (!id) return;
        window.location.href = `/admin/edit_vehicle/${id}`;
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


    // add warranty
    // Purchase warranty modal open
    $(document).on('click', '.actAddPurchase', function(){
        const id = $(this).data('id');
        if (!id) return;
        
        const modalEl = document.getElementById('purchaseWarrantyModal');
        modalEl.dataset.vehicleId = id;

        renderPurchaseForm();
        
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    });

    // subscription warranty modal open
    $(document).on('click', '.actAddSubscription', function(){
        const id = $(this).data('id');
        if (!id) return;

        const modalEl = document.getElementById('subscriptionWarrantyModal');
        modalEl.dataset.vehicleId = id;

        renderSubscriptionForm();
        
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    });


});

