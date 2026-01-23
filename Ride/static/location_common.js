// modal rendering
async function renderSetLocationForm(vehicleId) {
    const body = document.getElementById('setLocationFormBody');
    body.innerHTML = `<div class="text-muted">Loading...</div>`;

    const tr = $(`#vehicleTable tr[data-id="${vehicleId}"]`);
    if (!tr.length) {
        body.innerHTML = `<div class="text-danger">Vehicle row not found.</div>`;
        return;
    }

    const vin = tr.data('vin') || '';
    const plate = tr.data('plate') || '';

    document.getElementById('slVin').textContent = vin;
    document.getElementById('slPlate').textContent = plate;

    // Current location
    const rawLocationId = tr.data('location-id');
    const currentLocationId =
        rawLocationId === '' || rawLocationId === undefined
            ? null
            : Number(rawLocationId);
        // for display            
    const currentLocationName =
        tr.data('location-name');

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
    let optionsHtml = `<option value="">-- Unassigned </option>`;

    locations
        .filter(p => p.status === 'active')
        .forEach(p => {
            const label = `${p.name} — ${p.address_line1}, ${p.city}`;
            const selected = (p.id === currentLocationId) ? 'selected' : '';
            optionsHtml += `
                <option value="${p.id}" ${selected}>
                    ${label}
                </option>
            `;
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
            <input type="date"
                   class="form-control"
                   id="locationStartDate"
                   value="${todayStr}">
        </div>
    `;

    const modalEl = document.getElementById('setLocationModal');
    modalEl.dataset.vehicleId = vehicleId;
    modalEl.dataset.currentLocationId =
        currentLocationId === null ? '' : String(currentLocationId);
}

// Save - for modal to change vehicle location

async function saveVehicleLocation() {
    const modalEl = document.getElementById('setLocationModal');
    const vehicleId = modalEl.dataset.vehicleId;

    if (!vehicleId) {
        alert('Vehicle ID missing.');
        return;
    }
    
    // new location
    const selectEl = document.getElementById('selectLocation');
    const rawValue = selectEl.value;
    const newLocationId = rawValue === '' ? null : Number(rawValue);


    const startDate =
        document.getElementById('locationStartDate').value || null;

    // validation
    if (newLocationId !== null && isNaN(newLocationId)) {
        alert('Invalid location.');
        return;
    }

    if (startDate && isNaN(Date.parse(startDate))) {
        alert('Invalid start date.');
        return;
    }

    // isNewlocation?
    const currentLocationId =
        modalEl.dataset.currentLocationId === ''
            ? null
            : Number(modalEl.dataset.currentLocationId);

    if (newLocationId === currentLocationId) {
        bootstrap.Modal.getInstance(modalEl).hide();
        return;
    }

    //API call
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