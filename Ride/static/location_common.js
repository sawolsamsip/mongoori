// modal rendering
async function renderSetLocationForm(vehicleId) {
    const body = document.getElementById('setLocationFormBody');
    body.innerHTML = `<div class="text-muted">Loading...</div>`;

    const tr = $(`#vehicleTable tr[data-id="${vehicleId}"]`);
    if (!tr.length) {
        body.innerHTML = `<div class="text-danger">Vehicle row not found.</div>`;
        return;
    }

    const table = $('#vehicleTable').DataTable();
    const row = table.row(tr);
    const rowData = row.data();

    // Current location
    let currentLocationName = rowData[0];
    if (!currentLocationName || currentLocationName === 'Unassigned') {
        currentLocationName = 'Unassigned';
    }

    // Load Parking lot list
    let locations = [];
    try {
        const res = await fetch('/api/parking-lots');
        const json = await res.json();
        if (json.success) {
            locations = json.data;
        }
    } catch (err) {
        console.error(err);
        body.innerHTML = `<div class="text-danger">Failed to load locations.</div>`;
        return;
    }

    // Build Dropdown List
    let optionsHtml = `<option value="">— Unassigned —</option>`;
    locations.forEach(p => {
        const selected = (p.name === currentLocationName) ? 'selected' : '';
        optionsHtml += `<option value="${p.id}" ${selected}>${p.name}</option>`;
    });

    // Default dates
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Rendering
    body.innerHTML = `
    <div class="mb-3">
        <label class="form-label fw-bold">Current Location</label>
        <div class="text-muted">${currentLocationName}</div>
    </div>

    <div class="mb-3">
        <label class="form-label fw-bold">New Location</label>
        <select class="form-select" id="selectLocation">
            ${optionsHtml}
        </select>
    </div>

    <hr/>

    <div class="mb-3">
        <label class="form-label fw-bold">Start Date</label>
        <input type="date" class="form-control" id="locationStartDate" value="${todayStr}">
    </div>
    `;

    const modalEl = document.getElementById('setLocationModal');
    modalEl.dataset.currentLocationName = currentLocationName;
}

// Save - for modal to change vehicle location

async function saveVehicleLocation() {
    const modalEl = document.getElementById('setLocationModal');
    const vehicleId = modalEl.dataset.vehicleId;

    if (!vehicleId) {
        alert('Vehicle ID missing.');
        return;
    }

    const selectEl = document.getElementById('selectLocation');
    const newLocationId = selectEl.value || null;
    const newLocationName =
        selectEl.options[selectEl.selectedIndex]?.text || 'Unassigned';

    const startDate =
        document.getElementById('locationStartDate').value || null;

    // validation
    if (newLocationId !== null && isNaN(Number(newLocationId))) {
        alert('Invalid location.');
        return;
    }

    if (startDate && isNaN(Date.parse(startDate))) {
        alert('Invalid start date.');
        return;
    }

    const currentLocationName =
        modalEl.dataset.currentLocationName || 'Unassigned';

    if (newLocationName === currentLocationName) {
        bootstrap.Modal.getInstance(modalEl).hide();
        return;
    }

    try {
        const res = await fetch(`/api/vehicles/${vehicleId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parking_lot_id: newLocationId, // null = Unassigned
                active_from: startDate          
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || 'Failed to update vehicle location.');
            return;
        }

        bootstrap.Modal.getInstance(modalEl).hide();

        const table = $('#vehicleTable').DataTable();
        await refreshVehicleRow(vehicleId, table);

        showToast(data.message || 'Vehicle location updated successfully.');

    } catch (err) {
        console.error(err);
        alert('Network error while updating vehicle location.');
    }

}

$(document).on('click', '#btnSaveLocation', saveVehicleLocation);