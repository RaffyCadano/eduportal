document
  .getElementById("allSectionsLink")
  .addEventListener("click", function (e) {
    e.preventDefault();

    // Set sidebar active state
    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
      link.classList.remove("active");
    });
    document.getElementById("allSectionsLink").classList.add("active");
    document.getElementById("sectionsDropdownBtn").classList.add("active");

    // Replace main-content with All Sections view
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
                  <li class='breadcrumb-item'><a href='#' id='sectionsBreadcrumb'><i class="bi bi-journal"></i><span>Sections</span></a></li>
                  <li class='breadcrumb-item active' aria-current='page'><i class='bi bi-list-ul'></i><span> All Sections</span></li>
                </ol>
              </nav>
                            <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
                <div class='d-flex justify-content-between align-items-center mb-4'>
                  <h3 class='fw-bold mb-0'>
                    <i class='bi bi-bookmark text-primary me-2'></i>
                    All Sections
                  </h3>
                                    <button class='btn btn-primary' id='refreshSectionsBtn'>
                                        <i class='bi bi-arrow-clockwise me-2'></i>Refresh
                                    </button>
                                </div>
                                <div class='alert alert-info d-flex align-items-center' role='alert'>
                                  <i class='bi bi-info-circle-fill me-2'></i>
                                  <div>
                                    <strong>Information:</strong> This page displays all sections. Use the search to find specific sections by name, grade, or teacher.
                                  </div>
                                </div>
                                <div class='row mb-4' id='sectionsSearchFilter'>
                                  <div class='col-md-12'>
                                    <div class='input-group'>
                                      <span class='input-group-text bg-light'>
                                        <i class='bi bi-search text-primary'></i>
                                      </span>
                                      <input type='text' class='form-control' id='sectionsSearchInput' placeholder='Search by section, grade, or teacher...' autocomplete='off'>
                                      <button class='btn btn-outline-secondary' type='button' id='clearSectionsSearchBtn' title='Clear search'>
                                        <i class='bi bi-x-lg'></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div id='sectionsContainer'>
                                    <div class='text-center py-4'>
                                        <div class='spinner-border text-primary' role='status'>
                                            <span class='visually-hidden'>Loading...</span>
                                        </div>
                                        <p class='mt-2 text-muted'>Loading sections...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

      // Load sections data
      loadAllSections();

      // Add refresh button functionality
      document
        .getElementById("refreshSectionsBtn")
        .addEventListener("click", function () {
          loadAllSections();
        });

      // Attach search event listeners for real-time filtering (separate from table rendering)
      const searchInput = document.getElementById("sectionsSearchInput");
      const clearBtn = document.getElementById("clearSectionsSearchBtn");

      function applySectionsFilter() {
        const term = (searchInput?.value || "").toLowerCase().trim();
        window.sectionsSearchTerm = term;
        window.sectionsPage = 1;
        if (typeof renderSectionsPage === "function") {
          renderSectionsPage();
        }
      }

      if (searchInput) {
        searchInput.addEventListener("input", applySectionsFilter);
      }
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          if (searchInput) {
            searchInput.value = "";
            applySectionsFilter();
            searchInput.focus();
          }
        });
      }
    }
  });

// New Section link handler (was missing, causing link not to work)
const newSectionLinkEl = document.getElementById("newSectionLink");
if (newSectionLinkEl) {
  newSectionLinkEl.addEventListener("click", function (e) {
    e.preventDefault();
    // Activate sidebar states
    document
      .querySelectorAll(".sidebar .nav-link")
      .forEach((l) => l.classList.remove("active"));
    newSectionLinkEl.classList.add("active");
    const sectionsDropdownBtn = document.getElementById("sectionsDropdownBtn");
    if (sectionsDropdownBtn) sectionsDropdownBtn.classList.add("active");

    const mainContent = document.querySelector(
      ".main-content .container-fluid"
    );
    if (!mainContent) return;

    // Ensure teacher helper modal exists only once (avoid duplicates if user re-enters form rapidly)
    const existingHelper = document.getElementById("sectionTeacherHelperModal");
    if (!existingHelper) {
      const helper = document.createElement("div");
      helper.id = "sectionTeacherHelperModal";
      helper.className = "modal fade";
      helper.tabIndex = -1;
      helper.setAttribute("aria-hidden", "true");
      helper.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">No Teachers Available</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              You must create at least one teacher before assigning a section teacher.
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" id="goCreateTeacherBtn" class="btn btn-success">Create Teacher</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(helper);
      setTimeout(() => {
        const goBtn = document.getElementById("goCreateTeacherBtn");
        if (goBtn) {
          goBtn.addEventListener("click", () => {
            // Expand teachers submenu and navigate to Add Teachers if present
            const teachersDropdownBtn = document.getElementById(
              "teachersDropdownBtn"
            );
            const teachersSubmenu = document.getElementById("teachersSubmenu");
            if (
              teachersDropdownBtn &&
              teachersSubmenu &&
              teachersSubmenu.style.display === "none"
            ) {
              teachersDropdownBtn.click();
            }
            const addTeachersLink = document.getElementById("addTeachersLink");
            if (addTeachersLink) addTeachersLink.click();
            const modalEl = document.getElementById(
              "sectionTeacherHelperModal"
            );
            if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
          });
        }
      }, 300);
    }

    mainContent.innerHTML = `
      <div class='row'>
        <div class='col-12'>
          <nav aria-label="breadcrumb" class="mb-3">
            <ol class="breadcrumb app-breadcrumb">
              <li class="breadcrumb-item"><a href="#" id="dashboardBreadcrumb"><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>
              <li class="breadcrumb-item"><a href="#" id="sectionsBreadcrumb"><i class="bi bi-journal"></i><span>Sections</span></a></li>
              <li class="breadcrumb-item active" aria-current="page"><i class='bi bi-plus-circle'></i><span> New Section</span></li>
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
                    <option value='11'>Grade 11</option>
                    <option value='12'>Grade 12</option>
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
      </div>`;

    // Populate teachers dropdown
    if (window.api && window.api.getTeachers) {
      window.api.getTeachers().then((result) => {
        const sel = document.getElementById("sectionTeacher");
        if (!sel) return;
        if (result.success && Array.isArray(result.teachers)) {
          // Filter unique teacher names
          const uniqueNames = [
            ...new Set(result.teachers.map((t) => t.name).filter(Boolean)),
          ];
          uniqueNames.forEach((name) => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            sel.appendChild(opt);
          });
        }
        if (sel.options.length <= 1) {
          // Show helper modal only if not already visible
          const helperModal = document.getElementById(
            "sectionTeacherHelperModal"
          );
          if (helperModal) {
            const instance = bootstrap.Modal.getOrCreateInstance(helperModal);
            // Prevent flashing a second instance
            if (!helperModal.classList.contains("show")) instance.show();
          }
        }
      });
    }

    // Submit handler for creating section
    const form = document.getElementById("createSectionForm");
    if (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHtml = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Creating...`;
        }
        const sectionName = form.sectionName.value.trim();
        const grade = form.gradeLevel.value.trim();
        const teacher = form.sectionTeacher.value.trim();
        if (!sectionName || !grade || !teacher) {
          showNotification("Please fill all required fields", "error", 4000);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
          }
          return;
        }
        // Fetch existing sections to enforce uniqueness
        if (window.api && window.api.getSections) {
          window.api.getSections().then((secRes) => {
            let duplicate = false;
            if (secRes.success && Array.isArray(secRes.sections)) {
              const target = sectionName.toLowerCase();
              duplicate = secRes.sections.some(
                (s) => (s.name || "").toLowerCase() === target
              );
            }
            if (duplicate) {
              showNotification(
                `Section name "${sectionName}" already exists.`,
                "error",
                5000
              );
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHtml;
              }
              return;
            }
            // Create section
            if (window.api && window.api.createEntity) {
              const payload = { name: sectionName, gradeLevel: grade, teacher };
              window.api
                .createEntity({ type: "sections", data: payload })
                .then((createRes) => {
                  if (createRes.success) {
                    showNotification(
                      "Section created successfully!",
                      "success",
                      4000
                    );
                    // Navigate back to All Sections
                    const allLink = document.getElementById("allSectionsLink");
                    if (allLink) allLink.click();
                  } else {
                    showNotification(
                      "Failed to create section: " +
                        (createRes.error || "Unknown error"),
                      "error",
                      6000
                    );
                  }
                })
                .catch((err) => {
                  showNotification(
                    "Error creating section: " + err,
                    "error",
                    6000
                  );
                })
                .finally(() => {
                  if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHtml;
                  }
                });
            }
          });
        }
      });
    }
  });
}

// Helper: close any open Bootstrap modals to avoid stacking
function closeAllModals() {
  try {
    const openModals = document.querySelectorAll(".modal.show");
    openModals.forEach((modalEl) => {
      const instance =
        bootstrap.Modal.getInstance(modalEl) ||
        bootstrap.Modal.getOrCreateInstance(modalEl);
      instance.hide();
    });
  } catch (err) {
    console.warn("closeAllModals encountered an error:", err);
  }
}

function loadAllSections() {
  const container = document.getElementById("sectionsContainer");
  if (!container) return;

  // Show loading state
  container.innerHTML = `
                <div class='text-center py-4'>
                    <div class='spinner-border text-primary' role='status'>
                        <span class='visually-hidden'>Loading...</span>
                    </div>
                    <p class='mt-2 text-muted'>Fixing data and loading sections...</p>
                </div>
            `;

  // First, try to fix any orphaned teacher references
  if (window.api && window.api.fixOrphanedTeachers) {
    window.api
      .fixOrphanedTeachers()
      .then((fixResult) => {
        // Now load sections
        loadSectionsData();
      })
      .catch((error) => {
        console.error("Error fixing orphaned teachers:", error);
        // Still try to load sections even if fix fails
        loadSectionsData();
      });
  } else {
    loadSectionsData();
  }
}

function loadSectionsData() {
  const container = document.getElementById("sectionsContainer");
  if (!container) return;

  if (window.api && window.api.getSections) {
    window.api
      .getSections()
      .then((result) => {
        if (result.success && Array.isArray(result.sections)) {
          // Always load student counts, then render paginated view
          loadStudentCountsForSections(result.sections).then(
            (sectionsWithCounts) => {
              window.sectionsAll = sectionsWithCounts || [];
              if (typeof window.sectionsPage === "undefined")
                window.sectionsPage = 1;
              if (typeof window.sectionsPageSize === "undefined")
                window.sectionsPageSize = 25;
              if (typeof window.sectionsSearchTerm === "undefined")
                window.sectionsSearchTerm = "";
              renderSectionsPage();
            }
          );
        } else {
          container.innerHTML = `
                            <div class='text-center py-5'>
                                <i class='bi bi-exclamation-triangle display-1 text-warning mb-3'></i>
                                <h5 class='text-warning'>Error Loading Sections</h5>
                                <p class='text-muted mb-4'>${
                                  result.error ||
                                  "Failed to load sections from the database."
                                }</p>
                                <button class='btn btn-outline-primary' onclick='loadAllSections()'>
                                    <i class='bi bi-arrow-clockwise me-2'></i>Try Again
                                </button>
                            </div>
                        `;
        }
      })
      .catch((error) => {
        container.innerHTML = `
                        <div class='text-center py-5'>
                            <i class='bi bi-wifi-off display-1 text-danger mb-3'></i>
                            <h5 class='text-danger'>Connection Error</h5>
                            <p class='text-muted mb-4'>Unable to connect to the database. Please check your connection.</p>
                            <button class='btn btn-outline-primary' onclick='loadAllSections()'>
                                <i class='bi bi-arrow-clockwise me-2'></i>Retry
                            </button>
                        </div>
                    `;
        console.error("Error loading sections:", error);
      });
  } else {
    container.innerHTML = `
                    <div class='text-center py-5'>
                        <i class='bi bi-x-circle display-1 text-danger mb-3'></i>
                        <h5 class='text-danger'>API Not Available</h5>
                        <p class='text-muted mb-4'>The sections API is not available. Please check your system configuration.</p>
                    </div>
                `;
  }
}

// Global variable to store sections data for deletion
let currentSectionsData = [];

// Pagination-aware renderer for All Sections
function renderSectionsPage() {
  const container = document.getElementById("sectionsContainer");
  if (!container) return;

  const all = Array.isArray(window.sectionsAll) ? window.sectionsAll : [];
  const term = (window.sectionsSearchTerm || "").toLowerCase().trim();
  const pageSize = Number(window.sectionsPageSize || 25);
  let page = Number(window.sectionsPage || 1);

  const filtered = term
    ? all.filter((s) => {
        const name = (s && (s.name || "")).toString().toLowerCase();
        const grade = (s && (s.gradeLevel || "")).toString().toLowerCase();
        const teacher = (s && (s.teacher || "")).toString().toLowerCase();
        return (
          name.includes(term) || grade.includes(term) || teacher.includes(term)
        );
      })
    : all;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
  window.sectionsPage = page;

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = total === 0 ? 0 : Math.min(page * pageSize, total);
  const pageItems =
    total === 0 ? [] : filtered.slice((page - 1) * pageSize, page * pageSize);

  // Top controls: Rows per page + range (match All Students UI)
  const topBar = `
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0 small text-muted">Rows per page:</label>
        <select id="sectionsPageSizeSelect" class="form-select form-select-sm" style="width:auto;">
          <option value="10" ${pageSize === 10 ? "selected" : ""}>10</option>
          <option value="25" ${pageSize === 25 ? "selected" : ""}>25</option>
          <option value="50" ${pageSize === 50 ? "selected" : ""}>50</option>
          <option value="100" ${pageSize === 100 ? "selected" : ""}>100</option>
        </select>
      </div>
      <div class="text-muted small" id="sectionsRangeInfo"></div>
    </div>`;

  // Table header
  let tableHtml = `
    <div class='table-responsive'>
      <table class='table table-hover table-bordered align-middle mb-0'>
        <thead class='table-dark text-white'>
          <tr>
            <th scope='col' class='text-center' style='width:6%'>#</th>
            <th scope='col' style='width:34%'>Section</th>
            <th scope='col' style='width:15%'>Grade</th>
            <th scope='col' style='width:25%'>Teacher</th>
            <th scope='col' class='text-center' style='width:10%'>Students</th>
            <th scope='col' class='text-center' style='width:10%'>Actions</th>
          </tr>
        </thead>
        <tbody id='sectionsTableBody' class='table-body-surface'>`;

  if (pageItems.length === 0) {
    tableHtml += `
      <tr class='empty-state-row' data-empty='true'>
        <td colspan='6'>
          <div class='py-5 text-center'>
            <i class='bi bi-bookmark-x display-5 text-muted mb-2 d-block'></i>
            <h6 class='text-muted mb-1'>No Sections Found</h6>
            <p class='text-muted mb-3'>There are no sections created yet.</p>
            <button class='btn btn-primary' onclick='document.getElementById("newSectionLink").click()'>
              <i class='bi bi-plus-lg me-2'></i>Add New Section First
            </button>
          </div>
        </td>
      </tr>`;
  } else {
    pageItems.forEach((section, idx) => {
      const s = typeof section === "object" ? section : { name: section };
      const name = s.name || "Unknown Section";
      const grade = s.gradeLevel || "";
      const teacher = s.teacher || "";
      const studentCount = s.studentCount || 0;
      const initial = name.charAt(0).toUpperCase();
      const rowIndex = (page - 1) * pageSize + idx + 1;

      tableHtml += `
        <tr class="align-middle text-center">
          <td class="text-muted fw-bold">${rowIndex}</td>
          <td>
            <div class="d-flex justify-content-start align-items-center">
              <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; font-size: 14px; font-weight: bold;">${initial}</div>
              <div class="d-flex flex-column align-items-start">
                <div class="fw-semibold">${name}</div>
                ${
                  grade
                    ? `<small class="text-muted">Grade ${grade}</small>`
                    : ""
                }
              </div>
            </div>
          </td>
          <td class="text-start">${grade || ""}</td>
          <td class="text-start">${teacher || ""}</td>
          <td><span class="badge bg-warning text-dark">${studentCount}</span></td>
          <td>
            <div class="dropdown position-static d-flex justify-content-center">
              <button class="btn btn-light btn-sm" type="button" id="sectionActionsDropdown${rowIndex}" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="sectionActionsDropdown${rowIndex}" style="z-index: 2000;">
                <li>
                  <a class="dropdown-item" href="#" onclick="viewSectionDetails('${name}', ${
        rowIndex - 1
      })">
                    <i class="bi bi-eye me-2"></i>View Details
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" onclick="manageStudents('${name}', ${JSON.stringify(
        s
      ).replace(/"/g, "&quot;")})">
                    <i class="bi bi-people me-2"></i>Manage Students
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" onclick="editSection('${name}', ${
        rowIndex - 1
      }, ${JSON.stringify(s).replace(/"/g, "&quot;")})">
                    <i class="bi bi-pencil me-2"></i>Edit Section
                  </a>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item text-danger" href="#" onclick="confirmDeleteSection('${name}', ${
        rowIndex - 1
      })">
                    <i class="bi bi-trash me-2"></i>Delete Section
                  </a>
                </li>
              </ul>
            </div>
          </td>
        </tr>`;
    });
  }

  tableHtml += `</tbody></table></div>`;

  // Bottom controls: pagination + total (match All Students UI)
  const bottomBar = `
    <div class='d-flex justify-content-between align-items-center flex-wrap gap-2 border-top py-2 mt-2'>
      <div class='pagination mb-0' id='sectionsPagination'></div>
      <div class='text-muted small'>Total Sections: <strong id='sectionsTotalCount'>${total}</strong></div>
    </div>`;

  container.innerHTML = topBar + tableHtml + bottomBar;

  // Wire rows-per-page changes
  const pageSizeSelect = document.getElementById("sectionsPageSizeSelect");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      window.sectionsPageSize = parseInt(pageSizeSelect.value, 10) || 25;
      window.sectionsPage = 1;
      renderSectionsPage();
    });
  }

  // Update range and totals
  const rangeInfo = document.getElementById("sectionsRangeInfo");
  if (rangeInfo)
    rangeInfo.textContent = `Showing ${startIdx}-${endIdx} of ${total}`;
  const totalEl = document.getElementById("sectionsTotalCount");
  if (totalEl) totalEl.textContent = String(total);

  // Build pagination controls
  buildSectionsPaginationControls(totalPages, page);
}

function buildSectionsPaginationControls(totalPages, currentPage) {
  const el = document.getElementById("sectionsPagination");
  if (!el) return;
  if (totalPages <= 1) {
    el.innerHTML = '<div class="small text-muted">Page 1 of 1</div>';
    return;
  }
  const parts = [];
  function btn(label, page, disabled = false, active = false) {
    return `<button class="btn btn-sm ${
      active ? "btn-primary" : "btn-outline-primary"
    } me-1 mb-1" data-page="${page}" ${
      disabled ? "disabled" : ""
    }>${label}</button>`;
  }
  parts.push(btn("«", 1, currentPage === 1));
  parts.push(btn("‹", Math.max(1, currentPage - 1), currentPage === 1));
  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }
  if (start > 1) parts.push('<span class="mx-1">...</span>');
  for (let p = start; p <= end; p++) {
    parts.push(btn(p, p, false, p === currentPage));
  }
  if (end < totalPages) parts.push('<span class="mx-1">...</span>');
  parts.push(
    btn("›", Math.min(totalPages, currentPage + 1), currentPage === totalPages)
  );
  parts.push(btn("»", totalPages, currentPage === totalPages));
  el.innerHTML = parts.join("");
  el.querySelectorAll("[data-page]").forEach((b) => {
    b.addEventListener("click", (e) => {
      const target = parseInt(e.currentTarget.getAttribute("data-page"), 10);
      if (
        !isNaN(target) &&
        target >= 1 &&
        target <= totalPages &&
        target !== window.sectionsPage
      ) {
        window.sectionsPage = target;
        renderSectionsPage();
      }
    });
  });
}

function confirmDeleteSection(sectionName, sectionIndex) {
  // Create confirmation modal
  const modalHtml = `
                <div class="modal fade" id="deleteSectionModal" tabindex="-1" aria-labelledby="deleteSectionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-danger text-white">
                                <h5 class="modal-title" id="deleteSectionModalLabel">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                    Delete Section
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning d-flex align-items-center" role="alert">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>
                                        <strong>Warning: This action cannot be undone!</strong>
                                    </div>
                                </div>
                                <p>Are you sure you want to delete the section:</p>
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6 class="card-title mb-1">
                                            <i class="bi bi-bookmark-fill text-danger me-2"></i>
                                            ${sectionName}
                                        </h6>
                                        <small class="text-muted">This will permanently remove the section and may affect associated students.</small>
                                    </div>
                                </div>
                                <p class="mt-3 mb-0 text-muted">This action will:</p>
                                <ul class="text-muted small">
                                    <li>Permanently delete the section from the database</li>
                                    <li>Remove section assignments from all students in this section</li>
                                    <li>Remove section assignments from assigned teachers</li>
                                    <li>Clean up all related data and relationships</li>
                                </ul>
                                <div class="alert alert-info mt-3" role="alert">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <strong>Note:</strong> Student and teacher profiles will remain intact - only their section assignments will be removed.
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-lg me-1"></i>Cancel
                                </button>
                                <button type="button" class="btn btn-danger" onclick="deleteSection(\`${sectionName}\`, ${sectionIndex})" data-bs-dismiss="modal">
                                    <i class="bi bi-trash-fill me-1"></i>Delete Section
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // Remove existing modal if present
  const existingModal = document.getElementById("deleteSectionModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  setTimeout(() => {
    const modal = document.getElementById("deleteSectionModal");
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

function deleteSection(sectionName, sectionIndex) {
  // Show loading notification
  showNotification("Deleting section and related data...", "info", 3000);

  if (window.api && window.api.deleteEntity) {
    // Use the proper deleteEntity API
    window.api
      .deleteEntity({ type: "sections", data: { name: sectionName } })
      .then((result) => {
        if (result.success) {
          // Show detailed success message
          const message =
            result.message || `Section "${sectionName}" deleted successfully!`;
          showNotification(message, "success", 6000);

          // Show additional info about related data updates
          if (result.studentsUpdated || result.teachersUpdated) {
            setTimeout(() => {
              const updateInfo = [];
              if (result.studentsUpdated > 0) {
                updateInfo.push(`${result.studentsUpdated} student(s) updated`);
              }
              if (result.teachersUpdated > 0) {
                updateInfo.push(`${result.teachersUpdated} teacher(s) updated`);
              }
              if (updateInfo.length > 0) {
                showNotification(
                  `Related data updated: ${updateInfo.join(", ")}`,
                  "info",
                  4000
                );
              }
            }, 2000);
          }

          // Reload the sections to reflect changes
          loadAllSections();
        } else {
          const errorMsg = result.error || "Unknown error occurred";
          showNotification(
            `Error deleting section: ${errorMsg}`,
            "error",
            6000
          );
        }
      })
      .catch((error) => {
        showNotification(`Failed to delete section: ${error}`, "error", 6000);
        console.error("Error deleting section:", error);
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

async function loadStudentCountsForSections(sections) {
  if (!window.api || !window.api.getStudents) {
    // Return sections as-is if students API not available
    return sections;
  }

  try {
    const studentsResult = await window.api.getStudents();
    if (studentsResult.success && Array.isArray(studentsResult.students)) {
      // Add student count to each section
      return sections.map((section) => {
        const sectionName =
          typeof section === "string" ? section : section.name || "";
        const studentCount = studentsResult.students.filter(
          (student) => student.section === sectionName
        ).length;

        if (typeof section === "object") {
          return { ...section, studentCount };
        } else {
          return { name: section, studentCount };
        }
      });
    } else {
      return sections;
    }
  } catch (error) {
    console.error("Error loading student counts:", error);
    return sections;
  }
}

function viewSectionDetails(sectionName, sectionIndex) {
  // Show loading notification
  showNotification("Loading section details...", "info", 2000);

  if (window.api && window.api.getSections) {
    window.api
      .getSections()
      .then((result) => {
        if (result.success && Array.isArray(result.sections)) {
          let section = null;
          // Prefer finding by name to be robust with filtered/paginated indices
          if (sectionName) {
            const target = sectionName.toString().toLowerCase();
            section =
              result.sections.find(
                (s) =>
                  (typeof s === "object" ? s.name || "" : s || "")
                    .toString()
                    .toLowerCase() === target
              ) || null;
          }
          // Fallback to index if name lookup fails and index is valid
          if (
            !section &&
            Number.isInteger(sectionIndex) &&
            sectionIndex >= 0 &&
            sectionIndex < result.sections.length
          ) {
            section = result.sections[sectionIndex];
          }
          if (section) {
            showSectionDetailsModal(section, sectionIndex);
          } else {
            showNotification("Section not found", "error", 4000);
          }
        } else {
          showNotification("Error loading section details", "error", 4000);
        }
      })
      .catch((error) => {
        showNotification("Failed to load section details", "error", 4000);
        console.error("Error loading section details:", error);
      });
  } else {
    showNotification("API not available", "error", 4000);
  }
}

function showSectionDetailsModal(section, sectionIndex) {
  const sectionName =
    typeof section === "string" ? section : section.name || "Unknown Section";
  const modalHtml = `
                <div class="modal fade" id="sectionDetailsModal" tabindex="-1" aria-labelledby="sectionDetailsModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title" id="sectionDetailsModalLabel">
                                    <i class="bi bi-bookmark-fill me-2"></i>
                                    Section Details: ${sectionName}
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="card bg-light h-100">
                                            <div class="card-header bg-info text-white">
                                                <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Basic Information</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-3">
                                                    <strong><i class="bi bi-bookmark text-primary me-2"></i>Section Name:</strong>
                                                    <span class="ms-2">${sectionName}</span>
                                                </div>
                                                ${
                                                  typeof section === "object" &&
                                                  section.gradeLevel
                                                    ? `
                                                    <div class="mb-3">
                                                        <strong><i class="bi bi-mortarboard text-info me-2"></i>Grade Level:</strong>
                                                        <span class="ms-2 badge bg-info">Grade ${section.gradeLevel}</span>
                                                    </div>
                                                `
                                                    : ""
                                                }
                                                ${
                                                  typeof section === "object" &&
                                                  section.teacher
                                                    ? `
                                                    <div class="mb-3">
                                                        <strong><i class="bi bi-person-fill text-success me-2"></i>Assigned Teacher:</strong>
                                                        <span class="ms-2">${section.teacher}</span>
                                                    </div>
                                                `
                                                    : ""
                                                }
                                                <div class="mb-0">
                                                    <strong><i class="bi bi-hash text-muted me-2"></i>Section Index:</strong>
                                                    <span class="ms-2 badge bg-secondary">#${
                                                      sectionIndex + 1
                                                    }</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card bg-light h-100">
                                            <div class="card-header bg-success text-white">
                                                <h6 class="mb-0"><i class="bi bi-people me-2"></i>Student Information</h6>
                                            </div>
                                            <div class="card-body" id="sectionStudentsContainer">
                                                <div class="text-center">
                                                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                                                        <span class="visually-hidden">Loading students...</span>
                                                    </div>
                                                    <p class="mt-2 text-muted small">Loading students...</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${
                                  typeof section === "object"
                                    ? `
                                    <div class="row mt-3">
                                        <div class="col-12">
                                            <div class="card bg-light">
                                                <div class="card-header bg-warning text-dark">
                                                    <h6 class="mb-0"><i class="bi bi-gear me-2"></i>Additional Details</h6>
                                                </div>
                                                <div class="card-body">
                                                    ${
                                                      section.description
                                                        ? `
                                                        <div class="mb-2">
                                                            <strong><i class="bi bi-chat-text text-primary me-2"></i>Description:</strong>
                                                            <span class="ms-2">${section.description}</span>
                                                        </div>
                                                    `
                                                        : ""
                                                    }
                                                    ${
                                                      section.capacity
                                                        ? `
                                                        <div class="mb-2">
                                                            <strong><i class="bi bi-people-fill text-info me-2"></i>Capacity:</strong>
                                                            <span class="ms-2 badge bg-info">${section.capacity} students</span>
                                                        </div>
                                                    `
                                                        : ""
                                                    }
                                                    ${
                                                      section.createdDate
                                                        ? `
                                                        <div class="mb-0">
                                                            <strong><i class="bi bi-calendar-plus text-success me-2"></i>Created:</strong>
                                                            <span class="ms-2">${new Date(
                                                              section.createdDate
                                                            ).toLocaleDateString()}</span>
                                                        </div>
                                                    `
                                                        : ""
                                                    }
                                                    ${
                                                      !section.description &&
                                                      !section.capacity &&
                                                      !section.createdDate
                                                        ? `
                                                        <p class="text-muted mb-0 text-center">
                                                            <i class="bi bi-info-circle me-2"></i>
                                                            No additional details available
                                                        </p>
                                                    `
                                                        : ""
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-lg me-1"></i>Close
                                </button>
                                <button type="button" class="btn btn-primary" onclick="editSection('${sectionName}', ${sectionIndex}, ${JSON.stringify(
    section
  ).replace(/"/g, "&quot;")})">
                                    <i class="bi bi-pencil me-1"></i>Edit Section
                                </button>
                                <button type="button" class="btn btn-success" onclick="manageStudents('${sectionName}', ${JSON.stringify(
    section
  ).replace(/"/g, "&quot;")})">
                                    <i class="bi bi-people me-1"></i>Manage Students
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // Remove existing modal if present
  const existingModal = document.getElementById("sectionDetailsModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  setTimeout(() => {
    const modal = document.getElementById("sectionDetailsModal");
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();

      // Load students for this section
      loadSectionStudents(sectionName);

      // Remove modal from DOM when hidden
      modal.addEventListener("hidden.bs.modal", function () {
        modal.remove();
      });
    }
  }, 100);
}

function loadSectionStudents(sectionName) {
  const container = document.getElementById("sectionStudentsContainer");
  if (!container) return;

  if (window.api && window.api.getStudents) {
    window.api
      .getStudents()
      .then((result) => {
        if (result.success && Array.isArray(result.students)) {
          // Filter students for this section
          const sectionStudents = result.students.filter(
            (student) => student.section === sectionName
          );

          if (sectionStudents.length === 0) {
            container.innerHTML = `
                                <div class="text-center">
                                    <i class="bi bi-person-x display-4 text-muted mb-2"></i>
                                    <p class="text-muted mb-0">No students assigned</p>
                                    <small class="text-muted">This section has no students yet</small>
                                </div>
                            `;
          } else {
            // Store students globally for edit modal
            window.allStudentsData = result.students;
            let studentsHtml = `
                                <div class="mb-2">
                                    <strong><i class="bi bi-people-fill text-success me-2"></i>Students (${sectionStudents.length}):</strong>
                                </div>
                                <div class="list-group list-group-flush">
                            `;

            sectionStudents.forEach((student, index) => {
              studentsHtml += `
                                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-0">
                                        <div class="flex-grow-1">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <i class="bi bi-person text-primary me-2"></i>
                                                    <strong>${
                                                      student.name ||
                                                      "Unknown Student"
                                                    }</strong>
                                                    ${
                                                      student.registrationNo
                                                        ? `<br><small class="text-muted ms-3">ID: ${student.registrationNo}</small>`
                                                        : ""
                                                    }
                                                    ${
                                                      student.grade
                                                        ? `<br><small class="text-muted ms-3">Grade: ${student.grade}</small>`
                                                        : ""
                                                    }
                                                </div>
                                                <div class="btn-group" role="group" aria-label="Student actions">
                                                        <button type="button" class="btn btn-outline-info btn-sm" onclick="viewStudentDetails('${
                                                          student.id
                                                        }', '${student.name}')">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeStudentFromSection('${
                                                      student.id
                                                    }', '${
                student.name
              }', '${sectionName}')">
                                                        <i class="bi bi-person-dash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
            });

            studentsHtml += `</div>`;
            container.innerHTML = studentsHtml;
          }
        } else {
          container.innerHTML = `
                            <div class="text-center">
                                <i class="bi bi-exclamation-triangle text-warning"></i>
                                <p class="text-muted mb-0">Error loading students</p>
                            </div>
                        `;
        }
      })
      .catch((error) => {
        container.innerHTML = `
                        <div class="text-center">
                            <i class="bi bi-wifi-off text-danger"></i>
                            <p class="text-muted mb-0">Connection error</p>
                        </div>
                    `;
        console.error("Error loading students:", error);
      });
  } else {
    container.innerHTML = `
                    <div class="text-center">
                        <i class="bi bi-x-circle text-danger"></i>
                        <p class="text-muted mb-0">Students API not available</p>
                    </div>
                `;
  }
}

// Helper: populate teachers dropdown for the Edit Section modal
function loadTeachersForEdit(selectedTeacher) {
  const teacherSelect = document.getElementById("editSectionTeacher");
  if (!teacherSelect) return;

  // Keep the placeholder and remove existing options beyond the first
  while (teacherSelect.options.length > 1) {
    teacherSelect.remove(1);
  }

  if (window.api && window.api.getTeachers) {
    window.api
      .getTeachers()
      .then((result) => {
        if (result.success && Array.isArray(result.teachers)) {
          result.teachers.forEach((teacher) => {
            const name =
              typeof teacher === "object" ? teacher.name || "" : teacher || "";
            if (!name) return;
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            teacherSelect.appendChild(opt);
          });

          if (selectedTeacher) {
            const target = (selectedTeacher || "")
              .toString()
              .toLowerCase()
              .trim();
            const match = Array.from(teacherSelect.options).find(
              (o) => o.value.toLowerCase().trim() === target
            );
            if (match) teacherSelect.value = match.value;
          }
        } else {
          console.warn(
            "loadTeachersForEdit: Failed to load teachers",
            result.error
          );
        }
      })
      .catch((err) => {
        console.error("loadTeachersForEdit: Error loading teachers", err);
      });
  } else {
    console.warn("loadTeachersForEdit: Teachers API not available");
  }
}

function editSection(sectionName, sectionIndex, sectionData) {
  // Parse section data if it's a string
  let section = {};
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

  // Close all existing modals to prevent stacking
  closeAllModals();

  // Create edit section modal
  const modalHtml = `
                <div class="modal fade" id="editSectionModal" tabindex="-1" aria-labelledby="editSectionModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title" id="editSectionModalLabel">
                                    <i class="bi bi-pencil-square me-2"></i>Edit Section - ${
                                      section.name || sectionName
                                    }
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editSectionForm">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="editSectionName" class="form-label">
                                                    <i class="bi bi-bookmark me-1"></i>Section Name <span class="text-danger">*</span>
                                                </label>
                                                <input type="text" class="form-control" id="editSectionName" name="sectionName" 
                                                       value="${
                                                         section.name ||
                                                         sectionName
                                                       }" required>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="editGradeLevel" class="form-label">
                                                    <i class="bi bi-mortarboard me-1"></i>Grade Level <span class="text-danger">*</span>
                                                </label>
                                                <select class="form-select" id="editGradeLevel" name="gradeLevel" required>
                                                    <option value="">Choose Grade Level...</option>
                                                    <option value="7" ${
                                                      section.gradeLevel == "7"
                                                        ? "selected"
                                                        : ""
                                                    }>Grade 7</option>
                                                    <option value="8" ${
                                                      section.gradeLevel == "8"
                                                        ? "selected"
                                                        : ""
                                                    }>Grade 8</option>
                                                    <option value="9" ${
                                                      section.gradeLevel == "9"
                                                        ? "selected"
                                                        : ""
                                                    }>Grade 9</option>
                                                    <option value="10" ${
                                                      section.gradeLevel == "10"
                                                        ? "selected"
                                                        : ""
                                                    }>Grade 10</option>
                                                    <option value="11" ${
                                                      section.gradeLevel == "11"
                                                        ? "selected"
                                                        : ""
                                                    }>Grade 11</option>
                                                    <option value="12" ${
                                                      section.gradeLevel == "12"
                                                        ? "selected"
                                                        : ""
                                                    }>Grade 12</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editSectionTeacher" class="form-label">
                                            <i class="bi bi-person-badge me-1"></i>Class Teacher <span class="text-danger">*</span>
                                        </label>
                                        <select class="form-select" id="editSectionTeacher" name="sectionTeacher" required>
                                            <option value="">Choose Teacher...</option>
                                        </select>
                                        <div class="form-text">
                                            <i class="bi bi-info-circle me-1"></i>
                                            Select the teacher who will be responsible for this section
                                        </div>
                                    </div>
                                    <input type="hidden" id="originalSectionName" value="${
                                      section.name || sectionName
                                    }">
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" >
                                    <i class="bi bi-x-lg me-1"></i>Cancel
                                </button>
                                <button type="submit" form="editSectionForm" class="btn btn-warning">
                                    <i class="bi bi-check-lg me-1"></i>Update Section
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // Remove existing modal if present
  const existingModal = document.getElementById("editSectionModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Load teachers for dropdown
  loadTeachersForEdit(section.teacher);

  // Show modal
  setTimeout(() => {
    const modal = document.getElementById("editSectionModal");
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();

      // Add form submission handler
      document
        .getElementById("editSectionForm")
        .addEventListener("submit", function (ev) {
          ev.preventDefault();
          updateSection(ev.target, section);
        });

      // Remove modal from DOM when hidden
      modal.addEventListener("hidden.bs.modal", function () {
        modal.remove();
      });
    }
  }, 100);
}

function updateSection(form, originalSection) {
  const formData = new FormData(form);
  const originalSectionName = form.originalSectionName.value;
  const newSectionName = formData.get("sectionName").trim();
  const newGradeLevel = formData.get("gradeLevel");
  const newTeacher = formData.get("sectionTeacher");

  // Check if form is already being submitted
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton && submitButton.disabled) {
    return;
  }

  // Disable submit button to prevent double submission
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="bi bi-hourglass-split me-2"></i>Updating...';
  }

  // Validate required fields
  if (!newSectionName || !newGradeLevel || !newTeacher) {
    showNotification("Please fill in all required fields", "error", 4000);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML =
        '<i class="bi bi-check-lg me-1"></i>Update Section';
    }
    return;
  }

  // Check if anything actually changed
  if (
    originalSectionName === newSectionName &&
    originalSection &&
    originalSection.gradeLevel === newGradeLevel &&
    originalSection.teacher === newTeacher
  ) {
    showNotification("No changes were made", "info", 3000);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML =
        '<i class="bi bi-check-lg me-1"></i>Update Section';
    }
    return;
  }

  // Use reliable update method: delete and recreate
  performSectionUpdate(
    originalSectionName,
    newSectionName,
    newGradeLevel,
    newTeacher,
    submitButton
  );
}

function performSectionUpdate(
  originalName,
  newName,
  gradeLevel,
  teacher,
  submitButton
) {
  if (!window.api || !window.api.deleteEntity || !window.api.createEntity) {
    showNotification("Section update API not available", "error", 4000);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML =
        '<i class="bi bi-check-lg me-1"></i>Update Section';
    }
    return;
  }

  showNotification("Updating section...", "info", 2000);

  // Step 1: Delete the original section
  window.api
    .deleteEntity({ type: "sections", data: { name: originalName } })
    .then((deleteResult) => {
      if (deleteResult.success) {
        // Step 2: Create the updated section
        const newSectionData = {
          name: newName,
          gradeLevel: gradeLevel,
          teacher: teacher,
        };

        window.api
          .createEntity({ type: "sections", data: newSectionData })
          .then((createResult) => {
            if (createResult.success) {
              // Success!
              showNotification(
                "Section updated successfully!",
                "success",
                4000
              );

              // Close the modal
              const modal = document.getElementById("editSectionModal");
              if (modal) {
                const bootstrapModal = bootstrap.Modal.getInstance(modal);
                if (bootstrapModal) {
                  bootstrapModal.hide();
                }
              }

              // Reload all sections to show updated data
              setTimeout(() => {
                loadAllSections();
                showNotification(
                  "Section has been updated successfully",
                  "success",
                  3000
                );
              }, 500);
            } else {
              // Create failed - try to restore original
              console.error(
                "Failed to create updated section:",
                createResult.error
              );
              restoreOriginalSection(
                originalName,
                gradeLevel,
                teacher,
                "Failed to update section: " +
                  (createResult.error || "Unknown error")
              );

              if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML =
                  '<i class="bi bi-check-lg me-1"></i>Update Section';
              }
            }
          })
          .catch((createError) => {
            console.error("Error creating updated section:", createError);
            // Try to restore original section
            restoreOriginalSection(
              originalName,
              gradeLevel,
              teacher,
              "Error creating updated section. Attempting to restore original."
            );

            if (submitButton) {
              submitButton.disabled = false;
              submitButton.innerHTML =
                '<i class="bi bi-check-lg me-1"></i>Update Section';
            }
          });
      } else {
        // Delete failed
        console.error("Failed to delete original section:", deleteResult.error);
        showNotification(
          "Failed to update section: " +
            (deleteResult.error || "Could not modify original section"),
          "error",
          6000
        );

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML =
            '<i class="bi bi-check-lg me-1"></i>Update Section';
        }
      }
    })
    .catch((deleteError) => {
      console.error("Error deleting original section:", deleteError);
      showNotification(
        "Error updating section: " + deleteError.message,
        "error",
        4000
      );

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML =
          '<i class="bi bi-check-lg me-1"></i>Update Section';
      }
    });
}

function restoreOriginalSection(
  originalName,
  gradeLevel,
  teacher,
  errorMessage
) {
  window.api
    .createEntity({
      type: "sections",
      data: {
        name: originalName,
        gradeLevel: gradeLevel,
        teacher: teacher,
      },
    })
    .then((restoreResult) => {
      if (restoreResult.success) {
        showNotification(
          errorMessage + " Original section has been restored.",
          "warning",
          8000
        );
      } else {
        showNotification(
          "CRITICAL: " +
            errorMessage +
            " Could not restore original section. Please contact administrator.",
          "error",
          10000
        );
      }
    })
    .catch((restoreError) => {
      console.error("Failed to restore original section:", restoreError);
      showNotification(
        "CRITICAL: Section update failed and original section could not be restored. Please contact administrator immediately.",
        "error",
        10000
      );
    });
}
