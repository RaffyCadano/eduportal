const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
  // Student CRUD
  getStudents: () => ipcRenderer.invoke("get-students"),
  updateStudent: (student) => ipcRenderer.invoke("update-student", student),

  // Teacher CRUD
  getTeachers: () => ipcRenderer.invoke("get-teachers"),
  updateTeacher: (teacher) => ipcRenderer.invoke("update-teacher", teacher),

  // Section CRUD
  getSections: () => ipcRenderer.invoke("get-sections"),
  updateStudentSection: (data) =>
    ipcRenderer.invoke("update-student-section", data),

  // Credentials
  getCredentials: () => ipcRenderer.invoke("get-credentials"),
  updateCredentialPassword: (data) =>
    ipcRenderer.invoke("update-credential-password", data),

  // Entity creation & deletion
  createEntity: (payload) => ipcRenderer.invoke("create-entity", payload),
  deleteEntity: (payload) => ipcRenderer.invoke("delete-entity", payload),

  // Window controls
  closeWindow: () => ipcRenderer.send("close-window"),
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  maximizeWindow: () => ipcRenderer.send("maximize-window"),

  // Utility
  fixOrphanedTeachers: () => ipcRenderer.invoke("fix-orphaned-teachers"),
  openLoginWindow: () => ipcRenderer.send("open-login-window"),
  loginSuccess: () => ipcRenderer.send("login-success"),

  // Teacher convenience helpers
  getTeacher: async (idOrName) => {
    const res = await ipcRenderer.invoke("get-teachers");
    if (res && res.success && Array.isArray(res.teachers)) {
      return (
        res.teachers.find(
          (t) =>
            t.id === idOrName || t.name === idOrName || t.username === idOrName
        ) || null
      );
    }
    return null;
  },
  updateTeacherPassword: ({ username, newPassword }) =>
    ipcRenderer.invoke("update-credential-password", { username, newPassword }),
  // Subjects & assignments
  getSubjects: () => ipcRenderer.invoke("get-subjects"),
  addSubject: (name) => ipcRenderer.invoke("add-subject", { name }),
  updateSectionSubjects: (payload) =>
    ipcRenderer.invoke("update-section-subjects", payload),
  // Maintenance / backup
  fullBackup: () => ipcRenderer.invoke("full-backup"),
  resetDatabase: () => ipcRenderer.invoke("reset-database"),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  sendUpdateStatus: (cb) => ipcRenderer.on('update-status', (event, msg) => cb(msg)),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
