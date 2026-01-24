$('#manageFinanceModal').on('shown.bs.modal', function () {
    const vehicleId = $(this).data('vehicleId');
    if (!vehicleId) return;

    loadFinanceCategories();
    // loadVehicleFinance(vehicleId);
    // loadFinanceSummary(vehicleId);
});

// Save Cost
$(document).on('click', '#saveCostBtn', async function () {
    const modal = $('#manageFinanceModal');
    const vehicleId = modal.data('vehicleId');

    if (!vehicleId) {
        alert('Vehicle context missing.');
        return;
    }

    const payload = {
        date: $('#costDate').val(),
        category_id: $('#costCategory').val(),
        amount: $('#costAmount').val(),
        note: $('#costNote').val()
    };

    if (!payload.date || !payload.category_id || !payload.amount) {
        alert('Date, category, and amount are required.');
        return;
    }

    const btn = $(this);
    btn.prop('disabled', true);

    try {
        const res = await fetch(`/api/finance/vehicles/${vehicleId}/cost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || 'Failed to save cost.');
            return;
        }

        // reset inputs
        $('#costDate').val('');
        $('#costCategory').val('');
        $('#costAmount').val('');
        $('#costNote').val('');

        if (typeof showToast === 'function') {
            showToast('Cost saved');
        }

        // summary refresh
        // loadVehicleFinance(vehicleId);

    } catch (err) {
        console.error(err);
        alert('Network error while saving cost.');
    } finally {
        btn.prop('disabled', false);
    }
});

// save Revenue
$(document).on('click', '#saveRevenueBtn', async function () {
    const modal = $('#manageFinanceModal');
    const vehicleId = modal.data('vehicleId');

    if (!vehicleId) {
        alert('Vehicle context missing.');
        return;
    }

    const payload = {
        date: $('#revenueDate').val(),
        category_id: $('#revenueCategory').val(),
        amount: $('#revenueAmount').val(),
        note: $('#revenueNote').val()
    };

    if (!payload.date || !payload.category_id || !payload.amount) {
        alert('Date, category, and amount are required.');
        return;
    }

    const btn = $(this);
    btn.prop('disabled', true);

    try {
        const res = await fetch(`/api/finance/vehicles/${vehicleId}/revenue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || 'Failed to save revenue.');
            return;
        }

        // reset inputs
        $('#revenueDate').val('');
        $('#revenueCategory').val('');
        $('#revenueAmount').val('');
        $('#revenueNote').val('');

        if (typeof showToast === 'function') {
            showToast('Revenue saved');
        }

        // summary refresh
        // loadVehicleFinance(vehicleId);

    } catch (err) {
        console.error(err);
        alert('Network error while saving revenue.');
    } finally {
        btn.prop('disabled', false);
    }
});

async function loadFinanceCategories() {
    const costSelect = $('#costCategory');
    const revenueSelect = $('#revenueCategory');

    costSelect.empty().append('<option value="" disabled selected>Choose...</option>');
    revenueSelect.empty().append('<option value="" disabled selected>Choose...</option>');

    const costRes = await fetch('/api/finance/categories?scope=vehicle&type=cost');
    const revenueRes = await fetch('/api/finance/categories?scope=vehicle&type=revenue');

    const costData = await costRes.json();
    const revenueData = await revenueRes.json();

    costData.categories.forEach(c => {
        costSelect.append(`<option value="${c.category_id}">${c.name}</option>`);
    });

    revenueData.categories.forEach(c => {
        revenueSelect.append(`<option value="${c.category_id}">${c.name}</option>`);
    });
}