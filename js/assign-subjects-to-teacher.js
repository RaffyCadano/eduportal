(function(){
  const state = {
    teachers: [],
    subjects: [],
    assignments: {}, // { teacherName: Set(subjects) }
    selectedSubject: null,
    bulkMode: false,
    bulkSelectedSubjects: new Set(),
    bulkSelectedTeachers: new Set(),
    loading: false
  };

  window.openAssignSubjectsToTeacherPage = function(){
    activateSidebar();
    const container = document.querySelector('.main-content .container-fluid');
    if (!container){ showNotification('Main content not found','error',2500); return; }
    container.innerHTML = buildLayout();
    wireStaticEvents();
    loadInitialData();
  };

  function activateSidebar(){
    try {
      document.querySelectorAll('.sidebar .nav-link').forEach(l=>l.classList.remove('active'));
      document.getElementById('assignSubjectsToTeacherLink')?.classList.add('active');
      document.getElementById('subjectsDropdownBtn')?.classList.add('active');
    } catch(e){}
  }

  function buildLayout(){
    return `
      <div class='row'>
        <div class='col-12'>
          <nav aria-label="breadcrumb" class="mb-3">
            <ol class="breadcrumb app-breadcrumb">
              <li class="breadcrumb-item"><a href="#" id="dashboardBreadcrumb"><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>
              <li class="breadcrumb-item"><a href="#" id="subjectsBreadcrumb"><i class="bi bi-book"></i><span>Subjects</span></a></li>
              <li class="breadcrumb-item active" aria-current="page"><i class='bi bi-link-45deg'></i><span> Assign Subjects to Teacher</span></li>
            </ol>
          </nav>
          <div class='card p-4 border' style='border:none; border-radius:1.5em;'>
            <div class='d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2'>
              <div class='d-flex flex-wrap justify-content-between align-items-center gap-2 w-100'>
                <div>
                  <h3 class='fw-bold mb-0'>
                    <i class='bi bi-person-badge text-primary me-2'></i>
                    Assign Subjects to Teacher
                  </h3>
                  <div class='small text-muted mt-1'>Attach subjects to teachers quickly or use bulk mode for speed.</div>
                </div>
                <div class='d-flex gap-2'>
                  <button class='btn btn-outline-secondary btn-sm' id='toggleBulkModeBtn' title='Toggle bulk assign'><i class='bi bi-ui-checks-grid me-1'></i><span class='label'>Bulk Mode</span></button>
                  <button class='btn btn-outline-primary btn-sm' id='refreshAssignSubjectsTeacherBtn'><i class='bi bi-arrow-clockwise me-1'></i>Refresh</button>
                  <button class='btn btn-success btn-sm' id='newSubjectBtn'><i class='bi bi-plus-lg me-1'></i>Add Subject</button>
                </div>
              </div>
            </div>
            <div class='alert alert-info d-flex align-items-center small' role='alert'>
              <i class='bi bi-info-circle-fill me-2'></i>
              <div>
                <strong>Tip:</strong> Click a subject to highlight where it's used. Remove a subject from a teacher by clicking the small x on its badge.
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
                      <span id='bulkSubjectHint' class='text-primary d-none'>Select subjects then teachers → Apply</span>
                    </div>
                  </div>
                </div>
                <div class='col-xl-8'>
                  <div class='d-flex flex-column h-100'>
                    <div class='row g-2 align-items-center mb-3'>
                      <div class='col-md-6'>
                        <div class='input-group input-group-sm'>
                          <span class='input-group-text bg-light'><i class='bi bi-search text-primary'></i></span>
                          <input id='teacherFilter' type='text' class='form-control' placeholder='Search teacher...'>
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
                      <table class='table table-hover align-middle mb-0' id='teachersTable'>
                        <thead class='table-dark text-white'>
                          <tr>
                            <th class='text-center bulk-col d-none' style='width:2.5rem;'><input type='checkbox' id='bulkSelectAllTeachers' /></th>
                            <th class='text-center' style='width:3rem;'>#</th>
                            <th style='min-width:160px;'>Teacher</th>
                            <th style='min-width:200px;'>Subjects</th>
                            <th class='text-center' style='width:55px;'>Status</th>
                          </tr>
                        </thead>
                        <tbody id='teachersAssignTbody' class='table-body-surface'></tbody>
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

  function wireStaticEvents(){
    document.getElementById('refreshAssignSubjectsTeacherBtn')?.addEventListener('click', ()=>{ showNotification('Refreshing...', 'info', 1000); loadInitialData(); });
    document.getElementById('newSubjectBtn')?.addEventListener('click', openInlineAddSubjectForm);
    document.getElementById('subjectSearch')?.addEventListener('input', renderSubjects);
    document.getElementById('teacherFilter')?.addEventListener('input', renderTeachers);
    document.getElementById('toggleBulkModeBtn')?.addEventListener('click', toggleBulkMode);
    document.getElementById('applyBulkBtn')?.addEventListener('click', applyBulk);
    document.getElementById('clearBulkBtn')?.addEventListener('click', clearBulk);
    document.getElementById('bulkSelectAllTeachers')?.addEventListener('change', e => {
      if (!state.bulkMode) return;
      if (e.target.checked){
        state.teachers.forEach(t => state.bulkSelectedTeachers.add(t.name));
      } else {
        state.bulkSelectedTeachers.clear();
      }
      document.querySelectorAll('.teacher-bulk-check').forEach(chk => { chk.checked = e.target.checked; });
      updateBulkApplyButton();
    });
  }

  function loadInitialData(){
    state.loading = true;
    const teachersPromise = window.api?.getTeachers ? window.api.getTeachers() : Promise.resolve({ success:false, teachers: []});
    const subjectsPromise = window.api?.getSubjects ? window.api.getSubjects() : Promise.resolve({ success:false, subjects: []});
    Promise.all([teachersPromise, subjectsPromise])
      .then(([teachRes, subjRes]) => {
        state.teachers = (teachRes.success && Array.isArray(teachRes.teachers)) ? teachRes.teachers : [];
        state.subjects = (subjRes.success && Array.isArray(subjRes.subjects)) ? subjRes.subjects.slice().sort((a,b)=>a.localeCompare(b)) : [];
        rebuildAssignmentsFromTeachers();
        renderSubjects();
        renderTeachers();
        updateSummary();
      })
      .catch(err => {
        state.teachers = []; state.subjects = []; state.assignments = {};
        renderSubjects(); renderTeachers(); updateSummary();
      })
      .finally(()=>{ state.loading = false; });
  }

  function rebuildAssignmentsFromTeachers(){
    state.assignments = {};
    state.teachers.forEach(t => {
      const name = t.name;
      const arr = Array.isArray(t.subjects) ? t.subjects.filter(s=>typeof s==='string' && s.trim()) : [];
      state.assignments[name] = new Set(arr);
    });
  }

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
    updateSubjectFooter();
    highlightSelectedSubject();
  }

  function buildSubjectItem(name){
    const count = countTeachersWithSubject(name);
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
    if (state.bulkMode) return;
    document.querySelectorAll('#subjectsList .subject-item').forEach(el => {
      const subj = el.dataset.subject;
      if (state.selectedSubject === subj) el.classList.add('active'); else el.classList.remove('active');
    });
  }

  function highlightSubjectBadges(){
    const selected = state.selectedSubject;
    document.querySelectorAll('#teachersAssignTbody .subject-badge').forEach(b => {
      const subj = b.getAttribute('data-subject');
      if (selected && subj === selected){
        b.classList.remove('bg-info'); b.classList.add('bg-primary');
      } else {
        b.classList.add('bg-info'); b.classList.remove('bg-primary');
      }
    });
  }

  function countTeachersWithSubject(subj){
    let c=0; for (const set of Object.values(state.assignments)){ if (set.has(subj)) c++; } return c;
  }

  function renderTeachers(){
    const tbody = document.getElementById('teachersAssignTbody');
    if (!tbody) return;
    const filter = (document.getElementById('teacherFilter')?.value || '').toLowerCase().trim();
    const rows = state.teachers
      .filter(t => {
        const name = (t.name||'').toLowerCase();
        return !filter || name.includes(filter);
      })
      .map((t, idx) => buildTeacherRow(t, idx))
      .join('');
    const colSpan = state.bulkMode ? 5 : 4;
    tbody.innerHTML = rows || `<tr><td colspan='${colSpan}' class='text-center text-muted py-4'>No teachers found</td></tr>`;
    attachTeacherRowEvents();
    updateBulkUIVisibility();
    highlightSubjectBadges();
  }

  function buildTeacherRow(teacher, index){
    const name = teacher.name || '(Unnamed)';
    const subjects = Array.from(state.assignments[name]||[]).sort((a,b)=>a.localeCompare(b));
    const bulkChecked = state.bulkSelectedTeachers.has(name) ? 'checked' : '';
    return `
      <tr data-teacher='${name}'>
        <td class='border text-center align-middle bulk-col d-none'><input type='checkbox' class='form-check-input teacher-bulk-check' data-bulk-teacher='${name}' ${bulkChecked} /></td>
        <td class='border text-center text-muted fw-semibold'>${index+1}</td>
        <td class='border fw-semibold text-truncate' title='${name}'>${name}</td>
        <td>
          <div class='d-flex flex-wrap gap-1 align-items-center subject-badges'>
            ${subjects.map(s => `<span class='badge bg-info subject-badge' data-subject='${s}' title='Click to remove'>${s}<i class='bi bi-x ms-1 small remove-subject' data-remove='${s}'></i></span>`).join('')}
            <button class='btn btn-sm btn-outline-primary add-teacher-subject-btn' type='button' title='Assign subject'><i class='bi bi-plus-lg'></i></button>
          </div>
        </td>
        <td class='text-center align-middle'><span class='text-success' title='Saved'><i class='bi bi-check2-circle'></i></span></td>
      </tr>`;
  }

  function attachTeacherRowEvents(){
    document.querySelectorAll('#teachersAssignTbody tr').forEach(row => {
      const teacherName = row.getAttribute('data-teacher');
      row.querySelector('.add-teacher-subject-btn')?.addEventListener('click', e => {
        e.stopPropagation(); openTeacherAssignPopover(teacherName, e.currentTarget);
      });
      row.querySelectorAll('.remove-subject').forEach(icon => {
        icon.addEventListener('click', e => {
          e.stopPropagation();
          const subj = icon.getAttribute('data-remove');
          removeSubjectFromTeacher(teacherName, subj);
        });
      });
      row.querySelectorAll('.teacher-bulk-check').forEach(chk => {
        chk.addEventListener('change', () => {
          const tname = chk.getAttribute('data-bulk-teacher');
          if (chk.checked) state.bulkSelectedTeachers.add(tname); else state.bulkSelectedTeachers.delete(tname);
          updateBulkApplyButton();
        });
      });
    });
  }

  function openTeacherAssignPopover(teacherName, anchor){
    closeAnyPopover();
    const set = state.assignments[teacherName] || new Set();
    const choices = state.subjects.filter(s => !set.has(s));
    const empty = choices.length===0;
    const div = document.createElement('div');
    div.id = 'assignTeacherPopover';
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
      btn.addEventListener('click', () => { addSubjectToTeacher(teacherName, btn.dataset.choice); close(); });
    });
    div.querySelector('.addNewFromPopover')?.addEventListener('click', ()=>{
      document.getElementById('newSubjectBtn')?.click(); close();
    });
    const input = div.querySelector('input');
    const createBtn = div.querySelector('.create-and-assign');
    createBtn.addEventListener('click', ()=>createAndAssign(input, teacherName, close));
    input.addEventListener('keydown', e=>{ if (e.key==='Enter'){ e.preventDefault(); createAndAssign(input, teacherName, close);} else if (e.key==='Escape'){ close(); }});
    input.focus();
  }

  function createAndAssign(inputEl, teacherName, closeFn){
    const raw = (inputEl.value||'').trim(); if (!raw){ showNotification('Subject name required','warning',1600); inputEl.focus(); return; }
    if (state.subjects.some(s=>s.toLowerCase()===raw.toLowerCase())){ addSubjectToTeacher(teacherName, raw); closeFn(); return; }
    inputEl.disabled = true;
    if (window.api?.addSubject){
      window.api.addSubject(raw).then(res => {
        if (!res.success){ showNotification(res.error||'Failed to add', 'error', 2500); inputEl.disabled=false; return; }
        state.subjects.push(raw); state.subjects.sort((a,b)=>a.localeCompare(b));
        addSubjectToTeacher(teacherName, raw);
        renderSubjects();
        showNotification(`Created & assigned "${raw}"`, 'success', 1800);
        closeFn();
      }).catch(err => { showNotification('Add error','error',2200); inputEl.disabled=false; });
    } else {
      state.subjects.push(raw); addSubjectToTeacher(teacherName, raw); closeFn();
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
  function closeAnyPopover(){ document.getElementById('assignTeacherPopover')?.remove(); }

  function addSubjectToTeacher(teacherName, subject){
    if (!teacherName || !subject) return;
    const set = state.assignments[teacherName] || new Set();
    if (set.has(subject)) return;
    set.add(subject);
    state.assignments[teacherName] = set;
    saveAssignment(teacherName);
    renderTeachers();
    renderSubjects();
  }

  function removeSubjectFromTeacher(teacherName, subject){
    if (!teacherName || !subject) return;
    const set = state.assignments[teacherName] || new Set();
    if (!set.has(subject)) return;
    set.delete(subject);
    state.assignments[teacherName] = set;
    saveAssignment(teacherName);
    renderTeachers();
    renderSubjects();
  }

  function saveAssignment(teacherName){
    if (window.api && window.api.assignSubjectsToTeacher){
      window.api.assignSubjectsToTeacher({ teacher: teacherName, subjects: Array.from(state.assignments[teacherName]) })
        .then(result => {
          if (result.success){
            showNotification('Subjects assigned to teacher','success',2000);
          }else{
            showNotification(result.error||'Failed to assign subjects.','error',3000);
          }
        })
        .catch(()=>{ showNotification('Error assigning subjects.','error',3000); });
    }
  }

  function toggleBulkMode(){
    state.bulkMode = !state.bulkMode;
    if (!state.bulkMode){
      state.bulkSelectedSubjects.clear();
      state.bulkSelectedTeachers.clear();
      state.selectedSubject = null;
    }
    renderSubjects();
    renderTeachers();
    updateBulkApplyButton();
    updateBulkModeButton();
  }

  function toggleBulkSubject(subj){
    if (state.bulkSelectedSubjects.has(subj)) state.bulkSelectedSubjects.delete(subj); else state.bulkSelectedSubjects.add(subj);
    const chk = document.querySelector(`.subject-bulk-check[data-bulk-subject="${CSS.escape(subj)}"]`);
    if (chk) chk.checked = state.bulkSelectedSubjects.has(subj);
    updateBulkApplyButton();
    document.querySelectorAll(`#subjectsList .subject-item[data-subject="${CSS.escape(subj)}"]`).forEach(el=>{
      el.classList.toggle('bulk-selected', state.bulkSelectedSubjects.has(subj));
    });
  }

  function applyBulk(){
    if (state.bulkSelectedSubjects.size===0 || state.bulkSelectedTeachers.size===0) return;
    const subjects = Array.from(state.bulkSelectedSubjects);
    const teachers = Array.from(state.bulkSelectedTeachers);
    let changed = 0;
    teachers.forEach(teacherName => {
      const set = state.assignments[teacherName] || new Set();
      let localChanged = false;
      subjects.forEach(subj => { if (!set.has(subj)){ set.add(subj); localChanged = true; } });
      if (localChanged){
        state.assignments[teacherName] = set;
        saveAssignment(teacherName);
        changed++;
      }
    });
    if (changed>0){
      renderTeachers();
      renderSubjects();
      showNotification(`Applied to ${changed} teacher${changed!==1?'s':''}`, 'success', 1800);
    } else {
      showNotification('No changes needed', 'info', 1500);
    }
  }

  function clearBulk(){
    state.bulkSelectedSubjects.clear();
    state.bulkSelectedTeachers.clear();
    document.getElementById('bulkSelectAllTeachers')?.click();
    renderSubjects(); renderTeachers(); updateBulkApplyButton();
  }

  function updateBulkApplyButton(){
    const btn = document.getElementById('applyBulkBtn');
    if (!btn) return;
    const enabled = state.bulkSelectedSubjects.size>0 && state.bulkSelectedTeachers.size>0;
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

  function updateSummary(){
    const el = document.getElementById('assignSummary'); if (!el) return;
    const total = Object.values(state.assignments).reduce((sum,set)=> sum + set.size,0);
    el.textContent = `${total} assignment${total!==1?'s':''}`;
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
      }).catch(err => { showNotification('Error adding subject', 'error', 3000); });
    } else {
      state.subjects.push(clean); state.subjects.sort((a,b)=>a.localeCompare(b)); renderSubjects();
    }
  }

})();