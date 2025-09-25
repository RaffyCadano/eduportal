// Redesigned Assign Subjects Module
// Features:
//  - Improved UI layout with toolbar
//  - Inline add subject, selectable subjects with quick stats
//  - Bulk assign mode (select subjects + multiple sections, apply once)
//  - Per-section quick add popover (lightweight)
//  - Save status indicators (saving / saved / error)
//  - Debounced persistence & minimal re-rendering
//  - Robust handling of case differences in section names

(function(){
  const SAVE_DEBOUNCE_MS = 400;

  const state = {
    subjects: [],            // [string]
    sections: [],            // [{ id, name, gradeLevel, teacher, subjects? }]
    assignments: {},         // { sectionName: Set(subjects) }
    selectedSubject: null,   // string | null
    bulkMode: false,
    bulkSelectedSubjects: new Set(), // in bulk mode
    bulkSelectedSections: new Set(),
    pendingSaves: new Map(), // sectionName -> timeoutId
    saving: new Set(),       // sectionName currently saving
    saveErrors: new Set(),   // sectionName had last error
  };

  function log(...a){ console.debug('[AssignSubjects]', ...a); }

  // Public entry
  window.openAssignSubjectsPage = function(){
    activateSidebar();
    const container = document.querySelector('.main-content .container-fluid');
    if (!container){ showNotification('Main content container missing', 'error', 3000); return; }
    container.innerHTML = buildLayout();
    wireStaticEvents();
    loadInitialData();
  };

  function activateSidebar(){
    try {
      document.querySelectorAll('.sidebar .nav-link').forEach(l=>l.classList.remove('active'));
      document.getElementById('assignSubjectsLink')?.classList.add('active');
      document.getElementById('subjectsDropdownBtn')?.classList.add('active');
    } catch(e){ log('Sidebar activation failed', e); }
  }

  function buildLayout(){
    return `
      <div class='row'>
        <div class='col-12'>
          <nav aria-label="breadcrumb" class="mb-3">
            <ol class="breadcrumb app-breadcrumb">
              <li class="breadcrumb-item"><a href="#" id="dashboardBreadcrumb"><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>
              <li class="breadcrumb-item"><a href="#" id="subjectsBreadcrumb"><i class="bi bi-book"></i><span>Subjects</span></a></li>
              <li class="breadcrumb-item active" aria-current="page"><i class='bi bi-link-45deg'></i><span> Assign</span></li>
            </ol>
          </nav>
          <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
            <div class='d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2'>
              <div class='d-flex flex-wrap justify-content-between align-items-center gap-2 w-100'>
                <div>
                  <h3 class='fw-bold mb-0'>
                    <i class='bi bi-journal-text text-primary me-2'></i>
                    Assign Subjects
                  </h3>
                  <div class='small text-muted mt-1'>Attach subjects to sections quickly or use bulk mode for speed.</div>
                </div>
                <div class='d-flex gap-2'>
                  <button class='btn btn-outline-secondary btn-sm' id='toggleBulkModeBtn' title='Toggle bulk assign (multiple sections & subjects)'><i class='bi bi-ui-checks-grid me-1'></i><span class='label'>Bulk Mode</span></button>
                  <button class='btn btn-outline-primary btn-sm' id='refreshAssignSubjectsBtn'><i class='bi bi-arrow-clockwise me-1'></i>Refresh</button>
                  <button class='btn btn-success btn-sm' id='newSubjectBtn'><i class='bi bi-plus-lg me-1'></i>Add Subject</button>
                </div>
              </div>
            </div>
            <div class='alert alert-info d-flex align-items-center small' role='alert'>
              <i class='bi bi-info-circle-fill me-2'></i>
              <div>
                <strong>Tip:</strong> Click a subject to highlight where it's used. Remove a subject from a section by clicking the small x on its badge.
              </div>
            </div>
            <div class='pt-2'>
              <div class='row g-3'>
                <div class='col-xl-4'>
                  <div class='h-100 d-flex flex-column subject-panel card-subtle border rounded p-2'>
                    <div class='d-flex gap-2 mb-2'>
                      <input id='subjectSearch' type='text' class='form-control form-control-sm' placeholder='Search subjects...'>
                    </div>
                    <div id='subjectsList' class='list-group flex-grow-1 overflow-auto small' style='max-height:60vh;'></div>
                    <div id='subjectsFooter' class='pt-2 small text-muted d-flex justify-content-between'>
                      <span id='subjectCount'></span>
                      <span id='bulkSubjectHint' class='text-primary d-none'>Select subjects then sections → Apply</span>
                    </div>
                  </div>
                </div>
                <div class='col-xl-8'>
                  <div class='d-flex flex-column h-100'>
                    <div class='row g-2 align-items-center mb-3'>
                      <div class='col-md-6'>
                        <div class='input-group input-group-sm'>
                          <span class='input-group-text bg-light'><i class='bi bi-search text-primary'></i></span>
                          <input id='sectionFilter' type='text' class='form-control' placeholder='Search section / teacher / grade...'>
                        </div>
                      </div>
                      <div class='col-md-6 text-end small'>
                        <span id='assignSummary' class='me-3 text-muted'></span>
                        <span id='bulkActions' class='d-none'>
                          <button class='btn btn-sm btn-primary' id='applyBulkBtn' disabled><i class='bi bi-check2-circle me-1'></i>Apply</button>
                          <button class='btn btn-sm btn-outline-secondary' id='clearBulkBtn'><i class='bi bi-x-circle me-1'></i>Clear</button>
                        </span>
                      </div>
                    </div>
                    <div class='table-responsive' style='max-height:60vh;overflow:hidden;'>
                      <table class='table table-hover align-middle mb-0' id='sectionsTable'>
                        <thead class='table-dark text-white'>
                          <tr>
                            <th class='text-center bulk-col d-none' style='width:2.5rem;'><input type='checkbox' id='bulkSelectAllSections' /></th>
                            <th class='text-center' style='width:3rem;'>#</th>
                            <th style='min-width:160px;'>Section</th>
                            <th style='width:80px;'>Grade</th>
                            <th style='min-width:140px;'>Teacher</th>
                            <th style='min-width:200px;'>Subjects</th>
                            <th class='text-center' style='width:55px;'>Status</th>
                          </tr>
                        </thead>
                        <tbody id='sectionsAssignTbody' class='table-body-surface'></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ---------- Data Loading ----------
  function loadInitialData(){
    const sectionsPromise = window.api?.getSections ? window.api.getSections() : Promise.resolve({ success:false, sections: []});
    const subjectsPromise = window.api?.getSubjects ? window.api.getSubjects() : Promise.resolve({ success:false, subjects: []});
    Promise.all([sectionsPromise, subjectsPromise])
      .then(([secRes, subjRes]) => {
        state.sections = (secRes.success && Array.isArray(secRes.sections)) ? secRes.sections : [];
        state.subjects = (subjRes.success && Array.isArray(subjRes.subjects)) ? subjRes.subjects.slice().sort((a,b)=>a.localeCompare(b)) : [];
        rebuildAssignmentsFromSections();
        renderSubjects();
        renderSections();
        updateSummary();
      })
      .catch(err => {
        log('Load error', err);
        state.sections = []; state.subjects = []; state.assignments = {};
        renderSubjects(); renderSections(); updateSummary();
      });
  }

  function rebuildAssignmentsFromSections(){
    state.assignments = {};
    state.sections.forEach(sec => {
      const name = (sec && sec.name) ? sec.name : (typeof sec === 'string' ? sec : '');
      if (!name) return;
      const arr = Array.isArray(sec.subjects) ? sec.subjects.filter(s=>typeof s==='string' && s.trim()) : [];
      state.assignments[name] = new Set(arr);
    });
  }

  // ---------- Rendering Subjects ----------
  function renderSubjects(){
    const list = document.getElementById('subjectsList');
    if (!list) return;
    const search = (document.getElementById('subjectSearch')?.value || '').toLowerCase().trim();
    const subjects = state.subjects.filter(s => !search || s.toLowerCase().includes(search));
    if (subjects.length === 0){
      list.innerHTML = `<div class='text-center text-muted small p-3'>
        <div class='mb-2'><i class='bi bi-journal-x me-1'></i>No subjects yet</div>
        <button class='btn btn-success btn-sm' id='addFirstSubjectBtn'><i class='bi bi-plus-lg me-1'></i>Add Subject</button>
      </div>`;
      document.getElementById('addFirstSubjectBtn')?.addEventListener('click', ()=>document.getElementById('newSubjectBtn')?.click());
      updateSubjectFooter();
      return;
    }
    list.innerHTML = subjects.map(name => buildSubjectItem(name)).join('');
    // Events
    list.querySelectorAll('.subject-item').forEach(item => {
      item.addEventListener('click', e => {
        if (state.bulkMode){
          const subj = item.dataset.subject;
            toggleBulkSubject(subj);
            e.stopPropagation();
            return;
        }
        const subj = item.dataset.subject;
        state.selectedSubject = (state.selectedSubject === subj) ? null : subj;
        highlightSelectedSubject();
        highlightSubjectBadges();
      });
    });
    list.querySelectorAll('.delete-subject-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const subj = btn.closest('.subject-item').dataset.subject;
        attemptDeleteSubject(subj);
      });
    });
    updateSubjectFooter();
    highlightSelectedSubject();
  }

  function buildSubjectItem(name){
    const count = countSectionsWithSubject(name);
    const active = state.selectedSubject === name ? ' active' : '';
    const bulkSelected = state.bulkMode && state.bulkSelectedSubjects.has(name) ? ' bulk-selected' : '';
    return `
      <div class='list-group-item d-flex justify-content-between align-items-center subject-item${active}${bulkSelected}' data-subject='${name}' style='cursor:pointer;'>
        <div class='d-flex align-items-center gap-2 flex-grow-1'>
          ${state.bulkMode ? `<input type='checkbox' class='form-check-input m-0 subject-bulk-check' ${state.bulkSelectedSubjects.has(name)?'checked':''} data-bulk-subject='${name}' />` : ''}
          <span class='text-truncate'><i class='bi bi-journal-text me-2 text-primary'></i>${name}</span>
        </div>
        <div class='d-flex align-items-center gap-2'>
          <span class='badge rounded-pill bg-primary'>${count}</span>
          <button class='btn btn-sm btn-outline-danger border-0 delete-subject-btn' title='Remove (local only)' style='--bs-btn-padding-y:.125rem; --bs-btn-padding-x:.35rem;'><i class='bi bi-trash'></i></button>
        </div>
      </div>`;
  }

  function updateSubjectFooter(){
    const countEl = document.getElementById('subjectCount');
    if (countEl) countEl.textContent = `${state.subjects.length} subject${state.subjects.length!==1?'s':''}`;
    const hint = document.getElementById('bulkSubjectHint');
    if (hint) hint.classList.toggle('d-none', !state.bulkMode);
  }

  function highlightSelectedSubject(){
    if (state.bulkMode) return; // skip in bulk mode
    document.querySelectorAll('#subjectsList .subject-item').forEach(el => {
      const subj = el.dataset.subject;
      if (state.selectedSubject === subj) el.classList.add('active'); else el.classList.remove('active');
    });
  }

  function highlightSubjectBadges(){
    const selected = state.selectedSubject;
    document.querySelectorAll('#sectionsAssignTbody .subject-badge').forEach(b => {
      const subj = b.getAttribute('data-subject');
      if (selected && subj === selected){
        b.classList.remove('bg-info'); b.classList.add('bg-primary');
      } else {
        b.classList.add('bg-info'); b.classList.remove('bg-primary');
      }
    });
  }

  function countSectionsWithSubject(subj){
    let c=0; for (const set of Object.values(state.assignments)){ if (set.has(subj)) c++; } return c;
  }

  // ---------- Rendering Sections ----------
  function renderSections(){
    const tbody = document.getElementById('sectionsAssignTbody');
    if (!tbody) return;
    const filter = (document.getElementById('sectionFilter')?.value || '').toLowerCase().trim();
    const rows = state.sections
      .filter(sec => {
        const name = (sec.name||'').toLowerCase();
        const teacher = (sec.teacher||'').toLowerCase();
        const grade = (sec.gradeLevel? String(sec.gradeLevel):'').toLowerCase();
        return !filter || name.includes(filter) || teacher.includes(filter) || grade.includes(filter);
      })
      .map((sec, idx) => buildSectionRow(sec, idx))
      .join('');
    const colSpan = state.bulkMode ? 7 : 6; // extra bulk column when active
    tbody.innerHTML = rows || `<tr><td colspan='${colSpan}' class='text-center text-muted py-4'>No sections found</td></tr>`;
    attachSectionRowEvents();
    updateBulkUIVisibility();
    highlightSubjectBadges();
  }

  function buildSectionRow(sec, index){
    const name = sec.name || '(Unnamed)';
    const grade = sec.gradeLevel ? `G${sec.gradeLevel}` : '';
    const teacher = sec.teacher || '';
    const subjects = Array.from(state.assignments[name]||[]).sort((a,b)=>a.localeCompare(b));
    const saving = state.saving.has(name);
    const error = state.saveErrors.has(name);
    const bulkChecked = state.bulkSelectedSections.has(name) ? 'checked' : '';
    return `
      <tr data-section='${name}'>
        <td class='border text-center align-middle bulk-col d-none'><input type='checkbox' class='form-check-input section-bulk-check' data-bulk-section='${name}' ${bulkChecked} /></td>
        <td class='border text-center text-muted fw-semibold'>${index+1}</td>
        <td class='border fw-semibold text-truncate' title='${name}'>${name}</td>
        <td class='border text-muted small'>${grade}</td>
        <td class='border small text-truncate' title='${teacher}'>${teacher}</td>
        <td>
          <div class='d-flex flex-wrap gap-1 align-items-center subject-badges'>
            ${subjects.map(s => `<span class='badge bg-info subject-badge' data-subject='${s}' title='Click to remove'>${s}<i class='bi bi-x ms-1 small remove-subject' data-remove='${s}'></i></span>`).join('')}
            <button class='btn btn-sm btn-outline-primary add-section-subject-btn' type='button' title='Assign subject'><i class='bi bi-plus-lg'></i></button>
          </div>
        </td>
        <td class='text-center align-middle'>${buildSaveStatusIcon(saving, error)}</td>
      </tr>`;
  }

  function buildSaveStatusIcon(saving, error){
    if (saving) return `<span class='text-primary' title='Saving...'><span class='spinner-border spinner-border-sm'></span></span>`;
    if (error) return `<span class='text-danger' title='Last save failed'><i class='bi bi-exclamation-triangle-fill'></i></span>`;
    return `<span class='text-success' title='Saved'><i class='bi bi-check2-circle'></i></span>`;
  }

  function attachSectionRowEvents(){
    document.querySelectorAll('#sectionsAssignTbody tr').forEach(row => {
      const sectionName = row.getAttribute('data-section');
      // Add subject button
      row.querySelector('.add-section-subject-btn')?.addEventListener('click', e => {
        e.stopPropagation(); openSectionAssignPopover(sectionName, e.currentTarget);
      });
      // Remove subject icon
      row.querySelectorAll('.remove-subject').forEach(icon => {
        icon.addEventListener('click', e => {
          e.stopPropagation();
          const subj = icon.getAttribute('data-remove');
          removeSubjectFromSection(sectionName, subj);
        });
      });
      // Bulk selection checkbox
      row.querySelectorAll('.section-bulk-check').forEach(chk => {
        chk.addEventListener('change', () => {
          const subj = chk.getAttribute('data-bulk-section');
          if (chk.checked) state.bulkSelectedSections.add(subj); else state.bulkSelectedSections.delete(subj);
          updateBulkApplyButton();
        });
      });
    });
  }

  // ---------- Subject Operations ----------
  function addSubject(name){
    const clean = (name||'').trim();
    if (!clean){ showNotification('Subject name required', 'warning', 1600); return; }
    if (state.subjects.some(s => s.toLowerCase() === clean.toLowerCase())){
      showNotification('Subject already exists', 'warning', 1800); return;
    }
    if (window.api?.addSubject){
      window.api.addSubject(clean).then(res => {
        if (!res.success){ showNotification(res.error||'Failed to add', 'error', 3000); return; }
        state.subjects.push(clean); state.subjects.sort((a,b)=>a.localeCompare(b));
        state.selectedSubject = clean;
        renderSubjects(); highlightSubjectBadges(); showNotification(`Added subject "${clean}"`, 'success', 1600);
      }).catch(err => { log('Add subject error', err); showNotification('Error adding subject', 'error', 3000); });
    } else {
      state.subjects.push(clean); state.subjects.sort((a,b)=>a.localeCompare(b)); renderSubjects();
    }
  }

  function attemptDeleteSubject(name){
    // No backend delete endpoint implemented yet.
    if (!name) return;
    const assignedCount = countSectionsWithSubject(name);
    if (assignedCount>0){
      showNotification('Cannot remove – subject assigned to sections (remove assignments first)', 'error', 3000);
      return;
    }
    state.subjects = state.subjects.filter(s => s !== name);
    if (state.selectedSubject === name) state.selectedSubject = null;
    renderSubjects(); highlightSubjectBadges(); updateSummary();
    showNotification(`Removed subject "${name}" (local only)`, 'warning', 2200);
  }

  // ---------- Section Assignment Ops ----------
  function ensureAssignmentSet(sectionName){
    if (!state.assignments[sectionName]) state.assignments[sectionName] = new Set();
    return state.assignments[sectionName];
  }

  function addSubjectToSection(sectionName, subject){
    if (!sectionName || !subject) return;
    const set = ensureAssignmentSet(sectionName);
    if (set.has(subject)) return; // already
    set.add(subject);
    queueSave(sectionName);
    rerenderSectionRow(sectionName);
    rerenderSubject(subject);
  }

  function removeSubjectFromSection(sectionName, subject){
    if (!sectionName || !subject) return;
    const set = ensureAssignmentSet(sectionName);
    if (!set.has(subject)) return;
    set.delete(subject);
    queueSave(sectionName);
    rerenderSectionRow(sectionName);
    rerenderSubject(subject);
  }

  function rerenderSectionRow(sectionName){
    const row = document.querySelector(`#sectionsAssignTbody tr[data-section="${CSS.escape(sectionName)}"]`);
    if (!row){ renderSections(); return; }
    const sec = state.sections.find(s => s.name === sectionName);
    if (!sec){ renderSections(); return; }
    const idx = state.sections.findIndex(s => s.name === sectionName);
    const newRow = document.createElement('tbody');
    newRow.innerHTML = buildSectionRow(sec, idx);
    const fresh = newRow.firstElementChild;
    row.replaceWith(fresh);
    // Attach events for this new row only
    const wrap = document.createElement('tbody');
    wrap.appendChild(fresh);
    attachSectionRowEvents();
    highlightSubjectBadges();
    updateSummary();
  }

  function rerenderSubject(subject){
    // Update count badge & active highlight without full list rebuild if possible
    const item = document.querySelector(`#subjectsList .subject-item[data-subject="${CSS.escape(subject)}"]`);
    if (!item){ renderSubjects(); return; }
    const count = countSectionsWithSubject(subject);
    const badge = item.querySelector('.badge');
    if (badge) badge.textContent = count;
  }

  // ---------- Saving Logic ----------
  function queueSave(sectionName){
    markSaving(sectionName, true);
    if (state.pendingSaves.has(sectionName)) clearTimeout(state.pendingSaves.get(sectionName));
    const timeout = setTimeout(()=>performSave(sectionName), SAVE_DEBOUNCE_MS);
    state.pendingSaves.set(sectionName, timeout);
  }

  function performSave(sectionName){
    state.pendingSaves.delete(sectionName);
    if (!window.api?.updateSectionSubjects){ markSaving(sectionName,false); return; }
    const sec = state.sections.find(s=>s.name === sectionName);
    const subjectsArr = Array.from(state.assignments[sectionName]||[]).sort((a,b)=>a.localeCompare(b));
    const payload = { sectionName, subjects: subjectsArr };
    if (sec && (sec.id || sec.userKey)) payload.sectionId = sec.id || sec.userKey;
    window.api.updateSectionSubjects(payload).then(res => {
      if (!res.success){ markSaveError(sectionName); showNotification(`Save failed: ${res.error}`, 'error', 3000); }
      else { clearSaveError(sectionName); }
      markSaving(sectionName,false);
      rerenderSectionRow(sectionName);
    }).catch(err => {
      log('Save error', err); markSaveError(sectionName); markSaving(sectionName,false); rerenderSectionRow(sectionName); showNotification('Save error', 'error', 2500);
    });
  }

  function markSaving(sectionName, on){
    if (on) state.saving.add(sectionName); else state.saving.delete(sectionName);
  }
  function markSaveError(sectionName){ state.saveErrors.add(sectionName); }
  function clearSaveError(sectionName){ state.saveErrors.delete(sectionName); }

  // ---------- Popover Assign ----------
  function openSectionAssignPopover(sectionName, anchor){
    closeAnyPopover();
    const set = ensureAssignmentSet(sectionName);
    const choices = state.subjects.filter(s => !set.has(s));
    const empty = choices.length===0;
    const div = document.createElement('div');
    div.id = 'assignSectionPopover';
    div.className = 'card shadow position-absolute';
    div.style.zIndex = 1065;
    div.style.minWidth = '240px';
    div.innerHTML = `
      <div class='card-header py-1 px-2 d-flex justify-content-between align-items-center'>
        <span class='small fw-semibold'>Assign Subject</span>
        <button class='btn btn-sm btn-outline-secondary close-pop' style='--bs-btn-padding-y:.1rem; --bs-btn-padding-x:.35rem;'><i class='bi bi-x'></i></button>
      </div>
      <div class='p-2'>
        ${empty ? `<div class='text-muted small'>No unassigned subjects.<br><button class='btn btn-link p-0 mt-1 addNewFromPopover'>Add subject</button></div>` : 
          `<div class='list-group small popover-subjects' style='max-height:210px; overflow:auto;'>
            ${choices.map(c=>`<button type='button' class='list-group-item list-group-item-action py-1 px-2 pop-choice' data-choice='${c}'>${c}</button>`).join('')}
          </div>`}
        <div class='mt-2 border-top pt-2 small'>
          <div class='input-group input-group-sm'>
            <input type='text' class='form-control' placeholder='New subject' maxlength='60' />
            <button class='btn btn-success create-and-assign'><i class='bi bi-plus-lg'></i></button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);
    positionPopover(anchor, div);
    const close = ()=>{ if (div.parentNode) div.remove(); document.removeEventListener('click', outside); };
    function outside(ev){ if (!div.contains(ev.target) && ev.target!==anchor) close(); }
    setTimeout(()=>document.addEventListener('click', outside),10);
    div.querySelector('.close-pop')?.addEventListener('click', close);
    div.querySelectorAll('.pop-choice').forEach(btn => {
      btn.addEventListener('click', () => { addSubjectToSection(sectionName, btn.dataset.choice); close(); });
    });
    div.querySelector('.addNewFromPopover')?.addEventListener('click', ()=>{
      document.getElementById('newSubjectBtn')?.click(); close();
    });
    const input = div.querySelector('input');
    const createBtn = div.querySelector('.create-and-assign');
    createBtn.addEventListener('click', ()=>createAndAssign(input, sectionName, close));
    input.addEventListener('keydown', e=>{ if (e.key==='Enter'){ e.preventDefault(); createAndAssign(input, sectionName, close);} else if (e.key==='Escape'){ close(); }});
    input.focus();
  }

  function createAndAssign(inputEl, sectionName, closeFn){
    const raw = (inputEl.value||'').trim(); if (!raw){ showNotification('Subject name required','warning',1600); inputEl.focus(); return; }
    if (state.subjects.some(s=>s.toLowerCase()===raw.toLowerCase())){ addSubjectToSection(sectionName, raw); closeFn(); return; }
    inputEl.disabled = true;
    if (window.api?.addSubject){
      window.api.addSubject(raw).then(res => {
        if (!res.success){ showNotification(res.error||'Failed to add', 'error', 2500); inputEl.disabled=false; return; }
        state.subjects.push(raw); state.subjects.sort((a,b)=>a.localeCompare(b));
        addSubjectToSection(sectionName, raw);
        renderSubjects();
        showNotification(`Created & assigned "${raw}"`, 'success', 1800);
        closeFn();
      }).catch(err => { log('Add error', err); showNotification('Add error','error',2200); inputEl.disabled=false; });
    } else {
      state.subjects.push(raw); addSubjectToSection(sectionName, raw); closeFn();
    }
  }

  function positionPopover(anchor, pop){
    const r = anchor.getBoundingClientRect();
    const top = window.scrollY + r.bottom + 4;
    let left = window.scrollX + r.left;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8;
    if (left > maxLeft) left = maxLeft;
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  }
  function closeAnyPopover(){ document.getElementById('assignSectionPopover')?.remove(); }

  // ---------- Bulk Mode ----------
  function toggleBulkMode(){
    state.bulkMode = !state.bulkMode;
    if (!state.bulkMode){
      state.bulkSelectedSubjects.clear();
      state.bulkSelectedSections.clear();
      state.selectedSubject = null;
    }
    renderSubjects();
    renderSections();
    updateBulkApplyButton();
    updateBulkModeButton();
  }

  function toggleBulkSubject(subj){
    if (state.bulkSelectedSubjects.has(subj)) state.bulkSelectedSubjects.delete(subj); else state.bulkSelectedSubjects.add(subj);
    const chk = document.querySelector(`.subject-bulk-check[data-bulk-subject="${CSS.escape(subj)}"]`);
    if (chk) chk.checked = state.bulkSelectedSubjects.has(subj);
    updateBulkApplyButton();
    // Visual highlight
    document.querySelectorAll(`#subjectsList .subject-item[data-subject="${CSS.escape(subj)}"]`).forEach(el=>{
      el.classList.toggle('bulk-selected', state.bulkSelectedSubjects.has(subj));
    });
  }

  function applyBulk(){
    if (state.bulkSelectedSubjects.size===0 || state.bulkSelectedSections.size===0) return;
    const subjects = Array.from(state.bulkSelectedSubjects);
    const sections = Array.from(state.bulkSelectedSections);
    let changed = 0;
    sections.forEach(secName => {
      const set = ensureAssignmentSet(secName);
      let localChanged = false;
      subjects.forEach(subj => { if (!set.has(subj)){ set.add(subj); localChanged = true; } });
      if (localChanged){ queueSave(secName); changed++; }
    });
    if (changed>0){
      sections.forEach(rerenderSectionRow);
      subjects.forEach(rerenderSubject);
      showNotification(`Applied to ${changed} section${changed!==1?'s':''}`, 'success', 1800);
    } else {
      showNotification('No changes needed', 'info', 1500);
    }
  }

  function clearBulk(){
    state.bulkSelectedSubjects.clear();
    state.bulkSelectedSections.clear();
    document.getElementById('bulkSelectAllSections')?.click(); // toggle off if was on
    renderSubjects(); renderSections(); updateBulkApplyButton();
  }

  function updateBulkApplyButton(){
    const btn = document.getElementById('applyBulkBtn');
    if (!btn) return;
    const enabled = state.bulkSelectedSubjects.size>0 && state.bulkSelectedSections.size>0;
    btn.disabled = !enabled;
  }

  function updateBulkModeButton(){
    const btn = document.getElementById('toggleBulkModeBtn');
    if (!btn) return;
    if (state.bulkMode){
      btn.classList.add('btn-primary'); btn.classList.remove('btn-outline-secondary');
    } else {
      btn.classList.remove('btn-primary'); btn.classList.add('btn-outline-secondary');
    }
  }

  function updateBulkUIVisibility(){
    const bulkCols = document.querySelectorAll('.bulk-col');
    bulkCols.forEach(c => c.classList.toggle('d-none', !state.bulkMode));
    document.getElementById('bulkActions')?.classList.toggle('d-none', !state.bulkMode);
  }

  // ---------- Summary ----------
  function updateSummary(){
    const el = document.getElementById('assignSummary'); if (!el) return;
    const total = Object.values(state.assignments).reduce((sum,set)=> sum + set.size,0);
    el.textContent = `${total} assignment${total!==1?'s':''}`;
  }

  // ---------- Static Events ----------
  function wireStaticEvents(){
  // Breadcrumb clicks now handled by centralized wiring in main.html
    document.getElementById('refreshAssignSubjectsBtn')?.addEventListener('click', ()=>{ showNotification('Refreshing...', 'info', 1000); loadInitialData(); });
    document.getElementById('newSubjectBtn')?.addEventListener('click', openInlineAddSubjectForm);
    document.getElementById('subjectSearch')?.addEventListener('input', renderSubjects);
    document.getElementById('sectionFilter')?.addEventListener('input', renderSections);
    document.getElementById('toggleBulkModeBtn')?.addEventListener('click', toggleBulkMode);
    document.getElementById('applyBulkBtn')?.addEventListener('click', applyBulk);
    document.getElementById('clearBulkBtn')?.addEventListener('click', clearBulk);
    document.getElementById('bulkSelectAllSections')?.addEventListener('change', e => {
      if (!state.bulkMode) return;
      if (e.target.checked){
        state.sections.forEach(sec => state.bulkSelectedSections.add(sec.name));
      } else {
        state.bulkSelectedSections.clear();
      }
      document.querySelectorAll('.section-bulk-check').forEach(chk => { chk.checked = e.target.checked; });
      updateBulkApplyButton();
    });
  }

  function openInlineAddSubjectForm(){
    if (document.getElementById('inlineNewSubjectForm')){
      const input = document.querySelector('#inlineNewSubjectForm input'); input?.focus(); return;
    }
    const list = document.getElementById('subjectsList');
    if (!list) return;
    const form = document.createElement('div');
    form.id = 'inlineNewSubjectForm';
    form.className = 'p-2 border rounded mb-2 bg-light small';
    form.innerHTML = `
      <div class='input-group input-group-sm'>
        <input type='text' class='form-control' placeholder='Subject name...' maxlength='60'>
        <button class='btn btn-success'><i class='bi bi-check2'></i></button>
        <button class='btn btn-outline-secondary cancel'><i class='bi bi-x-lg'></i></button>
      </div>`;
    list.parentNode.insertBefore(form, list);
    const input = form.querySelector('input');
    const saveBtn = form.querySelector('.btn-success');
    const cancelBtn = form.querySelector('.cancel');
    function close(){ form.remove(); }
    function submit(){ const val = (input.value||'').trim(); if (!val){ showNotification('Name required','warning',1600); input.focus(); return; } addSubject(val); close(); }
    saveBtn.addEventListener('click', e=>{ e.preventDefault(); submit(); });
    cancelBtn.addEventListener('click', e=>{ e.preventDefault(); close(); });
    input.addEventListener('keydown', e=>{ if (e.key==='Enter'){ e.preventDefault(); submit(); } else if (e.key==='Escape'){ close(); }});
    input.focus();
  }

})();
