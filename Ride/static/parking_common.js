// modal rendering
async function renderSetParkingForm(vehicleId) {
    const body = document.getElementById('setParkingFormBody');
    body.innerHTML = `<div class="text-muted">Loading...</div>`;

    const tr = $(`#vehicleTable tr[data-id="${vehicleId}"]`);
    if (!tr.length) {
        body.innerHTML = `<div class="text-danger">Vehicle row not found.</div>`;
        return;
    }

    const table = $('#vehicleTable').DataTable();
    const row = table.row(tr);
    const rowData = row.data();

    // Current Parking lot
    let currentParkingName = rowData[0];
    if (!currentParkingName || currentParkingName === 'Unassigned') {
        currentParkingName = 'Unassigned';
    }

    // Load Parking lot list
    let parkingLots = [];
    try {
        const res = await fetch('/api/parking-lots');
        const json = await res.json();
        if (json.success) {
            parkingLots = json.data;
        }
    } catch (err) {
        console.error(err);
        body.innerHTML = `<div class="text-danger">Failed to load parking lots.</div>`;
        return;
    }

    // Build Dropdown List
    let optionsHtml = `<option value="">— Unassigned —</option>`;
    parkingLots.forEach(p => {
        const selected = (p.name === currentParkingName) ? 'selected' : '';
        optionsHtml += `<option value="${p.id}" ${selected}>${p.name}</option>`;
    });

    // Rendering
    body.innerHTML = `
        <div class="mb-3">
            <label class="form-label fw-bold">Current Parking</label>
            <div class="text-muted">
                ${currentParkingName}
            </div>
        </div>

        <div class="mb-3">
            <label class="form-label fw-bold">New Parking</label>
            <select class="form-select" id="selectParkingLot">
                ${optionsHtml}
            </select>
        </div>
    `;
}

// Save - for modal to change parking lot

async function saveVehicleParking() {
    const modalEl = document.getElementById('setParkingModal');
    const vehicleId = modalEl.dataset.vehicleId;

    if (!vehicleId) {
        alert('Vehicle ID missing.');
        return;
    }

    const selectEl = document.getElementById('selectParkingLot');
    if (!selectEl) {
        alert('Parking selector not found.');
        return;
    }
    const parkingLotId = selectEl.value || null;

    try {
        const res = await fetch(`/api/vehicles/${vehicleId}/parking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parking_lot_id: parkingLotId
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || 'Failed to update parking.');
            return;
        }

        bootstrap.Modal.getInstance(modalEl).hide();
        showToast(data.message || 'Parking updated successfully.');

        location.reload();

    } catch (err) {
        console.error(err);
        alert('Network error while updating parking.');
    }

}



$(document).on('click', '#btnSaveParking', saveVehicleParking);