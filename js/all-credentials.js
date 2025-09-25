// Student Login Management Functions
    let allStudentCredentials = []; // Store all credentials for filtering
    // Pagination state for Student Manage Login
    window.studentCredPage = window.studentCredPage || 1;
    window.studentCredPageSize = window.studentCredPageSize || 25; // default page size matches All Students
    window.studentFilteredCredentials = window.studentFilteredCredentials || [];

        function loadStudentCredentials() {
            // Render search bar above credentials container, matching teacher markup
            const credentialsContainer = document.getElementById('credentialsContainer');
            if (credentialsContainer && !document.getElementById('studentCredentialSearchInput')) {
                const searchBarDiv = document.createElement('div');
                searchBarDiv.className = 'row mb-4';
                searchBarDiv.id = 'studentSearchFilterSection';
                searchBarDiv.style.display = '';
                searchBarDiv.innerHTML = `
                    <div class='col-md-12'>
                        <div class='input-group'>
                            <span class='input-group-text bg-light'>
                                <i class='bi bi-search text-primary'></i>
                            </span>
                            <input type='text' 
                                   class='form-control' 
                                   id='studentCredentialSearchInput'
                                   placeholder='Search by name, username, or account type...'
                                   autocomplete='off'>
                            <button class='btn btn-outline-secondary' 
                                    type='button' 
                                    id='studentClearSearchBtn'
                                    title='Clear search'>
                                <i class='bi bi-x-lg'></i>
                            </button>
                        </div>
                    </div>
                `;
                credentialsContainer.parentNode.insertBefore(searchBarDiv, credentialsContainer);
            }

            function renderFilteredStudentCredentials() {
                let filtered = allStudentCredentials;
                if (window.studentSearchTerm && window.studentSearchTerm.trim() !== '') {
                    const searchTerm = window.studentSearchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
                    filtered = allStudentCredentials.filter(cred => {
                        const name = (cred.name || '').toLowerCase();
                        const username = (cred.username || '').toLowerCase();
                        const type = (cred.type || 'student').toLowerCase();
                        return name.includes(searchTerm) || username.includes(searchTerm) || type.includes(searchTerm);
                    });
                }
                // Reset to first page if current page exceeds total pages after filtering
                window.studentFilteredCredentials = filtered;
                displayCredentials(filtered);
            }

            // Attach event listener once
            setTimeout(() => {
                const searchInput = document.getElementById('studentCredentialSearchInput');
                const clearBtn = document.getElementById('studentClearSearchBtn');
                if (searchInput) {
                    searchInput.value = window.studentSearchTerm || '';
                    searchInput.oninput = function () {
                        window.studentSearchTerm = searchInput.value;
                        window.studentCredPage = 1; // reset page on new search
                        renderFilteredStudentCredentials();
                    };
                }
                if (clearBtn && searchInput) {
                    clearBtn.addEventListener('click', function () {
                        searchInput.value = '';
                        window.studentSearchTerm = '';
                        window.studentCredPage = 1;
                        renderFilteredStudentCredentials();
                    });
                }
            }, 0);

            window.studentSearchTerm = '';
            renderFilteredStudentCredentials();
            const container = document.getElementById('credentialsContainer');
            if (!container) return;

            // Show loading state
            container.innerHTML = `
                <div class='text-center py-4'>
                    <div class='spinner-border text-primary' role='status'>
                        <span class='visually-hidden'>Loading...</span>
                    </div>
                    <p class='mt-2 text-muted'>Loading student credentials...</p>
                </div>
            `;

                        if (window.api && window.api.getCredentials) {
                                Promise.all([
                                    window.api.getCredentials(),
                                    window.api.getStudents ? window.api.getStudents() : Promise.resolve({ success: false })
                                ]).then(([credentialsResult, studentsResult]) => {
                    if (credentialsResult.success && Array.isArray(credentialsResult.credentials)) {
                                                // Build map username -> profilePictureUrl from students
                                                let studentPhotoMap = {};
                                                if (studentsResult && studentsResult.success && Array.isArray(studentsResult.students)) {
                                                    studentsResult.students.forEach(stu => {
                                                        if (stu.username && stu.profilePictureUrl) {
                                                            studentPhotoMap[stu.username.toLowerCase()] = stu.profilePictureUrl;
                                                        }
                                                    });
                                                }
                        // Filter to show only student credentials using the 'type' field
                        const excludePatterns = ['admin', 'administrator', 'teacher', 'staff', 'system', 'root', 'user'];
                        const studentPatterns = ['student', 'stud', 'pupil', 'learner'];
                        const studentCredentials = credentialsResult.credentials.filter(credential => {
                            // If type is present and is 'student'
                            if (credential.type && credential.type.toLowerCase() === 'student') {
                                return true;
                            }
                            // Fallback: Include if username or name contains student patterns, and exclude system/teacher accounts
                            const username = (credential.username || '').toLowerCase();
                            const name = (credential.name || '').toLowerCase();
                            const isSystemAccount = excludePatterns.some(pattern =>
                                username.includes(pattern) || name.includes(pattern)
                            );
                            const isStudentAccount = studentPatterns.some(pattern =>
                                username.includes(pattern) || name.includes(pattern)
                            );
                            return isStudentAccount && !isSystemAccount;
                        });

                        // Show only student credentials; if none, render in-table empty state
                        allStudentCredentials = studentCredentials;
                        window.studentSearchTerm = '';
                        function renderFilteredStudentCredentials() {
                            let filtered = allStudentCredentials;
                            if (window.studentSearchTerm && window.studentSearchTerm.trim() !== '') {
                                const searchTerm = window.studentSearchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
                                filtered = allStudentCredentials.filter(cred => {
                                    const name = (cred.name || '').toLowerCase();
                                    const username = (cred.username || '').toLowerCase();
                                    const type = (cred.type || 'student').toLowerCase();
                                    // Match if search term is in name, username, or type
                                    return name.includes(searchTerm) || username.includes(searchTerm) || type.includes(searchTerm);
                                });
                            }
                            window.studentFilteredCredentials = filtered;
                            displayCredentials(filtered, studentPhotoMap);
                            // Re-attach event listener after rendering
                            setTimeout(() => {
                                const searchInput = document.getElementById('studentCredentialSearchInput');
                                const clearBtn = document.getElementById('studentClearSearchBtn');
                                if (searchInput) {
                                    searchInput.value = window.studentSearchTerm;
                                    searchInput.oninput = function () {
                                        window.studentSearchTerm = searchInput.value;
                                        window.studentCredPage = 1;
                                        renderFilteredStudentCredentials();
                                    };
                                }
                                if (clearBtn && searchInput) {
                                    clearBtn.addEventListener('click', function () {
                                        searchInput.value = '';
                                        window.studentSearchTerm = '';
                                        window.studentCredPage = 1;
                                        renderFilteredStudentCredentials();
                                    });
                                }
                            }, 0);
                        }
                        renderFilteredStudentCredentials();


                    } else {
                        container.innerHTML = `
                            <div class='text-center py-5'>
                                <i class='bi bi-exclamation-triangle display-1 text-warning mb-3'></i>
                                <h5 class='text-warning'>Error Loading Credentials</h5>
                                <p class='text-muted mb-4'>${credentialsResult.error || 'Failed to load credentials from the database.'}</p>
                                <button class='btn btn-outline-primary' onclick='loadStudentCredentials()'>
                                    <i class='bi bi-arrow-clockwise me-2'></i>Try Again
                                </button>
                            </div>
                        `;
                    }
                }).catch(error => {
                    container.innerHTML = `
                        <div class='text-center py-5'>
                            <i class='bi bi-wifi-off display-1 text-danger mb-3'></i>
                            <h5 class='text-danger'>Connection Error</h5>
                            <p class='text-muted mb-4'>Unable to connect to the database. Please check your connection.</p>
                            <button class='btn btn-outline-primary' onclick='loadStudentCredentials()'>
                                <i class='bi bi-arrow-clockwise me-2'></i>Retry
                            </button>
                        </div>
                    `;
                    console.error('Error loading credentials:', error);
                });
            } else {
                container.innerHTML = `
                    <div class='text-center py-5'>
                        <i class='bi bi-x-circle display-1 text-danger mb-3'></i>
                        <h5 class='text-danger'>API Not Available</h5>
                        <p class='text-muted mb-4'>The credentials API is not available. Please check your system configuration.</p>
                    </div>
                `;
            }
        }

        function displayCredentials(credentials, studentPhotoMap) {
            const container = document.getElementById('credentialsContainer');
            if (!container) return;

            // Pagination calculations
            const totalItems = Array.isArray(credentials) ? credentials.length : 0;
            const pageSize = Math.max(1, parseInt(window.studentCredPageSize || 10, 10));
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            let currentPage = Math.min(Math.max(1, parseInt(window.studentCredPage || 1, 10)), totalPages);
            window.studentCredPage = currentPage;

            const startIndex = (currentPage - 1) * pageSize;
            const endIndexExclusive = Math.min(startIndex + pageSize, totalItems);
            const pageItems = totalItems > 0 ? credentials.slice(startIndex, endIndexExclusive) : [];
            const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
            const showingTo = totalItems === 0 ? 0 : endIndexExclusive;

                        let credentialsHtml = `
                                <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                                    <div class="d-flex align-items-center gap-2">
                                        <label class="form-label mb-0 small text-muted">Rows per page:</label>
                                        <select id="studentCredPageSizeSelect" class="form-select form-select-sm" style="width:auto;">
                                            <option value="10" ${pageSize===10?"selected":""}>10</option>
                                            <option value="25" ${pageSize===25?"selected":""}>25</option>
                                            <option value="50" ${pageSize===50?"selected":""}>50</option>
                                            <option value="100" ${pageSize===100?"selected":""}>100</option>
                                        </select>
                                    </div>
                                    <div class="text-muted small" id="studentCredRangeInfo">Showing ${showingFrom}-${showingTo} of ${totalItems}</div>
                                </div>
                                <div class='table-responsive'>
                    <table class='table table-hover align-middle'>
                        <thead class='table-dark'>
                            <tr>
                                <th scope='col' style='width: 5%;'>#</th>
                                <th scope='col' style='width: 30%;'>
                                    <i class='bi bi-person-fill me-2'></i>Student
                                </th>
                                <th scope='col' style='width: 25%;'>
                                    <i class='bi bi-person-badge me-2'></i>Username
                                </th>
                                <th scope='col' style='width: 30%;'>
                                    <i class='bi bi-key-fill me-2'></i>Password
                                </th>
                                <th scope='col' style='width: 15%;'>
                                    <i class='bi bi-gear-fill me-2'></i>Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            // Search bar event listener is set in loadStudentCredentials after rendering
                        if (!credentials || credentials.length === 0) {
                credentialsHtml += `
                  <tr>
                    <td colspan="5" class="text-center py-5">
                      <div class="d-flex flex-column align-items-center">
                        <i class="bi bi-people text-muted" style="font-size:2.2rem;"></i>
                        <h6 class="mt-2 mb-1">No students found</h6>
                        <p class="text-muted small mb-3">Add a student to create login credentials.</p>
                        <button class="btn btn-primary" onclick='document.getElementById("addStudentLink").click()'>
                          <i class="bi bi-person-plus me-2"></i>Add Student
                        </button>
                      </div>
                    </td>
                  </tr>`;
            } else {
                                pageItems.forEach((credential, idx) => {
                                        const index = startIndex + idx;
                    const maskedPassword = '*'.repeat(credential.password.length);
                    const photoUrl = studentPhotoMap && credential.username ? studentPhotoMap[credential.username.toLowerCase()] : null;
                    let avatarHtml;
                    if (photoUrl) {
                      avatarHtml = `<div class='student-avatar-wrapper me-3' style='width:40px;height:40px;'><img src='${photoUrl}' class='student-avatar-img' style='width:40px;height:40px;border-radius:50%;object-fit:cover;' onerror="this.onerror=null;this.replaceWith('<div class=\\'bg-primary text-white rounded-circle d-flex align-items-center justify-content-center\\' style=\\'width:40px;height:40px;font-weight:600;font-size:14px;\\'>${credential.name.charAt(0).toUpperCase()}</div>');" alt='Avatar'></div>`;
                    } else {
                      avatarHtml = `<div class='bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3' style='width:40px;height:40px;font-weight:600;font-size:14px;'>${credential.name.charAt(0).toUpperCase()}</div>`;
                    }

                    credentialsHtml += `
                        <tr>
                            <td class='text-muted fw-bold'>${index + 1}</td>
                            <td>
                                <div class='d-flex align-items-center'>
                                    ${avatarHtml}
                                    <div>
                                        <div class='fw-semibold'>${credential.name}</div>
                                        <small class='text-muted'>
                                            ${credential.type ? credential.type.charAt(0).toUpperCase() + credential.type.slice(1) : 'Student'}
                                        </small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class='input-group input-group-sm'>
                                    <span class='input-group-text bg-light'>
                                        <i class='bi bi-person-badge text-primary'></i>
                                    </span>
                                    <input type='text' class='form-control bg-light' value='${credential.username}' readonly>
                                    <button class='btn btn-outline-secondary' type='button' onclick='copyToClipboard("${credential.username}", "Username")'>
                                        <i class='bi bi-clipboard'></i>
                                    </button>
                                </div>
                            </td>
                            <td>
                                <div class='input-group input-group-sm'>
                                    <span class='input-group-text bg-light'>
                                        <i class='bi bi-key text-warning'></i>
                                    </span>
                                    <input type='password' class='form-control bg-light password-field' 
                                           value='${credential.password}' 
                                           data-masked='${maskedPassword}' 
                                           data-real='${credential.password}' 
                                           readonly 
                                           id='password-${index}'>
                                    <button class='btn btn-outline-secondary password-toggle' 
                                            type='button' 
                                            onclick='togglePasswordVisibility(${index})' 
                                            data-visible='false'>
                                        <i class='bi bi-eye'></i>
                                    </button>
                                    <button class='btn btn-outline-secondary' 
                                            type='button' 
                                            onclick='copyToClipboard("${credential.password}", "Password")'>
                                        <i class='bi bi-clipboard'></i>
                                    </button>
                                </div>
                            </td>
                            <td>
                                <div class='d-flex gap-1'>
                                    <button class='btn btn-sm btn-primary' 
                                            onclick='editCredential("${credential.username}", "${credential.name}", "${credential.password}")' 
                                            title='Edit Credential'>
                                        <i class='bi bi-pencil'></i>
                                    </button>
                                    <button class='btn btn-sm btn-info' 
                                            onclick='viewCredentialDetails("${credential.username}", "${credential.name}", "${credential.password}", "${credential.type || 'student'}")' 
                                            title='View Details'>
                                        <i class='bi bi-eye'></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }

                        credentialsHtml += `
                                    </tbody>
                                </table>
                            </div>
                            <div class='d-flex justify-content-between align-items-center flex-wrap gap-2 border-top py-2 mt-2'>
                              <div class='pagination mb-0' id='studentCredPagination'></div>
                              <div class='text-muted small'>Total Credentials: <strong id='studentCredTotalCount'>${totalItems}</strong></div>
                            </div>
            `;

            container.innerHTML = credentialsHtml;
                        // Wire page-size selector (top controls)
                        const pageSizeSelect = document.getElementById('studentCredPageSizeSelect');
                        if (pageSizeSelect) {
                            pageSizeSelect.addEventListener('change', function () {
                                const val = parseInt(this.value, 10);
                                window.studentCredPageSize = isNaN(val) ? 25 : val;
                                window.studentCredPage = 1;
                                const data = Array.isArray(window.studentFilteredCredentials) ? window.studentFilteredCredentials : credentials;
                                displayCredentials(data, studentPhotoMap);
                            });
                        }
                        // Range info and total count already set in HTML; build pagination controls like All Students
                        const pagEl = document.getElementById('studentCredPagination');
                        if (pagEl) {
                            pagEl.innerHTML = buildStudentCredPaginationControls(totalPages, currentPage);
                            pagEl.querySelectorAll('[data-page]').forEach(btn => {
                                btn.addEventListener('click', (e) => {
                                    const target = parseInt(e.currentTarget.getAttribute('data-page'), 10);
                                    if (!isNaN(target) && target >= 1 && target <= totalPages && target !== window.studentCredPage) {
                                        window.studentCredPage = target;
                                        const data = Array.isArray(window.studentFilteredCredentials) ? window.studentFilteredCredentials : credentials;
                                        displayCredentials(data, studentPhotoMap);
                                    }
                                });
                            });
                        }
        }

                    function buildStudentCredPaginationControls(totalPages, currentPage) {
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
                        if (end > totalPages) { end = totalPages; start = Math.max(1, end - windowSize + 1); }
                        if (start > 1) parts.push('<span class="mx-1">...</span>');
                        for (let p = start; p <= end; p++) {
                            parts.push(btn(p, p, false, p === currentPage));
                        }
                        if (end < totalPages) parts.push('<span class="mx-1">...</span>');
                        parts.push(btn('›', Math.min(totalPages, currentPage + 1), currentPage === totalPages));
                        parts.push(btn('»', totalPages, currentPage === totalPages));
                        return parts.join('');
                    }

        function togglePasswordVisibility(index) {
            const passwordField = document.getElementById(`password-${index}`);
            const toggleButton = passwordField.nextElementSibling;
            const icon = toggleButton.querySelector('i');
            const isVisible = toggleButton.getAttribute('data-visible') === 'true';

            if (isVisible) {
                // Hide password
                passwordField.type = 'password';
                passwordField.value = passwordField.getAttribute('data-masked');
                icon.className = 'bi bi-eye';
                toggleButton.setAttribute('data-visible', 'false');
            } else {
                // Show password
                passwordField.type = 'text';
                passwordField.value = passwordField.getAttribute('data-real');
                icon.className = 'bi bi-eye-slash';
                toggleButton.setAttribute('data-visible', 'true');
            }
        }

        function copyToClipboard(text, type) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => {
                    showNotification(`${type} copied to clipboard!`, 'success', 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    showNotification(`Failed to copy ${type.toLowerCase()}`, 'error', 3000);
                });
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showNotification(`${type} copied to clipboard!`, 'success', 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                    showNotification(`Failed to copy ${type.toLowerCase()}`, 'error', 3000);
                } finally {
                    document.body.removeChild(textArea);
                }
            }
        }

        // Teacher Login Management Functions
    let allTeacherCredentials = [];
    // Pagination state for Teacher Manage Login
    window.teacherCredPage = window.teacherCredPage || 1;
    window.teacherCredPageSize = window.teacherCredPageSize || 25; // match All Students default
    window.teacherFilteredCredentials = window.teacherFilteredCredentials || [];

        function loadTeacherCredentials() {
            // Render search bar above teacher credentials container, matching student markup
            const teacherCredentialsContainer = document.getElementById('teacherCredentialsContainer');
            if (teacherCredentialsContainer && !document.getElementById('teacherCredentialSearchInput')) {
                const searchBarDiv = document.createElement('div');
                searchBarDiv.className = 'row mb-4';
                searchBarDiv.id = 'teacherSearchFilterSection';
                searchBarDiv.style.display = '';
                searchBarDiv.innerHTML = `
                    <div class='col-md-12'>
                        <div class='input-group'>
                            <span class='input-group-text bg-light'>
                                <i class='bi bi-search text-primary'></i>
                            </span>
                            <input type='text' 
                                   class='form-control' 
                                   id='teacherCredentialSearchInput'
                                   placeholder='Search by name, username, or account type...'
                                   autocomplete='off'>
                            <button class='btn btn-outline-secondary' 
                                    type='button' 
                                    id='teacherClearSearchBtn'
                                    title='Clear search'>
                                <i class='bi bi-x-lg'></i>
                            </button>
                        </div>
                    </div>
                `;
                teacherCredentialsContainer.parentNode.insertBefore(searchBarDiv, teacherCredentialsContainer);
            }

            function renderFilteredTeacherCredentials() {
                let filtered = allTeacherCredentials;
                if (window.teacherSearchTerm && window.teacherSearchTerm.trim() !== '') {
                    const searchTerm = window.teacherSearchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
                    filtered = allTeacherCredentials.filter(cred => {
                        const name = (cred.name || '').toLowerCase();
                        const username = (cred.username || '').toLowerCase();
                        const type = (cred.type || 'teacher').toLowerCase();
                        return name.includes(searchTerm) || username.includes(searchTerm) || type.includes(searchTerm);
                    });
                }
                displayTeacherCredentials(filtered);
            }

            // Attach event listener once
            setTimeout(() => {
                const searchInput = document.getElementById('teacherCredentialSearchInput');
                const clearBtn = document.getElementById('teacherClearSearchBtn');
                if (searchInput) {
                    searchInput.value = window.teacherSearchTerm || '';
                    searchInput.oninput = function () {
                        window.teacherSearchTerm = searchInput.value;
                        renderFilteredTeacherCredentials();
                    };
                }
                if (clearBtn && searchInput) {
                    clearBtn.addEventListener('click', function () {
                        searchInput.value = '';
                        window.teacherSearchTerm = '';
                        renderFilteredTeacherCredentials();
                    });
                }
            }, 0);

            window.teacherSearchTerm = '';
            renderFilteredTeacherCredentials();
            const container = document.getElementById('teacherCredentialsContainer');
            if (!container) return;

            // Show loading state
            container.innerHTML = `
                <div class='text-center py-4'>
                    <div class='spinner-border text-primary' role='status'>
                        <span class='visually-hidden'>Loading...</span>
                    </div>
                    <p class='mt-2 text-muted'>Loading teacher credentials...</p>
                </div>
            `;

            if (window.api && window.api.getCredentials) {
                window.api.getCredentials().then(credentialsResult => {
                    if (credentialsResult.success && Array.isArray(credentialsResult.credentials)) {
                        // Filter to show only teacher credentials using the 'type' field
                        const excludePatterns = ['admin', 'administrator', 'student', 'staff', 'system', 'root', 'user'];
                        const teacherPatterns = ['teacher', 'faculty', 'prof', 'instructor'];
                        const teacherCredentials = credentialsResult.credentials.filter(credential => {
                            // If type is present and is 'teacher'
                            if (credential.type && credential.type.toLowerCase() === 'teacher') {
                                return true;
                            }
                            // Fallback: Include if username or name contains teacher patterns, and exclude system/student accounts
                            const username = (credential.username || '').toLowerCase();
                            const name = (credential.name || '').toLowerCase();
                            const isSystemAccount = excludePatterns.some(pattern =>
                                username.includes(pattern) || name.includes(pattern)
                            );
                            const isTeacherAccount = teacherPatterns.some(pattern =>
                                username.includes(pattern) || name.includes(pattern)
                            );
                            return isTeacherAccount && !isSystemAccount;
                        });

                        allTeacherCredentials = teacherCredentials;
                        // Always re-render filtered credentials after loading
                        function renderFilteredTeacherCredentials() {
                            let filtered = allTeacherCredentials;
                            if (window.teacherSearchTerm && window.teacherSearchTerm.trim() !== '') {
                                const searchTerm = window.teacherSearchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
                                filtered = allTeacherCredentials.filter(cred => {
                                    const name = (cred.name || '').toLowerCase();
                                    const username = (cred.username || '').toLowerCase();
                                    const type = (cred.type || 'teacher').toLowerCase();
                                    return name.includes(searchTerm) || username.includes(searchTerm) || type.includes(searchTerm);
                                });
                            }
                            window.teacherFilteredCredentials = filtered;
                            displayTeacherCredentials(filtered);
                            // Re-attach event listener after rendering
                            setTimeout(() => {
                                const searchInput = document.getElementById('teacherCredentialSearchInput');
                                const clearBtn = document.getElementById('teacherClearSearchBtn');
                                if (searchInput) {
                                    searchInput.value = window.teacherSearchTerm || '';
                                    searchInput.oninput = function () {
                                        window.teacherSearchTerm = searchInput.value;
                                        window.teacherCredPage = 1;
                                        renderFilteredTeacherCredentials();
                                    };
                                }
                                if (clearBtn && searchInput) {
                                    clearBtn.addEventListener('click', function () {
                                        searchInput.value = '';
                                        window.teacherSearchTerm = '';
                                        window.teacherCredPage = 1;
                                        renderFilteredTeacherCredentials();
                                    });
                                }
                            }, 0);
                        }
                        window.teacherSearchTerm = '';
                        renderFilteredTeacherCredentials();
                    } else {
                        container.innerHTML = `
                            <div class='text-center py-5'>
                                <i class='bi bi-exclamation-triangle display-1 text-warning mb-3'></i>
                                <h5 class='text-warning'>Error Loading Credentials</h5>
                                <p class='text-muted mb-4'>${credentialsResult.error || 'Failed to load credentials from the database.'}</p>
                                <button class='btn btn-outline-primary' onclick='loadTeacherCredentials()'>
                                    <i class='bi bi-arrow-clockwise me-2'></i>Retry
                                </button>
                            </div>
                        `;
                    }
                }).catch(error => {
                    container.innerHTML = `
                        <div class='text-center py-5'>
                            <i class='bi bi-wifi-off display-1 text-danger mb-3'></i>
                            <h5 class='text-danger'>Connection Error</h5>
                            <p class='text-muted mb-4'>Unable to connect to the database. Please check your connection.</p>
                            <button class='btn btn-outline-primary' onclick='loadTeacherCredentials()'>
                                <i class='bi bi-arrow-clockwise me-2'></i>Retry
                            </button>
                        </div>
                    `;
                    console.error('Error loading teacher credentials:', error);
                });
            } else {
                container.innerHTML = `
                    <div class='text-center py-5'>
                        <i class='bi bi-x-circle display-1 text-danger mb-3'></i>
                        <h5 class='text-danger'>API Not Available</h5>
                        <p class='text-muted mb-4'>The credentials API is not available. Please check your system configuration.</p>
                    </div>
                `;
            }
        }

        function displayTeacherCredentials(credentials) {
            const container = document.getElementById('teacherCredentialsContainer');
            if (!container) return;
            // Pagination calculations
            const totalItems = Array.isArray(credentials) ? credentials.length : 0;
            const pageSize = Math.max(1, parseInt(window.teacherCredPageSize || 25, 10));
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            let currentPage = Math.min(Math.max(1, parseInt(window.teacherCredPage || 1, 10)), totalPages);
            window.teacherCredPage = currentPage;
            const startIndex = (currentPage - 1) * pageSize;
            const endIndexExclusive = Math.min(startIndex + pageSize, totalItems);
            const pageItems = totalItems > 0 ? credentials.slice(startIndex, endIndexExclusive) : [];
            const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
            const showingTo = totalItems === 0 ? 0 : endIndexExclusive;

            let credentialsHtml = `
                <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                  <div class="d-flex align-items-center gap-2">
                    <label class="form-label mb-0 small text-muted">Rows per page:</label>
                    <select id="teacherCredPageSizeSelect" class="form-select form-select-sm" style="width:auto;">
                      <option value="10" ${pageSize===10?"selected":""}>10</option>
                      <option value="25" ${pageSize===25?"selected":""}>25</option>
                      <option value="50" ${pageSize===50?"selected":""}>50</option>
                      <option value="100" ${pageSize===100?"selected":""}>100</option>
                    </select>
                  </div>
                  <div class="text-muted small" id="teacherCredRangeInfo">Showing ${showingFrom}-${showingTo} of ${totalItems}</div>
                </div>
                <div class='table-responsive'>
                    <table class='table table-hover align-middle'>
                        <thead class='table-dark'>
                            <tr>
                                <th scope='col' style='width: 5%;'>#</th>
                                <th scope='col' style='width: 25%;'>
                                    <i class='bi bi-person-fill me-2'></i>Name
                                </th>
                                <th scope='col' style='width: 25%;'>
                                    <i class='bi bi-person-badge me-2'></i>Username
                                </th>
                                <th scope='col' style='width: 30%;'>
                                    <i class='bi bi-key-fill me-2'></i>Password
                                </th>
                                <th scope='col' style='width: 15%;'>
                                    <i class='bi bi-gear-fill me-2'></i>Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (!credentials || credentials.length === 0) {
                credentialsHtml += `
                  <tr>
                    <td colspan="5" class="text-center py-5">
                      <div class="d-flex flex-column align-items-center">
                        <i class="bi bi-people text-muted" style="font-size:2.2rem;"></i>
                        <h6 class="mt-2 mb-1">No teacher credentials found</h6>
                        <p class="text-muted small mb-3">Add a teacher to create login credentials.</p>
                        <button class="btn btn-primary" onclick='const l=document.getElementById("addTeachersLink"); if(l) l.click();'>
                          <i class="bi bi-person-plus me-2"></i>Add Teacher
                        </button>
                      </div>
                    </td>
                  </tr>`;
            } else {
                pageItems.forEach((credential, idx) => {
                    const rowIndex = startIndex + idx;
                    const maskedPassword = '*'.repeat(credential.password.length);
                    credentialsHtml += `
                        <tr>
                            <td class='text-muted fw-bold'>${rowIndex + 1}</td>
                            <td>
                                <div class='d-flex align-items-center'>
                                    <div class='bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3' 
                                         style='width: 40px; height: 40px; font-size: 14px; font-weight: bold;'>
                                        ${credential.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div class='fw-semibold'>${credential.name}</div>
                                        <small class='text-muted'>${credential.type || 'teacher'}</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class='input-group input-group-sm'>
                                    <span class='input-group-text bg-light'>
                                        <i class='bi bi-person-badge text-info'></i>
                                    </span>
                                    <input type='text' class='form-control bg-light' value='${credential.username}' readonly>
                                    <button class='btn btn-outline-secondary' type='button' onclick='copyToClipboard("${credential.username}", "Username")'>
                                        <i class='bi bi-clipboard'></i>
                                    </button>
                                </div>
                            </td>
                            <td>
                                <div class='input-group input-group-sm'>
                                    <span class='input-group-text bg-light'>
                                        <i class='bi bi-key text-warning'></i>
                                    </span>
                                    <input type='password' class='form-control bg-light password-field' 
                                           value='${credential.password}' 
                                           data-masked='${maskedPassword}' 
                                           data-real='${credential.password}' 
                                           readonly 
                                           id='teacher-password-${rowIndex}'>
                                    <button class='btn btn-outline-secondary password-toggle' 
                                            type='button' 
                                            onclick='toggleTeacherPasswordVisibility(${rowIndex})' 
                                            data-visible='false'>
                                        <i class='bi bi-eye'></i>
                                    </button>
                                    <button class='btn btn-outline-secondary' 
                                            type='button' 
                                            onclick='copyToClipboard("${credential.password}", "Password")'>
                                        <i class='bi bi-clipboard'></i>
                                    </button>
                                </div>
                            </td>
                            <td>
                                <div class='d-flex gap-1'>
                                    <button class='btn btn-sm btn-primary' 
                                            onclick='editTeacherCredential("${credential.username}", "${credential.name}", "${credential.password}")' 
                                            title='Edit Credential'>
                                        <i class='bi bi-pencil'></i>
                                    </button>
                                    <button class='btn btn-sm btn-info' 
                                            onclick='viewCredentialDetails("${credential.username}", "${credential.name}", "${credential.password}", "${credential.type || 'teacher'}")' 
                                            title='View Details'>
                                        <i class='bi bi-eye'></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }

            credentialsHtml += `
                        </tbody>
                    </table>
                </div>
                <div class='d-flex justify-content-between align-items-center flex-wrap gap-2 border-top py-2 mt-2'>
                    <div class='pagination mb-0' id='teacherCredPagination'></div>
                    <div class='text-muted small'>Total Credentials: <strong id='teacherCredTotalCount'>${totalItems}</strong></div>
                </div>
            `;

            container.innerHTML = credentialsHtml;

            // Wire page-size selector
            const pageSizeSelect = document.getElementById('teacherCredPageSizeSelect');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', function () {
                    const val = parseInt(this.value, 10);
                    window.teacherCredPageSize = isNaN(val) ? 25 : val;
                    window.teacherCredPage = 1;
                    const data = Array.isArray(window.teacherFilteredCredentials) ? window.teacherFilteredCredentials : credentials;
                    displayTeacherCredentials(data);
                });
            }
            // Build pagination controls
            const pagEl = document.getElementById('teacherCredPagination');
            if (pagEl) {
                pagEl.innerHTML = buildTeacherCredPaginationControls(totalPages, currentPage);
                pagEl.querySelectorAll('[data-page]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const target = parseInt(e.currentTarget.getAttribute('data-page'), 10);
                        if (!isNaN(target) && target >= 1 && target <= totalPages && target !== window.teacherCredPage) {
                            window.teacherCredPage = target;
                            const data = Array.isArray(window.teacherFilteredCredentials) ? window.teacherFilteredCredentials : credentials;
                            displayTeacherCredentials(data);
                        }
                    });
                });
            }
        }

        function buildTeacherCredPaginationControls(totalPages, currentPage) {
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
            if (end > totalPages) { end = totalPages; start = Math.max(1, end - windowSize + 1); }
            if (start > 1) parts.push('<span class="mx-1">...</span>');
            for (let p = start; p <= end; p++) {
                parts.push(btn(p, p, false, p === currentPage));
            }
            if (end < totalPages) parts.push('<span class="mx-1">...</span>');
            parts.push(btn('›', Math.min(totalPages, currentPage + 1), currentPage === totalPages));
            parts.push(btn('»', totalPages, currentPage === totalPages));
            return parts.join('');
        }



        function toggleTeacherPasswordVisibility(index) {
            const passwordField = document.getElementById(`teacher-password-${index}`);
            const toggleButton = passwordField.nextElementSibling;
            const icon = toggleButton.querySelector('i');
            const isVisible = toggleButton.getAttribute('data-visible') === 'true';
            if (isVisible) {
                passwordField.type = 'password';
                passwordField.value = passwordField.getAttribute('data-masked');
                icon.className = 'bi bi-eye';
                toggleButton.setAttribute('data-visible', 'false');
            } else {
                passwordField.type = 'text';
                passwordField.value = passwordField.getAttribute('data-real');
                icon.className = 'bi bi-eye-slash';
                toggleButton.setAttribute('data-visible', 'true');
            }
        }


        function editTeacherCredential(username, name, password) {
            closeAllModals();
            const modalHtml = `
                <div class="modal fade" id="editTeacherCredentialModal" tabindex="-1" aria-labelledby="editTeacherCredentialModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title" id="editTeacherCredentialModalLabel">Edit Teacher Password</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editTeacherCredentialForm">
                                    <div class="mb-3">
                                        <label for="editTeacherPasswordInput" class="form-label">New Password</label>
                                        <div class="input-group">
                                            <input type="password" class="form-control" id="editTeacherPasswordInput" value="${password}" required>
                                            <button class="btn btn-outline-secondary" type="button" id="toggleEditTeacherPasswordBtn">
                                                <i class="bi bi-eye" id="editTeacherPasswordIcon"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Save</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const existingModal = document.getElementById('editTeacherCredentialModal');
            if (existingModal) {
                existingModal.remove();
            }
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            setTimeout(() => {
                const modal = document.getElementById('editTeacherCredentialModal');
                if (modal) {
                    const bootstrapModal = new bootstrap.Modal(modal);
                    bootstrapModal.show();
                    const form = document.getElementById('editTeacherCredentialForm');
                    form.addEventListener('submit', function (ev) {
                        ev.preventDefault();
                        const passwordEl = document.getElementById('editTeacherPasswordInput');
                        const newPassword = (passwordEl.value || '').trim();
                        if (!newPassword) {
                            showNotification('Password cannot be empty.', 'error', 4000);
                            passwordEl.focus();
                            return;
                        }
                        if (window.api && typeof window.api.updateCredentialPassword === 'function') {
                            window.api.updateCredentialPassword({ username, newPassword }).then(result => {
                                if (result && result.success) {
                                    showNotification('Password updated successfully!', 'success', 3000);
                                    bootstrapModal.hide();
                                    if (typeof loadTeacherCredentials === 'function') loadTeacherCredentials();
                                } else {
                                    showNotification('Failed to update password.' + (result && result.error ? ' ' + result.error : ''), 'error', 4500);
                                }
                            }).catch(err => {
                                console.error('Error updating teacher password:', err);
                                showNotification('Error updating password.', 'error', 4000);
                            });
                        } else {
                            showNotification('Password update API not available.', 'error', 4000);
                        }
                    });
                    document.getElementById('toggleEditTeacherPasswordBtn').addEventListener('click', function () {
                        const passwordInput = document.getElementById('editTeacherPasswordInput');
                        const icon = document.getElementById('editTeacherPasswordIcon');
                        if (passwordInput.type === 'password') {
                            passwordInput.type = 'text';
                            icon.className = 'bi bi-eye-slash';
                        } else {
                            passwordInput.type = 'password';
                            icon.className = 'bi bi-eye';
                        }
                    });
                    modal.addEventListener('hidden.bs.modal', function () {
                        modal.remove();
                    });
                }
            }, 100);
        }
        // Remove Teacher Manage Login link from sidebar
        const teacherManageLoginLink = document.getElementById('teacherManageLoginLink');
        if (teacherManageLoginLink) {
            teacherManageLoginLink.remove();
        }
        // Add handler for manageTeachersLoginLink
        const manageTeachersLoginLink = document.getElementById('manageTeachersLoginLink');
        if (manageTeachersLoginLink) {
            manageTeachersLoginLink.addEventListener('click', function (e) {
                e.preventDefault();
                // Set sidebar active state
                document.querySelectorAll('.sidebar .nav-link').forEach(function (link) {
                    link.classList.remove('active');
                });
                manageTeachersLoginLink.classList.add('active');
                document.getElementById('teachersDropdownBtn').classList.add('active');
                // Replace main-content with Teacher Login Management view
                const mainContent = document.querySelector('.main-content .container-fluid');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class='row'>
                            <div class='col-12'>
                                <nav aria-label='breadcrumb' class='mb-3'>
                                    <ol class='breadcrumb app-breadcrumb'>
                                        <li class='breadcrumb-item'><a href='#' id='dashboardBreadcrumb'><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>
                                        <li class='breadcrumb-item'><a href='#' id='teachersBreadcrumb'><i class="bi bi-person-badge"></i><span>Teachers</span></a></li>
                                        <li class='breadcrumb-item active' aria-current='page'><i class='bi bi-key-fill'></i><span> Manage Login</span></li>
                                    </ol>
                                </nav>
                                <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
                                    <div class='d-flex justify-content-between align-items-center mb-4'>
                                        <h3 class='fw-bold mb-0'>
                                            <i class='bi bi-key-fill text-primary me-2'></i>
                                            Teacher Login Management
                                        </h3>
                                        <button class='btn btn-primary' id='refreshTeacherCredentialsBtn'>
                                            <i class='bi bi-arrow-clockwise me-2'></i>Refresh
                                        </button>
                                    </div>
                                    <div class='alert alert-info d-flex align-items-center' role='alert'>
                                        <i class='bi bi-info-circle-fill me-2'></i>
                                        <div>
                                            <strong>Information:</strong> This page displays teacher login credentials. Passwords are hidden by default for security. Click the eye icon to reveal passwords.
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
                                    <div id='teacherCredentialsContainer'>
                                        <div class='text-center py-4'>
                                        <div class='spinner-border text-primary' role='status'>
                                            <span class='visually-hidden'>Loading...</span>
                                        </div>
                                            <p class='mt-2 text-muted'>Loading teacher credentials...</p>
                                        </div>
                                        </div>
                                </div>
                            </div>
                        </div>
                    `;
                    // Load credentials data
                    loadTeacherCredentials();
                    // Add refresh button functionality
                    document.getElementById('refreshTeacherCredentialsBtn').addEventListener('click', function () {
                        loadTeacherCredentials();
                    });
                }
            });
        }
        function editCredential(username, name, password) {
            // Show modal to edit password
            closeAllModals();
            const modalHtml = `
                <div class="modal fade" id="editCredentialModal" tabindex="-1" aria-labelledby="editCredentialModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title" id="editCredentialModalLabel">Edit Password for ${name}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editCredentialForm">
                                    <div class="mb-3">
                                        <label for="editPasswordInput" class="form-label">New Password</label>
                                        <div class="input-group">
                                            <input type="password" class="form-control" id="editPasswordInput" value="${password}" required>
                                            <button class="btn btn-outline-secondary" type="button" id="toggleEditCredentialPasswordBtn">
                                                <i class="bi bi-eye" id="editCredentialPasswordIcon"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Save</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // Remove existing modal if present
            const existingModal = document.getElementById('editCredentialModal');
            if (existingModal) {
                existingModal.remove();
            }
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            setTimeout(() => {
                const modal = document.getElementById('editCredentialModal');
                if (modal) {
                    const bootstrapModal = new bootstrap.Modal(modal);
                    bootstrapModal.show();
                    // Handle form submission
                    const form = document.getElementById('editCredentialForm');
                    form.addEventListener('submit', function (ev) {
                        ev.preventDefault();
                        const pwdEl = document.getElementById('editPasswordInput');
                        const newPassword = (pwdEl.value || '').trim();
                        if (!newPassword) {
                            showNotification('Password cannot be empty.', 'error', 4000);
                            pwdEl.focus();
                            return;
                        }
                        if (window.api && typeof window.api.updateCredentialPassword === 'function') {
                            window.api.updateCredentialPassword({ username, newPassword }).then(result => {
                                if (result && result.success) {
                                    showNotification('Password updated successfully!', 'success', 3000);
                                    bootstrapModal.hide();
                                    if (typeof loadStudentCredentials === 'function') loadStudentCredentials();
                                    if (typeof loadTeacherCredentials === 'function') loadTeacherCredentials();
                                } else {
                                    showNotification('Failed to update password.' + (result && result.error ? ' ' + result.error : ''), 'error', 4500);
                                }
                            }).catch(err => {
                                console.error('Credential password update error:', err);
                                showNotification('Error updating password.', 'error', 4000);
                            });
                        } else {
                            showNotification('Password update API not available.', 'error', 4000);
                        }
                    });
                    // Add show/hide password toggle logic
                    document.getElementById('toggleEditCredentialPasswordBtn').addEventListener('click', function () {
                        const passwordInput = document.getElementById('editPasswordInput');
                        const icon = document.getElementById('editCredentialPasswordIcon');
                        if (passwordInput.type === 'password') {
                            passwordInput.type = 'text';
                            icon.className = 'bi bi-eye-slash';
                        } else {
                            passwordInput.type = 'password';
                            icon.className = 'bi bi-eye';
                        }
                    });
                    // Remove modal from DOM when hidden
                    modal.addEventListener('hidden.bs.modal', function () {
                        modal.remove();
                    });
                }
            }, 100);
        }
        // ...existing code...

        function viewCredentialDetails(username, name, password, type = 'student') {
            // Close any existing modals first
            closeAllModals();

            const accountType = type.charAt(0).toUpperCase() + type.slice(1) + ' Account';

            const modalHtml = `
                <div class="modal fade" id="credentialDetailsModal" tabindex="-1" aria-labelledby="credentialDetailsModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-info text-white">
                                <h5 class="modal-title" id="credentialDetailsModalLabel">
                                    <i class="bi bi-key-fill me-2"></i>
                                    Credential Details - ${name}
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <div class="alert alert-primary d-flex align-items-center" role="alert">
                                            <i class="bi bi-info-circle-fill me-2"></i>
                                            <div>
                                                <strong>Security Notice:</strong> This information is sensitive. Do not share credentials with unauthorized persons.
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="card h-100">
                                            <div class="card-header bg-primary text-white">
                                                <i class="bi bi-person-fill me-2"></i>Account Information
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-3">
                                                    <label class="form-label fw-semibold">Full Name</label>
                                                    <div class="input-group">
                                                        <span class="input-group-text"><i class="bi bi-person"></i></span>
                                                        <input type="text" class="form-control" value="${name}" readonly>
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label fw-semibold">Account Type</label>
                                                    <div class="input-group">
                                                        <span class="input-group-text"><i class="bi bi-shield-check"></i></span>
                                                        <input type="text" class="form-control" value="${accountType}" readonly>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="card h-100">
                                            <div class="card-header bg-success text-white">
                                                <i class="bi bi-key-fill me-2"></i>Login Credentials
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-3">
                                                    <label class="form-label fw-semibold">Username</label>
                                                    <div class="input-group">
                                                        <span class="input-group-text"><i class="bi bi-person-badge"></i></span>
                                                        <input type="text" class="form-control" value="${username}" readonly>
                                                        <button class="btn btn-outline-secondary" type="button" onclick="copyToClipboard('${username}', 'Username')">
                                                            <i class="bi bi-clipboard"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label fw-semibold">Password</label>
                                                    <div class="input-group">
                                                        <span class="input-group-text"><i class="bi bi-key"></i></span>
                                                        <input type="password" class="form-control" value="${password}" readonly id="modalPassword">
                                                        <button class="btn btn-outline-secondary" type="button" onclick="toggleModalPassword()">
                                                            <i class="bi bi-eye" id="modalPasswordIcon"></i>
                                                        </button>
                                                        <button class="btn btn-outline-secondary" type="button" onclick="copyToClipboard('${password}', 'Password')">
                                                            <i class="bi bi-clipboard"></i>
                                                        </button>
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
                                <button type="button" class="btn btn-primary" onclick="editCredential('${username}', '${name}', '${password}')">
                                    <i class="bi bi-pencil me-1"></i>Edit Credential
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if present
            const existingModal = document.getElementById('credentialDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show modal
            setTimeout(() => {
                const modal = document.getElementById('credentialDetailsModal');
                if (modal) {
                    const bootstrapModal = new bootstrap.Modal(modal);
                    bootstrapModal.show();

                    // Remove modal from DOM when hidden
                    modal.addEventListener('hidden.bs.modal', function () {
                        modal.remove();
                    });
                }
            }, 100);
        }

        function toggleModalPassword() {
            const passwordField = document.getElementById('modalPassword');
            const icon = document.getElementById('modalPasswordIcon');

            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.className = 'bi bi-eye-slash';
            } else {
                passwordField.type = 'password';
                icon.className = 'bi bi-eye';
            }
        }

