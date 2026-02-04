$('#manageFinanceModal').on('shown.bs.modal', function () {
    const vehicleId = $(this).data('vehicleId');
    if (!vehicleId) return;

    loadOwnershipCategories();
    resetCostForm();
    resetRevenueForm();
});


/* category load */
async function loadOwnershipCategories() {
  const costSelect = $('#costCategory');
  const revenueSelect = $('#revenueCategory');

  costSelect.empty().append('<option value="" disabled selected>Choose...</option>');
  revenueSelect.empty().append('<option value="" disabled selected>Choose...</option>');

  try {
    const [costRes, revenueRes] = await Promise.all([
      fetch('/api/finance/management/categories?type=cost'),
      fetch('/api/finance/management/categories?type=revenue')
    ]);

    const costData = await costRes.json();
    const revenueData = await revenueRes.json();

    costData.categories.forEach(c => {
      costSelect.append(`<option value="${c.category_id}">${c.name}</option>`);
    });

    revenueData.categories.forEach(c => {
      revenueSelect.append(`<option value="${c.category_id}">${c.name}</option>`);
    });

  } catch (err) {
    console.error(err);
    alert('Failed to load finance categories.');
  }
}


/* Toggle */
$('input[name="costPaymentType"]').on('change', function () {
  const type = $(this).val();

  $('#costFieldsOneTime').toggleClass('d-none', type !== 'one_time');
  $('#costFieldsMonthly').toggleClass('d-none', type !== 'monthly');
  $('#costFieldsInstallment').toggleClass('d-none', type !== 'installment');
});


/* Installment */
$('#costInstallStartDate, #costInstallMonths').on('change', function () {
  const startDate = $('#costInstallStartDate').val();
  const months = parseInt($('#costInstallMonths').val(), 10);

  if (!startDate || !months) {
    $('#costInstallEndDate').val('');
    return;
  }

  const d = new Date(startDate);
  d.setMonth(d.getMonth() + (months - 1));

  $('#costInstallEndDate').val(d.toISOString().slice(0, 10));
});


/* save cost */
$(document).on('click', '#saveCostBtn', async function () {
  const modal = $('#manageFinanceModal');
  const vehicleId = modal.data('vehicleId');
  if (!vehicleId) return alert('Vehicle context missing.');

  const paymentType = $('input[name="costPaymentType"]:checked').val();
  const categoryText = $('#costCategory option:selected').text();

  const payload = {
    vehicle_id: vehicleId,
    category_id: $('#costCategory').val(),
    payment_type: paymentType,
    event_date: $('#costEventDate').val(),
    note: $('#costNote').val()
  };

  /* ---- basic validation ---- */
  if (!payload.category_id || !payload.event_date) {
    return alert('Category and event date are required.');
  }

  /* ---- payment type specific ---- */
  if (paymentType === 'one_time') {
    payload.total_amount = $('#costOneTimeAmount').val();
    if (!payload.total_amount) return alert('Total amount is required.');
  }

  if (paymentType === 'monthly') {
    payload.monthly_amount = $('#costMonthlyAmount').val();
    payload.start_date = $('#costMonthlyStartDate').val();
    payload.end_date = $('#costMonthlyEndDate').val() || null;

    if (!payload.monthly_amount || !payload.start_date) {
      return alert('Monthly amount and start date are required.');
    }
  }

  if (paymentType === 'installment') {
    payload.total_amount = $('#costInstallTotal').val();
    payload.months = $('#costInstallMonths').val();
    payload.start_date = $('#costInstallStartDate').val();

    if (!payload.total_amount || !payload.months || !payload.start_date) {
      return alert('Total amount, months, and start date are required.');
    }
  }

  /* ---- Other Cost requires note ---- */
  if (categoryText === 'Other Cost' && !payload.note) {
    return alert('Note is required for Other Cost.');
  }

  const btn = $(this);
  btn.prop('disabled', true);

  try {
    const res = await fetch(`/api/finance/management/vehicles/${vehicleId}/obligations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.message || 'Failed to save cost.');
      return;
    }

    showToast?.('Ownership cost saved');
    resetCostForm();

  } catch (err) {
    console.error(err);
    alert('Network error while saving cost.');
  } finally {
    btn.prop('disabled', false);
  }
});


/* save revenue */
$(document).on('click', '#saveRevenueBtn', async function () {
  const modal = $('#manageFinanceModal');
  const vehicleId = modal.data('vehicleId');
  if (!vehicleId) return alert('Vehicle context missing.');

  const categoryText = $('#revenueCategory option:selected').text();

  const payload = {
    vehicle_id: vehicleId,
    category_id: $('#revenueCategory').val(),
    payment_type: 'one_time',
    event_date: $('#revenueEventDate').val(),
    total_amount: $('#revenueAmount').val(),
    note: $('#revenueNote').val()
  };

  if (!payload.category_id || !payload.event_date || !payload.total_amount) {
    return alert('Category, date, and amount are required.');
  }

  if (categoryText === 'Other Revenue' && !payload.note) {
    return alert('Note is required for Other Revenue.');
  }

  try {
    const res = await fetch(`/api/finance/vehicles/${vehicleId}/obligations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.message || 'Failed to save revenue.');
      return;
    }

    showToast?.('Ownership revenue saved');
    resetRevenueForm();

  } catch (err) {
    console.error(err);
    alert('Network error while saving revenue.');
  }
});


/* Form Reset Helpers */

function resetCostForm() {
  $('#costCategory').val('');
  $('#costEventDate').val('');
  $('#costNote').val('');

  $('#costOneTimeAmount').val('');

  $('#costMonthlyAmount').val('');
  $('#costMonthlyStartDate').val('');
  $('#costMonthlyEndDate').val('');

  $('#costInstallTotal').val('');
  $('#costInstallMonths').val('');
  $('#costInstallStartDate').val('');
  $('#costInstallEndDate').val('');

  $('#costPtOneTime').prop('checked', true).trigger('change');
}

function resetRevenueForm() {
  $('#revenueCategory').val('');
  $('#revenueEventDate').val('');
  $('#revenueAmount').val('');
  $('#revenueNote').val('');
}