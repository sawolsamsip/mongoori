
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

    $('btnEditVehicle').on('click', function(){
        const id = $('#modalVehicleId').val();
        if (!id) return;
        window.location.href = `/admin/edit_vehicle/${id}`;
    });

    $('btnDeleteVehicle').on('click', function(){
        const id = $('#modalVehicleId').val();
        if (!id) return;

        if (!confirm("Are you sure you want to delete this vehicle?")) return;


    });
});