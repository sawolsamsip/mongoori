
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

    const modal = new bootstrap.Modal(document.getElementById("vehicleActionModal"));

    $('#vehicleTable tbody').on('click', 'tr', function(){
        const id = $(this).data('id');
        const vin = $(this).data('vin');

        if (!id) return;

        $('#modalVehicleId').val(id);
        $('#modalVehicleVin').text(vin || '-');

        modal.show();
    });

    $('#btnEditVehicle').on('click', async function(){
        const id = $('#modalVehicleId').val();
        if (!id) return;
        window.location.href = `/admin/edit_vehicle/${id}`;
    });

    $('#btnDeleteVehicle').on('click', async function(){
        const id = $('#modalVehicleId').val();
        if (!id) return;

        if (!confirm("Are you sure you want to delete this vehicle?")) return;
        
        try {
            const res = await fetch('/admin/delete_vehicle',{
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ vehicle_id: id })
            });
            
            const data = await res.json();

            if (data.success) {
                modal.hide();

                const row = $(`#vehicleTable tr[data-id="${id}"]`);
                row.fadeOut(300, function(){ $(this).remove(); });

                showToast(data.message);
            } else {
                alert(data.message || "Delete failed");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Network error while deleting vehicle");
        }

    })
});