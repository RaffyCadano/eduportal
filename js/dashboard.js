// Redesigned dashboard: dynamic stats, theme-aware, no inline colors.
(function(){
	const state = {
		loading: false,
		counts: { students: 0, teachers: 0, sections: 0, activeStudents: 0, activeTeachers: 0 },
		activities: []
	};

	function metricCard({ icon, label, value, accent }) {
		return `<div class="col-sm-6 col-lg-3">
			<div class="card h-100 border-0 metric-tile overflow-hidden position-relative">
				<div class="metric-accent metric-accent-${accent}"></div>
				<div class="card-body d-flex flex-column justify-content-between">
					<div class="d-flex align-items-center mb-2">
						<div class="flex-shrink-0 me-2 icon-wrap icon-${accent}"><i class="bi ${icon} fs-4"></i></div>
						<div class="flex-grow-1 text-end small text-uppercase fw-semibold tracking-tight">${label}</div>
					</div>
					<div class="display-6 fw-bold mb-0" style="line-height:1;">${value}</div>
				</div>
			</div>
		</div>`;
	}

	function renderSkeleton() {
		const c = document.getElementById('dashboardContainer');
		if (!c) return;
		c.innerHTML = `<div class='py-4 text-center text-muted'>Loading dashboard...</div>`;
	}

	function render() {
		const c = document.getElementById('dashboardContainer');
		if (!c) return;
		const { counts, activities } = state;
		c.innerHTML = `
			<div class='row g-3 g-lg-4 mb-4'>
				${metricCard({ icon:'bi-people', label:'Students', value:counts.students, accent:'blue' })}
				${metricCard({ icon:'bi-person-badge', label:'Teachers', value:counts.teachers, accent:'amber' })}
				${metricCard({ icon:'bi-journal-bookmark', label:'Sections', value:counts.sections, accent:'violet' })}
				${metricCard({ icon:'bi-person-check', label:'Active Students', value:counts.activeStudents, accent:'green' })}
			</div>
			<div class='row gy-4'>
				<div class='col-12 col-xl-8'>
					<div class='card border-0 shadow-sm surface'>
						<div class='card-header border-0 pb-0 bg-transparent d-flex align-items-center justify-content-between'>
							<h6 class='fw-bold mb-0'>Recent Activity</h6>
							<button class='btn btn-sm btn-outline-secondary refresh-activity'><i class='bi bi-arrow-repeat me-1'></i>Refresh</button>
						</div>
						<div class='card-body pt-3 pb-2'>
							${activities.length === 0 ? `<div class='text-muted small py-3'>No recent events.</div>` : `
								<ul class='list-group list-group-flush activity-list'>
									${activities.map(a=>`
										<li class='list-group-item px-0 d-flex gap-3 align-items-start activity-item'>
											<div class='activity-icon ${a.type}'><i class='bi ${a.icon}'></i></div>
											<div class='flex-grow-1'>
												<div class='small fw-semibold mb-1'>${a.message}</div>
												<div class='text-muted tiny'>${a.time}</div>
											</div>
										</li>`).join('')}
								</ul>`}
						</div>
					</div>
				</div>
				<div class='col-12 col-xl-4'>
					<div class='card border-0 shadow-sm surface-alt h-100'>
						<div class='card-header border-0 bg-transparent pb-0'>
							<h6 class='fw-bold mb-0'>Summary</h6>
						</div>
						<div class='card-body pt-3'>
							<div class='d-flex flex-column gap-3'>
								<div class='d-flex justify-content-between small'><span class='text-muted'>Teachers / Students</span><span class='fw-semibold'>${counts.teachers} / ${counts.students}</span></div>
								<div class='d-flex justify-content-between small'><span class='text-muted'>Avg Students / Section</span><span class='fw-semibold'>${counts.sections ? Math.round(counts.students / counts.sections) : 0}</span></div>
								<div class='d-flex justify-content-between small'><span class='text-muted'>Active Teachers</span><span class='fw-semibold'>${counts.activeTeachers}</span></div>
							</div>
							<hr />
							<button class='btn w-100 btn-sm btn-primary open-students mt-2'><i class='bi bi-people me-1'></i> View Students</button>
							<button class='btn w-100 btn-sm btn-outline-primary open-teachers mt-2'><i class='bi bi-person-badge me-1'></i> View Teachers</button>
							<button class='btn w-100 btn-sm btn-outline-secondary open-sections mt-2'><i class='bi bi-journal-bookmark me-1'></i> View Sections</button>
						</div>
					</div>
				</div>
			</div>`;

		// Wire buttons
		c.querySelector('.refresh-activity')?.addEventListener('click', ()=> loadActivities());
		c.querySelector('.open-students')?.addEventListener('click', ()=> document.getElementById('allStudentsLink')?.click());
		c.querySelector('.open-teachers')?.addEventListener('click', ()=> document.getElementById('allTeachersLink')?.click());
		c.querySelector('.open-sections')?.addEventListener('click', ()=> document.getElementById('allSectionsLink')?.click());
	}

	function deriveActiveStudents(students) {
		// Placeholder: consider active if has sectionId
		return students.filter(s => s.sectionId).length;
	}
	function deriveActiveTeachers(teachers) {
		// Placeholder: consider active if has subjects or sections array
		return teachers.filter(t => (t.subjects && t.subjects.length) || (t.sections && t.sections.length)).length;
	}

	async function loadCounts() {
		state.loading = true; renderSkeleton();
		try {
			const [studentsRes, teachersRes, sectionsRes] = await Promise.all([
				window.api.getStudents().catch(()=>({ students:[] })),
				window.api.getTeachers().catch(()=>({ teachers:[] })),
				window.api.getSections().catch(()=>({ sections:[] })),
			]);
			const students = studentsRes.students || [];
			const teachers = teachersRes.teachers || [];
			const sections = sectionsRes.sections || [];
			state.counts.students = students.length;
			state.counts.teachers = teachers.length;
			state.counts.sections = sections.length;
			state.counts.activeStudents = deriveActiveStudents(students);
			state.counts.activeTeachers = deriveActiveTeachers(teachers);
		} catch(e){ console.error('Dashboard counts error', e); }
		finally { state.loading = false; render(); }
	}

	function loadActivities() {
		// Placeholder: synthesize simple activity feed from counts timestamp
		const now = new Date();
		state.activities = [
			{ type:'student', icon:'bi-person-plus', message:`${state.counts.students} students currently registered`, time: now.toLocaleTimeString() },
			{ type:'teacher', icon:'bi-person-badge', message:`${state.counts.teachers} teachers in system`, time: now.toLocaleTimeString() },
			{ type:'section', icon:'bi-journal-bookmark', message:`${state.counts.sections} sections managed`, time: now.toLocaleTimeString() },
			{ type:'active', icon:'bi-person-check', message:`${state.counts.activeStudents} active students`, time: now.toLocaleTimeString() },
		];
		render();
	}

	function initDashboardLink() {
		const dashboardLink = document.getElementById('dashboardLink') || document.querySelector('.sidebar .nav-link');
		if (!dashboardLink) return;
		dashboardLink.addEventListener('click', e => {
			e.preventDefault();
			document.querySelectorAll('.sidebar .nav-link').forEach(l=> l.classList.remove('active'));
			dashboardLink.classList.add('active');
			// Ensure container exists in main-content then render
			const mainContent = document.querySelector('.main-content .container-fluid');
			if (mainContent) {
				if (!document.getElementById('dashboardContainer')) {
					mainContent.innerHTML = `<div id='dashboardContainer'></div>`;
				}
				render();
			}
		});
	}

	function injectStylesOnce(){
		if (document.getElementById('dashboardStyles')) return;
			const css = `
			.metric-tile { border-radius:1.25rem; background:var(--surface-alt); position:relative; transition:background .3s, transform .25s; }
			.metric-tile:hover { transform:translateY(-3px); }
			.metric-accent { position:absolute; inset:0; opacity:0.08; }
			.metric-accent-blue { background:linear-gradient(135deg,#3b82f6,#60a5fa); }
			.metric-accent-amber { background:linear-gradient(135deg,#f59e0b,#fbbf24); }
			.metric-accent-violet { background:linear-gradient(135deg,#8b5cf6,#a78bfa); }
			.metric-accent-green { background:linear-gradient(135deg,#16a34a,#22c55e); }
			.icon-wrap { width:40px; height:40px; border-radius:.85rem; display:flex; align-items:center; justify-content:center; font-size:1.25rem; }
			.icon-blue { background:rgba(59,130,246,.15); color:#2563eb; }
			.icon-amber { background:rgba(245,158,11,.20); color:#b45309; }
			.icon-violet { background:rgba(139,92,246,.18); color:#6d28d9; }
			.icon-green { background:rgba(34,197,94,.18); color:#15803d; }
			.theme-dark .icon-blue { background:rgba(59,130,246,.22); color:#60a5fa; }
			.theme-dark .icon-amber { background:rgba(245,158,11,.30); color:#fbbf24; }
			.theme-dark .icon-violet { background:rgba(139,92,246,.30); color:#a78bfa; }
			.theme-dark .icon-green { background:rgba(34,197,94,.30); color:#4ade80; }
			.activity-list .activity-item { border:none; border-bottom:1px solid var(--border-color); }
			.activity-list .activity-item:last-child { border-bottom:none; }
			.activity-icon { width:34px; height:34px; border-radius:.75rem; display:flex; align-items:center; justify-content:center; font-size:14px; background:var(--surface-alt); }
			.activity-icon.student { color:#2563eb; }
			.activity-icon.teacher { color:#b45309; }
			.activity-icon.section { color:#6d28d9; }
			.activity-icon.active { color:#15803d; }
			.tiny { font-size: .675rem; letter-spacing:.5px; }
				.tracking-tight { letter-spacing:.5px; }
		`;
		const style = document.createElement('style'); style.id='dashboardStyles'; style.textContent = css; document.head.appendChild(style);
	}

	function init(){
		injectStylesOnce();
		initDashboardLink();
		loadCounts().then(loadActivities);
	}

	if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
