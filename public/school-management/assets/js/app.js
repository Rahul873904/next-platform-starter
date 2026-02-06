const statsContainer = document.querySelector('[data-stats]');
const requestForm = document.getElementById('requestForm');
const alertBox = document.getElementById('formAlert');
const requestList = document.getElementById('recentRequests');
const STORAGE_KEY = 'svm_requests';

const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const renderStats = (stats) => {
  if (!statsContainer) return;
  statsContainer.querySelectorAll('[data-stat]')?.forEach((node) => {
    const key = node.dataset.stat;
    node.textContent = stats?.[key] ?? '0';
  });
};

const renderRequests = (items) => {
  if (!requestList) return;
  if (!items?.length) {
    requestList.innerHTML = '<p class="mb-0 text-muted">No recent submissions yet.</p>';
    return;
  }

  requestList.innerHTML = items
    .map(
      (item) => `
      <div class="notice-item">
        <strong>${item.name}</strong>
        <div class="text-muted small">${item.type} · ${formatDate(item.created_at)}</div>
        <div>${item.message}</div>
      </div>
    `,
    )
    .join('');
};

const safeFetchJson = async (url, options) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

const getStoredRequests = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

const storeRequest = (payload) => {
  const stored = getStoredRequests();
  stored.push(payload);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
};

const computeStats = (items) => {
  const stats = {
    total: items.length,
    admissions: 0,
    feedback: 0,
    staff: 0,
    transport: 0,
    other: 0,
  };

  items.forEach((item) => {
    const type = item.type || 'other';
    if (Object.prototype.hasOwnProperty.call(stats, type)) {
      stats[type] += 1;
    } else {
      stats.other += 1;
    }
  });

  return stats;
};

const loadSeedRequests = async () => {
  const data = await safeFetchJson('./data/requests.json');
  return Array.isArray(data) ? data : [];
};

const fetchStats = async () => {
  const data = await safeFetchJson('./api/stats.php');
  if (data?.ok) {
    renderStats(data.stats);
    return true;
  }
  return false;
};

const fetchRequests = async () => {
  const data = await safeFetchJson('./api/list.php');
  if (data?.ok) {
    renderRequests(data.items);
    return true;
  }
  return false;
};

const showAlert = (message, type = 'success') => {
  if (!alertBox) return;
  alertBox.classList.remove('alert-success', 'alert-danger', 'd-none');
  alertBox.classList.add(type === 'success' ? 'alert-success' : 'alert-danger');
  alertBox.textContent = message;
};

const resetAlert = () => {
  if (!alertBox) return;
  alertBox.classList.add('d-none');
  alertBox.textContent = '';
};

const refreshFallbackData = async () => {
  const seed = await loadSeedRequests();
  const stored = getStoredRequests();
  const merged = [...seed, ...stored].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  renderStats(computeStats(merged));
  renderRequests(merged.slice(0, 6));
};

if (requestForm) {
  requestForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    resetAlert();

    const formData = new FormData(requestForm);
    const payload = Object.fromEntries(formData.entries());
    payload.details = {
      grade: payload.grade || undefined,
      campus: payload.campus || undefined,
    };

    const apiResponse = await safeFetchJson('./api/submit.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (apiResponse?.ok) {
      showAlert(apiResponse.message, 'success');
      requestForm.reset();
      await fetchStats();
      await fetchRequests();
      return;
    }

    const fallbackPayload = {
      ...payload,
      id: `local_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    storeRequest(fallbackPayload);
    showAlert('Request saved locally. We will contact you shortly.', 'success');
    requestForm.reset();
    await refreshFallbackData();
  });
}

const init = async () => {
  const apiOk = (await fetchStats()) && (await fetchRequests());
  if (!apiOk) {
    await refreshFallbackData();
  }
};

init();
