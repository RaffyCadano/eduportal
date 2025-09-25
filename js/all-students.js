// (Removed legacy students submenu toggle code; handled by new sidebar component)
function renderAllStudentsList() {
  const container = document.getElementById("studentsContainer");
  if (!container) return;

  // Show loading spinner
  container.innerHTML = `
    <div class='text-center py-4'>
      <div class='spinner-border text-primary' role='status'>
        <span class='visually-hidden'>Loading...</span>
      </div>
      <p class='mt-2 text-muted'>Loading students...</p>
    </div>
  `;

  // Fetch students from backend
  if (window.api && window.api.getStudents) {
    window.api
      .getStudents()
      .then((result) => {
        if (result.success && Array.isArray(result.students)) {
          const students = result.students.slice();

          // Initialize pagination state
            window._allStudentsData = students;
            if (!window._studentsPageSize) window._studentsPageSize = 25;
            window._studentsCurrentPage = 1;

            // Table skeleton with pagination controls container
            container.innerHTML = `
              <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                <div class="d-flex align-items-center gap-2">
                  <label class="form-label mb-0 small text-muted">Rows per page:</label>
                  <select id="studentsPageSizeSelect" class="form-select form-select-sm" style="width:auto;">
                    <option value="10">10</option>
                    <option value="25" selected>25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div class="text-muted small" id="studentsRangeInfo"></div>
              </div>
              <div class='table-responsive'>
                <table class='table table-bordered table-hover mb-0' id='allStudentsTable'>
                  <thead class='table-dark'>
                    <tr>
                      <th scope='col' style='width:5%;' class='text-center'>#</th>
                      <th scope='col' style='width:55%;'>Name</th>
                      <th scope='col' style='width:10%;'>Grade</th>
                      <th scope='col' style='width:20%;'>Section</th>
                      <th scope='col' style='width:10%;'>Actions</th>
                    </tr>
                  </thead>
                  <tbody id='allStudentsTbody'></tbody>
                </table>
              </div>
              <div class='d-flex justify-content-between align-items-center flex-wrap gap-2 border-top py-2 mt-2'>
                <div class='pagination mb-0' id='studentsPagination'></div>
                <div class='text-muted small'>Total Students: <strong id='studentsTotalCount'>${students.length}</strong></div>
              </div>
            `;

            // Attach page size change listener
            const pageSizeSelect = document.getElementById('studentsPageSizeSelect');
            pageSizeSelect.addEventListener('change', () => {
              window._studentsPageSize = parseInt(pageSizeSelect.value, 10) || 25;
              window._studentsCurrentPage = 1;
              renderStudentsPage();
            });

            // Render first page (will show in-table empty state if list is empty)
            renderStudentsPage();
        } else {
          container.innerHTML =
            "<div class='text-danger text-center py-4'>Failed to load students.</div>";
        }
      })
      .catch(() => {
        container.innerHTML =
          "<div class='text-danger text-center py-4'>Error loading students.</div>";
      });
  } else {
    container.innerHTML =
      "<div class='text-danger text-center py-4'>Student API not available.</div>";
  }
}

// Helper: build a single student row (used by pagination renderer)
function buildStudentRow(student, displayIndex, absoluteIndex) {
  const safeName = (student.name || '').replace(/'/g, "&#39;");
  const hasPic = !!student.profilePictureUrl;
  const initial = (student.name || '?').charAt(0).toUpperCase();
  const imgHtml = hasPic
    ? `<img src="${student.profilePictureUrl}" alt="${safeName}" class="student-avatar-img" onerror="this.onerror=null;this.style.display='none';const f=this.parentElement.querySelector('.avatar-fallback'); if(f) f.style.display='flex';" />`
    : '';
  return `
    <tr class="align-middle text-center">
      <td class="text-muted fw-bold">${displayIndex}</td>
      <td class="text-start">
        <div class="d-flex justify-content-start align-items-center">
          <div class="student-avatar-wrapper position-relative me-3" style="width:40px;height:40px;">
            <div class="avatar-fallback bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style="width:40px;height:40px;font-size:14px;font-weight:bold;${hasPic ? 'display:none;' : ''}">${initial}</div>
            ${imgHtml}
          </div>
          <div class="d-flex flex-column align-items-start">
            <div class="fw-semibold">${student.name || 'Unnamed Student'}</div>
            <small class="text-muted">${student.registrationNo || ''}</small>
          </div>
        </div>
      </td>
      <td>${student.grade || student.gradeLevel || ''}</td>
      <td class="text-start">${student.section || 'Unassigned'}</td>
      <td>
        <div class="dropdown d-flex justify-content-center">
          <button class="btn btn-light btn-sm" type="button" id="studentActionsDropdown${student.id}" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="studentActionsDropdown${student.id}">
            <li><a class="dropdown-item" href="#" onclick="viewStudentDetails('${student.id}','${safeName}')"><i class="bi bi-eye me-2"></i>View Details</a></li>
            <li><a class="dropdown-item" href="#" onclick="editStudent('${student.id}')"><i class="bi bi-pencil me-2"></i>Edit Student</a></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="confirmDeleteStudent('${safeName}','${student.id}','${absoluteIndex}')"><i class="bi bi-trash me-2"></i>Delete</a></li>
          </ul>
        </div>
      </td>
    </tr>`;
}

// Render current page of students
function renderStudentsPage() {
  const data = window._allStudentsData || [];
  const pageSize = window._studentsPageSize || 25;
  const currentPage = window._studentsCurrentPage || 1;
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (window._studentsCurrentPage > totalPages) window._studentsCurrentPage = totalPages;
  const startIdx = (window._studentsCurrentPage - 1) * pageSize;
  const pageItems = data.slice(startIdx, startIdx + pageSize);

  const tbody = document.getElementById('allStudentsTbody');
  if (!tbody) return;
  // Empty state inside table when there are no students at all
  if (total === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5">
          <div class="d-flex flex-column align-items-center">
            <i class="bi bi-people text-muted" style="font-size:2.2rem;"></i>
            <h6 class="mt-2 mb-1">No students found</h6>
            <p class="text-muted small mb-3">Add your first student to get started.</p>
            <button class="btn btn-primary" id="tableEmptyAddStudentBtn">
              <i class="bi bi-person-plus me-2"></i>Add Student
            </button>
          </div>
        </td>
      </tr>`;
    const cta = document.getElementById('tableEmptyAddStudentBtn');
    if (cta) cta.addEventListener('click', () => {
      const link = document.getElementById('addStudentLink');
      if (link) link.click();
    });
    // Update range info & pagination for empty
    const rangeInfo = document.getElementById('studentsRangeInfo');
    if (rangeInfo) rangeInfo.textContent = 'Showing 0-0 of 0';
    const pagEl = document.getElementById('studentsPagination');
    if (pagEl) pagEl.innerHTML = '<div class="small text-muted">Page 1 of 1</div>';
    const totalEl = document.getElementById('studentsTotalCount');
    if (totalEl) totalEl.textContent = '0';
    return;
  }
  let rows = '';
  pageItems.forEach((student, i) => {
    rows += buildStudentRow(student, startIdx + i + 1, startIdx + i);
  });
  tbody.innerHTML = rows || `<tr><td colspan="5" class="text-center text-muted py-4">No students on this page.</td></tr>`;

  // Range info
  const rangeInfo = document.getElementById('studentsRangeInfo');
  if (rangeInfo) {
    const from = total === 0 ? 0 : startIdx + 1;
    const to = Math.min(startIdx + pageSize, total);
    rangeInfo.textContent = `Showing ${from}-${to} of ${total}`;
  }

  // Pagination controls
  const pagEl = document.getElementById('studentsPagination');
  if (pagEl) {
    pagEl.innerHTML = buildStudentsPaginationControls(totalPages, window._studentsCurrentPage);
    // Attach listeners
    pagEl.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = parseInt(e.currentTarget.getAttribute('data-page'), 10);
        if (!isNaN(target) && target >= 1 && target <= totalPages && target !== window._studentsCurrentPage) {
          window._studentsCurrentPage = target;
          renderStudentsPage();
        }
      });
    });
  }
}

function buildStudentsPaginationControls(totalPages, currentPage) {
  if (totalPages <= 1) return '<div class="small text-muted">Page 1 of 1</div>';
  const parts = [];
  function btn(label, page, disabled = false, active = false) {
    return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'} me-1 mb-1" data-page="${page}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  }
  // First & Prev
  parts.push(btn('«', 1, currentPage === 1));
  parts.push(btn('‹', Math.max(1, currentPage - 1), currentPage === 1));
  // Page window (max 5 pages around current)
  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > totalPages) { end = totalPages; start = Math.max(1, end - windowSize + 1); }
  if (start > 1) parts.push('<span class="mx-1">...</span>');
  for (let p = start; p <= end; p++) {
    parts.push(btn(p, p, false, p === currentPage));
  }
  if (end < totalPages) parts.push('<span class="mx-1">...</span>');
  // Next & Last
  parts.push(btn('›', Math.min(totalPages, currentPage + 1), currentPage === totalPages));
  parts.push(btn('»', totalPages, currentPage === totalPages));
  return parts.join('');
}
function confirmDeleteStudent(studentName, studentId, studentIndex) {
  // Close any existing modals first
  // Create confirmation modal
  const modalHtml = `
                <div class="modal fade" id="deleteStudentModal" tabindex="-1" aria-labelledby="deleteStudentModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-danger text-white">
                                <h5 class="modal-title" id="deleteStudentModalLabel">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                    Delete Student
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" style="max-height:75vh; overflow-y:auto;">
                                <div class="alert alert-warning d-flex align-items-center" role="alert">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>
                                        <strong>Warning!</strong> This action cannot be undone.
                                    </div>
                                </div>
                                <p>Are you sure you want to delete the student:</p>
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6 class="card-title mb-1">
                                            <i class="bi bi-person-circle me-2"></i>${studentName}
                                        </h6>
                                        ${
                                          studentId
                                            ? `<small class="text-muted">ID: ${studentId}</small>`
                                            : ""
                                        }
                                    </div>
                                </div>
                                <p class="mt-3 mb-0 text-muted">This action will:</p>
                                <ul class="text-muted small">
                                    <li>Permanently delete the student from the database</li>
                                    <li>Remove all student data and relationships</li>
                                    <li>Clean up all related records</li>
                                </ul>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-lg me-1"></i>Cancel
                                </button>
                                <button type="button" class="btn btn-danger" onclick="deleteStudent(\`${studentName}\`, \`${studentId}\`, ${studentIndex})" data-bs-dismiss="modal">
                                    <i class="bi bi-trash-fill me-1"></i>Delete Student
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // Remove existing modal if present
  const existingModal = document.getElementById("deleteStudentModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  setTimeout(() => {
    const modal = document.getElementById("deleteStudentModal");
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();

      // Remove modal from DOM when hidden
      modal.addEventListener("hidden.bs.modal", function () {
        modal.remove();
      });
    }
  }, 100);
}

function deleteStudent(studentName, studentId, studentIndex) {
  // Show loading notification
  showNotification("Deleting student and related data...", "info", 3000);

  if (window.api && window.api.deleteEntity) {
    // Use the proper deleteEntity API
    const deleteData = { name: studentName };
    if (studentId) {
      deleteData.id = studentId;
    }

    window.api
      .deleteEntity({ type: "students", data: deleteData })
      .then((result) => {
        if (result.success) {
          // Show detailed success message
          const message =
            result.message || `Student "${studentName}" deleted successfully!`;
          showNotification(message, "success", 6000);

          // Show additional info about related data updates
          if (result.sectionsUpdated) {
            setTimeout(() => {
              showNotification(
                `Updated ${result.sectionsUpdated} section(s)`,
                "info",
                4000
              );
            }, 2000);
          }

          // Reload the students to reflect changes
          renderAllStudentsList();
        } else {
          const errorMsg = result.error || "Unknown error occurred";
          showNotification(
            `Error deleting student: ${errorMsg}`,
            "error",
            6000
          );
        }
      })
      .catch((error) => {
        showNotification(`Failed to delete student: ${error}`, "error", 6000);
        console.error("Error deleting student:", error);
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
document
  .getElementById("allStudentsLink")
  .addEventListener("click", function (e) {
    e.preventDefault();

    // Set sidebar active state
    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
      link.classList.remove("active");
    });
    this.classList.add("active");
    document.getElementById("studentsDropdownBtn").classList.add("active");
    // Load all students view
    const mainContent = document.querySelector(
      ".main-content .container-fluid"
    );
    if (mainContent) {
      mainContent.innerHTML = `
          <div class='row'>
            <div class='col-12'>
              <!-- Example Breadcrumb for All Students Page -->
              <nav aria-label="breadcrumb" class="mb-3">
                <ol class="breadcrumb app-breadcrumb">
                  <li class="breadcrumb-item">
                    <a href="#" id="dashboardBreadcrumb" class="text-primary fw-semibold">
                      <i class="bi bi-house-door-fill me-1"></i>Dashboard
                    </a>
                  </li>
                  <li class="breadcrumb-item">
                    <a href="#" id="studentsBreadcrumb" class="text-primary fw-semibold">
                      <i class="bi bi-people-fill me-1"></i>Students
                    </a>
                  </li>
                  <li class="breadcrumb-item active fw-bold text-dark" aria-current="page">
                    <i class="bi bi-list-ul me-1"></i> All Students
                  </li>
                </ol>
              </nav>
              <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
                <div class='d-flex justify-content-between align-items-center mb-4'>
                  <h3 class='fw-bold mb-0'>
                    <i class='bi bi-people-fill text-primary me-2'></i>
                    All Students
                  </h3>
                  <button class='btn btn-primary' id='refreshStudentsBtn'>
                    <i class='bi bi-arrow-clockwise me-2'></i>Refresh
                  </button>
                </div>
                <div class='alert alert-info d-flex align-items-center' role='alert'>
                  <i class='bi bi-info-circle-fill me-2'></i>
                  <div>
                    <strong>Information:</strong> This page displays all students. Use the search and filter options to find specific students.
                  </div>
                </div>
                <!-- Search and Filter Section -->
                <div class='row mb-4' id='searchFilterSection'>
                  <div class='col-md-12'>
                    <div class='input-group'>
                      <span class='input-group-text bg-light'>
                        <i class='bi bi-search text-primary'></i>
                      </span>
                      <input type='text' 
                             class='form-control' 
                             id='studentSearchInput'
                             placeholder='Search by name, registration no, or section...'
                             autocomplete='off'>
                      <button class='btn btn-outline-secondary' 
                              type='button' 
                              id='clearStudentSearchBtn'
                              title='Clear search'>
                        <i class='bi bi-x-lg'></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div id='studentsContainer'>
                  <div class='table-responsive'>
                    <table class='table table-hover align-middle mb-0' style='border-radius:1em;'>
                      <thead class='table-dark text-white'>
                        <tr>
                          <th scope='col' class='fw-semibold' style='font-size:1.05em;'>
                            <i class='bi bi-person me-2'></i>Name
                          </th>
                          <th scope='col' class='fw-semibold' style='font-size:1.05em;'>
                            <i class='bi bi-card-list me-2'></i>Registration No
                          </th>
                          <th scope='col' class='fw-semibold' style='font-size:1.05em;'>
                            <i class='bi bi-mortarboard me-2'></i>Grade
                          </th>
                          <th scope='col' class='fw-semibold' style='font-size:1.05em;'>
                            <i class='bi bi-diagram-3 me-2'></i>Section
                          </th>
                          <th scope='col' class='fw-semibold text-center' style='font-size:1.05em;'>
                            <i class='bi bi-eye me-2'></i>Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody id='studentsTableBody' class='table-body-surface'>
                        <!-- Student rows will be rendered here -->
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
    }
    renderAllStudentsList();
    // Attach this after rendering the table and search input
    document
      .getElementById("studentSearchInput")
      .addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase().trim();
        const table = document.querySelector("#studentsContainer table");
        if (!table) return;
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
          // Combine all searchable columns
          const text = Array.from(row.querySelectorAll("td"))
            .map((td) => td.textContent.toLowerCase())
            .join(" ");
          row.style.display = text.includes(searchTerm) ? "" : "none";
        });
      });
  });
// Helper: Remove undefined properties
function cleanStudentData(data) {
  const cleaned = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) cleaned[key] = data[key];
  });
  return cleaned;
}

// Add Student sidebar link handler
document
  .getElementById("addStudentLink")
  .addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
      link.classList.remove("active");
    });
    document.getElementById("addStudentLink").classList.add("active");
    document.getElementById("studentsDropdownBtn").classList.add("active");

    const mainContent = document.querySelector(
      ".main-content .container-fluid"
    );
    if (mainContent) {
      mainContent.innerHTML = `
      <div class='row'>
        <div class='col-12'>
          <nav aria-label='breadcrumb' class='mb-3'>
            <ol class='breadcrumb app-breadcrumb'>
              <li class='breadcrumb-item'>
                <a href='#' id='dashboardBreadcrumb'><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a>
              </li>
              <li class='breadcrumb-item'>
                <a href='#' id='studentsBreadcrumb'><i class="bi bi-people-fill"></i><span>Students</span></a>
              </li>
              <li class='breadcrumb-item active' aria-current='page'><i class='bi bi-person-plus-fill'></i><span> Add Student</span></li>
            </ol>
          </nav>
          <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
            <h3 class='fw-bold mb-4 text-center'>Admission Form</h3>
            <div class='mb-3 text-center'>
              <span style='color:#1976d2; font-weight:500;'>* Blue label: Required field</span>
              <span style='color:#888; margin-left:16px;'>Grey label: Optional field</span>
            </div>
            <form id='studentAdmissionForm'>
              <h5 class='fw-semibold mb-3 mt-2'>1. Student Information</h5>
              <div class='row g-3 mb-3'>
                <div class='col-md-6'>
                  <label for='studentName' class='form-label' style='color:#1976d2;'>Student Name *</label>
                  <input type='text' class='form-control' id='studentName' required>
                </div>
                <div class='col-md-6'>
                  <label for='registrationNo' class='form-label' style='color:#1976d2;'>Registration No *</label>
                  <input type='text' class='form-control' id='registrationNo' required>
                </div>
                <div class='col-md-6'>
                  <label for='gradeLevel' class='form-label' style='color:#1976d2;'>Grade Level *</label>
                  <select class='form-select' id='gradeLevel' required>
                    <option value=''>Select Grade</option>
                    <option value='7'>Grade 7</option>
                    <option value='8'>Grade 8</option>
                    <option value='9'>Grade 9</option>
                    <option value='10'>Grade 10</option>
                  </select>
                </div>
                <div class='col-md-6'>
                  <label for='dob' class='form-label' style='color:#1976d2;'>Date of Birth *</label>
                  <input type='date' class='form-control' id='dob' required>
                </div>
                <div class='col-md-6'>
                  <label for='admissionDate' class='form-label' style='color:#1976d2;'>Date of Admission *</label>
                  <input type='date' class='form-control' id='admissionDate' required>
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
                <!-- Section dropdown removed -->
              </div>
              <h5 class='fw-semibold mb-3 mt-4'>2. Other Information</h5>
              <div class='row g-3 mb-3'>
                <div class='col-md-6'>
                  <label for='profilePicture' class='form-label' style='color:#888;'>Profile Picture</label>
                  <input type='file' class='form-control' id='profilePicture' accept='image/*'>
                  <div class='mt-2 d-flex align-items-center gap-3' id='profilePicPreviewWrapper' style='display:none;'>
                    <img id='profilePicPreview' alt='Preview' style='width:72px;height:72px;object-fit:cover;border-radius:12px;border:1px solid #ccc;'>
                    <div class='small text-muted flex-grow-1'>
                      <div id='profilePicMeta'></div>
                      <button type='button' class='btn btn-sm btn-outline-danger mt-1' id='removeProfilePicBtn'>Remove</button>
                    </div>
                  </div>
                  <small class='text-muted d-block mt-1'>JPEG/PNG up to 1MB. Automatically resized to max 256x256.</small>
                </div>
                <div class='col-md-6'>
                  <label for='studentMobile' class='form-label' style='color:#888;'>Mobile No.</label>
                  <input type='tel' class='form-control' id='studentMobile'>
                </div>
                <div class='col-md-6'>
                  <label for='address' class='form-label' style='color:#888;'>Address</label>
                  <input type='text' class='form-control' id='address'>
                </div>
                <div class='col-md-6'>
                  <label for='religion' class='form-label' style='color:#888;'>Religion</label>
                  <input type='text' class='form-control' id='religion'>
                </div>
                <div class='col-md-6'>
                  <label for='previousSchool' class='form-label' style='color:#888;'>Previous School</label>
                  <input type='text' class='form-control' id='previousSchool'>
                </div>
                <div class='col-md-6'>
                  <label for='birthOrder' class='form-label' style='color:#888;'>Birth Order (for twins/multiples)</label>
                  <select class='form-select' id='birthOrder'>
                    <option value=''>Not applicable</option>
                    <option value='Single'>Single birth</option>
                    <option value='First Twin'>First Twin</option>
                    <option value='Second Twin'>Second Twin</option>
                    <option value='First Triplet'>First Triplet</option>
                    <option value='Second Triplet'>Second Triplet</option>
                    <option value='Third Triplet'>Third Triplet</option>
                  </select>
                </div>
                <div class='col-md-6'>
                  <label for='siblingRegNo' class='form-label' style='color:#888;'>Sibling Registration No. (if any)</label>
                  <input type='text' class='form-control' id='siblingRegNo' placeholder='Enter sibling registration number'>
                </div>
                <div class='col-md-12'>
                  <label for='medicalNotes' class='form-label' style='color:#888;'>Medical/Special Notes</label>
                  <textarea class='form-control' id='medicalNotes' rows='2' placeholder='Any medical conditions, allergies, or special requirements'></textarea>
                </div>
              </div>
              <h5 class='fw-semibold mb-3 mt-4'>3. Father/Guardian Information</h5>
              <div class='row g-3 mb-3'>
                <div class='col-md-6'>
                  <label for='fatherName' class='form-label' style='color:#888;'>Father Name</label>
                  <input type='text' class='form-control' id='fatherName'>
                </div>
                <div class='col-md-6'>
                  <label for='fatherOccupation' class='form-label' style='color:#888;'>Occupation</label>
                  <input type='text' class='form-control' id='fatherOccupation'>
                </div>
                <div class='col-md-6'>
                  <label for='fatherEducation' class='form-label' style='color:#888;'>Education</label>
                  <input type='text' class='form-control' id='fatherEducation'>
                </div>
                <div class='col-md-6'>
                  <label for='fatherMobile' class='form-label' style='color:#888;'>Mobile No.</label>
                  <input type='tel' class='form-control' id='fatherMobile'>
                </div>
              </div>
              <h5 class='fw-semibold mb-3 mt-4'>4. Mother Information</h5>
              <div class='row g-3 mb-4'>
                <div class='col-md-6'>
                  <label for='motherName' class='form-label' style='color:#888;'>Mother Name</label>
                  <input type='text' class='form-control' id='motherName'>
                </div>
                <div class='col-md-6'>
                  <label for='motherOccupation' class='form-label' style='color:#888;'>Occupation</label>
                  <input type='text' class='form-control' id='motherOccupation'>
                </div>
                <div class='col-md-6'>
                  <label for='motherEducation' class='form-label' style='color:#888;'>Education</label>
                  <input type='text' class='form-control' id='motherEducation'>
                </div>
                <div class='col-md-6'>
                  <label for='motherMobile' class='form-label' style='color:#888;'>Mobile No.</label>
                  <input type='tel' class='form-control' id='motherMobile'>
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

      // Attach submit & profile picture handlers after rendering the form
      setTimeout(() => {
        const form = document.getElementById("studentAdmissionForm");
        const fileInput = document.getElementById('profilePicture');
        const previewWrapper = document.getElementById('profilePicPreviewWrapper');
        const previewImg = document.getElementById('profilePicPreview');
        const metaDiv = document.getElementById('profilePicMeta');
        const removeBtn = document.getElementById('removeProfilePicBtn');
        // Will hold processed (resized) data URL
        let processedProfilePic = null;

        function resetPreview() {
          processedProfilePic = null;
          if (previewWrapper) previewWrapper.style.display = 'none';
          if (fileInput) fileInput.value = '';
        }

        function dataURLSize(dataURL) {
          // Rough byte length from base64 (ignore headers)
          if (!dataURL) return 0;
            const head = dataURL.indexOf(',');
            const b64 = head > -1 ? dataURL.substring(head + 1) : dataURL;
            return Math.ceil((b64.length * 3) / 4);
        }

        async function resizeImage(file, maxDim = 256) {
          return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
              let { width, height } = img;
              if (width > maxDim || height > maxDim) {
                const scale = Math.min(maxDim / width, maxDim / height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
              }
              const canvas = document.createElement('canvas');
              canvas.width = width; canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(blob => {
                if (!blob) { reject('Blob conversion failed'); return; }
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              }, 'image/jpeg', 0.85);
            };
            img.onerror = reject;
            img.src = url;
          });
        }

        if (fileInput) {
          fileInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) { resetPreview(); return; }
            if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
              showNotification('Unsupported image type. Use JPG or PNG.', 'error');
              resetPreview();
              return;
            }
            if (file.size > 1024 * 1024) { // >1MB
              showNotification('Image too large (max 1MB before processing).', 'error');
              resetPreview();
              return;
            }
            try {
              processedProfilePic = await resizeImage(file, 256);
              const sizeKb = Math.round(dataURLSize(processedProfilePic) / 1024);
              if (previewImg) previewImg.src = processedProfilePic;
              if (metaDiv) metaDiv.innerHTML = `<span class='badge bg-primary-subtle text-primary-emphasis border border-primary-subtle'>${file.type.replace('image/','').toUpperCase()}</span> <span class='ms-1 small text-muted'>~${sizeKb} KB</span>`;
              if (previewWrapper) previewWrapper.style.display = 'flex';
            } catch (err) {
              console.error('Image processing failed', err);
              showNotification('Failed to process image.', 'error');
              resetPreview();
            }
          });
        }
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            resetPreview();
          });
        }

        if (form) {
          form.addEventListener("submit", function (ev) {
            ev.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            let originalHtml;
            if (submitBtn) {
              originalHtml = submitBtn.innerHTML;
              submitBtn.disabled = true;
              submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...`;
            }
            function generateUsernameFromName(fullName) {
              const words = fullName.trim().split(/\s+/);
              if (words.length === 0) return "";
              const lastName = words[words.length - 1].toLowerCase();
              const initials = words
                .slice(0, 2)
                .map((w) => w[0].toLowerCase())
                .join("");
              return lastName + initials;
            }
            function generateRandomPassword(length = 8) {
              const chars =
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
              let pwd = "";
              for (let i = 0; i < length; i++) {
                pwd += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              return pwd;
            }
            // Collect form data
            const studentName = form.studentName.value.trim();
            // Generate username from name
            const username = generateUsernameFromName(studentName);
            const studentData = {
              name: form.studentName.value.trim(),
              username: username,
              password: generateRandomPassword(10), // Generate a random 10-char password
              registrationNo: form.registrationNo.value.trim(),
              gradeLevel: form.gradeLevel.value,
              dob: form.dob.value,
              admissionDate: form.admissionDate.value,
              gender: form.gender.value,
              profilePicture: processedProfilePic || undefined,
              studentMobile: form.studentMobile.value.trim() || undefined,
              address: form.address.value.trim() || undefined,
              religion: form.religion.value.trim() || undefined,
              previousSchool: form.previousSchool.value.trim() || undefined,
              birthOrder: form.birthOrder.value || undefined,
              siblingRegNo: form.siblingRegNo.value.trim() || undefined,
              medicalNotes: form.medicalNotes.value.trim() || undefined,
              fatherName: form.fatherName.value.trim() || undefined,
              fatherOccupation: form.fatherOccupation.value.trim() || undefined,
              fatherEducation: form.fatherEducation.value.trim() || undefined,
              fatherMobile: form.fatherMobile.value.trim() || undefined,
              motherName: form.motherName.value.trim() || undefined,
              motherOccupation: form.motherOccupation.value.trim() || undefined,
              motherEducation: form.motherEducation.value.trim() || undefined,
              motherMobile: form.motherMobile.value.trim() || undefined,
            };

            // Clean data to remove undefined properties
            const cleanedData = cleanStudentData(studentData);

            // Submit student data (checks for duplicate registration)
            submitStudentData(cleanedData, form, submitBtn, originalHtml);
          });
        }
      }, 100);
    }
  });

function submitStudentData(data, form, submitBtn, originalHtml) {
  if (window.api && window.api.getStudents) {
    window.api
      .getStudents()
      .then((result) => {
        if (result.success && Array.isArray(result.students)) {
          const newRegNo = data.registrationNo.toString().trim().toLowerCase();
          const existingStudent = result.students.find((student) => {
            const existingRegNo = (student.registrationNo || "")
              .toString()
              .trim()
              .toLowerCase();
            return existingRegNo === newRegNo;
          });
          if (existingStudent) {
            showNotification(
              `A student with registration number ${data.registrationNo} already exists.`,
              "error"
            );
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalHtml;
            }
            return;
          }
        }
        // If no duplicate found, proceed with creation
        createStudent(data, form, submitBtn, originalHtml);
      })
      .catch((err) => {
        showNotification(
          "Warning: Student with this registration number may already exist. Please verify before proceeding.",
          "error",
          6000
        );
        createStudent(data, form, submitBtn, originalHtml);
      });
  } else {
    showNotification(
      "Warning: Registration validation not available. Proceeding with student creation.",
      "info",
      6000
    );
    createStudent(data, form, submitBtn, originalHtml);
  }
}
function createStudent(data, form, submitBtn, originalHtml) {
  if (window.api && window.api.createEntity) {
    const cleanedData = cleanStudentData(data);
    window.api
      .createEntity({ type: "students", data: cleanedData })
      .then((result) => {
        if (result && result.success) {
          let message = result.username && result.username !== data.username
              ? `Student admission submitted successfully! Generated username: ${result.username}`
              : "Student admission submitted successfully!";
          if (result.profilePictureUrl) {
            message += " Profile picture stored.";
          }
          showNotification(message, "success");
          if (form) form.reset();
        } else {
          const errorMsg =
            result && result.error ? result.error : "Unknown error";
          showNotification("Error: " + errorMsg, "error");
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHtml;
        }
      })
      .catch((err) => {
        showNotification(
          "Submission failed: " + (err && err.message ? err.message : err),
          "error"
        );
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHtml;
        }
      });
  } else {
    showNotification("API not available.", "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}
document
  .getElementById("manageLoginLink")
  .addEventListener("click", function (e) {
    e.preventDefault();

    // Set sidebar active state
    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
      link.classList.remove("active");
    });
    document.getElementById("manageLoginLink").classList.add("active");
    document.getElementById("studentsDropdownBtn").classList.add("active");

    // Replace main-content with Student Login Management view
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
                  <li class='breadcrumb-item'><a href='#' id='studentsBreadcrumb'><i class="bi bi-people-fill"></i><span>Students</span></a></li>
                  <li class='breadcrumb-item active' aria-current='page'><i class='bi bi-key-fill'></i><span> Manage Login</span></li>
                </ol>
              </nav>
                            <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
                                <div class='d-flex justify-content-between align-items-center mb-4'>
                                    <h3 class='fw-bold mb-0'>
                                        <i class='bi bi-key-fill text-primary me-2'></i>
                                        Student Login Management
                                    </h3>
                                    <button class='btn btn-primary' id='refreshCredentialsBtn'>
                                        <i class='bi bi-arrow-clockwise me-2'></i>Refresh
                                    </button>
                                </div>
                                <div class='alert alert-info d-flex align-items-center' role='alert'>
                                    <i class='bi bi-info-circle-fill me-2'></i>
                                    <div>
                                        <strong>Information:</strong> This page displays student login credentials. Passwords are hidden by default for security. Click the eye icon to reveal passwords.
                                    </div>
                                </div>
                                <!-- Search and Filter Section -->
                                <div class='row mb-4' id='searchFilterSection' style='display: none;'>
                                    <div class='col-md-12'>
                                        <div class='input-group'>
                                            <span class='input-group-text bg-light'>
                                                <i class='bi bi-search text-primary'></i>
                                            </span>
                                            <input type='text' 
                                                   class='form-control' 
                                                   id='credentialSearchInput'
                                                   placeholder='Search by name, username, or account type...'
                                                   autocomplete='off'>
                                            <button class='btn btn-outline-secondary' 
                                                    type='button' 
                                                    id='clearSearchBtn'
                                                    title='Clear search'>
                                                <i class='bi bi-x-lg'></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div id='credentialsContainer'>
                                    <div class='text-center py-4'>
                                        <div class='spinner-border text-primary' role='status'>
                                            <span class='visually-hidden'>Loading...</span>
                                        </div>
                                        <p class='mt-2 text-muted'>Loading student credentials...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

      // Load credentials data
      loadStudentCredentials();

      // Add refresh button functionality
      document
        .getElementById("refreshCredentialsBtn")
        .addEventListener("click", function () {
          loadStudentCredentials();
        });
    }
  });

// Student Management Functions
// Global variable to store current section for student management
let currentManagedSection = null;

function manageStudents(sectionName, sectionData) {
  // Parse section data if it's a string
  let section = sectionName;
  if (typeof sectionData === "string") {
    try {
      section = JSON.parse(sectionData.replace(/&quot;/g, '"'));
    } catch (e) {
      console.error("Error parsing section data:", e);
      section = { name: sectionName };
    }
  } else if (typeof sectionData === "object") {
    section = sectionData;
  } else {
    section = { name: sectionName };
  }

  const actualSectionName = section.name || sectionName;

  // Store current section for use in confirmation functions
  currentManagedSection = section;
  // Close all existing modals to prevent stacking
  // Create student management modal
  const modalHtml = `
                <div class="modal fade" id="studentManagementModal" tabindex="-1" aria-labelledby="studentManagementModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title" id="studentManagementModalLabel">
                                    <i class="bi bi-people me-2"></i>
                                    Manage Students - ${actualSectionName}${
    section.gradeLevel ? ` (Grade ${section.gradeLevel})` : ""
  }
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card h-100">
                                            <div class="card-header bg-primary text-white">
                                                <h6 class="mb-0"><i class="bi bi-people-fill me-2"></i>Students in ${actualSectionName}</h6>
                                            </div>
                                            <div class="card-body" style="display:flex; flex-direction:column; height:60vh;">
                                                <!-- Search bar for assigned students -->
                                                <div class="mb-3">
                                                    <div class="input-group input-group-sm">
                                                        <span class="input-group-text bg-primary text-white border-primary">
                                                            <i class="bi bi-search"></i>
                                                        </span>
                                                        <input type="text" class="form-control border-primary" id="assignedStudentsSearch" placeholder="Search by name, ID, or grade..." onkeyup="filterAssignedStudents()" onfocus="this.select()">
                                                        <button class="btn btn-outline-primary btn-sm" type="button" onclick="clearAssignedSearch()" title="Clear search">
                                                            <i class="bi bi-x-lg"></i>
                                                        </button>
                                                    </div>
                                                    <small class="text-muted mt-1 d-block"><i class="bi bi-info-circle me-1"></i>Search by student name, registration ID, or grade level</small>
                                                </div>
                                                <div id="assignedStudentsContainer" style="max-height:50vh;overflow-y:auto;flex-grow:1;">
                                                    <div class="text-center py-4">
                                                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                                                            <span class="visually-hidden">Loading...</span>
                                                        </div>
                                                        <p class="mt-2 text-muted small">Loading assigned students...</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card h-100">
                                            <div class="card-header bg-info text-white">
                                                <h6 class="mb-0"><i class="bi bi-person-plus me-2"></i>Available Students</h6>
                                            </div>
                                            <div class="card-body" style="display:flex; flex-direction:column; height:50vh;">
                                                <!-- Search bar for available students -->
                                                <div class="mb-3">
                                                    <div class="input-group input-group-sm">
                                                        <span class="input-group-text bg-info text-white border-info">
                                                            <i class="bi bi-search"></i>
                                                        </span>
                                                        <input type="text" class="form-control border-info" id="availableStudentsSearch" placeholder="Search by name, ID, grade, or section...">
                                                        <button class="btn btn-outline-info btn-sm" type="button" onclick="clearAvailableSearch()" title="Clear search">
                                                            <i class="bi bi-x-lg"></i>
                                                        </button>
                                                    </div>
                                                    <small class="text-muted mt-1 d-block"><i class="bi bi-info-circle me-1"></i>Search by name, ID, grade, or current section</small>
                                                </div>
                                                <div id="availableStudentsContainer" style="max-height:60vh;overflow-y:auto;flex-grow:1;">
                                                    <div class="text-center py-4">
                                                        <div class="spinner-border spinner-border-sm text-info" role="status">
                                                            <span class="visually-hidden">Loading...</span>
                                                        </div>
                                                        <p class="mt-2 text-muted small">Loading available students...</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-lg me-1"></i>Close
                                </button>
                                <button type="button" class="btn btn-success" onclick="refreshStudentManagement('${actualSectionName}', ${JSON.stringify(
    section
  ).replace(/"/g, "&quot;")})">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // Remove existing modal if present
  const existingModal = document.getElementById("studentManagementModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  setTimeout(() => {
    const modal = document.getElementById("studentManagementModal");
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();

      // Load student data
      loadStudentManagementData(actualSectionName, section);

      // Attach search listeners (assigned already uses inline onkeyup; ensure available wired here)
      const availableSearch = document.getElementById('availableStudentsSearch');
      if (availableSearch) {
        availableSearch.addEventListener('input', () => {
          filterAvailableStudents();
        });
      }
    }
  }, 100);
}

function loadStudentManagementData(sectionName, section) {
  if (!window.api || !window.api.getStudents) {
    console.error("Students API not available");
    return;
  }

  window.api
    .getStudents()
    .then((result) => {
      if (result.success && Array.isArray(result.students)) {
        // Get section grade level for filtering
        const sectionGrade =
          section && section.gradeLevel ? section.gradeLevel.toString() : null;

        // Separate assigned and available students
        const assignedStudents = result.students.filter(
          (student) => student.section === sectionName
        );

        // Filter available students by grade level if section has a grade
        let availableStudents = result.students.filter(
          (student) => !student.section || student.section !== sectionName
        );

        if (sectionGrade) {
          // Only show students with matching grade level
          availableStudents = availableStudents.filter((student) => {
            const studentGrade = (
              student.grade ||
              student.gradeLevel ||
              ""
            ).toString();
            return studentGrade === sectionGrade;
          });
        }

        loadAssignedStudents(assignedStudents, sectionName);
        loadAvailableStudents(availableStudents, sectionName);
      } else {
        console.error("Failed to load students:", result.error);
      }
    })
    .catch((error) => {
      console.error("Error loading students:", error);
    });
}

function loadAssignedStudents(students, sectionName) {
  const container = document.getElementById('assignedStudentsContainer');
  if (!container) return;

  if (!Array.isArray(students) || students.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-person-x display-4 text-muted mb-3"></i>
        <h6 class="text-muted mb-1">No Students Assigned</h6>
        <p class="text-muted small mb-0">This section has no students assigned yet.</p>
      </div>`;
    return;
  }

  let html = `
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <strong class="text-primary">Assigned Students (<span id="assignedStudentsCount">${students.length}</span>)</strong>
        <span class="badge bg-primary" id="assignedStudentsBadge">${students.length}</span>
      </div>
      <small class="text-muted d-block mt-1"><i class="bi bi-info-circle me-1"></i>Scroll to view all. Use search to filter.</small>
    </div>
  <div class="list-group" id="assignedStudentsList" style="max-height:50vh; overflow-y:auto; border:1px solid #e5e7eb; border-radius:.5rem;">
  `;

  students.forEach(student => {
    const name = student.name || 'Unknown';
    const reg = student.registrationNo || null;
    const grade = student.grade || student.gradeLevel || null;
    const idAttr = (student.registrationNo || '').toLowerCase();
    const gradeBadge = grade ? `<span class="badge bg-success ms-2">G${grade}</span>` : '';
    const initial = name.charAt(0).toUpperCase();
    html += `
      <div class="list-group-item student-item px-3 py-2" 
           data-student-name="${name.toLowerCase()}" 
           data-student-id="${idAttr}" 
           data-student-grade="${(grade || '').toString().toLowerCase()}">
        <div class="d-flex align-items-center justify-content-between w-100">
          <div class="d-flex align-items-center flex-grow-1 min-w-0">
            <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style="width:42px;height:42px;font-weight:600;font-size:.9rem;">
              ${initial}
            </div>
            <div class="d-flex flex-column flex-grow-1 min-w-0">
              <div class="d-flex align-items-center flex-wrap">
                <span class="fw-semibold me-1 text-truncate" style="max-width:160px;">${name}</span>
                ${gradeBadge}
              </div>
              <small class="text-muted text-truncate" style="max-width:200px;">
                ${reg ? `ID: ${reg}` : 'No ID'}${grade ? ` | Grade: ${grade}` : ''}
              </small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-1 ms-2 flex-shrink-0">
            <button type="button" class="btn btn-outline-info btn-sm" title="View Details" onclick="viewStudentDetails('${student.id}','${name.replace(/'/g, "&#39;")}')">
              <i class="bi bi-eye"></i>
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm" title="Remove from Section" onclick="removeStudentFromSection('${student.id}','${name.replace(/'/g, "&#39;")}', '${sectionName}')">
              <i class="bi bi-person-dash"></i>
            </button>
          </div>
        </div>
      </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

function loadAvailableStudents(students, sectionName) {
  const container = document.getElementById("availableStudentsContainer");
  if (!container) return;

  const isGradeFiltered = currentManagedSection && currentManagedSection.gradeLevel;
  const gradeText = isGradeFiltered ? ` for Grade ${currentManagedSection.gradeLevel}` : "";

  if (students.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-person-check display-4 text-muted mb-3"></i>
        <h6 class="text-muted">${isGradeFiltered ? `No Available Grade ${currentManagedSection.gradeLevel} Students` : "All Students Assigned"}</h6>
        <p class="text-muted small">${isGradeFiltered ? `All Grade ${currentManagedSection.gradeLevel} students are already assigned to sections.` : "All students are already assigned to sections."}</p>
      </div>`;
    return;
  }

  let html = `
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <strong class="text-info">Available Students${gradeText} (<span id="availableStudentsCount">${students.length}</span>)</strong>
        <span class="badge bg-info" id="availableStudentsBadge">${students.length}</span>
      </div>
      <small class="text-muted d-block mt-1"><i class="bi bi-info-circle me-1"></i>${isGradeFiltered ? "Only students from the matching grade are shown." : "Students with or without sections are listed."}</small>
    </div>
  <div class="list-group" id="availableStudentsList" style="max-height:50vh; overflow-y:auto; border:1px solid #e5e7eb; border-radius:.5rem;flex-1">
  `;

  students.forEach(student => {
    const name = student.name || 'Unknown';
    const reg = student.registrationNo || null;
    const grade = student.grade || student.gradeLevel || null;
    const currentSection = student.section || null;
    const idAttr = (student.registrationNo || '').toLowerCase();
    const gradeBadge = grade ? `<span class="badge bg-success ms-2">G${grade}</span>` : '';
    const initial = name.charAt(0).toUpperCase();
    const hasOtherSection = currentSection && currentSection !== sectionName;

    html += `
      <div class="list-group-item student-item px-3 py-2" 
           data-student-name="${name.toLowerCase()}" 
           data-student-id="${idAttr}" 
           data-student-grade="${(grade || '').toString().toLowerCase()}"
           data-student-section="${(currentSection || '').toLowerCase()}">
        <div class="d-flex align-items-center justify-content-between w-100">
          <div class="d-flex align-items-center flex-grow-1 min-w-0">
            <div class="rounded-circle bg-info text-white d-flex align-items-center justify-content-center me-3" style="width:42px;height:42px;font-weight:600;font-size:.9rem;">
              ${initial}
            </div>
            <div class="d-flex flex-column flex-grow-1 min-w-0">
              <div class="d-flex align-items-center flex-wrap">
                <span class="fw-semibold me-1 text-truncate" style="max-width:160px;">${name}</span>
                ${gradeBadge}
              </div>
              <small class="text-muted text-truncate" style="max-width:220px;">
                ${reg ? `ID: ${reg}` : 'No ID'}${grade ? ` | Grade: ${grade}` : ''}${currentSection ? ` | Current: ${currentSection}` : ' | Unassigned'}
              </small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-1 ms-2 flex-shrink-0">
            <button type="button" class="btn btn-outline-info btn-sm" title="View Details" onclick="viewStudentDetails('${student.id}','${name.replace(/'/g, "&#39;")}')">
              <i class="bi bi-eye"></i>
            </button>
            ${hasOtherSection ? `<button type=\"button\" class=\"btn btn-outline-warning btn-sm\" title=\"Unassign from ${currentSection}\" onclick=\"removeStudentFromSection('${student.id}','${name.replace(/'/g, "&#39;")}','${currentSection.replace(/'/g, "&#39;")}','${sectionName.replace(/'/g, "&#39;")}')\"><i class=\"bi bi-person-dash\"></i></button>` : ''}
            <button type="button" class="btn btn-outline-success btn-sm" title="Assign to ${sectionName}" onclick="assignStudentToSection('${student.id}','${name.replace(/'/g, "&#39;")}','${sectionName.replace(/'/g, "&#39;")}')">
              <i class="bi bi-person-plus"></i>
            </button>
          </div>
        </div>
      </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

function assignStudentToSection(studentId, studentName, sectionName) {
  // Close any existing open modals (avoid stacked Bootstrap modals)
  let hadManageStudentsOpen = false;
  try {
    document.querySelectorAll('.modal.show').forEach(modalEl => {
      if (modalEl.id === 'manageStudentsModal') hadManageStudentsOpen = true;
      try {
        const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        instance.hide();
      } catch (e) {
        console.warn('Could not hide modal', modalEl.id, e);
      }
    });
    // Remove transient student-related modals after hide animation
    setTimeout(() => {
      document.querySelectorAll('.modal').forEach(modalEl => {
        if (!modalEl.classList.contains('show')) {
          if (/assignStudentModal|removeStudentModal|editStudentModal|manageStudentsModal|studentDetailsModal/i.test(modalEl.id)) {
            if (modalEl.id !== 'assignStudentModal') modalEl.remove();
          }
        }
      });
    }, 350);
  } catch (e) {
    console.warn('Error closing modals before assign student', e);
  }
  // Store flag so confirmAssignStudent can optionally restore manage students view
  window._reopenManageStudentsAfterAssign = hadManageStudentsOpen;
  // Create confirmation modal
  const confirmModalHtml = `
                <div class="modal fade" id="assignStudentModal" tabindex="-1" aria-labelledby="assignStudentModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title" id="assignStudentModalLabel">
                                    <i class="bi bi-person-plus-fill me-2"></i>Assign Student to Section
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-info d-flex align-items-center" role="alert">
                                    <i class="bi bi-info-circle-fill me-2"></i>
                                    <div>Confirm the assignment of this student to the section.</div>
                                </div>
                                <p>Are you sure you want to assign the following student to <strong>${sectionName}</strong>?</p>
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6 class="card-title mb-1">
                                            <i class="bi bi-person-circle me-2"></i>${studentName}
                                        </h6>
                                        <small class="text-muted">ID: ${studentId}</small>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-lg me-1"></i>Cancel
                                </button>
                                <button type="button" class="btn btn-success" onclick="confirmAssignStudent('${studentId}', '${studentName}', '${sectionName}')" data-bs-dismiss="modal">
                                    <i class="bi bi-check-lg me-1"></i>Assign Student
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // Remove existing modal if present
  const existingModal = document.getElementById("assignStudentModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", confirmModalHtml);

  // Show modal
  setTimeout(() => {
    const modal = document.getElementById("assignStudentModal");
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();

      // Remove modal from DOM when hidden
      modal.addEventListener("hidden.bs.modal", function () {
        modal.remove();
      });
    }
  }, 100);
}

function confirmAssignStudent(studentId, studentName, sectionName) {
  // Update student's section
  updateStudentSection(studentId, sectionName, () => {
    showNotification(
      `${studentName} has been assigned to section ${sectionName}`,
      "success",
      4000
    );
    // If manage students modal was previously open, rebuild it (since we closed it to avoid stacking)
    if (window._reopenManageStudentsAfterAssign) {
      setTimeout(() => {
        try {
          if (typeof manageStudents === 'function') {
            manageStudents(sectionName, currentManagedSection);
          }
        } catch (e) {
          console.warn('Could not reopen manage students modal after assignment', e);
        } finally {
          window._reopenManageStudentsAfterAssign = false;
        }
      }, 400); // slight delay to let assignment persist and modal hide complete
    } else {
      // Original behavior when manage students stayed open
      refreshStudentManagement(sectionName, currentManagedSection);
    }
  });
}

function removeStudentFromSection(studentId, studentName, sectionName, managedSectionName) {
  // Create confirmation modal
  const confirmModalHtml = `
                <div class="modal fade" id="removeStudentModal" tabindex="-1" aria-labelledby="removeStudentModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title" id="removeStudentModalLabel">
                                    <i class="bi bi-person-dash-fill me-2"></i>Remove Student from Section
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning d-flex align-items-center" role="alert">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>This will remove the student from the section.</div>
                                </div>
                                <p>Are you sure you want to remove the following student from <strong>${sectionName}</strong>?</p>
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6 class="card-title mb-1">
                                            <i class="bi bi-person-circle me-2"></i>${studentName}
                                        </h6>
                                        <small class="text-muted">ID: ${studentId}</small>
                                    </div>
                                </div>
                                <p class="mt-3 mb-0 text-muted small">Note: The student will not be deleted, only unassigned from this section.</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-lg me-1"></i>Cancel
                                </button>
                <button type="button" class="btn btn-warning" onclick="confirmRemoveStudent('${studentId}', '${studentName}', '${sectionName}'${managedSectionName ? ", '" + managedSectionName + "'" : ''})" data-bs-dismiss="modal">
                                    <i class="bi bi-person-dash me-1"></i>Remove Student
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // Remove existing modal if present
  const existingModal = document.getElementById("removeStudentModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", confirmModalHtml);

  // Show modal
  setTimeout(() => {
    const modal = document.getElementById("removeStudentModal");
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();

      // Remove modal from DOM when hidden
      modal.addEventListener("hidden.bs.modal", function () {
        modal.remove();
      });
    }
  }, 100);
}

function confirmRemoveStudent(studentId, studentName, sectionName, managedSectionName) {
  const contextSection = managedSectionName || sectionName;
  updateStudentSection(studentId, null, () => {
    showNotification(`${studentName} has been removed from section ${sectionName}`,'success',4000);
    refreshStudentManagement(contextSection, currentManagedSection);
  });
}

function updateStudentSection(studentId, newSection, callback) {
  if (window.api && window.api.updateStudentSection) {
    window.api
  .updateStudentSection({ studentId, sectionName: newSection })
      .then((result) => {
        if (result.success) {
          if (callback) callback();
          // Also refresh All Sections view (student counts) if it's currently displayed
          try {
            if (typeof loadAllSections === 'function' && document.getElementById('sectionsContainer')) {
              // Debounce rapid successive refreshes
              if (window._sectionsRefreshTimer) clearTimeout(window._sectionsRefreshTimer);
              window._sectionsRefreshTimer = setTimeout(() => {
                loadAllSections();
              }, 400); // slight delay to allow DB update to propagate
            }
          } catch (e) {
            console.warn('Could not refresh sections after student update:', e);
          }
        } else {
          showNotification(
            "Failed to update student section: " +
              (result.error || "Unknown error"),
            "error",
            6000
          );
        }
      })
      .catch((error) => {
        console.error("Error updating student section:", error);
        showNotification("Error updating student section", "error", 4000);
      });
  } else {
    showNotification("Student update API not available", "error", 4000);
  }
}

function refreshStudentManagement(sectionName, sectionData) {
  // Parse section data if it's a string
  let section = sectionName;
  if (typeof sectionData === "string") {
    try {
      section = JSON.parse(sectionData.replace(/&quot;/g, '"'));
    } catch (e) {
      console.error("Error parsing section data:", e);
      section = { name: sectionName };
    }
  } else if (typeof sectionData === "object") {
    section = sectionData;
  } else {
    section = { name: sectionName };
  }

  loadStudentManagementData(sectionName, section);
}

// Search filter functions for student management
function filterAssignedStudents() {
  const searchInput = document.getElementById("assignedStudentsSearch");
  const studentsList = document.getElementById("assignedStudentsList");
  const studentsCount = document.getElementById("assignedStudentsCount");
  const studentsBadge = document.getElementById("assignedStudentsBadge");

  if (!searchInput || !studentsList) return;

  const searchTerm = searchInput.value.toLowerCase().trim();
  const studentItems = studentsList.querySelectorAll(".student-item");
  let visibleCount = 0;

  studentItems.forEach((item) => {
    const name = item.getAttribute("data-student-name") || "";
    const id = item.getAttribute("data-student-id") || "";
    const grade = item.getAttribute("data-student-grade") || "";

    const isVisible =
      name.includes(searchTerm) ||
      id.includes(searchTerm) ||
      grade.includes(searchTerm);

    if (isVisible) {
      item.style.display = "";
      visibleCount++;
    } else {
      item.style.display = "none";
    }
  });

  // Update count displays
  if (studentsCount) studentsCount.textContent = visibleCount;
  if (studentsBadge) studentsBadge.textContent = visibleCount;

  // Show no results message if needed
  showNoResultsMessage(
    "assignedStudentsContainer",
    visibleCount,
    "assigned students"
  );
}

function clearAssignedSearch() {
  const searchInput = document.getElementById("assignedStudentsSearch");
  if (searchInput) {
    searchInput.value = "";
    filterAssignedStudents();
    searchInput.focus();
  }
}

function clearAvailableSearch() {
  const searchInput = document.getElementById("availableStudentsSearch");
  if (searchInput) {
    searchInput.value = "";
    filterAvailableStudents();
    searchInput.focus();
  }
}

// Filter Available Students list
function filterAvailableStudents() {
  const searchInput = document.getElementById('availableStudentsSearch');
  const list = document.getElementById('availableStudentsList');
  const countEl = document.getElementById('availableStudentsCount');
  const badgeEl = document.getElementById('availableStudentsBadge');
  if (!searchInput || !list) return;

  const term = searchInput.value.toLowerCase().trim();
  const items = list.querySelectorAll('.student-item');
  let visible = 0;
  items.forEach(item => {
    const name = item.getAttribute('data-student-name') || '';
    const id = item.getAttribute('data-student-id') || '';
    const grade = item.getAttribute('data-student-grade') || '';
    const section = item.getAttribute('data-student-section') || '';
    const match = name.includes(term) || id.includes(term) || grade.includes(term) || section.includes(term);
    if (match) {
      item.style.display = '';
      visible++;
    } else {
      item.style.display = 'none';
    }
  });
  if (countEl) countEl.textContent = visible;
  if (badgeEl) badgeEl.textContent = visible;
  showNoResultsMessage('availableStudentsContainer', visible, 'available students');
}

function showNoResultsMessage(containerId, visibleCount, studentType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let noResultsDiv = container.querySelector(".no-search-results");

  if (visibleCount === 0) {
    if (!noResultsDiv) {
      noResultsDiv = document.createElement("div");
      noResultsDiv.className = "no-search-results text-center py-4 mt-3";
      noResultsDiv.innerHTML = `
                        <i class="bi bi-search display-4 text-muted mb-3"></i>
                        <h6 class="text-muted">No Results Found</h6>
                        <p class="text-muted small">No ${studentType} match your search criteria. Try adjusting your search terms.</p>
                    `;
      container.appendChild(noResultsDiv);
    }
  } else {
    if (noResultsDiv) {
      noResultsDiv.remove();
    }
  }
}

function editStudent(studentId) {
  if (!window.api || !window.api.getStudents) {
    showNotification("Student API not available", "error", 4000);
    return;
  }
  Promise.all([
    window.api.getStudents(),
    window.api.getSections
      ? window.api.getSections()
      : Promise.resolve({ sections: [] }),
  ])
    .then(([studentResult, sectionResult]) => {
      if (studentResult.success && Array.isArray(studentResult.students)) {
        const student = studentResult.students.find(
          (s) => s.id === studentId || s.name === studentId
        );
        if (!student) {
          showNotification("Student not found", "error", 4000);
          return;
        }
        const availableSections = Array.isArray(sectionResult.sections)
          ? sectionResult.sections
          : [];
        const sectionOptions = availableSections
          .map(
            (sec) =>
              `<option value="${sec.name}"${
                student.section === sec.name ? " selected" : ""
              }>${sec.name}</option>`
          )
          .join("");
        const genderOptions = ["Male", "Female", "Other"]
          .map(
            (g) =>
              `<option value="${g}"${
                student.gender === g ? " selected" : ""
              }>${g}</option>`
          )
          .join("");
        const gradeOptions = ["7", "8", "9", "10"]
          .map(
            (g) =>
              `<option value="${g}"${
                student.grade == g || student.gradeLevel == g ? " selected" : ""
              }>${g}</option>`
          )
          .join("");
        const modalHtml = `
            <div class="modal fade" id="editStudentModal" tabindex="-1" aria-labelledby="editStudentModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title" id="editStudentModalLabel">
                                <i class="bi bi-pencil me-2"></i>
                                Edit Student: ${student.name || "Unknown"}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form id="editStudentForm">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card bg-light h-100">
                                            <div class="card-header bg-primary text-white">
                                                <h6 class="mb-0"><i class="bi bi-person me-2"></i>Personal Information</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-3 d-flex align-items-start gap-3">
                                                    <div id="editProfilePicWrapper" class="student-avatar-wrapper" style="width:72px;height:72px;position:relative;flex:0 0 auto;">
                                                        <img id="editProfilePicPreviewImg" class="student-avatar-img" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:${student.profilePictureUrl?'block':'none'};" src="${student.profilePictureUrl || ''}" onerror="this.style.display='none';document.getElementById('editProfilePicFallback').style.display='flex';">
                                                        <div id="editProfilePicFallback" class="d-flex justify-content-center align-items-center bg-secondary text-white rounded-circle" style="width:100%;height:100%;font-weight:600;font-size:1.1rem;${student.profilePictureUrl?'display:none;':'display:flex;'}">
                                                          ${(student.name||'?').trim().split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <div class="btn-group mb-2" role="group" aria-label="Change avatar">
                                                            <button type="button" id="changeEditProfilePicBtn" class="btn btn-sm btn-outline-primary"><i class="bi bi-image me-1"></i>Change</button>
                                                            <button type="button" id="removeEditProfilePicBtn" class="btn btn-sm btn-outline-danger" ${student.profilePictureUrl?'':'disabled'}><i class="bi bi-x-circle me-1"></i>Remove</button>
                                                        </div>
                                                        <div class="small text-muted">JPEG/PNG up to 1MB. Will be resized to max 256px.</div>
                                                        <input type="file" id="editProfilePicInput" accept="image/png,image/jpeg" hidden />
                                                        <input type="hidden" name="_avatarState" value="unchanged">
                                                        <input type="hidden" name="_avatarData" value="">
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Full Name</strong></label>
                                                    <input type="text" class="form-control" name="name" value="${student.name || ''}" required>
                                                    <div id="editProfilePicMeta" class="small text-muted mt-1"></div>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Registration No</strong></label>
                                                    <input type="text" class="form-control" name="registrationNo" value="${student.registrationNo || ""}">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Username</strong></label>
                                                    <input type="text" class="form-control" name="username" value="${student.username || ""}" readonly>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Gender</strong></label>
                                                    <select class="form-select" name="gender">${genderOptions}</select>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Date of Birth</strong></label>
                                                    <input type="date" class="form-control" name="dob" value="${student.dob ? new Date(student.dob).toISOString().split("T")[0] : ""}">
                                                </div>
                                                <div class="mb-0">
                                                    <label class="form-label"><strong>Address</strong></label>
                                                    <input type="text" class="form-control" name="address" value="${student.address || ""}">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card bg-light h-100">
                                            <div class="card-header bg-success text-white">
                                                <h6 class="mb-0"><i class="bi bi-book me-2"></i>Academic Information</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Section</strong></label>
                                                    <select class="form-select" name="section">${sectionOptions}</select>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Grade</strong></label>
                                                    <select class="form-select" name="grade">${gradeOptions}</select>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Date of Joining</strong></label>
                                                    <input type="date" class="form-control" name="admissionDate" value="${
                                                      student.admissionDate
                                                        ? new Date(
                                                            student.admissionDate
                                                          )
                                                            .toISOString()
                                                            .split("T")[0]
                                                        : ""
                                                    }">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Parent Name</strong></label>
                                                    <input type="text" class="form-control" name="parentName" value="${
                                                      student.parentName || ""
                                                    }">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label"><strong>Mobile No</strong></label>
                                                    <input type="text" class="form-control" name="mobileNo" value="${
                                                      student.mobileNo || ""
                                                    }">
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
            </div>
            `;
        const existingModal = document.getElementById("editStudentModal");
        if (existingModal) {
          existingModal.remove();
        }
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        setTimeout(() => {
          const modal = document.getElementById("editStudentModal");
          if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            const form = document.getElementById("editStudentForm");
            // Profile picture change handling
            let newProcessedProfilePic = null; // holds new dataURL if changed
            const picInput = document.getElementById('editProfilePicInput');
            const changeBtn = document.getElementById('changeEditProfilePicBtn');
            const removeBtn = document.getElementById('removeEditProfilePicBtn');
            const previewImg = document.getElementById('editProfilePicPreviewImg');
            const fallbackDiv = document.getElementById('editProfilePicFallback');
            const metaDiv = document.getElementById('editProfilePicMeta');

            function dataURLSize(dataURL) {
              if (!dataURL) return 0;
              const head = dataURL.indexOf(',');
              const b64 = head > -1 ? dataURL.substring(head + 1) : dataURL;
              return Math.ceil((b64.length * 3) / 4);
            }
            async function resizeImage(file, maxDim = 256) {
              return new Promise((resolve, reject) => {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                  let { width, height } = img;
                  if (width > maxDim || height > maxDim) {
                    const scale = Math.min(maxDim / width, maxDim / height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                  }
                  const canvas = document.createElement('canvas');
                  canvas.width = width; canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, width, height);
                  canvas.toBlob(blob => {
                    if (!blob) { reject('Blob conversion failed'); return; }
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  }, 'image/jpeg', 0.85);
                };
                img.onerror = reject;
                img.src = url;
              });
            }
            function resetEditPreview() {
              newProcessedProfilePic = null;
              if (previewImg) previewImg.src = student.profilePictureUrl || '';
              if (!student.profilePictureUrl && fallbackDiv) fallbackDiv.style.display = '';
              if (metaDiv) metaDiv.innerHTML = '';
              if (removeBtn) removeBtn.disabled = !(student.profilePictureUrl);
              if (picInput) picInput.value = '';
            }
            if (changeBtn) {
              changeBtn.addEventListener('click', () => {
                if (picInput) picInput.click();
              });
            }
            if (picInput) {
              picInput.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) { resetEditPreview(); return; }
                if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
                  showNotification('Unsupported image type. Use JPG or PNG.', 'error');
                  resetEditPreview();
                  return;
                }
                if (file.size > 1024 * 1024) { // >1MB
                  showNotification('Image too large (max 1MB before processing).', 'error');
                  resetEditPreview();
                  return;
                }
                try {
                  newProcessedProfilePic = await resizeImage(file, 256);
                  const sizeKb = Math.round(dataURLSize(newProcessedProfilePic) / 1024);
                  if (previewImg) {
                    previewImg.src = newProcessedProfilePic;
                  } else if (fallbackDiv) {
                    // Replace fallback with img element
                    const imgEl = document.createElement('img');
                    imgEl.id = 'editProfilePicPreviewImg';
                    imgEl.className = 'student-avatar-img';
                    imgEl.src = newProcessedProfilePic;
                    fallbackDiv.replaceWith(imgEl);
                  }
                  if (fallbackDiv) fallbackDiv.style.display = 'none';
                  if (metaDiv) metaDiv.innerHTML = `<span class='badge bg-primary-subtle text-primary-emphasis border border-primary-subtle'>${file.type.replace('image/','').toUpperCase()}</span> <span class='ms-1 small text-muted'>~${sizeKb} KB</span>`;
                  if (removeBtn) removeBtn.disabled = false;
                } catch (err) {
                  console.error('Image processing failed', err);
                  showNotification('Failed to process image.', 'error');
                  resetEditPreview();
                }
              });
            }
            if (removeBtn) {
              removeBtn.addEventListener('click', () => {
                // User opts to remove picture entirely
                newProcessedProfilePic = 'REMOVE';
                if (previewImg) previewImg.src = '';
                if (fallbackDiv) fallbackDiv.style.display = '';
                if (metaDiv) metaDiv.innerHTML = '<span class="text-danger small">Will remove on save</span>';
                removeBtn.disabled = true;
              });
            }
            form.addEventListener("submit", function (ev) {
              ev.preventDefault();
              const submitBtn = form.querySelector('button[type="submit"]');
              if (submitBtn) {
                // Show loading spinner and disable button
                submitBtn.disabled = true;
                const originalHtml = submitBtn.innerHTML;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...`;

                saveStudentChanges(form, student).finally(() => {
                  // Restore button after save completes
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = originalHtml;
                });
              } else {
                saveStudentChanges(form, student);
              }

              const formData = new FormData(form);
              const updatedStudent = {
                id: student.id,
                name: formData.get("name").trim(),
                registrationNo: formData.get("registrationNo").trim(),
                username: formData.get("username").trim(),
                gender: formData.get("gender"),
                dob: formData.get("dob"),
                address: formData.get("address").trim(),
                section: formData.get("section"),
                grade: formData.get("grade"),
                admissionDate: formData.get("admissionDate"),
                parentName: formData.get("parentName").trim(),
                mobileNo: formData.get("mobileNo").trim(),
                // Only send profilePicture if changed
                profilePicture: newProcessedProfilePic === null ? undefined : newProcessedProfilePic
              };
              if (window.api && window.api.updateStudent) {
                window.api
                  .updateStudent(updatedStudent)
                  .then((result) => {
                    if (result.success) {
                      showNotification(
                        "Student updated successfully!",
                        "success",
                        3000
                      );
                      bootstrapModal.hide();
                      renderAllStudentsList();
                    } else {
                      showNotification(
                        "Failed to update student",
                        "error",
                        4000
                      );
                    }
                  })
                  .catch((error) => {
                    showNotification("Error updating student", "error", 4000);
                  });
              } else {
                showNotification("Update API not available", "error", 4000);
              }
            });
            modal.addEventListener("hidden.bs.modal", function () {
              modal.remove();
            });
          }
        }, 100);
      } else {
        showNotification("Failed to load students", "error", 4000);
      }
    })
    .catch((error) => {
      showNotification("Error loading students", "error", 4000);
    });
}
function saveStudentChanges(form, student) {
  const formData = new FormData(form);
  const updatedStudent = {
    id: student.id,
    name: formData.get("name").trim(),
    registrationNo: formData.get("registrationNo").trim(),
    username: formData.get("username").trim(),
    gender: formData.get("gender"),
    dob: formData.get("dob"),
    address: formData.get("address").trim(),
    section: formData.get("section"),
    grade: formData.get("grade"),
    admissionDate: formData.get("admissionDate"),
    parentName: formData.get("parentName").trim(),
    mobileNo: formData.get("mobileNo").trim(),
  };
  if (window.api && window.api.updateStudent) {
    window.api
      .updateStudent(updatedStudent)
      .then((result) => {
        if (result.success) {
          showNotification("Student updated successfully!", "success", 3000);
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("editStudentModal")
          );
          if (modal) modal.hide();
          renderAllStudentsList();
        } else {
          showNotification("Failed to update student", "error", 4000);
        }
      })
      .catch((error) => {
        showNotification("Error updating student", "error", 4000);
      });
  } else {
    showNotification("Update API not available", "error", 4000);
  }
}

function showStudentDetailsModal(student) {
  const modalHtml = `
    <div class="modal fade" id="studentDetailsModal" tabindex="-1" aria-labelledby="studentDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title d-flex align-items-center gap-2" id="studentDetailsModalLabel">
              <span><i class="bi bi-person-circle me-2"></i>Student Details: ${student.name || 'Unknown'}</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- Left Column: Personal Information -->
              <div class="col-md-6">
                <div class="card bg-light h-100">
                  <div class="card-header bg-primary text-white">
                    <h6 class="mb-0"><i class="bi bi-person me-2"></i>Personal Information</h6>
                  </div>
                  <div class="card-body">
                    <div class="d-flex align-items-center gap-3 mb-3">
                      <div style="width:72px;height:72px;position:relative;">
                        ${(student.profilePictureUrl) ? `<img src="${student.profilePictureUrl}" alt="Avatar" style="width:72px;height:72px;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
                      </div>
                      <div class="small text-muted">Profile picture${student.profilePictureUrl ? '' : ' not set'}.</div>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-person-fill text-primary me-2"></i>Full Name:</strong>
                      <span class="ms-2">${student.name || 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-card-text text-info me-2"></i>Registration No:</strong>
                      <span class="ms-2">${student.registrationNo || 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-person-circle text-muted me-2"></i>Username:</strong>
                      <span class="ms-2"><code>${student.username || 'Not specified'}</code></span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-gender-ambiguous text-secondary me-2"></i>Gender:</strong>
                      <span class="ms-2">${student.gender || 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-calendar text-warning me-2"></i>Date of Birth:</strong>
                      <span class="ms-2">${student.dob ? new Date(student.dob).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                    <div class="mb-0">
                      <strong><i class="bi bi-geo-alt text-danger me-2"></i>Address:</strong>
                      <span class="ms-2">${student.address || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Right Column: Academic Information -->
              <div class="col-md-6">
                <div class="card bg-light h-100">
                  <div class="card-header bg-success text-white">
                    <h6 class="mb-0"><i class="bi bi-book me-2"></i>Academic Information</h6>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <strong><i class="bi bi-bookmark text-primary me-2"></i>Section:</strong>
                      <span class="ms-2 badge ${student.section ? 'bg-success' : 'bg-secondary'}">${student.section || 'Unassigned'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-mortarboard text-info me-2"></i>Grade:</strong>
                      <span class="ms-2">${student.gradeLevel || 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-calendar-plus text-warning me-2"></i>Date of Joining:</strong>
                      <span class="ms-2">${student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                    <div class="mb-3">
                      <strong><i class="bi bi-person-hearts text-danger me-2"></i>Parent Name:</strong>
                      <span class="ms-2">${student.parentName || 'Not specified'}</span>
                    </div>
                    <div class="mb-0">
                      <strong><i class="bi bi-telephone text-success me-2"></i>Mobile No:</strong>
                      <span class="ms-2">${student.mobileNo || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ${student.id ? `
              <div class="row mt-3">
                <div class="col-12">
                  <div class="card bg-light">
                    <div class="card-header bg-warning text-dark">
                      <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>System Information</h6>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col-md-6">
                          <strong><i class="bi bi-key text-primary me-2"></i>Student ID:</strong>
                          <span class="ms-2"><code>${student.id}</code></span>
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
            <button type="button" class="btn btn-danger" onclick="confirmDeleteStudent('${student.name}','${student.id || ''}',0)" data-bs-dismiss="modal">
              <i class="bi bi-trash me-1"></i>Delete Student
            </button>
          </div>
        </div>
      </div>
    </div>`;

  const existing = document.getElementById('studentDetailsModal');
  if (existing) {
    try {
      const inst = bootstrap.Modal.getInstance(existing);
      if (inst) {
        // Hide first to allow Bootstrap to run its normal cleanup
        existing.addEventListener('hidden.bs.modal', () => existing.remove(), { once: true });
        inst.hide();
      } else {
        existing.remove();
      }
    } catch(_) {
      existing.remove();
    }
  }
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  setTimeout(() => {
    const modal = document.getElementById('studentDetailsModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
        // Deferred cleanup to avoid race with another modal opening immediately
        setTimeout(() => {
          if (!document.querySelector('.modal.show')) {
            const leftovers = document.querySelectorAll('.modal-backdrop');
            if (leftovers.length > 1) {
              // Keep the last one if Bootstrap still thinks one is present
              leftovers.forEach((b, idx, arr) => { if (idx < arr.length - 1) b.remove(); });
            } else if (leftovers.length === 1) {
              // Remove single leftover only if no modals actually shown
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

function viewStudentDetails(studentIdOrName, displayName) {
  // Normalize input (could be ID, registrationNo, or name)
  const lookup = (studentIdOrName ?? '').toString().trim();
  const fallbackName = (displayName ?? '').toString().trim();

  // Close existing modals similar to teacher flow
  try {
    document.querySelectorAll('.modal.show').forEach(modalEl => {
      try { (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).hide(); } catch(_) {}
    });
    setTimeout(() => {
      document.querySelectorAll('.modal').forEach(modalEl => {
        if (!modalEl.classList.contains('show') && /assignStudentModal|removeStudentModal|editStudentModal|manageStudentsModal|studentDetailsModal/i.test(modalEl.id)) {
          if (modalEl.id !== 'studentDetailsModal') modalEl.remove();
        }
      });
    }, 350);
  } catch(e){ console.warn('Modal cleanup before viewing student details failed', e); }

  // No skeleton loader; go straight to fetching and rendering

  if (!window.api || !window.api.getStudents) {
    showNotification('Student API not available', 'error', 4000);
    return;
  }

  const attemptStart = Date.now();
  window.api.getStudents()
    .then(res => {
      if (!(res.success && Array.isArray(res.students))) throw new Error(res.error || 'Failed');
      // Matching strategy: id -> registrationNo -> exact name (lookup or fallback) -> case-insensitive contains
      const lcLookup = lookup.toLowerCase();
      const lcFallback = fallbackName.toLowerCase();
      let student = res.students.find(s => s.id && s.id === lookup);
      if (!student && lookup) student = res.students.find(s => (s.registrationNo||'') === lookup);
      if (!student && lookup) student = res.students.find(s => (s.name||'').toLowerCase() === lcLookup);
      if (!student && fallbackName) student = res.students.find(s => (s.name||'').toLowerCase() === lcFallback);
      if (!student && lookup) student = res.students.find(s => (s.name||'').toLowerCase().includes(lcLookup));
      if (!student && fallbackName) student = res.students.find(s => (s.name||'').toLowerCase().includes(lcFallback));
      if (!student) {
        showNotification('Student not found', 'error', 4000);
        return;
      }
      // No loader to clean up
      // Call the primary (avatar-enabled) details renderer
      if (typeof showStudentDetailsModal === 'function') {
        showStudentDetailsModal(student);
      } else {
        console.warn('Avatar-enabled showStudentDetailsModal not found');
      }
    })
    .catch(err => {
      console.error('[StudentDetails] Load failed', err);
      const elapsed = Date.now() - attemptStart;
      showNotification('Error loading student details', 'error', 4000);
      // No loader to clean up
      // Auto-retry once if quick failure (<500ms) to handle transient race
      if (elapsed < 500) {
        setTimeout(()=> viewStudentDetails(lookup), 600);
      }
    });
}

// Ensure globals for inline onclick usage and keep original references
window.viewStudentDetails = window.viewStudentDetails || viewStudentDetails;
if (!window._originalShowStudentDetailsModal && typeof showStudentDetailsModal === 'function') {
  window._originalShowStudentDetailsModal = showStudentDetailsModal;
}
window.showStudentDetailsModal = window.showStudentDetailsModal || showStudentDetailsModal;
