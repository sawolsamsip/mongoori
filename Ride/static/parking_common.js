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

    // Default dates
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Rendering
    body.innerHTML = `
    <div class="mb-3">
        <label class="form-label fw-bold">Current Parking</label>
        <div class="text-muted">${currentParkingName}</div>
    </div>

    <div class="mb-3">
        <label class="form-label fw-bold">New Parking</label>
        <select class="form-select" id="selectParkingLot">
            ${optionsHtml}
        </select>
    </div>

    <hr/>

    <div class="mb-3">
        <label class="form-label fw-bold">Start Date</label>
        <input type="date" class="form-control" id="parkingStartDate" value="${todayStr}">
    </div>

    <div class="mb-3">
        <label class="form-label fw-bold">Monthly Fee</label>
        <input type="number" class="form-control" id="parkingMonthlyFee" min="0" step="0.01">
    </div>

    <div class="form-check mb-2">
        <input class="form-check-input" type="checkbox" id="toggleEndDate">
        <label class="form-check-label fw-bold" for="toggleEndDate">
            Set end date (optional)
        </label>
    </div>

    <div class="mb-3">
        <label class="form-label fw-bold">End Date</label>
        <input type="date" class="form-control" id="parkingEndDate" disabled>
    </div>
    `;

    // Toggle end date enable/disable
    const toggle = document.getElementById('toggleEndDate');
    const endDate = document.getElementById('parkingEndDate');
    toggle.addEventListener('change', () => {
        endDate.disabled = !toggle.checked;
        if (!toggle.checked) endDate.value = '';
    });

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
    const startDateEl = document.getElementById('parkingStartDate');
    const feeEl = document.getElementById('parkingMonthlyFee');
    const toggleEndEl = document.getElementById('toggleEndDate');
    const endDateEl = document.getElementById('parkingEndDate');

    const parkingFrom = startDateEl?.value || '';
    const parkingTo = (toggleEndEl?.checked && endDateEl?.value) ? endDateEl.value : null;


    // validation
    if (parkingLotId && parkingTo && parkingFrom && parkingTo < parkingFrom) {
        alert('End Date must be on or after Start Date.');
        return;
    }

    let feeAmountCents = null;
    const feeStr = (feeEl?.value || '').trim();
    if (feeStr !== '') {
        const feeNum = Number(feeStr);
        if (Number.isNaN(feeNum) || feeNum < 0) {
            alert('Monthly Fee must be a valid non-negative number.');
        return;
        }
        feeAmountCents = Math.round(feeNum * 100);
    }

    try {
        const res = await fetch(`/api/vehicles/${vehicleId}/parking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parking_lot_id: parkingLotId,     
                parking_from: parkingFrom || null,
                parking_to: parkingTo,            
                fee_unit: 'monthly',              
                fee_amount_cents: feeAmountCents,
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