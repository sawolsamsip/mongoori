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