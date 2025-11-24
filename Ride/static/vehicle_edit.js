function showToast(msg){
    const toastEl = document.getElementById("successToast");
    const msgBox = document.getElementById("toastMsg");
    
    msgBox.textContent = msg;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

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
            const res = await fetch('/admin/delete_vehicle', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ vehicle_id: id })
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

        currentVehicleId = id;

        renderPurchaseForm();

        const modalEl = document.getElementById('purchaseWarrantyModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    });

    // subscription warranty modal open
    $(document).on('click', '.actAddSubscription', function(){
        const id = $(this).data('id');
        currentVehicleId = id;

        renderSubscriptionForm();
        
        const modalEl = document.getElementById('subscriptionWarrantyModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    });
    


    // purchase subscription Save with modal
    $('#purchaseWarrantyModal').on('click', '#btnSavePurchase', async function () {    
        const type = $('#purchaseType').val();
        const expireDate = $('#purchaseExpireDate').val();
        const expireMiles = $('#purchaseExpireMiles').val();

        if (!currentVehicleId) {
            alert("Vehicle ID missing.");
            return;
        }
    
        if (!type) {
            alert("Please select warranty type.");
            return;
        }
    
        try {
            const res = await fetch('/admin/add_warranty_purchase', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    vehicle_id: currentVehicleId,
                    warranty_type: type,
                    expire_date: expireDate || null,
                    expire_miles: expireMiles || null,
                    category: "purchase"
                })
            });
    
            const data = await res.json();
    
            if (data.success) {
                const modalEl = document.getElementById('purchaseWarrantyModal');
                bootstrap.Modal.getInstance(modalEl).hide();
                showToast("Purchase warranty added");
                location.reload();
            } else {
                alert(data.message || "Add warranty failed");
            }
    
        } catch (err) {
            console.error(err);
            alert("Network error while adding warranty");
        }
    });

    // subscription Warranty Save with modal
    $('#subscriptionWarrantyModal').on('click', '#btnSaveSubscription', async function () {    
        const type = $('#subscriptionType').val();
        const startDate = $('#subStart').val();
        const cost = $('#subCost').val();

        if (!currentVehicleId) {
            alert("Vehicle ID missing.");
            return;
        }
    
        if (!type) {
            alert("Please select warranty type.");
            return;
        }
    
        try {
            const res = await fetch('/admin/add_warranty_subscription', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    vehicle_id: currentVehicleId,
                    warranty_type: type,
                    start_date: startDate,
                    monthly_cost: cost || null,
                    category: "subscription"
                })
            });
    
            const data = await res.json();
    
            if (data.success) {
                const modalEl = document.getElementById('subscriptionWarrantyModal');
                bootstrap.Modal.getInstance(modalEl).hide();
                showToast("Subscription warranty added");
                location.reload();
            } else {
                alert(data.message || "Add warranty failed");
            }
    
        } catch (err) {
            console.error(err);
            alert("Network error while adding warranty");
        }
    });


});

