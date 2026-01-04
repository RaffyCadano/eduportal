(function () {
  const state = {
    teachers: [],
    loading: false,
    filter: '',
    departmentFilter: 'all',
  };

  window.openTeacherWithSubjectsPage = function () {
    activateSidebar();
    const container = document.querySelector('.main-content .container-fluid');
    if (!container) {
      showNotification('Main content not found', 'error', 2500);
      return;
    }
    container.innerHTML = buildLayout();
    wireEvents();
    loadData();
  };

  function activateSidebar() {
    try {
      document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
      document.getElementById('teacherWithSubjectsLink')?.classList.add('active');
      document.getElementById('subjectsDropdownBtn')?.classList.add('active');
    } catch (e) { }
  }

  function buildLayout() {
    return (
      '<div class="row">' +
      '<div class="col-12">' +
      '<nav aria-label="breadcrumb" class="mb-3">' +
      '<ol class="breadcrumb app-breadcrumb">' +
      '<li class="breadcrumb-item"><a href="#" id="dashboardBreadcrumb"><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>' +
      '<li class="breadcrumb-item active" aria-current="page"><i class="bi bi-person-badge"></i><span> Teachers & Subjects</span></li>' +
      '</ol>' +
      '</nav>' +
      '<div class="card border-0" style="border-radius:1.25rem;">' +
      '<div class="card-header surface-alt border-0 pt-3 pb-2 d-flex flex-wrap justify-content-between align-items-end gap-2">' +
      '<div>' +
      '<h4 class="fw-bold mb-0">Teachers & Subjects</h4>' +
      '<small class="text-muted">Overview of all teachers with assigned subjects.</small>' +
      '</div>' +
      '<div class="d-flex gap-2">' +
      '<button class="btn btn-outline-primary btn-sm" id="goAssignTeacherBtn" title="Assign subjects"><i class="bi bi-pencil-square me-1"></i>Assign Subjects</button>' +
      '<button class="btn btn-outline-secondary btn-sm" id="refreshTeachersSubjectsBtn"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>' +
      '</div>' +
      '</div>' +
      '<div class="card-body pt-0">' +
      '<div class="row g-3 mb-2">' +
      '<div class="col-md-4">' +
      '<input type="text" id="teacherSearchInput" class="form-control form-control-sm" placeholder="Search teacher or subject...">' +
      '</div>' +
      '<div class="col-md-3">' +
      '<select id="departmentFilterSelect" class="form-select form-select-sm">' +
      '<option value="all">All Departments</option>' +
      '</select>' +
      '</div>' +
      '<div class="col-md-5 text-end small text-muted align-self-center">' +
      '<span id="teacherOverviewSummary"></span>' +
      '</div>' +
      '</div>' +
      '<div id="teachersSubjectsContent" class="position-relative">' +
      '<div id="loadingOverlay" class="text-center py-5 d-none">' +
      '<div class="spinner-border text-primary"></div>' +
      '<div class="mt-2 small text-muted">Loading...</div>' +
      '</div>' +
      '<div id="teachersGroupedContainer"></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function wireEvents() {
    document.getElementById('refreshTeachersSubjectsBtn')?.addEventListener('click', () => { loadData(true); });
    document.getElementById('goAssignTeacherBtn')?.addEventListener('click', () => { window.openAssignSubjectsToTeacherPage?.(); });
    document.getElementById('teacherSearchInput')?.addEventListener('input', () => { state.filter = document.getElementById('teacherSearchInput').value.trim(); renderGroups(); });
    document.getElementById('departmentFilterSelect')?.addEventListener('change', () => { state.departmentFilter = document.getElementById('departmentFilterSelect').value; renderGroups(); });
  }

  function loadData(force = false) {
    if (state.loading && !force) return;
    state.loading = true;
    document.getElementById('loadingOverlay')?.classList.remove('d-none');
    const teachersPromise = window.api?.getTeachers ? window.api.getTeachers() : Promise.resolve({ success: false, teachers: [] });
    Promise.resolve(teachersPromise)
      .then(teachRes => {
        const teachers = (teachRes.success && Array.isArray(teachRes.teachers)) ? teachRes.teachers : [];
        teachers.forEach(t => { if (!Array.isArray(t.subjects)) t.subjects = []; });
        state.teachers = teachers;
        populateDepartments(teachers);
        renderGroups();
      })
      .catch(err => { showNotification('Failed to load teachers', 'error', 3000); })
      .finally(() => {
        state.loading = false;
        document.getElementById('loadingOverlay')?.classList.add('d-none');
      });
  }

  function populateDepartments(teachers) {
    const select = document.getElementById('departmentFilterSelect');
    if (!select) return;
    const existing = new Set(['all']);
    Array.from(select.options).forEach(o => existing.add(o.value));
    const departments = Array.from(new Set(teachers.map(t => t.department).filter(Boolean))).sort();
    departments.forEach(d => {
      if (!existing.has(d)) {
        const opt = document.createElement('option'); opt.value = d; opt.textContent = d; select.appendChild(opt);
      }
    });
  }

  function renderGroups() {
    const container = document.getElementById('teachersGroupedContainer');
    if (!container) return;
    const filter = state.filter.toLowerCase();
    const departmentFilter = state.departmentFilter;
    let filtered = state.teachers.slice();
    if (departmentFilter && departmentFilter !== 'all') filtered = filtered.filter(t => (t.department || '') === departmentFilter);
    if (filter) {
      filtered = filtered.filter(t => {
        const blob = (t.name || '') + ' ' + (Array.isArray(t.subjects) ? t.subjects.join(' ') : '') + ' ' + (t.department || '');
        return blob.toLowerCase().includes(filter);
      });
    }
    const byDept = groupBy(filtered, t => t.department || 'No Department');
    const deptKeys = Object.keys(byDept).sort();
    let html = '';
    if (deptKeys.length) {
      deptKeys.forEach(d => { html += buildDeptBlock(d, byDept[d]); });
    } else {
      html = '<div class="text-center text-muted py-5">No teachers match your filters.</div>';
    }
    container.innerHTML = html;
    updateSummary();
    attachExpandableHandlers();
  }

  function buildDeptBlock(dept, teachers) {
    let teacherCards = '';
    teachers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    teachers.forEach(t => { teacherCards += buildTeacherCard(t); });
    return (
      '<div class="mb-4 dept-block" data-dept="' + dept + '">' +
      '<div class="d-flex justify-content-between align-items-center mb-2">' +
      '<h6 class="mb-0 fw-bold">' + (dept === 'No Department' ? 'No Department' : dept) + '</h6>' +
      '<button class="btn btn-sm btn-outline-secondary toggle-dept" data-dept="' + dept + '"><i class="bi bi-arrows-collapse"></i></button>' +
      '</div>' +
      '<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 dept-teachers" data-dept-container="' + dept + '">' +
      (teacherCards || "<div class='col'><div class='text-muted small'>No teachers</div></div>") +
      '</div>' +
      '</div>'
    );
  }

  function buildTeacherCard(teacher) {
    const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.slice().sort((a, b) => a.localeCompare(b)) : [];
    let subjectBadges = '';
    if (subjects.length) {
      subjects.forEach(s => {
        subjectBadges += '<span class="badge rounded-pill bg-info text-dark border border-light-subtle subject-badge me-1 mb-1">' + s + '</span>';
      });
    } else {
      subjectBadges = '<span class="text-muted small fst-italic">No subjects</span>';
    }
    return (
      '<div class="col">' +
      '<div class="card h-100 shadow-sm teacher-card border" style="border-radius:.75rem;">' +
      '<div class="card-body p-3 d-flex flex-column">' +
      '<div class="d-flex justify-content-between align-items-start mb-1">' +
      '<div class="fw-semibold text-truncate" title="' + (teacher.name || '') + '">' + (teacher.name || '(Unnamed)') + '</div>' +
      '<button class="btn btn-sm btn-outline-primary assign-jump" data-teacher="' + teacher.name + '" title="Assign subjects to this teacher"><i class="bi bi-plus-lg"></i></button>' +
      '</div>' +
      '<div class="small text-muted mb-2 d-flex flex-wrap gap-2">' +
      (teacher.department ? '<span><i class="bi bi-building me-1"></i>' + teacher.department + '</span>' : '') +
      '</div>' +
      '<div class="mt-auto">' + subjectBadges + '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function attachExpandableHandlers() {
    document.querySelectorAll('.toggle-dept').forEach(btn => {
      btn.addEventListener('click', () => {
        const dept = btn.getAttribute('data-dept');
        const container = document.querySelector('[data-dept-container="' + dept + '"]');
        if (!container) return;
        const hidden = container.classList.toggle('d-none');
        btn.innerHTML = hidden ? '<i class="bi bi-arrows-expand"></i>' : '<i class="bi bi-arrows-collapse"></i>';
      });
    });
    document.querySelectorAll('.assign-jump').forEach(btn => {
      btn.addEventListener('click', () => {
        window.openAssignSubjectsToTeacherPage?.();
        showNotification('Opening assignment view...', 'info', 1400);
      });
    });
  }

  function groupBy(arr, fn) {
    return arr.reduce((acc, item) => { const key = fn(item); (acc[key] ||= []).push(item); return acc; }, {});
  }

  function updateSummary() {
    const el = document.getElementById('teacherOverviewSummary'); if (!el) return;
    const totalTeachers = state.teachers.length;
    const totalAssignments = state.teachers.reduce((acc, t) => acc + (Array.isArray(t.subjects) ? t.subjects.length : 0), 0);
    el.textContent = totalTeachers + ' teacher' + (totalTeachers !== 1 ? 's' : '') + ', ' + totalAssignments + ' subject assignment' + (totalAssignments !== 1 ? 's' : '');
  }

})();