$('#manageFleetModal').on('shown.bs.modal', function () {
    const vehicleId = $(this).data('vehicleId');
    if (!vehicleId) return;

    loadFleetServiceOptions();
    loadVehicleFleets(vehicleId);
});

async function loadFleetServiceOptions(selectSelector = '#newFleetService') {
  const select = $(selectSelector);
  select.empty();
  select.append('<option value="">Select...</option>');

  try {
    const res = await fetch('/api/fleet-services');
    const data = await res.json();

    data.fleet_services.forEach(fs => {
      select.append(
        `<option value="${fs.fleet_service_id}">
          ${fs.name}
        </option>`
      );
    });
  } catch (err) {
    console.error('Failed to load fleet services', err);
  }
}

async function loadVehicleFleets(vehicleId) {
    const activeBody = $('#activeFleetTable');
    const pastBody = $('#pastFleetTable');

    activeBody.empty();
    pastBody.empty();

    try {
    const res = await fetch(`/api/vehicles/${vehicleId}/fleets`);
    const data = await res.json();

    if (!data.success) {
      alert(data.message || 'Failed to load fleet data.');
      return;
    }

    const fleets = data.fleets || [];

    let hasActive = false;
    let hasPast = false;

    fleets.forEach(f => {
        if (f.registered_to === null) {
            hasActive = true;
            activeBody.append(`
            <tr>
                <td>${f.fleet_name}</td>
                <td>${f.registered_from}</td>
                <td class="text-center">
                <button
                    class="btn btn-sm btn-outline-danger actUnregisterFleet"
                    data-id="${f.vehicle_fleet_id}">
                    Unregister
                </button>
                </td>
            </tr>
            `);
        } else {
            hasPast = true;
            pastBody.append(`
            <tr>
                <td>${f.fleet_name}</td>
                <td>${f.registered_from}</td>
                <td>${f.registered_to || '-'}</td>
            </tr>
            `);
        }
    });

    // empty states
    if (!hasActive) {
      activeBody.append(`
        <tr class="text-muted">
          <td colspan="4" class="text-center">No active fleet</td>
        </tr>
      `);
    }

    if (!hasPast) {
      pastBody.append(`
        <tr class="text-muted">
          <td colspan="3" class="text-center">No fleet history</td>
        </tr>
      `);
    }

  } catch (err) {
    console.error(err);
    alert('Network error while loading fleet data.');
  }

}

// register new fleet button
$(document).on('click', '#registerFleetBtn', async function () {
    const modal = $('#manageFleetModal');
    const vehicleId = modal.data('vehicleId');

    const fleetServiceId = $('#newFleetService').val();
    const registeredFrom = $('#newFleetFrom').val();

    if (!vehicleId) {
        alert('Vehicle context missing.');
        return;
    }
    if (!fleetServiceId) {
        alert('Please select a fleet service.');
        return;
    }
    if (!registeredFrom) {
        alert('Please select a start date.');
        return;
    }

    const btn = $(this);
    btn.prop('disabled', true);

    const payload = {
        fleet_service_id: fleetServiceId,
        registered_from: registeredFrom
    }

    try {
        const res = await fetch(`/api/vehicles/${vehicleId}/fleets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
        alert(data.message || 'Failed to register fleet.');
        return;
        }

        
        $('#newFleetService').val('');
        $('#newFleetFrom').val('');

        await loadVehicleFleets(vehicleId);
        if (typeof onFleetChanged === 'function') {
            onFleetChanged(vehicleId);
        }

    } catch (err) {
        console.error(err);
        alert('Network error while registering fleet.');
    } finally {
        btn.prop('disabled', false);
    }
});

// Unregister
$(document).on('click', '.actUnregisterFleet', async function () {
    const btn = $(this);
    const vehicleFleetId = btn.data('id');

    if (!vehicleFleetId) return;

    if (!confirm('Unregister this fleet?')) return;

    btn.prop('disabled', true);

    try {
        const res = await fetch(`/api/vehicle-fleets/${vehicleFleetId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        }
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || 'Failed to unregister fleet.');
        return;
        }


        const vehicleId = $('#manageFleetModal').data('vehicleId');
        if (vehicleId) {
            await loadVehicleFleets(vehicleId);
            if (typeof onFleetChanged === 'function') {
                onFleetChanged(vehicleId);
            }
        }

    } catch (err) {
        console.error(err);
        alert('Network error while unregistering fleet.');
    } finally {
        btn.prop('disabled', false);
    }
});
