// Settings Module
(function(){
	function log(...a){ console.debug('[Settings]', ...a); }

	// Public entry
	window.openSettingsPage = function(){
		activateSidebar();
		const container = document.querySelector('.main-content .container-fluid');
		if(!container){ showNotification('Main container missing','error',2500); return; }
		container.innerHTML = buildLayout();
		wireEvents();
	};

	function activateSidebar(){
		try {
			document.querySelectorAll('.sidebar .nav-link').forEach(l=>l.classList.remove('active'));
			document.getElementById('settingsLink')?.classList.add('active');
		} catch(e){ log('Sidebar activation failed', e); }
	}

	function buildLayout(){
		return `
			<div class='row'>
				<div class='col-12'>
					<nav aria-label="breadcrumb" class="mb-3">
						<ol class='breadcrumb app-breadcrumb'>
							<li class='breadcrumb-item'><a href='#' id='dashboardBreadcrumb'><i class='bi bi-house-door-fill'></i><span>Dashboard</span></a></li>
							<li class='breadcrumb-item active' aria-current='page'><i class='bi bi-gear'></i><span>Settings</span></li>
						</ol>
					</nav>
					<div class='card p-4 border' style='border:none; border-radius:1.5em;'>
						<div class='d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2'>
							<h3 class='fw-bold mb-0'><i class='bi bi-gear text-primary me-2'></i>Application Settings</h3>
							<button class='btn btn-outline-primary btn-sm' id='refreshSettingsBtn'><i class='bi bi-arrow-clockwise me-1'></i>Reload</button>
						</div>
						<div class='alert alert-info d-flex align-items-center' role='alert'>
							<i class='bi bi-info-circle-fill me-2'></i>
							<div>Manage maintenance tasks and data utilities for this dashboard.</div>
						</div>
						<div class='row g-4'>
							<div class='col-lg-12'>
								<div class='card h-100 shadow-sm'>
									<div class='card-header bg-warning text-dark py-2'>
										<h6 class='mb-0'><i class='bi bi-tools me-2'></i>Maintenance & Data Utilities</h6>
									</div>
									<div class='card-body small'>
										<div class='mb-3 d-flex justify-content-between align-items-center'>
											<div>
												<div class='fw-semibold'>Fix Orphaned Teacher References</div>
												<small class='text-muted'>Remove teacher IDs in sections that no longer exist.</small>
											</div>
											<button class='btn btn-outline-warning btn-sm' id='fixOrphanedBtn'><i class='bi bi-wrench-adjustable-circle me-1'></i>Run</button>
										</div>
										<div class='mb-3 d-flex justify-content-between align-items-center'>
											<div>
												<div class='fw-semibold'>Export Sections (JSON)</div>
												<small class='text-muted'>Download current sections + subject assignments.</small>
											</div>
											<button class='btn btn-outline-secondary btn-sm' id='exportSectionsBtn'><i class='bi bi-download me-1'></i>Export</button>
										</div>
															<div class='mb-3 d-flex justify-content-between align-items-center'>
																<div>
																	<div class='fw-semibold text-danger'>Full Backup</div>
																	<small class='text-muted'>Download ALL data (students, teachers, sections, subjects, credentials).</small>
																</div>
																<button class='btn btn-outline-danger btn-sm' id='fullBackupBtn'><i class='bi bi-archive me-1'></i>Backup</button>
															</div>
															<div class='mb-3 d-flex justify-content-between align-items-center'>
																<div>
																	<div class='fw-semibold text-danger'>Reset Entire Database</div>
																	<small class='text-muted'>Creates a full backup first, then deletes all data. Cannot be undone.</small>
																</div>
																<button class='btn btn-danger btn-sm' id='resetDbBtn'><i class='bi bi-exclamation-octagon me-1'></i>Reset</button>
															</div>
										
										<div class='border-top pt-2 text-muted fst-italic'>Changes that affect data are permanent.</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>`;
	}

	function wireEvents(){
		// Breadcrumb clicks handled centrally.
		document.getElementById('refreshSettingsBtn')?.addEventListener('click', ()=>{ showNotification('Reloaded settings','info',1200); loadInitialSettings(); });
		document.getElementById('fixOrphanedBtn')?.addEventListener('click', fixOrphanedTeachers);
		document.getElementById('exportSectionsBtn')?.addEventListener('click', exportSections);
			document.getElementById('fullBackupBtn')?.addEventListener('click', fullBackup);
			document.getElementById('resetDbBtn')?.addEventListener('click', confirmResetDatabase);
	}

	function fixOrphanedTeachers(){
		if (!window.api || !window.api.fixOrphanedTeachers){ showNotification('API not available','error',1800); return; }
		showNotification('Scanning for orphaned teacher references...','info',2200);
		window.api.fixOrphanedTeachers().then(res => {
			if (res.success){
				showNotification(res.message || 'Fix completed','success',3000);
			} else {
				showNotification(res.error || 'Fix failed','error',3000);
			}
		}).catch(err => { showNotification('Error fixing orphaned teachers','error',3000); log(err); });
	}

	async function exportSections(){
		if (!window.api || !window.api.getSections){ showNotification('Sections API not available','error',2000); return; }
		try {
			const res = await window.api.getSections();
			if (!res.success){ showNotification('Failed to fetch sections','error',2200); return; }
			const data = res.sections || [];
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'sections-export-'+new Date().toISOString().slice(0,10)+'.json';
			document.body.appendChild(a); a.click(); a.remove();
			setTimeout(()=> URL.revokeObjectURL(url), 1500);
			showNotification('Sections exported','success',1600);
		} catch(e){ showNotification('Export failed','error',2500); log(e); }
	}


		async function fullBackup(autoNotify=true){
			if (!window.api?.fullBackup){ showNotification('Backup API not available','error',2200); return null; }
			try {
				if (autoNotify) showNotification('Generating full backup...','info',2000);
				const res = await window.api.fullBackup();
				if (!res.success){ showNotification(res.error||'Backup failed','error',3000); return null; }
				const backup = res.backup || {};
				const blob = new Blob([JSON.stringify(backup,null,2)], { type:'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				const stamp = new Date(backup.timestamp||Date.now()).toISOString().replace(/[:T]/g,'-').slice(0,19);
				a.download = 'full-backup-'+stamp+'.json';
				document.body.appendChild(a); a.click(); a.remove();
				setTimeout(()=>URL.revokeObjectURL(url),1500);
				if (autoNotify) showNotification('Backup downloaded','success',1800);
				return backup;
			} catch(e){ showNotification('Backup failed','error',2600); console.error(e); return null; }
		}

		function confirmResetDatabase(){
			// Build lightweight confirmation modal
			const id='resetDbModal';
			document.getElementById(id)?.remove();
			const html = `
				<div class='modal fade' id='${id}' tabindex='-1'>
					<div class='modal-dialog modal-dialog-centered'>
						<div class='modal-content'>
							<div class='modal-header bg-danger text-white'>
								<h5 class='modal-title'><i class='bi bi-exclamation-octagon-fill me-2'></i>Reset Database</h5>
								<button type='button' class='btn-close btn-close-white' data-bs-dismiss='modal'></button>
							</div>
							<div class='modal-body'>
								<div class='alert alert-warning small'><i class='bi bi-exclamation-triangle-fill me-2'></i>This will DELETE all students, teachers, sections, subjects, and credentials after creating a backup. This cannot be undone.</div>
								<p class='small mb-2 fw-semibold'>Protection Steps:</p>
								<ol class='small mb-3 ps-3'>
									<li>Generate & download a full backup (automatic)</li>
									<li>Wipe all major collections</li>
								</ol>
								<div class='form-check small'>
									<input class='form-check-input' type='checkbox' value='' id='confirmResetChk'>
									<label class='form-check-label' for='confirmResetChk'>I understand this action is irreversible.</label>
								</div>
							</div>
							<div class='modal-footer'>
								<button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Cancel</button>
								<button type='button' class='btn btn-danger' id='doResetBtn' disabled><i class='bi bi-exclamation-octagon me-1'></i>Proceed</button>
							</div>
						</div>
					</div>
				</div>`;
			document.body.insertAdjacentHTML('beforeend', html);
			const modalEl = document.getElementById(id);
			const bsModal = new bootstrap.Modal(modalEl);
			bsModal.show();
			modalEl.addEventListener('hidden.bs.modal', ()=> modalEl.remove());
			const chk = modalEl.querySelector('#confirmResetChk');
			const btn = modalEl.querySelector('#doResetBtn');
			chk.addEventListener('change', ()=>{ btn.disabled = !chk.checked; });
			btn.addEventListener('click', async ()=>{
				btn.disabled = true;
				btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Working...`;
				// 1. Backup
				const backup = await fullBackup(false);
				if (!backup){ btn.innerHTML='Failed'; showNotification('Backup failed – aborting reset','error',3000); btn.disabled=false; return; }
				showNotification('Backup saved, wiping data...','info',2000);
				// 2. Reset
				if (!window.api?.resetDatabase){ showNotification('Reset API missing','error',2500); return; }
				try {
					const res = await window.api.resetDatabase();
					if (res.success){
						showNotification('Database reset complete','success',2500);
						bsModal.hide();
					} else {
						showNotification(res.error||'Reset failed','error',3000);
					}
				} catch(e){ showNotification('Reset failed','error',3000); console.error(e); }
			});
		}

	// Sidebar link wiring if element already exists
	document.getElementById('settingsLink')?.addEventListener('click', function(e){
		e.preventDefault();
		openSettingsPage();
		if (typeof localStorage !== 'undefined') localStorage.setItem('lastPage','settings');
	});


})();
