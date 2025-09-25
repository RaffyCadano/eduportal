// Classes With Subjects Page
// Provides a read-focused overview of sections (classes) and their assigned subjects.
// Includes filtering, grouping by grade, and a quick jump to assignment screen.

(function(){
	function log(...a){ console.debug('[ClassesWithSubjects]', ...a); }

	const state = {
		sections: [], // { name, gradeLevel, teacher, subjects: [] }
		loading: false,
		filter: '',
		gradeFilter: 'all',
	};

	window.openClassesWithSubjectsPage = function(){
		activateSidebar();
		const container = document.querySelector('.main-content .container-fluid');
		if (!container){ showNotification('Main content not found','error',2500); return; }
		container.innerHTML = buildLayout();
		wireEvents();
		loadData();
	};

	function activateSidebar(){
		try {
			document.querySelectorAll('.sidebar .nav-link').forEach(l=>l.classList.remove('active'));
			document.getElementById('classesWithSubjectsLink')?.classList.add('active');
			document.getElementById('subjectsDropdownBtn')?.classList.add('active');
		} catch(e){ log('Sidebar activation failed', e); }
	}

	function buildLayout(){
		return `
			<div class='row'>
				<div class='col-12'>
					<nav aria-label="breadcrumb" class='mb-3'>
						<ol class='breadcrumb app-breadcrumb'>
							<li class='breadcrumb-item'><a href='#' id='dashboardBreadcrumb'><i class="bi bi-house-door-fill"></i><span>Dashboard</span></a></li>
							<li class='breadcrumb-item active' aria-current='page'><i class='bi bi-collection'></i><span> Classes & Subjects</span></li>
						</ol>
					</nav>
					<div class='card border-0' style='border-radius:1.25rem;'>
						<div class='card-header surface-alt border-0 pt-3 pb-2 d-flex flex-wrap justify-content-between align-items-end gap-2'>
							<div>
								<h4 class='fw-bold mb-0'>Classes & Subjects</h4>
								<small class='text-muted'>Overview of all sections with assigned subjects.</small>
							</div>
							<div class='d-flex gap-2'>
								<button class='btn btn-outline-primary btn-sm' id='goAssignBtn' title='Assign subjects'><i class='bi bi-pencil-square me-1'></i>Assign Subjects</button>
								<button class='btn btn-outline-secondary btn-sm' id='refreshClassesSubjectsBtn'><i class='bi bi-arrow-clockwise me-1'></i>Refresh</button>
							</div>
						</div>
						<div class='card-body pt-0'>
							<div class='row g-3 mb-2'>
								<div class='col-md-4'>
									<input type='text' id='sectionSearchInput' class='form-control form-control-sm' placeholder='Search section, teacher, or subject...'>
								</div>
								<div class='col-md-3'>
									<select id='gradeFilterSelect' class='form-select form-select-sm'>
										<option value='all'>All Grades</option>
									</select>
								</div>
								<div class='col-md-5 text-end small text-muted align-self-center'>
									<span id='overviewSummary'></span>
								</div>
							</div>
							<div id='classesSubjectsContent' class='position-relative'>
								<div id='loadingOverlay' class='text-center py-5 d-none'>
									<div class='spinner-border text-primary'></div>
									<div class='mt-2 small text-muted'>Loading...</div>
								</div>
								<div id='classesGroupedContainer'></div>
							</div>
						</div>
					</div>
				</div>
			</div>`;
	}

	function wireEvents(){
		// Breadcrumb clicks handled centrally now.
		document.getElementById('refreshClassesSubjectsBtn')?.addEventListener('click', ()=>{ loadData(true); });
		document.getElementById('goAssignBtn')?.addEventListener('click', ()=>{ window.openAssignSubjectsPage?.(); });
		document.getElementById('sectionSearchInput')?.addEventListener('input', ()=>{ state.filter = document.getElementById('sectionSearchInput').value.trim(); renderGroups(); });
		document.getElementById('gradeFilterSelect')?.addEventListener('change', ()=>{ state.gradeFilter = document.getElementById('gradeFilterSelect').value; renderGroups(); });
	}

	function loadData(force=false){
		if (state.loading && !force) return;
		state.loading = true;
		document.getElementById('loadingOverlay')?.classList.remove('d-none');
		const sectionsPromise = window.api?.getSections ? window.api.getSections() : Promise.resolve({ success:false, sections: []});
		const subjectsPromise = window.api?.getSubjects ? window.api.getSubjects() : Promise.resolve({ success:false, subjects: []});
		Promise.all([sectionsPromise, subjectsPromise])
			.then(([secRes, subjRes]) => {
				const sections = (secRes.success && Array.isArray(secRes.sections)) ? secRes.sections : [];
				// Ensure subjects array on each section (persisted earlier via assign page)
				sections.forEach(s => { if (!Array.isArray(s.subjects)) s.subjects = []; });
				state.sections = sections;
				populateGrades(sections);
				renderGroups();
			})
			.catch(err => { log('Load error', err); showNotification('Failed to load sections','error',3000); })
			.finally(()=>{
				state.loading = false;
				document.getElementById('loadingOverlay')?.classList.add('d-none');
			});
	}

	function populateGrades(sections){
		const select = document.getElementById('gradeFilterSelect');
		if (!select) return;
		const existing = new Set(['all']);
		Array.from(select.options).forEach(o=>existing.add(o.value));
		const grades = Array.from(new Set(sections.map(s=>s.gradeLevel).filter(Boolean))).sort((a,b)=>{
			const na = parseInt(a,10); const nb = parseInt(b,10);
			if (!isNaN(na)&&!isNaN(nb)) return na-nb; return a.localeCompare(b);
		});
		grades.forEach(g => {
			if (!existing.has(g)){
				const opt = document.createElement('option'); opt.value=g; opt.textContent = `Grade ${g}`; select.appendChild(opt);
			}
		});
	}

	function renderGroups(){
		const container = document.getElementById('classesGroupedContainer');
		if (!container) return;
		const filter = state.filter.toLowerCase();
		const gradeFilter = state.gradeFilter;
		let filtered = state.sections.slice();
		if (gradeFilter && gradeFilter !== 'all') filtered = filtered.filter(s => (s.gradeLevel||'').toString() === gradeFilter);
		if (filter){
			filtered = filtered.filter(s => {
				const blob = `${s.name||''} ${s.teacher||''} ${(s.subjects||[]).join(' ')}`.toLowerCase();
				return blob.includes(filter);
			});
		}
		const byGrade = groupBy(filtered, s => s.gradeLevel || 'Ungraded');
		const gradeKeys = Object.keys(byGrade).sort((a,b)=>{
			if (a==='Ungraded') return 1; if (b==='Ungraded') return -1;
			const na=parseInt(a,10), nb=parseInt(b,10); if(!isNaN(na)&&!isNaN(nb)) return na-nb; return a.localeCompare(b);
		});
		container.innerHTML = gradeKeys.length? gradeKeys.map(g => buildGradeBlock(g, byGrade[g])).join('') : `<div class='text-center text-muted py-5'>No sections match your filters.</div>`;
		updateSummary();
		attachExpandableHandlers();
	}

	function buildGradeBlock(grade, sections){
		const sectionCards = sections.sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(sec => buildSectionCard(sec)).join('');
		return `
			<div class='mb-4 grade-block' data-grade='${grade}'>
				<div class='d-flex justify-content-between align-items-center mb-2'>
					<h6 class='mb-0 fw-bold'>${grade==='Ungraded'? 'No Grade' : 'Grade '+grade}</h6>
					<button class='btn btn-sm btn-outline-secondary toggle-grade' data-grade='${grade}'><i class='bi bi-arrows-collapse'></i></button>
				</div>
				<div class='row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 grade-sections' data-grade-container='${grade}'>
					${sectionCards || `<div class='col'><div class='text-muted small'>No sections</div></div>`}
				</div>
			</div>`;
	}

	function buildSectionCard(sec){
		const subjects = Array.isArray(sec.subjects) ? sec.subjects.slice().sort((a,b)=>a.localeCompare(b)) : [];
		const subjectBadges = subjects.length ? subjects.map(s=>`<span class='badge rounded-pill bg-info text-dark border border-light-subtle subject-badge me-1 mb-1'>${s}</span>`).join('') : `<span class='text-muted small fst-italic'>No subjects</span>`;
		return `
			<div class='col'>
				<div class='card h-100 shadow-sm section-card border' style='border-radius:.75rem;'>
					<div class='card-body p-3 d-flex flex-column'>
						<div class='d-flex justify-content-between align-items-start mb-1'>
							<div class='fw-semibold text-truncate' title='${sec.name||''}'>${sec.name||'(Unnamed)'}</div>
							<button class='btn btn-sm btn-outline-primary assign-jump' data-sec='${sec.name}' title='Assign subjects to this section'><i class='bi bi-plus-lg'></i></button>
						</div>
						<div class='small text-muted mb-2 d-flex flex-wrap gap-2'>
							${sec.gradeLevel?`<span><i class='bi bi-mortarboard me-1'></i>G${sec.gradeLevel}</span>`:''}
							${sec.teacher?`<span title='Teacher'><i class='bi bi-person-badge me-1'></i>${sec.teacher}</span>`:''}
						</div>
						<div class='mt-auto'>${subjectBadges}</div>
					</div>
				</div>
			</div>`;
	}

	function attachExpandableHandlers(){
		document.querySelectorAll('.toggle-grade').forEach(btn => {
			btn.addEventListener('click', ()=>{
				const grade = btn.getAttribute('data-grade');
				const container = document.querySelector(`[data-grade-container="${CSS.escape(grade)}"]`);
				if (!container) return;
				const hidden = container.classList.toggle('d-none');
				btn.innerHTML = hidden ? `<i class='bi bi-arrows-expand'></i>` : `<i class='bi bi-arrows-collapse'></i>`;
			});
		});
		document.querySelectorAll('.assign-jump').forEach(btn => {
			btn.addEventListener('click', ()=>{
				// Open assign page then optionally highlight section (future enhancement)
				window.openAssignSubjectsPage?.();
				showNotification('Opening assignment view...', 'info', 1400);
			});
		});
	}

	function groupBy(arr, fn){
		return arr.reduce((acc, item) => { const key = fn(item); (acc[key] ||= []).push(item); return acc; }, {});
	}

	function updateSummary(){
		const el = document.getElementById('overviewSummary'); if (!el) return;
		const totalSections = state.sections.length;
		const totalAssignments = state.sections.reduce((acc, s) => acc + (Array.isArray(s.subjects)? s.subjects.length : 0), 0);
		el.textContent = `${totalSections} section${totalSections!==1?'s':''}, ${totalAssignments} subject assignment${totalAssignments!==1?'s':''}`;
	}

})();
