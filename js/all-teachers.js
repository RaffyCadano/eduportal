// Render all teachers in the table (same design as students)
function renderAllTeachersList() {
  const tableBody = document.getElementById("teachersTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = `<tr><td colspan='5' class='text-center py-4'>
    <div class='spinner-border text-primary' role='status'><span class='visually-hidden'>Loading...</span></div>
    <p class='mt-2 text-muted'>Loading teachers...</p></td></tr>`;
  if (window.api && window.api.getTeachers) {
    window.api.getTeachers().then(result => {
      if (result.success && Array.isArray(result.teachers)) {
        const teachers = result.teachers.slice();
        // Initialize pagination state
        window._allTeachersData = teachers;
        if (!window._teachersPageSize) window._teachersPageSize = 25;
        window._teachersCurrentPage = 1;
        // Replace tbody parents (add controls outside body if needed)
        const table = tableBody.closest('table');
        if (table) {
          // Insert pagination controls wrapper above table if not present
          const wrapper = table.parentElement;
          if (wrapper) {
            // Add a header controls bar if absent
            if (!document.getElementById('teachersPaginationControls')) {
              const controlsBar = document.createElement('div');
              controlsBar.id = 'teachersPaginationControls';
              controlsBar.className = 'd-flex flex-wrap justify-content-between align-items-center mb-2 gap-2';
              controlsBar.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                  <label class="form-label mb-0 small text-muted">Rows per page:</label>
                  <select id="teachersPageSizeSelect" class="form-select form-select-sm" style="width:auto;">
                    <option value="10">10</option>
                    <option value="25" selected>25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div class="text-muted small" id="teachersRangeInfo"></div>
              `;
              wrapper.parentElement.insertBefore(controlsBar, wrapper);
            }
            // Add footer controls bar if absent
            if (!document.getElementById('teachersPaginationFooter')) {
              const footerBar = document.createElement('div');
              footerBar.id = 'teachersPaginationFooter';
              footerBar.className = 'd-flex justify-content-between align-items-center flex-wrap gap-2 border-top py-2 mt-2';
              footerBar.innerHTML = `
                <div class='pagination mb-0' id='teachersPagination'></div>
                <div class='text-muted small'>Total Teachers: <strong id='teachersTotalCount'>${teachers.length}</strong></div>
              `;
              wrapper.parentElement.appendChild(footerBar);
            } else {
              const totalEl = document.getElementById('teachersTotalCount');
              if (totalEl) totalEl.textContent = teachers.length;
            }
          }
        }
  renderTeachersPage();
        const pageSizeSelect = document.getElementById('teachersPageSizeSelect');
        if (pageSizeSelect) {
          pageSizeSelect.addEventListener('change', () => {
            window._teachersPageSize = parseInt(pageSizeSelect.value, 10) || 25;
            window._teachersCurrentPage = 1;
            renderTeachersPage();
          });
        }
      } else {
        tableBody.innerHTML = `<tr><td colspan='5' class='text-center py-5'><i class='bi bi-exclamation-triangle display-1 text-warning mb-3'></i><h5 class='text-warning'>Error Loading Teachers</h5><p class='text-muted mb-4'>${result.error || 'Failed to load teachers from the database.'}</p><button class='btn btn-outline-primary' onclick='renderAllTeachersList()'><i class='bi bi-arrow-clockwise me-2'></i>Try Again</button></td></tr>`;
      }
    }).catch(err => {
      console.error('Error loading teachers:', err);
      tableBody.innerHTML = `<tr><td colspan='5' class='text-center py-5'><i class='bi bi-wifi-off display-1 text-danger mb-3'></i><h5 class='text-danger'>Connection Error</h5><p class='text-muted mb-4'>Unable to connect to the database.</p><button class='btn btn-outline-primary' onclick='renderAllTeachersList()'><i class='bi bi-arrow-clockwise me-2'></i>Retry</button></td></tr>`;
    });
  } else {
    tableBody.innerHTML = `<tr><td colspan='5' class='text-center py-5'><i class='bi bi-x-circle display-1 text-danger mb-3'></i><h5 class='text-danger'>API Not Available</h5><p class='text-muted mb-4'>The teachers API is not available.</p></td></tr>`;
  }
}

// Helper: build teacher row
function buildTeacherRow(teacher, displayIndex, absoluteIndex) {
  const name = typeof teacher === 'object' ? (teacher.name || 'Unknown Teacher') : (teacher || 'Unknown Teacher');
  const id = typeof teacher === 'object' ? (teacher.id || '') : '';
  const mobile = typeof teacher === 'object' ? (teacher.mobileNo || '') : '';
  const pic = typeof teacher === 'object' ? (teacher.profilePictureUrl || teacher.profilePic || null) : null;
  const initials = (name||'?').trim().split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase();
  const safeName = name.replace(/'/g, "&#39;");
  return `
    <tr class="align-middle text-center">
      <td class="text-muted fw-bold">${displayIndex}</td>
      <td class="text-start">
        <div class="d-flex justify-content-start align-items-center">
          <div class="student-avatar-wrapper me-3" style="width:40px;height:40px;flex:0 0 auto;position:relative;">
            ${pic ? `<img src="${pic}" class="student-avatar-img" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
            <div class="d-flex align-items-center justify-content-center bg-info text-white rounded-circle" style="width:100%;height:100%;font-size:14px;font-weight:600;${pic ? 'display:none;' : 'display:flex;'}">${initials}</div>
          </div>
          <div class="d-flex flex-column align-items-start">
            <div class="fw-semibold">${name}</div>
            <small class="text-muted">${id}</small>
          </div>
        </div>
      </td>
      <td class="text-start">${mobile}</td>
      <td>
        <div class="dropdown position-static d-flex justify-content-center">
          <button class="btn btn-light btn-sm" type="button" id="teacherActionsDropdown${id}" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="teacherActionsDropdown${id}">
            <li><a class="dropdown-item" href="#" onclick="viewTeacherDetails('${id || name}')"><i class="bi bi-eye me-2"></i>View Details</a></li>
            <li><a class="dropdown-item" href="#" onclick="editTeacher('${id || name}')"><i class="bi bi-pencil me-2"></i>Edit Teacher</a></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="confirmDeleteTeacher('${safeName}','${id}',${absoluteIndex})"><i class="bi bi-trash me-2"></i>Delete</a></li>
          </ul>
        </div>
      </td>
    </tr>`;
}

function renderTeachersPage() {
  const data = window._allTeachersData || [];
  const pageSize = window._teachersPageSize || 25;
  const currentPage = window._teachersCurrentPage || 1;
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (window._teachersCurrentPage > totalPages) window._teachersCurrentPage = totalPages;
  const startIdx = (window._teachersCurrentPage - 1) * pageSize;
  const pageItems = data.slice(startIdx, startIdx + pageSize);
  const tbody = document.getElementById('teachersTableBody');
  if (!tbody) return;
  if (total === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5">
          <div class="d-flex flex-column align-items-center">
            <i class="bi bi-person-x display-5 text-muted mb-2"></i>
            <h6 class="mb-1">No Teachers Found</h6>
            <p class="text-muted small mb-3">Add your first teacher to get started.</p>
            <button class="btn btn-primary" id="tableEmptyAddTeacherBtn"><i class="bi bi-plus-lg me-2"></i>Add Teacher</button>
          </div>
        </td>
      </tr>`;
    const rangeInfo = document.getElementById('teachersRangeInfo');
    if (rangeInfo) rangeInfo.textContent = 'Showing 0-0 of 0';
    const pagEl = document.getElementById('teachersPagination');
    if (pagEl) pagEl.innerHTML = '<div class="small text-muted">Page 1 of 1</div>';
    const totalEl = document.getElementById('teachersTotalCount');
    if (totalEl) totalEl.textContent = '0';
    const cta = document.getElementById('tableEmptyAddTeacherBtn');
    cta?.addEventListener('click', () => { document.getElementById('addTeachersLink')?.click(); });
    return;
  }
  let rows = '';
  pageItems.forEach((t, i) => { rows += buildTeacherRow(t, startIdx + i + 1, startIdx + i); });
  tbody.innerHTML = rows || `<tr><td colspan='5' class='text-center text-muted py-4'>No teachers on this page.</td></tr>`;
  const rangeInfo = document.getElementById('teachersRangeInfo');
  if (rangeInfo) {
    const from = total === 0 ? 0 : startIdx + 1;
    const to = Math.min(startIdx + pageSize, total);
    rangeInfo.textContent = `Showing ${from}-${to} of ${total}`;
  }
  const pagEl = document.getElementById('teachersPagination');
  if (pagEl) {
    pagEl.innerHTML = buildTeachersPaginationControls(totalPages, window._teachersCurrentPage);
    pagEl.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = parseInt(e.currentTarget.getAttribute('data-page'), 10);
        if (!isNaN(target) && target >=1 && target <= totalPages && target !== window._teachersCurrentPage) {
          window._teachersCurrentPage = target;
          renderTeachersPage();
        }
      });
    });
  }
}

function buildTeachersPaginationControls(totalPages, currentPage) {
  if (totalPages <= 1) return '<div class="small text-muted">Page 1 of 1</div>';
  const parts = [];
  function btn(label, page, disabled = false, active = false) {
    return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'} me-1 mb-1" data-page="${page}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  }
  parts.push(btn('«', 1, currentPage === 1));
  parts.push(btn('‹', Math.max(1, currentPage - 1), currentPage === 1));
  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > totalPages) { end = totalPages; start = Math.max(1, end - windowSize + 1);} 
  if (start > 1) parts.push('<span class="mx-1">...</span>');
  for (let p = start; p <= end; p++) parts.push(btn(p, p, false, p === currentPage));
  if (end < totalPages) parts.push('<span class="mx-1">...</span>');
  parts.push(btn('›', Math.min(totalPages, currentPage + 1), currentPage === totalPages));
  parts.push(btn('»', totalPages, currentPage === totalPages));
  return parts.join('');
}

// Confirmation modal for deleting a teacher
function confirmDeleteTeacher(teacherName, teacherId, teacherIndex) {
  const modalHtml = `
    <div class="modal fade" id="deleteTeacherModal" tabindex="-1" aria-labelledby="deleteTeacherModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title" id="deleteTeacherModalLabel"><i class="bi bi-exclamation-triangle-fill me-2"></i>Delete Teacher</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning d-flex align-items-center" role="alert">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <div><strong>Warning: This action cannot be undone!</strong></div>
            </div>
            <p>Are you sure you want to delete the teacher:</p>
            <div class="card bg-light mb-3">
              <div class="card-body py-2">
                <h6 class="card-title mb-1"><i class="bi bi-person-badge-fill text-danger me-2"></i>${teacherName}</h6>
                <small class="text-muted">This will permanently remove the teacher and may affect associated sections.</small>
              </div>
            </div>
            <p class="mt-3 mb-1 text-muted">This action will:</p>
            <ul class="text-muted small mb-3">
              <li>Permanently delete the teacher from the database</li>
              <li>Remove teacher credentials and login access</li>
              <li>Remove teacher assignments from all sections</li>
              <li>Clean up related data links</li>
            </ul>
            <div class="alert alert-info" role="alert"><i class="bi bi-info-circle me-2"></i><strong>Note:</strong> Section profiles remain; only teacher assignments are removed.</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="bi bi-x-lg me-1"></i>Cancel</button>
            <button type="button" class="btn btn-danger" onclick="deleteTeacher('${teacherName}','${teacherId}',${teacherIndex})" data-bs-dismiss="modal"><i class="bi bi-trash-fill me-1"></i>Delete Teacher</button>
          </div>
        </div>
      </div>
    </div>`;

  const existing = document.getElementById('deleteTeacherModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  setTimeout(() => {
    const modalEl = document.getElementById('deleteTeacherModal');
    if (modalEl) {
      const bs = new bootstrap.Modal(modalEl);
      bs.show();
      modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    }
  }, 80);
}

// ------------------------------------------------------------------
// (Rest of file continues with deleteTeacher, viewTeacherDetails, showTeacherDetailsModal, editTeacher ...)

function deleteTeacher(teacherName, teacherId, teacherIndex) {
  // Show loading notification
  showNotification("Deleting teacher and related data...", "info", 3000);

  if (window.api && window.api.deleteEntity) {
    // Use the proper deleteEntity API
    const deleteData = { name: teacherName };
    if (teacherId) {
      deleteData.id = teacherId;
    }

    window.api
      .deleteEntity({ type: "teachers", data: deleteData })
      .then((result) => {
        if (result.success) {
          // Show detailed success message
          const message =
            result.message || `Teacher "${teacherName}" deleted successfully!`;
          showNotification(message, "success", 6000);

          // Show additional info about related data updates
          if (result.sectionsUpdated) {
            setTimeout(() => {
              showNotification(
                `${result.sectionsUpdated} section(s) updated`,
                "info",
                4000
              );
            }, 2000);
          }

          // Reload the teachers to reflect changes
          loadAllTeachers();
        } else {
          const errorMsg = result.error || "Unknown error occurred";
          showNotification(
            `Error deleting teacher: ${errorMsg}`,
            "error",
            6000
          );
        }
      })
      .catch((error) => {
        showNotification(`Failed to delete teacher: ${error}`, "error", 6000);
        console.error("Error deleting teacher:", error);
      });
  } else {
    // Fallback: API not available - show error message
    showNotification(
      "Delete functionality not available. Please check your system configuration.",
      "error",
      6000
    );
    console.error("API not available for delete operation");
  }
}

function viewTeacherDetails(teacherId) {
  // Show loading notification
  showNotification("Loading teacher details...", "info", 2000);

  if (!window.api || !window.api.getTeachers) {
    showNotification("Teacher API not available", "error", 4000);
    return;
  }

  window.api
    .getTeachers()
    .then((result) => {
      if (result.success && Array.isArray(result.teachers)) {
        const teacher = result.teachers.find(
          (t) => t.id === teacherId || t.name === teacherId
        );
        if (teacher) {
          showTeacherDetailsModal(teacher);
        } else {
          showNotification("Teacher not found", "error", 4000);
        }
      } else {
        showNotification("Failed to load teacher details", "error", 4000);
      }
    })
    .catch((error) => {
      console.error("Error loading teacher details:", error);
      showNotification("Error loading teacher details", "error", 4000);
    });
}

function showTeacherDetailsModal(teacher) {
  // Close any existing teacher details modal and rebuild with student-style structure
  const modalHtml = `
    <div class="modal fade" id="teacherDetailsModal" tabindex="-1" aria-labelledby="teacherDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title d-flex align-items-center gap-2" id="teacherDetailsModalLabel">
              <span><i class="bi bi-person-circle me-2"></i>Teacher Details: ${teacher.name || 'Unknown'}</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- Left Column: Personal Information (mirrors student personal card order) -->
              <div class="col-md-6">
                <div class="card bg-light h-100">
                  <div class="card-header bg-primary text-white">
                    <h6 class="mb-0"><i class="bi bi-person me-2"></i>Personal Information</h6>
                  </div>
                  <div class="card-body">
                    <div class="d-flex align-items-center gap-3 mb-3">
                      <div style="width:72px;height:72px;position:relative;">
                        ${(teacher.profilePictureUrl) ? `<img src="${teacher.profilePictureUrl}" alt="Avatar" style="width:72px;height:72px;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
                      </div>
                      <div class="small text-muted">Profile picture${teacher.profilePictureUrl ? '' : ' not set'}.</div>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-person-fill text-primary me-2"></i>Full Name:</strong>
                      <span class="ms-2">${teacher.name || 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-person-circle text-muted me-2"></i>Username:</strong>
                      <span class="ms-2"><code>${teacher.username || 'Not specified'}</code></span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-gender-ambiguous text-secondary me-2"></i>Gender:</strong>
                      <span class="ms-2">${teacher.gender || 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-calendar text-warning me-2"></i>Date of Birth:</strong>
                      <span class="ms-2">${teacher.dob ? new Date(teacher.dob).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                    <div class="mb-0">
                      <strong><i class="bi bi-geo-alt text-danger me-2"></i>Address:</strong>
                      <span class="ms-2">${teacher.address || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Right Column: Professional / Assignment Info (mirrors student academic layout) -->
              <div class="col-md-6">
                <div class="card bg-light h-100">
                  <div class="card-header bg-success text-white">
                    <h6 class="mb-0"><i class="bi bi-briefcase me-2"></i>Professional Information</h6>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <strong><i class="bi bi-bookmark text-primary me-2"></i>Section:</strong>
                      <span class="ms-2 badge ${teacher.section ? 'bg-success' : 'bg-secondary'}">${teacher.section || 'Unassigned'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-calendar-plus text-warning me-2"></i>Date of Joining:</strong>
                      <span class="ms-2">${teacher.dateOfJoining ? new Date(teacher.dateOfJoining).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-telephone text-success me-2"></i>Mobile No:</strong>
                      <span class="ms-2">${teacher.mobileNo || 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-envelope text-info me-2"></i>Email:</strong>
                      <span class="ms-2">${teacher.email || 'Not specified'}</span>
                    </div>
                    <div class="mb-0">
                      <strong><i class="bi bi-chat-left-text text-secondary me-2"></i>Other:</strong>
                      <span class="ms-2">${teacher.other || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ${teacher.id ? `
              <div class="row mt-3">
                <div class="col-12">
                  <div class="card bg-light">
                    <div class="card-header bg-warning text-dark">
                      <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>System Information</h6>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col-md-6">
                          <strong><i class="bi bi-key text-primary me-2"></i>Teacher ID:</strong>
                          <span class="ms-2"><code>${teacher.id}</code></span>
                        </div>
                        <div class="col-md-6">
                          <strong><i class="bi bi-calendar-check text-success me-2"></i>Status:</strong>
                          <span class="ms-2 badge bg-success">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>` : ''}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="bi bi-x-lg me-1"></i>Close
            </button>
            <button type="button" class="btn btn-danger" onclick="confirmDeleteTeacher('${teacher.name}','${teacher.id || ''}',0)" data-bs-dismiss="modal">
              <i class="bi bi-trash me-1"></i>Delete Teacher
            </button>
          </div>
        </div>
      </div>
    </div>`;

  const existing = document.getElementById('teacherDetailsModal');
  if (existing) {
    try {
      const inst = bootstrap.Modal.getInstance(existing);
      if (inst) {
        existing.addEventListener('hidden.bs.modal', () => existing.remove(), { once: true });
        inst.hide();
      } else {
        existing.remove();
      }
    } catch(_) { existing.remove(); }
  }
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  setTimeout(() => {
    const modal = document.getElementById('teacherDetailsModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
        setTimeout(() => {
          if (!document.querySelector('.modal.show')) {
            const leftovers = document.querySelectorAll('.modal-backdrop');
            if (leftovers.length > 1) {
              leftovers.forEach((b, idx, arr) => { if (idx < arr.length - 1) b.remove(); });
            } else if (leftovers.length === 1) {
              leftovers[0].remove();
            }
            if (!document.querySelector('.modal.show')) {
              document.body.classList.remove('modal-open');
              document.body.style.removeProperty('padding-right');
            }
          }
        }, 120);
      }, { once: true });
    }
  }, 100);
}

function editTeacher(teacherId) {
  // Close any currently open modals to avoid stacking
  try {
    document.querySelectorAll('.modal.show').forEach(m => {
      try {
        const inst = bootstrap.Modal.getInstance(m) || new bootstrap.Modal(m);
        inst.hide();
      } catch(e){ console.warn('Could not hide modal', m.id, e); }
    });
    // Clean transient teacher-related modals after fade
    setTimeout(() => {
      document.querySelectorAll('.modal').forEach(m => {
        if (!m.classList.contains('show')) {
          if (/teacherDetailsModal|editTeacherModal|manageTeachersModal/i.test(m.id)) {
            if (m.id !== 'editTeacherModal') m.remove();
          }
        }
      });
    }, 350);
  } catch(e) {
    console.warn('Error while closing existing modals before editing teacher', e);
  }
  if (!window.api || !window.api.getTeachers) {
    showNotification("Teacher API not available", "error", 4000);
    return;
  }
  // Fetch teachers plus sections (if available) to mirror student edit behavior
  const sectionsPromise = (window.api && window.api.getSections)
    ? window.api.getSections().catch(() => ({ sections: [] }))
    : Promise.resolve({ sections: [] });

  Promise.all([
    window.api.getTeachers(),
    sectionsPromise
  ])
    .then(([teacherResult, sectionResult]) => {
      if (!(teacherResult.success && Array.isArray(teacherResult.teachers))) {
        showNotification("Failed to load teachers", "error", 4000);
        return;
      }
      const teacher = teacherResult.teachers.find(
        (t) => t.id === teacherId || t.name === teacherId
      );
      if (!teacher) {
        showNotification("Teacher not found", "error", 4000);
        return;
      }

      const genderOptions = ["Male", "Female", "Other"]
        .map(
          (g) => `<option value="${g}"${teacher.gender === g ? " selected" : ""}>${g}</option>`
        )
        .join("");

      const rawSections = Array.isArray(sectionResult.sections)
        ? sectionResult.sections
        : [];

      // Sections may be array of strings or objects; normalize to names
      const sectionNames = rawSections.map((s) => {
        if (typeof s === 'string') return s; 
        if (s && typeof s === 'object') return s.name || s.section || ''; 
        return '';
      }).filter(Boolean);

      const sectionOptions = ["", ...sectionNames]
        .map((sec) => `<option value="${sec}"${teacher.section === sec ? ' selected' : ''}>${sec || '(None)'}</option>`)
        .join('');

      const modalHtml = `
        <div class="modal fade" id="editTeacherModal" tabindex="-1" aria-labelledby="editTeacherModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-info text-white">
                <h5 class="modal-title" id="editTeacherModalLabel">
                  <i class="bi bi-pencil me-2"></i>
                  Edit Teacher: ${teacher.name || 'Unknown'}
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <form id="editTeacherForm">
                <div class="modal-body">
                  <div class="row">
                    <!-- Left Column: Personal Information & Profile Picture -->
                    <div class="col-md-6">
                      <div class="card bg-light h-100">
                        <div class="card-header bg-primary text-white">
                          <h6 class="mb-0 d-flex align-items-center"><i class="bi bi-person me-2"></i>Personal Information</h6>
                        </div>
                        <div class="card-body">
                          <div class="d-flex align-items-center mb-3 gap-3">
                            <div id="teacherAvatarWrapper" class="student-avatar-wrapper" style="width:72px;height:72px;position:relative;flex:0 0 auto;">
                              <img id="teacherAvatarImg" class="student-avatar-img" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:${teacher.profilePictureUrl?'block':'none'};" src="${teacher.profilePictureUrl || ''}" onerror="this.style.display='none';document.getElementById('teacherAvatarFallback').style.display='flex';">
                              <div id="teacherAvatarFallback" class="d-flex justify-content-center align-items-center bg-secondary text-white rounded-circle" style="width:100%;height:100%;font-weight:600;font-size:1.1rem;${teacher.profilePictureUrl?'display:none;':'display:flex;'}">
                                ${(teacher.name||'?').trim().split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()}
                              </div>
                            </div>
                            <div class="flex-grow-1">
                              <div class="btn-group mb-2" role="group" aria-label="Change avatar">
                                <button type="button" id="changeTeacherAvatarBtn" class="btn btn-sm btn-outline-primary"><i class="bi bi-image me-1"></i>Change</button>
                                <button type="button" id="removeTeacherAvatarBtn" class="btn btn-sm btn-outline-danger" ${teacher.profilePictureUrl?'':'disabled'}><i class="bi bi-x-circle me-1"></i>Remove</button>
                              </div>
                              <div class="small text-muted">JPEG/PNG up to 1MB. Will be resized to max 256px.</div>
                              <input type="file" id="teacherAvatarInput" accept="image/*" hidden>
                              <input type="hidden" name="_avatarState" value="unchanged">
                              <input type="hidden" name="_avatarData" value="">
                            </div>
                          </div>
                          <div class="mb-3">
                            <label class="form-label"><strong>Full Name</strong></label>
                            <input type="text" class="form-control" name="name" value="${teacher.name || ''}" required>
                          </div>
                          <div class="mb-3">
                            <label class="form-label"><strong>Username</strong></label>
                            <input type="text" class="form-control" name="username" value="${teacher.username || ''}" readonly>
                          </div>
                          <div class="mb-3">
                            <label class="form-label"><strong>Gender</strong></label>
                            <select class="form-select" name="gender">${genderOptions}</select>
                          </div>
                          <div class="mb-3">
                            <label class="form-label"><strong>Date of Birth</strong></label>
                            <input type="date" class="form-control" name="dob" value="${teacher.dob ? new Date(teacher.dob).toISOString().split('T')[0] : ''}">
                          </div>
                          <div class="mb-3">
                            <label class="form-label"><strong>Address</strong></label>
                            <input type="text" class="form-control" name="address" value="${teacher.address || ''}">
                          </div>
                          <div class="mb-0">
                            <label class="form-label"><strong>Email</strong></label>
                            <input type="email" class="form-control" name="email" value="${teacher.email || ''}">
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Right Column: Professional Information -->
                    <div class="col-md-6">
                      <div class="card bg-light h-100">
                        <div class="card-header bg-success text-white">
                          <h6 class="mb-0"><i class="bi bi-briefcase me-2"></i>Professional Information</h6>
                        </div>
                        <div class="card-body">
                          <div class="mb-3">
                            <label class="form-label"><strong>Section</strong></label>
                            <select class="form-select" name="section">${sectionOptions}</select>
                          </div>
                          <div class="mb-3">
                            <label class="form-label"><strong>Date of Joining</strong></label>
                            <input type="date" class="form-control" name="dateOfJoining" value="${teacher.dateOfJoining ? new Date(teacher.dateOfJoining).toISOString().split('T')[0] : ''}">
                          </div>
                          <div class="mb-3">
                            <label class="form-label"><strong>Mobile No</strong></label>
                            <input type="text" class="form-control" name="mobileNo" value="${teacher.mobileNo || ''}">
                          </div>
                          <div class="mb-0">
                            <label class="form-label"><strong>Other Notes</strong></label>
                            <textarea class="form-control" name="other" rows="3" placeholder="Additional notes">${teacher.other || ''}</textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="bi bi-x-lg me-1"></i>Cancel
                  </button>
                  <button type="submit" class="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>`;

      const existing = document.getElementById('editTeacherModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      setTimeout(() => {
        const modalEl = document.getElementById('editTeacherModal');
        if (!modalEl) return;
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();

        const form = document.getElementById('editTeacherForm');
        // Avatar logic (mirrors student edit implementation)
        const avatarInput = document.getElementById('teacherAvatarInput');
        const changeAvatarBtn = document.getElementById('changeTeacherAvatarBtn');
        const removeAvatarBtn = document.getElementById('removeTeacherAvatarBtn');
        const avatarImg = document.getElementById('teacherAvatarImg');
        const avatarFallback = document.getElementById('teacherAvatarFallback');
        let processedTeacherAvatar = null; // data URL
        let avatarRemoved = false;

        function dataURLSize(dataURL){ if(!dataURL) return 0; const head = 'base64,'; const i = dataURL.indexOf(head); if(i===-1) return 0; return Math.round((dataURL.length - i - head.length) * 3/4); }
        function resizeImageToDataURL(file, maxDim=256, quality=0.85){
          return new Promise((resolve,reject)=>{
            const reader = new FileReader();
            reader.onload = e=>{
              const img = new Image();
              img.onload = ()=>{
                let {width, height} = img; if(width>height && width>maxDim){ height = Math.round(height * (maxDim/width)); width = maxDim; } else if(height>width && height>maxDim){ width = Math.round(width * (maxDim/height)); height = maxDim; } else if(width===height && width>maxDim){ width = height = maxDim; }
                const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,width,height);
                let mime = 'image/jpeg'; if(file.type === 'image/png') mime='image/png'; let dataURL = canvas.toDataURL(mime, quality);
                // If still >1MB and jpeg, lower quality once
                if(dataURLSize(dataURL) > 1024*1024 && mime==='image/jpeg'){ dataURL = canvas.toDataURL('image/jpeg', 0.7); }
                resolve(dataURL);
              };
              img.onerror = reject;
              img.src = e.target.result;
            };
            reader.onerror = reject; reader.readAsDataURL(file);
          });
        }

        changeAvatarBtn?.addEventListener('click', ()=> avatarInput?.click());
        removeAvatarBtn?.addEventListener('click', ()=>{
          processedTeacherAvatar = null; avatarRemoved = true;
          if(avatarImg){ avatarImg.style.display='none'; avatarImg.src=''; }
          if(avatarFallback){ avatarFallback.style.display='flex'; }
          removeAvatarBtn.disabled = true;
        });
        avatarInput?.addEventListener('change', async (e)=>{
          const file = e.target.files[0]; if(!file) return;
          if(!/^image\/(png|jpe?g)$/i.test(file.type)){ showNotification('Invalid image type. Use JPG or PNG.', 'error', 4000); return; }
          if(file.size > 2*1024*1024){ showNotification('Image too large. Max 2MB before compression.', 'error', 4000); return; }
          try {
            const dataURL = await resizeImageToDataURL(file, 256, 0.85);
            if(dataURLSize(dataURL) > 1024*1024){ showNotification('Image still exceeds 1MB after resize; choose a smaller one.', 'error', 5000); return; }
            processedTeacherAvatar = dataURL; avatarRemoved = false;
            if(avatarImg){ avatarImg.src = dataURL; avatarImg.style.display='block'; }
            if(avatarFallback){ avatarFallback.style.display='none'; }
            removeAvatarBtn.disabled = false;
          } catch(err){ console.error('Avatar processing failed', err); showNotification('Failed to process image', 'error', 4000); }
          avatarInput.value='';
        });
        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...`;

            const formData = new FormData(form);
            const updatedTeacher = {
              id: teacher.id,
              name: formData.get('name').trim(),
              username: formData.get('username').trim(),
              gender: formData.get('gender'),
              dob: formData.get('dob'),
              address: formData.get('address').trim(),
              mobileNo: formData.get('mobileNo').trim(),
              email: formData.get('email').trim(),
              dateOfJoining: formData.get('dateOfJoining'),
              section: formData.get('section'),
              other: formData.get('other').trim(),
              _originalId: teacher.id || null,
              _originalName: teacher.name || null
            };
            ["dob","dateOfJoining","section","other","address","mobileNo","email"].forEach(k=>{ if(updatedTeacher[k] === "") updatedTeacher[k] = null; });

            // Attach avatar changes
            if(processedTeacherAvatar){
              updatedTeacher.profilePicture = processedTeacherAvatar; // use same naming convention as students for backend reuse
            } else if(avatarRemoved){
              updatedTeacher.profilePicture = 'REMOVE';
            }

            // Reuse existing robust update fallback logic (attemptUpdate) from previous implementation
            async function attemptUpdate() {
              function restoreBtn() { submitBtn.disabled = false; submitBtn.innerHTML = originalHtml; }
              const apiKeys = Object.keys(window.api || {});
              try {
                let routeUsed = null;
                if (window.api && window.api.updateTeacher) {
                  try {
                    const res1 = await window.api.updateTeacher({ ...updatedTeacher });
                    if (res1 && res1.success) {
                      routeUsed = 'updateTeacher(object)';
                    }
                  } catch (e2) { console.warn('[TeacherEdit] updateTeacher(object) threw', e2); }
                  if (routeUsed) {
                    showNotification(`Teacher updated successfully (${routeUsed})`, 'success', 3500);
                    bsModal.hide();
                    renderAllTeachersList();
                    return restoreBtn();
                  }
                }
                if (window.api && window.api.updateEntity) {
                  try {
                    const res3 = await window.api.updateEntity({ type: 'teachers', data: updatedTeacher });
                    if (res3 && res3.success) {
                      showNotification('Teacher updated successfully (updateEntity)', 'success', 3500);
                      bsModal.hide();
                      renderAllTeachersList();
                      return restoreBtn();
                    }
                  } catch (e3) { console.warn('[TeacherEdit] updateEntity threw', e3); }
                }
                if (window.api && window.api.createEntity) {
                  showNotification('Using fallback recreate approach', 'info', 2500);
                  if (window.api.deleteEntity && (updatedTeacher.id || updatedTeacher._originalName)) {
                    try { await window.api.deleteEntity({ type: 'teachers', data: { id: updatedTeacher.id, name: updatedTeacher._originalName } }); } catch(_){}
                  }
                  const recreateData = { ...updatedTeacher };
                  if (teacher.profilePic && !recreateData.profilePic) recreateData.profilePic = teacher.profilePic;
                  if (!recreateData.password && window.api.getCredentials) {
                    try {
                      const credsRes = await window.api.getCredentials();
                      if (credsRes && credsRes.success && Array.isArray(credsRes.credentials)) {
                        const cred = credsRes.credentials.find(c => c.username === recreateData.username);
                        if (cred && cred.password) recreateData.password = cred.password;
                      }
                    } catch(_){}
                  }
                  if (!recreateData.password) recreateData.password = Math.random().toString(36).slice(-10);
                  if (recreateData.id && !(window.api.updateTeacher || window.api.updateEntity)) delete recreateData.id;
                  const payloadVariants = [
                    { type: 'teachers', data: recreateData },
                    { entityType: 'teachers', data: recreateData },
                    { collection: 'teachers', data: recreateData },
                    { type: 'teachers', payload: recreateData }
                  ];
                  for (let i = 0; i < payloadVariants.length; i++) {
                    try {
                      const resVariant = await window.api.createEntity(payloadVariants[i]);
                      if (resVariant && resVariant.success) {
                        showNotification(`Teacher updated (recreated) successfully via variant ${i + 1}!`, 'success', 3500);
                        bsModal.hide();
                        renderAllTeachersList();
                        return restoreBtn();
                      }
                    } catch(_){}
                  }
                  showNotification('Failed to save teacher changes after fallback attempts', 'error', 5000);
                  return restoreBtn();
                }
                showNotification('No available API to update teacher. Exposed keys: ' + apiKeys.join(', '), 'error', 6000);
                restoreBtn();
              } catch (outer) {
                console.error('[TeacherEdit] Unexpected update error', outer);
                showNotification('Unexpected error updating teacher', 'error', 4000);
                restoreBtn();
              }
            }
            attemptUpdate();
        });
        modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
      }, 80);
    })
    .catch(() => {
      showNotification("Error loading teachers", "error", 4000);
    });
}

// Add Teachers sidebar link functionality
document
  .getElementById("addTeachersLink")
  .addEventListener("click", function (e) {
    // Set sidebar active state
    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
      link.classList.remove("active");
    });
    document.getElementById("addTeachersLink").classList.add("active");
    document.getElementById("teachersDropdownBtn").classList.add("active");
    e.preventDefault();
    // Replace main-content with Teacher Admission form
    const mainContent = document.querySelector(
      ".main-content .container-fluid"
    );
    if (mainContent) {
      mainContent.innerHTML = `
                    <div class='row'>
                        <div class='col-12'>
              <nav aria-label='breadcrumb' class='mb-3'>
                <ol class='breadcrumb app-breadcrumb'>
                  <li class='breadcrumb-item'><a href='#' id='dashboardBreadcrumb'><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>
                  <li class='breadcrumb-item'><a href='#' id='teachersBreadcrumb'><i class="bi bi-person-badge"></i><span>Teachers</span></a></li>
                  <li class='breadcrumb-item active' aria-current='page'><i class='bi bi-person-plus-fill'></i><span> Add Teacher</span></li>
                </ol>
              </nav>
                            <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
                                <h3 class='fw-bold mb-4 text-center'>Teacher Admission Form</h3>
                                <div class='mb-3 text-center'>
                                    <span style='color:#1976d2; font-weight:500;'>* Blue label: Required field</span>
                                    <span style='color:#888; margin-left:16px;'>Grey label: Optional field</span>
                                </div>
                                <form id='teacherAdmissionForm'>
                                    <h5 class='fw-semibold mb-3 mt-2'>1. Teacher Information</h5>
                                    <div class='row g-3 mb-3'>
                                        <!-- Username and password will be auto-generated -->
                                        <div class='col-md-6'>
                                            <label for='teacherName' class='form-label' style='color:#1976d2;'>Name of Teacher *</label>
                                            <input type='text' class='form-control' id='teacherName' required>
                                        </div>
                                        <div class='col-md-6'>
                                            <label for='profilePic' class='form-label' style='color:#888;'>Profile Picture</label>
                                            <input type='file' class='form-control' id='profilePic' accept='image/*'>
                                        </div>
                                        <div class='col-md-6'>
                                            <label for='mobileNo' class='form-label' style='color:#1976d2;'>Mobile No. *</label>
                                            <input type='tel' class='form-control' id='mobileNo' required>
                                        </div>
                                        <div class='col-md-6'>
                                            <label for='dateOfJoining' class='form-label' style='color:#1976d2;'>Date of Joining *</label>
                                            <input type='date' class='form-control' id='dateOfJoining' required>
                                        </div>
                                        <div class='col-md-6'>
                                            <label for='gender' class='form-label' style='color:#1976d2;'>Gender *</label>
                                            <select class='form-select' id='gender' required>
                                                <option value=''>Select</option>
                                                <option value='Male'>Male</option>
                                                <option value='Female'>Female</option>
                                                <option value='Other'>Other</option>
                                            </select>
                                        </div>
                                        <div class='col-md-6'>
                                            <label for='address' class='form-label' style='color:#1976d2;'>Address *</label>
                                            <input type='text' class='form-control' id='address' required>
                                        </div>
                                        <div class='col-md-6'>
                                            <label for='dob' class='form-label' style='color:#1976d2;'>Date of Birth *</label>
                                            <input type='date' class='form-control' id='dob' required>
                                        </div>
                                    </div>
                                    <div class='d-flex justify-content-center gap-3'>
                                        <button type='reset' class='btn btn-secondary'>Reset</button>
                                        <button type='submit' class='btn btn-success'>Submit Admission</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                `;
      document
        .getElementById("teacherAdmissionForm")
        .addEventListener("submit", function (ev) {
          ev.preventDefault();

          // Gather form data
          const form = ev.target;

          // Check if form is already being submitted
          const submitButton = form.querySelector('button[type="submit"]');
          if (submitButton.disabled) {
            return; // Prevent double submission
          }

          // Disable submit button to prevent double submission
          submitButton.disabled = true;
          submitButton.innerHTML =
            '<i class="bi bi-hourglass-split me-2"></i>Processing...';

          // Generate username from teacher name
          function generateUsername(name) {
            // Split name into parts
            const parts = name.trim().split(/\s+/);
            if (parts.length === 0) return "";
            // Last name (last part)
            let lastName = parts[parts.length - 1].toLowerCase();
            // First 1 or 2 initials from first names
            let initials = "";
            if (parts.length > 1) {
              initials += parts[0][0] ? parts[0][0].toLowerCase() : "";
              if (parts.length > 2) {
                initials += parts[1][0] ? parts[1][0].toLowerCase() : "";
              }
            } else {
              // If only one part, use first letter
              initials += lastName[0] ? lastName[0] : "";
            }
            let username = (lastName + initials)
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 8);
            return username;
          }
          // Generate random password
          function generatePassword(length = 8) {
            const chars =
              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let pwd = "";
            for (let i = 0; i < length; i++) {
              pwd += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return pwd;
          }
          const teacherData = {
            name: form.teacherName.value.trim(),
            mobileNo: form.mobileNo.value.trim(),
            dateOfJoining: form.dateOfJoining.value,
            gender: form.gender.value,
            address: form.address.value.trim(),
            dob: form.dob.value,
            username: generateUsername(form.teacherName.value),
            password: generatePassword(10),
          };

          // Image processing for admission (mirror student create flow)
          const fileInput = form.profilePic;
          function dataURLSize(dataURL){ if(!dataURL) return 0; const head='base64,'; const i=dataURL.indexOf(head); if(i===-1) return 0; return Math.round((dataURL.length - i - head.length)*3/4); }
          function resizeImageToDataURL(file, maxDim=256, quality=0.85){ return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=e=>{ const img=new Image(); img.onload=()=>{ let {width,height}=img; if(width>height && width>maxDim){ height=Math.round(height*(maxDim/width)); width=maxDim; } else if(height>width && height>maxDim){ width=Math.round(width*(maxDim/height)); height=maxDim; } else if(width===height && width>maxDim){ width=height=maxDim; } const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height; const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,width,height); let mime='image/jpeg'; if(file.type==='image/png') mime='image/png'; let dataURL=canvas.toDataURL(mime, quality); if(dataURLSize(dataURL)>1024*1024 && mime==='image/jpeg'){ dataURL=canvas.toDataURL('image/jpeg',0.7); } resolve(dataURL); }; img.onerror=reject; img.src=e.target.result; }; reader.onerror=reject; reader.readAsDataURL(file); }); }

          const file = fileInput.files && fileInput.files[0];
          if(file){
            if(!/^image\/(png|jpe?g)$/i.test(file.type)){
              showNotification('Invalid image type (JPG/PNG only). Skipping image.', 'error', 4000);
              submitTeacherData(teacherData, form);
            } else if(file.size > 2*1024*1024){
              showNotification('Image too large (>2MB before processing). Choose a smaller file.', 'error', 5000);
              submitTeacherData(teacherData, form);
            } else {
              resizeImageToDataURL(file,256,0.85).then(dataURL=>{
                if(dataURLSize(dataURL) > 1024*1024){
                  showNotification('Processed image still exceeds 1MB; skipping image.', 'error', 5000);
                  submitTeacherData(teacherData, form);
                } else {
                  teacherData.profilePicture = dataURL; // use consistent field name
                  submitTeacherData(teacherData, form);
                }
              }).catch(err=>{ console.error('Teacher image processing failed', err); showNotification('Failed to process image; continuing without it.', 'error', 4000); submitTeacherData(teacherData, form); });
            }
          } else {
            submitTeacherData(teacherData, form);
          }
          function submitTeacherData(data, form) {
            // First check if teacher already exists (by name or mobile number)
            if (window.api && window.api.getTeachers) {
              window.api
                .getTeachers()
                .then((result) => {
                  if (result.success && Array.isArray(result.teachers)) {
                    // Check if teacher name or mobile number already exists
                    const newTeacherName = data.name
                      .toString()
                      .trim()
                      .toLowerCase();
                    const newMobileNo = data.mobileNo.toString().trim();

                    const existingTeacher = result.teachers.find((teacher) => {
                      const existingName = (teacher.name || "")
                        .toString()
                        .trim()
                        .toLowerCase();
                      const existingMobile = (teacher.mobileNo || "")
                        .toString()
                        .trim();

                      return (
                        existingName === newTeacherName ||
                        (newMobileNo && existingMobile === newMobileNo)
                      );
                    });

                    if (existingTeacher) {
                      // Re-enable submit button when duplicate is found
                      const submitButton = form.querySelector(
                        'button[type="submit"]'
                      );
                      submitButton.disabled = false;
                      submitButton.innerHTML = "Submit Admission";

                      // Determine if duplicate is by name or mobile
                      const duplicateType =
                        existingTeacher.name.toLowerCase().trim() ===
                        newTeacherName
                          ? "name"
                          : "mobile";
                      showDuplicateTeacherModal(
                        data.name,
                        data.mobileNo,
                        existingTeacher,
                        duplicateType
                      );
                      return; // Stop execution here - don't create teacher
                    }
                  }

                  // If no duplicate found, proceed with creation
                  createTeacher(data, form);
                })
                .catch((err) => {
                  // If getTeachers fails, proceed with creation but show warning
                  console.warn("Could not verify teacher uniqueness:", err);
                  showNotification(
                    "Warning: Could not verify teacher uniqueness. Proceeding with creation.",
                    "info",
                    4000
                  );
                  createTeacher(data, form);
                });
            } else {
              // If getTeachers API not available, proceed with creation but show warning
              console.warn("getTeachers API not available");
              showNotification(
                "Warning: Teacher validation not available. Proceeding with creation.",
                "info",
                4000
              );
              createTeacher(data, form);
            }
          }
        });

      function createTeacher(data, form) {
        if (window.api && window.api.createEntity) {
          window.api
            .createEntity({ type: "teachers", data })
            .then((result) => {
              // Re-enable submit button
              const submitButton = form.querySelector('button[type="submit"]');
              submitButton.disabled = false;
              submitButton.innerHTML = "Submit Admission";

              if (result.success) {
                const message =
                  result.username && result.username !== data.username
                    ? `Teacher admission submitted successfully! Generated username: ${result.username}`
                    : "Teacher admission submitted successfully!";
                showNotification(message, "success");
                form.reset();
              } else {
                // Check if error is related to duplicate teacher
                const errorMsg = result.error || "Unknown error";
                if (
                  errorMsg.toLowerCase().includes("teacher") ||
                  errorMsg.toLowerCase().includes("duplicate") ||
                  errorMsg.toLowerCase().includes("exists")
                ) {
                  showDuplicateTeacherModal(
                    data.name,
                    data.mobileNo,
                    null,
                    "general"
                  );
                } else {
                  showNotification("Error: " + errorMsg, "error");
                }
              }
            })
            .catch((err) => {
              // Re-enable submit button on error
              const submitButton = form.querySelector('button[type="submit"]');
              submitButton.disabled = false;
              submitButton.innerHTML = "Submit Admission";

              showNotification("Submission failed: " + err, "error");
            });
        } else {
          // Re-enable submit button if API not available
          const submitButton = form.querySelector('button[type="submit"]');
          submitButton.disabled = false;
          submitButton.innerHTML = "Submit Admission";

          showNotification("API not available.", "error");
        }
      }

      function showDuplicateTeacherModal(
        teacherName,
        mobileNo,
        existingTeacher,
        duplicateType
      ) {
        let message = "";

        if (duplicateType === "name") {
          message = `Teacher with name "${teacherName}" already exists. Please use a different name.`;
        } else if (duplicateType === "mobile") {
          message = `Teacher with mobile number "${mobileNo}" already exists. Please use a different mobile number.`;
        } else {
          message = `Teacher with this information already exists. Please verify and use different details.`;
        }

        // Show notification instead of modal
        showNotification(message, "error", 6000);

        // Focus on appropriate field after a short delay
        setTimeout(() => {
          if (duplicateType === "name") {
            const teacherNameInput = document.getElementById("teacherName");
            if (teacherNameInput) {
              teacherNameInput.focus();
              teacherNameInput.select();
            }
          } else if (duplicateType === "mobile") {
            const mobileInput = document.getElementById("mobileNo");
            if (mobileInput) {
              mobileInput.focus();
              mobileInput.select();
            }
          }
        }, 500);
      }
    }
    // ...existing code...

    document.getElementById("newSectionLink").addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        // Set sidebar active state
        document
          .querySelectorAll(".sidebar .nav-link")
          .forEach(function (link) {
            link.classList.remove("active");
          });
        document.getElementById("newSectionLink").classList.add("active");
        document.getElementById("sectionsDropdownBtn").classList.add("active");
        // Replace only the main-content area with the new section form, keep other content
        const mainContent = document.querySelector(
          ".main-content .container-fluid"
        );
        if (mainContent) {
          // Save current content to restore later if needed
          const prevContent = mainContent.innerHTML;
          // Inject modal HTML once (outside form)
          if (!document.getElementById("teacherModal")) {
            const modalDiv = document.createElement("div");
            modalDiv.className = "modal fade";
            modalDiv.id = "teacherModal";
            modalDiv.tabIndex = -1;
            modalDiv.setAttribute("aria-labelledby", "teacherModalLabel");
            modalDiv.setAttribute("aria-hidden", "true");
            modalDiv.innerHTML = `
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="teacherModalLabel">No Teacher Selected</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    Please select a teacher for this section before submitting.
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                                    <button type="button" class="btn btn-success" id="createTeacherBtn">Create Teacher</button>
                                </div>
                            </div>
                        </div>
                    `;
            document.body.appendChild(modalDiv);
            // Add event listener for Create Teacher button
            setTimeout(function () {
              const btn = document.getElementById("createTeacherBtn");
              if (btn) {
                btn.addEventListener("click", function () {
                  // Ensure Teachers dropdown is expanded
                  const teachersDropdownBtn = document.getElementById(
                    "teachersDropdownBtn"
                  );
                  const teachersSubmenu =
                    document.getElementById("teachersSubmenu");
                  if (
                    teachersDropdownBtn &&
                    teachersSubmenu &&
                    teachersSubmenu.style.display === "none"
                  ) {
                    teachersDropdownBtn.click();
                  }
                  // Simulate clicking the Add Teachers link in sidebar
                  const addTeachersLink =
                    document.getElementById("addTeachersLink");
                  if (addTeachersLink) {
                    addTeachersLink.click();
                  }
                  // Close modal
                  const modal = document.getElementById("teacherModal");
                  if (modal) {
                    const modalInstance =
                      bootstrap.Modal.getOrCreateInstance(modal);
                    modalInstance.hide();
                  }
                });
              }
            }, 500);
          }
          mainContent.innerHTML = `
            <div class='row'>
                <div class='col-12'>
          <nav aria-label='breadcrumb' class='mb-3'>
            <ol class='breadcrumb app-breadcrumb'>
              <li class='breadcrumb-item'><a href='#' id='dashboardBreadcrumb'><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>
              <li class='breadcrumb-item'><a href='#' id='sectionsBreadcrumb'><i class="bi bi-journal"></i><span>Sections</span></a></li>
              <li class='breadcrumb-item active' aria-current='page'><i class='bi bi-plus-circle'></i><span> New Section</span></li>
            </ol>
          </nav>
                    <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
                        <h3 class='fw-bold mb-4 text-center'>Create New Section</h3>
                        <div class='mb-3 text-center'>
                            <span style='color:#1976d2; font-weight:500;'>* Blue label: Required field</span>
                            <span style='color:#888; margin-left:16px;'>Grey label: Optional field</span>
                        </div>
                        <form id='createSectionForm'>
                            <div class='row g-3 mb-3'>
                                <div class='col-md-4'>
                                    <label for='sectionName' class='form-label' style='color:#1976d2;'>Section Name *</label>
                                    <input type='text' class='form-control' id='sectionName' required>
                                </div>
                                <div class='col-md-4'>
                                    <label for='gradeLevel' class='form-label' style='color:#1976d2;'>Grade Level *</label>
                                    <select class='form-select' id='gradeLevel' required>
                                        <option value=''>Select Grade</option>
                                        <option value='7'>Grade 7</option>
                                        <option value='8'>Grade 8</option>
                                        <option value='9'>Grade 9</option>
                                        <option value='10'>Grade 10</option>
                                    </select>
                                </div>
                                <div class='col-md-4'>
                                    <label for='sectionTeacher' class='form-label' style='color:#1976d2;'>Select Section Teacher *</label>
                                    <select class='form-select' id='sectionTeacher' required>
                                        <option value=''>Select</option>
                                    </select>
                                </div>
                            </div>
                            <div class='d-flex justify-content-center gap-3'>
                                <button type='reset' class='btn btn-secondary'>Reset</button>
                                <button type='submit' class='btn btn-success'>Create Section</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
          // Fetch teachers for dropdown
          if (window.api && window.api.getTeachers) {
            window.api.getTeachers().then((result) => {
              const teacherSelect = document.getElementById("sectionTeacher");
              if (result.success && Array.isArray(result.teachers)) {
                result.teachers.forEach((teacher) => {
                  const opt = document.createElement("option");
                  opt.value = teacher.name; // Use teacher name as value
                  opt.textContent = teacher.name;
                  opt.setAttribute("data-teacher-id", teacher.id); // Store ID as data attribute if needed
                  teacherSelect.appendChild(opt);
                });
              }
              // If no teachers available, show modal immediately
              if (teacherSelect.options.length <= 1) {
                const modal = document.getElementById("teacherModal");
                if (modal) {
                  const modalInstance =
                    bootstrap.Modal.getOrCreateInstance(modal);
                  modalInstance.show();
                }
              }
            });
          }
          document
            .getElementById("createSectionForm")
            .addEventListener("submit", function (ev) {
              ev.preventDefault();
              const form = ev.target;
              const sectionName = form.sectionName.value;
              const gradeLevel = form.gradeLevel.value;
              const sectionTeacher = form.sectionTeacher.value;
              if (!sectionTeacher) {
                // Show modal if teacher is not selected
                const modal = document.getElementById("teacherModal");
                if (modal) {
                  const modalInstance =
                    bootstrap.Modal.getOrCreateInstance(modal);
                  modalInstance.show();
                }
                return;
              }
              if (window.api && window.api.createEntity) {
                // First check if section name already exists
                if (window.api && window.api.getSections) {
                  window.api
                    .getSections()
                    .then((result) => {
                      if (result.success && Array.isArray(result.sections)) {
                        // Check if section name already exists (case-insensitive)
                        const newSectionName = sectionName
                          .toString()
                          .trim()
                          .toLowerCase();
                        const existingSection = result.sections.find(
                          (section) =>
                            section.toLowerCase().trim() === newSectionName
                        );

                        if (existingSection) {
                          // Show notification for duplicate section name
                          showDuplicateSectionModal(sectionName);
                          return;
                        }
                      }

                      // If no duplicate found, proceed with creation
                      createSection(
                        sectionName,
                        gradeLevel,
                        sectionTeacher,
                        form
                      );
                    })
                    .catch((err) => {
                      // If getSections fails, proceed silently with creation
                      console.warn(
                        "Could not verify section name uniqueness:",
                        err
                      );
                      createSection(
                        sectionName,
                        gradeLevel,
                        sectionTeacher,
                        form
                      );
                    });
                } else {
                  // If getSections API not available, proceed silently with creation
                  console.warn("getSections API not available");
                  createSection(sectionName, gradeLevel, sectionTeacher, form);
                }
              } else {
                showNotification("API not available.", "error");
              }
            });

          function createSection(
            sectionName,
            gradeLevel,
            sectionTeacher,
            form
          ) {
            if (window.api && window.api.createEntity) {
              window.api
                .createEntity({
                  type: "sections",
                  data: {
                    name: sectionName,
                    gradeLevel: gradeLevel,
                    teacher: sectionTeacher,
                  },
                })
                .then((result) => {
                  if (result.success) {
                    showNotification(
                      "Section created successfully!",
                      "success"
                    );
                    form.reset(); // Clear the form fields

                    // Refresh sections data if user is viewing sections
                    if (document.getElementById("sectionsContainer")) {
                      loadSectionsData();
                    }
                  } else {
                    // Check if error is related to duplicate section
                    const errorMsg = result.error || "Unknown error";
                    if (
                      errorMsg.toLowerCase().includes("section") ||
                      errorMsg.toLowerCase().includes("duplicate") ||
                      errorMsg.toLowerCase().includes("exists")
                    ) {
                      showDuplicateSectionModal(sectionName);
                    } else {
                      showNotification("Error: " + errorMsg, "error");
                    }
                  }
                })
                .catch((err) => {
                  showNotification("Submission failed: " + err, "error");
                });
            } else {
              showNotification("API not available.", "error");
            }
          }

          function showDuplicateSectionModal(sectionName) {
            const message = `Section "${sectionName}" already exists. Please use a different section name.`;

            // Show notification instead of modal
            showNotification(message, "error", 6000);

            // Focus on section name field after a short delay
            setTimeout(() => {
              const sectionNameInput = document.getElementById("sectionName");
              if (sectionNameInput) {
                sectionNameInput.focus();
                sectionNameInput.select();
              }
            }, 500);
          }
        }
      },
      300
    );
  });

// All Teachers sidebar link functionality
document
  .getElementById("allTeachersLink")
  .addEventListener("click", function (e) {
    e.preventDefault();

    // Set sidebar active state
    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
      link.classList.remove("active");
    });
    document.getElementById("allTeachersLink").classList.add("active");
    document.getElementById("teachersDropdownBtn").classList.add("active");

    // Replace main-content with All Teachers view (table design copied from students)
    const mainContent = document.querySelector(
      ".main-content .container-fluid"
    );
    if (mainContent) {
      mainContent.innerHTML = `
        <div class='row'>
          <div class='col-12'>
            <nav aria-label='breadcrumb' class='mb-3'>
              <ol class='breadcrumb app-breadcrumb'>
                <li class='breadcrumb-item'><a href='#' id='dashboardBreadcrumb'><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>
                <li class='breadcrumb-item'><a href='#' id='teachersBreadcrumb'><i class="bi bi-person-badge"></i><span>Teachers</span></a></li>
                <li class='breadcrumb-item active' aria-current='page'><i class='bi bi-people-fill'></i><span> All Teachers</span></li>
              </ol>
            </nav>
            <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
              <div class='d-flex justify-content-between align-items-center mb-4'>
                <h3 class='fw-bold mb-0'>
                  <i class='bi bi-person-badge text-primary me-2'></i>
                  All Teachers
                </h3>
                <button class='btn btn-primary' id='refreshTeachersBtn'>
                  <i class='bi bi-arrow-clockwise me-2'></i>Refresh
                </button>
              </div>
              <div class='alert alert-info d-flex align-items-center' role='alert'>
                <i class='bi bi-info-circle-fill me-2'></i>
                <div>
                  <strong>Information:</strong> This page displays all teachers. Use the search to find specific teachers.
                </div>
              </div>
              <div class='row mb-4' id='searchFilterSection'>
                <div class='col-md-12'>
                  <div class='input-group'>
                    <span class='input-group-text bg-light'>
                      <i class='bi bi-search text-primary'></i>
                    </span>
                    <input type='text' class='form-control' id='teacherSearchInput' placeholder='Search by name, ID, or section...' autocomplete='off'>
                    <button class='btn btn-outline-secondary' type='button' id='clearTeacherSearchBtn' title='Clear search'>
                      <i class='bi bi-x-lg'></i>
                    </button>
                  </div>
                </div>
              </div>
              <div id='teachersContainer'>
                <div class='table-responsive'>
                  <table class='table table-hover table-bordered align-middle mb-0'>
                    <thead class='table-dark'>
                      <tr>
                          <th scope='col' style='width: 5%;' class="text-center">#</th>
                          <th scope='col' style='width: 70%;'>
                              Name
                          </th>
                          <th scope='col' style='width: 15%;'>
                              Mobile No
                          </th>
                          <th scope='col' style='width: 5%;'>
                              Actions
                          </th>
                      </tr>
                    </thead>
                    <tbody id='teachersTableBody' class='table-body-surface'>
                      <!-- Teacher rows will be rendered here -->
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    renderAllTeachersList();
    // Attach search event listeners for real-time filtering
    document
      .getElementById("teacherSearchInput")
      .addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase().trim();
        const table = document.querySelector("#teachersContainer table");
        if (!table) return;
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
          const text = Array.from(row.querySelectorAll("td"))
            .map((td) => td.textContent.toLowerCase())
            .join(" ");
          row.style.display = text.includes(searchTerm) ? "" : "none";
        });
      });
    document.getElementById("clearTeacherSearchBtn").onclick = function () {
      document.getElementById("teacherSearchInput").value = "";
      renderAllTeachersList();
      document.getElementById("teacherSearchInput").focus();
    };
    document
      .getElementById("refreshTeachersBtn")
      .addEventListener("click", function () {
        renderAllTeachersList();
      });
  });
function loadAllTeachers() {
  const container = document.getElementById("teachersContainer");
  if (!container) return;

  container.innerHTML = `
    <div class='text-center py-4'>
      <div class='spinner-border text-primary' role='status'>
        <span class='visually-hidden'>Loading...</span>
      </div>
      <p class='mt-2 text-muted'>Loading teachers...</p>
    </div>
  `;

  if (!(window.api && window.api.getTeachers)) {
    container.innerHTML = `
      <div class='text-center py-5'>
        <i class='bi bi-x-circle display-1 text-danger mb-3'></i>
        <h5 class='text-danger'>API Not Available</h5>
        <p class='text-muted mb-4'>The teachers API is not available. Please check your system configuration.</p>
      </div>
    `;
    return;
  }

  window.api.getTeachers()
    .then(result => {
      if (!(result.success && Array.isArray(result.teachers))) {
        container.innerHTML = `
          <div class='text-center py-5'>
            <i class='bi bi-exclamation-triangle display-1 text-warning mb-3'></i>
            <h5 class='text-warning'>Error Loading Teachers</h5>
            <p class='text-muted mb-4'>${(result && result.error) || 'Failed to load teachers from the database.'}</p>
            <button class='btn btn-outline-primary' onclick='loadAllTeachers()'>
              <i class='bi bi-arrow-clockwise me-2'></i>Try Again
            </button>
          </div>
        `;
        return;
      }

      if (result.teachers.length === 0) {
        container.innerHTML = `
          <div class='text-center py-5'>
            <i class='bi bi-person-x display-1 text-muted mb-3'></i>
            <h5 class='text-muted'>No Teachers Found</h5>
            <p class='text-muted mb-4'>There are no teachers registered yet.</p>
            <button class='btn btn-primary' onclick='document.getElementById("addTeachersLink").click()'>
              <i class='bi bi-plus-lg me-2'></i>Add First Teacher
            </button>
          </div>
        `;
        return;
      }

      let teachersHtml = `<div class='row g-3'>`;

      result.teachers.forEach((teacher, index) => {
        const teacherObj = (typeof teacher === 'object') ? teacher : { name: teacher };
        const teacherName = teacherObj.name || 'Unknown Teacher';
        const teacherId = teacherObj.id || null;
        const teacherMobile = teacherObj.mobileNo || null;
        const teacherAddress = teacherObj.address || null;
        const teacherGender = teacherObj.gender || null;
        const dateOfJoining = teacherObj.dateOfJoining || null;
        const username = teacherObj.username || null;

        teachersHtml += `
          <div class='col-md-6 col-lg-4'>
            <div class='card h-100 border-0 shadow-sm'>
              <div class='card-body'>
                <div class='d-flex justify-content-between align-items-start mb-3'>
                  <h5 class='card-title mb-0 text-primary'>
                    <i class='bi bi-person-badge me-2'></i>${teacherName}
                  </h5>
                  <span class='badge bg-primary'>#${index + 1}</span>
                </div>
                ${(typeof teacher === 'object') ? `
                  <div class='mb-3'>
                    ${teacherMobile ? `<p class='card-text mb-1'><i class='bi bi-telephone text-muted me-2'></i><small class='text-muted'>Mobile:</small> ${teacherMobile}</p>` : ''}
                    ${teacherGender ? `<p class='card-text mb-1'><i class='bi bi-person text-muted me-2'></i><small class='text-muted'>Gender:</small> ${teacherGender}</p>` : ''}
                    ${teacherAddress ? `<p class='card-text mb-1'><i class='bi bi-geo-alt text-muted me-2'></i><small class='text-muted'>Address:</small> ${teacherAddress}</p>` : ''}
                    ${dateOfJoining ? `<p class='card-text mb-1'><i class='bi bi-calendar-check text-muted me-2'></i><small class='text-muted'>Joined:</small> ${new Date(dateOfJoining).toLocaleDateString()}</p>` : ''}
                    ${username ? `<p class='card-text mb-0'><i class='bi bi-person-circle text-muted me-2'></i><small class='text-muted'>Username:</small> <code>${username}</code></p>` : ''}
                  </div>
                ` : ''}
                <div class='d-flex gap-2'>
                  <button class='btn btn-outline-primary btn-sm flex-fill' onclick='viewTeacherDetails(\`${teacherId || teacherName}\`)' title='View details'>
                    <i class='bi bi-eye me-1'></i>View
                  </button>
                  <button class='btn btn-outline-secondary btn-sm' onclick='editTeacher(\`${teacherId || teacherName}\`)' title='Edit teacher'>
                    <i class='bi bi-pencil me-1'></i>Edit
                  </button>
                  <button class='btn btn-outline-danger btn-sm' onclick='confirmDeleteTeacher(\`${teacherName}\`, \`${teacherId || ''}\`, ${index})' title='Delete teacher'>
                    <i class='bi bi-trash me-1'></i>Del
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      teachersHtml += `</div>
        <div class='mt-4 text-center'>
          <p class='text-muted mb-0'>
            <i class='bi bi-info-circle me-1'></i>
            Total Teachers: <strong>${result.teachers.length}</strong>
          </p>
        </div>`;

      container.innerHTML = teachersHtml;
    })
    .catch(error => {
      console.error('Error loading teachers:', error);
      container.innerHTML = `
        <div class='text-center py-5'>
          <i class='bi bi-wifi-off display-1 text-danger mb-3'></i>
          <h5 class='text-danger'>Connection Error</h5>
          <p class='text-muted mb-4'>Unable to connect to the database. Please check your connection.</p>
          <button class='btn btn-outline-primary' onclick='loadAllTeachers()'>
            <i class='bi bi-arrow-clockwise me-2'></i>Retry
          </button>
        </div>
      `;
    });
}

document
  .getElementById("main-close-btn")
  .addEventListener("click", function () {
    if (window.api && window.api.closeWindow) {
      window.api.closeWindow();
    } else {
      window.close();
    }
  });
document
  .getElementById("main-minimize-btn")
  .addEventListener("click", function () {
    if (window.api && window.api.minimizeWindow) {
      window.api.minimizeWindow();
    }
  });
