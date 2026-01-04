let loginWin = null;
let dashboardWin = null;
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getStorage } = require("firebase-admin/storage");
const { autoUpdater } = require("electron-updater");
require("dotenv").config(); // load .env if present

const serviceAccount = loadServiceAccount();

let rtdb = null;
let storage = null;
let firebaseReady = false;
if (!serviceAccount) {
  console.error("[Firebase] Missing credentials");
} else {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    firebaseReady = true;
    console.log("[Firebase] Initialized");
    rtdb = getDatabase();
    storage = getStorage();
  } catch (e) {
    console.error("[Firebase] Init error:", e.message);
  }
}
function loadServiceAccount() {
  // Option 2: Path to JSON file via env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    try {
      const p = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
      if (fs.existsSync(p)) {
        console.log("[Firebase] Using service account file:", p);
        return JSON.parse(fs.readFileSync(p, "utf8"));
      } else {
        console.error("Service account file not found:", p);
      }
    } catch (e) {
      console.error("Failed reading FIREBASE_SERVICE_ACCOUNT_FILE:", e.message);
    }
  }
  console.error(
    "[Firebase] Service account not provided. Set FIREBASE_SERVICE_ACCOUNT_FILE."
  );
  return null;
}

function createWindow() {
  loginWin = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 400,
    minHeight: 600,
    maxWidth: 1920,
    maxHeight: 1080,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  loginWin.setMenu(null);
  loginWin.loadFile("index.html");
}

function showStartupError(msg) {
  const win = new BrowserWindow({
    width: 420,
    height: 260,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: "Startup Error",
    webPreferences: { contextIsolation: true },
  });
  win.setMenu(null);
  win.loadURL(
    "data:text/html," +
      encodeURIComponent(`<body style="font-family:system-ui;padding:18px">
      <h3 style="margin:0 0 8px;color:#c00">Startup Error</h3>
      <p style="font-size:14px;line-height:1.4">${msg}</p>
      <p style="font-size:12px;color:#555">Set FIREBASE_SERVICE_ACCOUNT_FILE or FIREBASE_SERVICE_ACCOUNT_JSON and restart.</p>
      <button onclick="window.close()" style="padding:6px 14px;font-size:13px;">Close</button>
    </body>`)
  );
}

function setupAutoUpdates() {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  autoUpdater.autoDownload = true;

  autoUpdater.on("checking-for-update", () => sendUpdateStatus("checking"));
  autoUpdater.on("update-available", (info) =>
    sendUpdateStatus("available", info.version)
  );
  autoUpdater.on("update-not-available", () => sendUpdateStatus("none"));
  autoUpdater.on("download-progress", (p) =>
    sendUpdateStatus("progress", Math.round(p.percent))
  );
  autoUpdater.on("update-downloaded", () => {
    sendUpdateStatus("downloaded");
    setTimeout(() => autoUpdater.quitAndInstall(), 2000);
  });
  autoUpdater.on("error", (err) => sendUpdateStatus("error", err.message));

  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  if (!firebaseReady) {
    showStartupError(
      "Firebase Admin credentials not found. Application features disabled."
    );
  } else {
    createWindow();
    setupAutoUpdates();
  }
});
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.on("login-success", () => {
  if (loginWin) {
    loginWin.close();
    loginWin = null;
  }
  // Prevent multiple dashboard windows
  if (dashboardWin && !dashboardWin.isDestroyed()) {
    dashboardWin.focus();
    return;
  }
  dashboardWin = new BrowserWindow({
    width: 1980,
    height: 1080,
    minWidth: 400,
    minHeight: 600,
    resizable: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  dashboardWin.setMenu(null);
  dashboardWin.center();
  dashboardWin.loadFile("pages/main.html");
  dashboardWin.webContents.on("before-input-event", (event, input) => {
    const isDevToolsShortcut =
      (input.control && input.shift && input.key.toLowerCase() === "i") ||
      (input.meta && input.alt && input.key.toLowerCase() === "i");
    if (isDevToolsShortcut) {
      dashboardWin.webContents.openDevTools({ mode: "detach" });
      event.preventDefault();
    }
  });
});

function sendUpdateStatus(state, data) {
  if (dashboardWin)
    dashboardWin.webContents.send("update-status", { state, data });
  if (loginWin) loginWin.webContents.send("update-status", { state, data });
}
autoUpdater.on("update-available", (info) =>
  sendUpdateStatus("available", info.version)
);
autoUpdater.on("download-progress", (p) =>
  sendUpdateStatus("progress", Math.round(p.percent))
);
autoUpdater.on("update-downloaded", () => sendUpdateStatus("downloaded"));
autoUpdater.on("error", (err) => sendUpdateStatus("error", err.message));
// Listen for request to open login window (logout)
ipcMain.on("open-login-window", () => {
  // Close all dashboard windows (showing main.html)
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.webContents.getURL().includes("pages/main.html")) {
      win.close();
    }
  });
  dashboardWin = null;
  if (!loginWin) {
    loginWin = new BrowserWindow({
      width: 400,
      minWidth: 600,
      minHeight: 600,
      height: 600,
      maxWidth: 1980,
      maxHeight: 1080,
      resizable: false,
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    loginWin.setMenu(null);
    loginWin.loadFile("index.html");
  }
});
//

// IPC handler for updating credential password
ipcMain.handle(
  "update-credential-password",
  async (event, { username, newPassword }) => {
    try {
      // Update password in Realtime Database
      const credentialsRef = rtdb.ref("credentials");
      const snapshot = await credentialsRef.once("value");
      const credentials = snapshot.val() || {};
      if (!credentials[username]) {
        return { success: false, error: "Username not found" };
      }
      // Update password
      credentials[username].password = newPassword;
      await credentialsRef.child(username).update({ password: newPassword });
      return { success: true };
    } catch (error) {
      console.error("Error updating password:", error);
      return { success: false, error: error.message };
    }
  }
);
ipcMain.on("check-for-updates", () => {
  if (autoUpdater) {
    autoUpdater.checkForUpdates();
  }
});
// Assign subjects to teacher
ipcMain.handle(
  "assign-subjects-to-teacher",
  async (event, { teacher, subjects }) => {
    try {
      if (!teacher || !Array.isArray(subjects)) {
        return { success: false, error: "Missing teacher or subjects" };
      }
      // Find teacher by name
      const teachersRef = rtdb.ref("teachers");
      const teachersSnapshot = await teachersRef.once("value");
      const teachers = teachersSnapshot.val() || {};
      let targetKey = null;
      for (const [key, t] of Object.entries(teachers)) {
        if (t.name === teacher) {
          targetKey = key;
          break;
        }
      }
      if (!targetKey) {
        return { success: false, error: "Teacher not found" };
      }
      // Update subjects
      await teachersRef.child(targetKey).child("subjects").set(subjects);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
);
// Window control IPC handlers
ipcMain.on("close-window", (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.on("minimize-window", (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

// Helper function to generate unique username
async function generateUniqueUsername(baseUsername) {
  try {
    const credentialsRef = rtdb.ref("credentials");
    const snapshot = await credentialsRef.once("value");
    const credentials = snapshot.val() || {};

    let username = baseUsername;
    let counter = 1;

    // Check if base username exists
    while (credentials[username]) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  } catch (error) {
    console.error("Error generating unique username:", error);
    return baseUsername; // Fallback to original username
  }
}

// IPC handlers for CRUD operations
ipcMain.handle("create-entity", async (event, { type, data }) => {
  try {
    // Store all entities in Realtime Database
    if (type === "teachers" && data.username && data.password) {
      // First check for duplicates in the database
      const teachersRef = rtdb.ref("teachers");
      const teachersSnapshot = await teachersRef.once("value");
      const teachers = teachersSnapshot.val() || {};

      // Check for duplicate name or mobile number
      const newTeacherName = data.name.toString().trim().toLowerCase();
      const newMobileNo = data.mobileNo ? data.mobileNo.toString().trim() : "";

      const duplicateExists = Object.values(teachers).some((teacher) => {
        const existingName = (teacher.name || "")
          .toString()
          .trim()
          .toLowerCase();
        const existingMobile = (teacher.mobileNo || "").toString().trim();

        return (
          existingName === newTeacherName ||
          (newMobileNo && existingMobile === newMobileNo)
        );
      });

      if (duplicateExists) {
        return {
          success: false,
          error: `Teacher with name "${data.name}" or mobile number "${data.mobileNo}" already exists.`,
        };
      }

      // Generate unique username
      const uniqueUsername = await generateUniqueUsername(data.username);

      // Separate credentials from profile (support both profilePicture & legacy profilePic)
      const {
        username,
        password,
        name,
        profilePicture,
        profilePic,
        ...profile
      } = data;
      const teacherRef = rtdb.ref("teachers").push();
      profile.userKey = teacherRef.key;
      profile.name = name;
      profile.username = uniqueUsername;

      let uploadedTeacherProfileUrl = null;
      const teacherImage = profilePicture || profilePic; // base64 data URL expected
      if (
        teacherImage &&
        typeof teacherImage === "string" &&
        teacherImage.startsWith("data:image/")
      ) {
        try {
          const matches = teacherImage.match(
            /^data:(image\/[^;]+);base64,(.+)$/
          );
          if (matches) {
            const mimeType = matches[1];
            const b64 = matches[2];
            const buffer = Buffer.from(b64, "base64");
            const ext = (mimeType.split("/")[1] || "jpg").replace(
              /[^a-z0-9]/gi,
              ""
            );
            const filePath = `teachers/${teacherRef.key}/profile.${ext}`;
            const bucket = storage.bucket();
            const bucketFile = bucket.file(filePath);
            await bucketFile.save(buffer, {
              resumable: false,
              metadata: {
                contentType: mimeType,
                cacheControl: "public,max-age=31536000",
              },
            });
            try {
              const [signedUrl] = await bucketFile.getSignedUrl({
                action: "read",
                expires: Date.now() + 31536000000,
              });
              uploadedTeacherProfileUrl = signedUrl;
              profile.profilePictureUrl = signedUrl;
            } catch (e) {
              uploadedTeacherProfileUrl = `gs://${bucket.name}/${filePath}`;
              profile.profilePictureUrl = uploadedTeacherProfileUrl;
              console.warn(
                "[STORAGE] Signed URL generation failed (teacher create), using gs:// path",
                e.message
              );
            }
          } else {
            console.warn(
              "[STORAGE] Teacher base64 image data did not match expected pattern"
            );
          }
        } catch (e) {
          console.warn("Failed to upload teacher profile picture:", e.message);
        }
      }

      await teacherRef.set(profile);

      const credRef = rtdb.ref("credentials").child(uniqueUsername);
      await credRef.set({
        password,
        type: "teacher",
        username: uniqueUsername,
        name: name,
        id: teacherRef.key,
      });
      return {
        success: true,
        id: teacherRef.key,
        username: uniqueUsername,
        profilePictureUrl: uploadedTeacherProfileUrl,
      };
    } else if (type === "students" && data.password) {
      // First check for duplicates in the database
      const studentsRef = rtdb.ref("students");
      const studentsSnapshot = await studentsRef.once("value");
      const students = studentsSnapshot.val() || {};

      // Accept both 'name' and 'studentName' for compatibility
      const rawName = data.studentName || data.name || "";
      const newStudentName = rawName.toString().trim().toLowerCase();
      const newRegistrationNo = data.registrationNo
        ? data.registrationNo.toString().trim()
        : "";

      const duplicateExists = Object.values(students).some((student) => {
        const existingName = (student.name || "")
          .toString()
          .trim()
          .toLowerCase();
        const existingRegNo = (student.registrationNo || "").toString().trim();

        return (
          existingName === newStudentName ||
          (newRegistrationNo && existingRegNo === newRegistrationNo)
        );
      });

      if (duplicateExists) {
        return {
          success: false,
          error: `Student with name "${rawName}" or registration number "${data.registrationNo}" already exists.`,
        };
      }

      // Generate username from name if not provided
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
      let username = data.username;
      if (!username || username.length < 2) {
        username = generateUsernameFromName(rawName);
      }
      // Generate unique username
      const uniqueUsername = await generateUniqueUsername(username);

      // Separate credentials from profile
      const { password, profilePicture, ...profile } = data;
      const studentRef = rtdb.ref("students").push();
      profile.userKey = studentRef.key;
      profile.name = rawName;
      profile.username = uniqueUsername; // Store the unique username in profile
      let uploadedProfilePictureUrl = null;
      // If profilePicture is a base64 data URL, upload to storage and store URL instead
      if (
        profilePicture &&
        typeof profilePicture === "string" &&
        profilePicture.startsWith("data:image/")
      ) {
        try {
          const matches = profilePicture.match(
            /^data:(image\/[^;]+);base64,(.+)$/
          );
          if (matches) {
            const mimeType = matches[1];
            const b64 = matches[2];
            const buffer = Buffer.from(b64, "base64");
            const ext = (mimeType.split("/")[1] || "jpg").replace(
              /[^a-z0-9]/gi,
              ""
            );
            const filePath = `students/${studentRef.key}/profile.${ext}`;
            const bucket = storage.bucket();
            const bucketFile = bucket.file(filePath);
            await bucketFile.save(buffer, {
              resumable: false,
              metadata: {
                contentType: mimeType,
                cacheControl: "public,max-age=31536000",
              },
            });
            // Try to get a signed URL valid for 1 year
            try {
              const [signedUrl] = await bucketFile.getSignedUrl({
                action: "read",
                expires: Date.now() + 31536000000,
              });
              uploadedProfilePictureUrl = signedUrl;
              profile.profilePictureUrl = signedUrl;
            } catch (e) {
              uploadedProfilePictureUrl = `gs://${bucket.name}/${filePath}`;
              profile.profilePictureUrl = uploadedProfilePictureUrl;
              console.warn(
                "[STORAGE] Signed URL generation failed, using gs:// path",
                e.message
              );
            }
          } else {
            console.warn(
              "[STORAGE] Base64 image data did not match expected pattern"
            );
          }
        } catch (e) {
          console.warn("Failed to upload profile picture:", e.message);
        }
      } else if (profilePicture) {
        console.warn("[STORAGE] profilePicture provided but not a data URL");
      }
      await studentRef.set(profile);
      // Store credentials separately using unique username as key
      const credRef = rtdb.ref("credentials").child(uniqueUsername);
      await credRef.set({
        password,
        type: "student",
        name: rawName,
        username: uniqueUsername,
        id: studentRef.key,
      });
      return {
        success: true,
        id: studentRef.key,
        username: uniqueUsername,
        profilePictureUrl: uploadedProfilePictureUrl,
      };
    } else if (type === "sections") {
      // Basic validation
      const sectionName = (data.name || data.sectionName || "")
        .toString()
        .trim();
      const gradeLevel = (data.gradeLevel || "").toString().trim();
      const teacher = (data.teacher || data.sectionTeacher || "")
        .toString()
        .trim();

      if (!sectionName || !gradeLevel || !teacher) {
        return {
          success: false,
          error: "Missing required fields (name, gradeLevel, teacher)",
        };
      }

      // Prevent duplicate section names (case-insensitive)
      const sectionsRef = rtdb.ref("sections");
      const sectionsSnap = await sectionsRef.once("value");
      const existingSections = sectionsSnap.val() || {};
      const lowerTarget = sectionName.toLowerCase();
      const duplicate = Object.values(existingSections).some(
        (sec) =>
          (sec.name || "").toString().trim().toLowerCase() === lowerTarget
      );
      if (duplicate) {
        return {
          success: false,
          error: `Section name "${sectionName}" already exists.`,
        };
      }

      // Resolve teacher: try to find teacher by name to store its Firebase key for relational lookups
      let teacherId = null;
      try {
        const teachersRef = rtdb.ref("teachers");
        const teachersSnap = await teachersRef.once("value");
        const teachers = teachersSnap.val() || {};
        for (const [tid, t] of Object.entries(teachers)) {
          if (
            (t.name || "").toString().trim().toLowerCase() ===
            teacher.toLowerCase()
          ) {
            teacherId = tid;
            break;
          }
        }
      } catch (e) {
        console.warn(
          "Could not resolve teacher ID for section creation:",
          e.message
        );
      }

      const newSectionRef = sectionsRef.push();
      const payload = {
        name: sectionName,
        gradeLevel,
        teacher: teacherId || teacher, // store ID if resolved, else name
        teacherId: teacherId || null,
        createdDate: Date.now(),
      };
      // Include optional fields if provided
      if (data.description) payload.description = data.description;
      if (data.capacity) payload.capacity = data.capacity;

      await newSectionRef.set(payload);
      return { success: true, id: newSectionRef.key };
    }
    // Fallback when type missing/unsupported
    return {
      success: false,
      error: "Unsupported entity type or missing payload",
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC handler to get sections
ipcMain.handle("get-sections", async () => {
  try {
    const ref = rtdb.ref("sections");
    const snapshot = await ref.once("value");
    const val = snapshot.val();
    let sections = [];

    if (val) {
      // Get teachers data to resolve teacher names
      const teachersRef = rtdb.ref("teachers");
      const teachersSnapshot = await teachersRef.once("value");
      const teachersVal = teachersSnapshot.val();

      // Create teacher lookup map
      const teacherMap = {};
      if (teachersVal && typeof teachersVal === "object") {
        Object.entries(teachersVal).forEach(([id, teacher]) => {
          teacherMap[id] = teacher.name || id;
        });
      }

      // If sections is an object, convert to array with complete section data
      if (typeof val === "object") {
        sections = Object.entries(val).map(([id, section]) => {
          let teacherName = section.teacher || null;
          let teacherId = section.teacherId || section.teacher || null;

          // If teacher field exists, try to resolve it
          if (section.teacher) {
            // Check if it's an ID that needs resolution
            if (teacherMap[section.teacher]) {
              teacherName = teacherMap[section.teacher];
              teacherId = section.teacher;
            } else {
              // Check if this looks like a Firebase ID (starts with -)
              if (section.teacher.startsWith("-")) {
                teacherName = "Unassigned (Teacher Removed)";
                teacherId = section.teacher;
              } else {
                // It might already be a name, keep it
                teacherName = section.teacher;
              }
            }
          }

          const resolvedSection = {
            id,
            name: section.name || id,
            gradeLevel: section.gradeLevel || null,
            capacity: section.capacity || null,
            description: section.description || null,
            createdDate: section.createdDate || null,
            // Add any other fields that might be stored first
            ...section,
            // Override with resolved teacher data (this must come after spread)
            teacher: teacherName,
            teacherId: teacherId,
          };

          return resolvedSection;
        });
      }
    }
    return { success: true, sections };
  } catch (error) {
    return { success: false, error: error.message, sections: [] };
  }
});
// IPC handler to get teachers (Realtime Database)
ipcMain.handle("get-teachers", async () => {
  if (!firebaseReady || !rtdb)
    return { success: false, error: "Database unavailable", teachers: [] };
  try {
    const ref = rtdb.ref("teachers");
    const snapshot = await ref.once("value");
    const val = snapshot.val();
    let teachers = [];
    if (val) {
      // If teachers is an object, convert to array with full teacher data
      if (typeof val === "object") {
        teachers = Object.entries(val).map(([id, teacher]) => ({
          id,
          name: teacher.name || id,
          mobileNo: teacher.mobileNo || null,
          address: teacher.address || null,
          gender: teacher.gender || null,
          dateOfJoining: teacher.dateOfJoining || null,
          dob: teacher.dob || null,
          username: teacher.username || null,
          userKey: teacher.userKey || id,
          // Add any other fields that might be stored
          ...teacher,
        }));
      }
    }
    return { success: true, teachers };
  } catch (error) {
    return { success: false, error: error.message, teachers: [] };
  }
});

// IPC handler to get students (Realtime Database)
ipcMain.handle("get-students", async () => {
  if (!firebaseReady || !rtdb)
    return { success: false, error: "Database unavailable", teachers: [] };
  try {
    const ref = rtdb.ref("students");
    const snapshot = await ref.once("value");
    const val = snapshot.val();
    let students = [];
    if (val) {
      // If students is an object, convert to array with full student data
      if (typeof val === "object") {
        students = Object.entries(val).map(([id, student]) => ({
          id,
          name: student.name || id,
          registrationNo: student.registrationNo || null,
          section: student.section || null,
          grade: student.grade || student.gradeLevel || null,
          gradeLevel: student.gradeLevel || student.grade || null,
          parentName: student.parentName || null,
          mobileNo: student.mobileNo || null,
          address: student.address || null,
          gender: student.gender || null,
          dateOfJoining: student.dateOfJoining || student.admissionDate || null,
          admissionDate: student.admissionDate || student.dateOfJoining || null,
          dob: student.dob || null,
          username: student.username || null,
          userKey: student.userKey || id,
          // Add any other fields that might be stored
          ...student,
        }));
      }
    }
    return { success: true, students };
  } catch (error) {
    return { success: false, error: error.message, students: [] };
  }
});

// IPC handler to delete entities and their related data
ipcMain.handle("delete-entity", async (event, { type, data }) => {
  try {
    if (type === "sections") {
      // Delete section and all related data
      const sectionName = data.name;

      // First, get the section ID by searching for the section name
      const sectionsRef = rtdb.ref("sections");
      const sectionsSnapshot = await sectionsRef.once("value");
      const sections = sectionsSnapshot.val() || {};

      let sectionKey = null;
      let sectionData = null;

      // Find the section by name
      for (const [key, section] of Object.entries(sections)) {
        if (section.name === sectionName) {
          sectionKey = key;
          sectionData = section;
          break;
        }
      }

      if (!sectionKey) {
        return { success: false, error: `Section "${sectionName}" not found` };
      }

      // Delete the section
      await sectionsRef.child(sectionKey).remove();

      // Remove section assignments from students
      const studentsRef = rtdb.ref("students");
      const studentsSnapshot = await studentsRef.once("value");
      const students = studentsSnapshot.val() || {};

      let studentsUpdated = 0;
      for (const [studentKey, student] of Object.entries(students)) {
        if (student.section === sectionName) {
          await studentsRef.child(studentKey).child("section").remove();
          studentsUpdated++;
        }
      }

      // Remove section from teacher assignments
      const teachersRef = rtdb.ref("teachers");
      const teachersSnapshot = await teachersRef.once("value");
      const teachers = teachersSnapshot.val() || {};

      let teachersUpdated = 0;
      for (const [teacherKey, teacher] of Object.entries(teachers)) {
        if (
          teacher.assignedSections &&
          teacher.assignedSections.includes(sectionName)
        ) {
          const updatedSections = teacher.assignedSections.filter(
            (s) => s !== sectionName
          );
          if (updatedSections.length > 0) {
            await teachersRef
              .child(teacherKey)
              .child("assignedSections")
              .set(updatedSections);
          } else {
            await teachersRef
              .child(teacherKey)
              .child("assignedSections")
              .remove();
          }
          teachersUpdated++;
        }
      }

      return {
        success: true,
        message: `Section "${sectionName}" deleted successfully. Updated ${studentsUpdated} students and ${teachersUpdated} teachers.`,
        studentsUpdated,
        teachersUpdated,
      };
    } else if (type === "teachers") {
      // Delete teacher and related data
      const teacherName = data.name || data.teacherName;
      const teacherId = data.id;

      let targetKey = null;
      let targetTeacher = null;

      if (teacherId) {
        // If we have an ID, use it directly
        targetKey = teacherId;
        const teacherRef = rtdb.ref("teachers").child(teacherId);
        const snapshot = await teacherRef.once("value");
        if (snapshot.exists()) {
          targetTeacher = snapshot.val();
        }
      } else if (teacherName) {
        // Search by name
        const teachersRef = rtdb.ref("teachers");
        const teachersSnapshot = await teachersRef.once("value");
        const teachers = teachersSnapshot.val() || {};

        for (const [key, teacher] of Object.entries(teachers)) {
          if (teacher.name === teacherName) {
            targetKey = key;
            targetTeacher = teacher;
            break;
          }
        }
      }

      if (!targetKey || !targetTeacher) {
        return { success: false, error: `Teacher not found` };
      }

      // Delete teacher profile
      await rtdb.ref("teachers").child(targetKey).remove();

      // Delete teacher credentials if they exist
      if (targetTeacher.username) {
        await rtdb.ref("credentials").child(targetTeacher.username).remove();
      }

      // Remove teacher assignments from sections
      const sectionsRef = rtdb.ref("sections");
      const sectionsSnapshot = await sectionsRef.once("value");
      const sections = sectionsSnapshot.val() || {};

      let sectionsUpdated = 0;
      for (const [sectionKey, section] of Object.entries(sections)) {
        if (
          section.teacher === targetTeacher.name ||
          section.teacherId === targetKey
        ) {
          await sectionsRef.child(sectionKey).child("teacher").remove();
          await sectionsRef.child(sectionKey).child("teacherId").remove();
          sectionsUpdated++;
        }
      }

      return {
        success: true,
        message: `Teacher "${targetTeacher.name}" deleted successfully. Updated ${sectionsUpdated} sections.`,
        sectionsUpdated,
      };
    } else if (type === "students") {
      // Delete student and related data
      const studentName = data.name || data.studentName;
      const studentId = data.id;

      let targetKey = null;
      let targetStudent = null;

      if (studentId) {
        // If we have an ID, use it directly
        targetKey = studentId;
        const studentRef = rtdb.ref("students").child(studentId);
        const snapshot = await studentRef.once("value");
        if (snapshot.exists()) {
          targetStudent = snapshot.val();
        }
      } else if (studentName) {
        // Search by name
        const studentsRef = rtdb.ref("students");
        const studentsSnapshot = await studentsRef.once("value");
        const students = studentsSnapshot.val() || {};

        for (const [key, student] of Object.entries(students)) {
          if (student.name === studentName) {
            targetKey = key;
            targetStudent = student;
            break;
          }
        }
      }

      if (!targetKey || !targetStudent) {
        return { success: false, error: `Student not found` };
      }

      // Delete student profile
      await rtdb.ref("students").child(targetKey).remove();

      // Delete student credentials if they exist
      if (targetStudent.username) {
        await rtdb.ref("credentials").child(targetStudent.username).remove();
      }

      return {
        success: true,
        message: `Student "${targetStudent.name}" deleted successfully.`,
      };
    } else {
      // Generic delete for other entity types
      const ref = rtdb.ref(type);

      if (data.id) {
        // Delete by ID
        await ref.child(data.id).remove();
        return { success: true, message: `${type} deleted successfully.` };
      } else {
        return { success: false, error: "No ID provided for deletion" };
      }
    }
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    return { success: false, error: error.message };
  }
});

// IPC handler to fix orphaned teacher references in sections
ipcMain.handle("fix-orphaned-teachers", async () => {
  try {
    const sectionsRef = rtdb.ref("sections");
    const sectionsSnapshot = await sectionsRef.once("value");
    const sections = sectionsSnapshot.val() || {};

    const teachersRef = rtdb.ref("teachers");
    const teachersSnapshot = await teachersRef.once("value");
    const teachers = teachersSnapshot.val() || {};

    const teacherIds = Object.keys(teachers);
    const updates = {};
    let fixedCount = 0;

    for (const [sectionId, section] of Object.entries(sections)) {
      if (
        section.teacher &&
        section.teacher.startsWith("-") &&
        !teacherIds.includes(section.teacher)
      ) {
        // This is an orphaned teacher ID, remove it
        updates[`sections/${sectionId}/teacher`] = null;
        updates[`sections/${sectionId}/teacherId`] = null;
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      await rtdb.ref().update(updates);
    }

    return {
      success: true,
      message: `Fixed ${fixedCount} orphaned teacher references`,
      fixedCount,
    };
  } catch (error) {
    console.error("Error fixing orphaned teachers:", error);
    return { success: false, error: error.message };
  }
});

// IPC handler to update student section assignment
ipcMain.handle(
  "update-student-section",
  async (event, { studentId, sectionName }) => {
    try {
      const studentRef = rtdb.ref("students").child(studentId);
      const snapshot = await studentRef.once("value");

      if (!snapshot.exists()) {
        return { success: false, error: "Student not found" };
      }

      // Update the student's section
      if (sectionName) {
        await studentRef.child("section").set(sectionName);
      } else {
        await studentRef.child("section").remove();
      }

      const studentName = snapshot.val().name || "Unknown Student";
      const message = sectionName
        ? `Student "${studentName}" assigned to section "${sectionName}"`
        : `Student "${studentName}" removed from section`;

      return { success: true, message };
    } catch (error) {
      console.error("Error updating student section:", error);
      return { success: false, error: error.message };
    }
  }
);
// IPC handler to update student profile
ipcMain.handle("update-student", async (event, updatedStudent) => {
  try {
    // Find student by ID
    const studentRef = rtdb.ref("students").child(updatedStudent.id);
    const snapshot = await studentRef.once("value");
    if (!snapshot.exists()) {
      return { success: false, error: "Student not found" };
    }
    const existing = snapshot.val() || {};
    let profilePictureUrl = existing.profilePictureUrl || null;
    // Handle profile picture update logic
    if (
      Object.prototype.hasOwnProperty.call(updatedStudent, "profilePicture")
    ) {
      const pp = updatedStudent.profilePicture;
      if (pp === "REMOVE") {
        // Attempt to delete existing stored file if path known (gs:// or signed URL)
        if (profilePictureUrl) {
          try {
            // Try to derive storage file path if it follows our pattern students/<id>/profile.*
            const match = profilePictureUrl.match(
              /students\/(.+?)\/profile\.[a-z0-9]+/i
            );
            if (match) {
              const filePath = `students/${updatedStudent.id}/profile.${
                (profilePictureUrl.split(".").pop() || "jpg").split("?")[0]
              }`;
              const bucket = storage.bucket();
              await bucket.file(filePath).delete({ ignoreNotFound: true });
            }
          } catch (e) {
            console.warn(
              "[STORAGE] Failed to delete old profile picture:",
              e.message
            );
          }
        }
        profilePictureUrl = null;
      } else if (typeof pp === "string" && pp.startsWith("data:image/")) {
        try {
          const matches = pp.match(/^data:(image\/[^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const b64 = matches[2];
            const buffer = Buffer.from(b64, "base64");
            const ext = (mimeType.split("/")[1] || "jpg").replace(
              /[^a-z0-9]/gi,
              ""
            );
            const filePath = `students/${updatedStudent.id}/profile.${ext}`;
            const bucket = storage.bucket();
            const bucketFile = bucket.file(filePath);
            await bucketFile.save(buffer, {
              resumable: false,
              metadata: {
                contentType: mimeType,
                cacheControl: "public,max-age=31536000",
              },
            });
            try {
              const [signedUrl] = await bucketFile.getSignedUrl({
                action: "read",
                expires: Date.now() + 31536000000,
              });
              profilePictureUrl = signedUrl;
            } catch (e) {
              profilePictureUrl = `gs://${bucket.name}/${filePath}`;
              console.warn(
                "[STORAGE] Signed URL generation failed (update), using gs:// path",
                e.message
              );
            }
          } else {
            console.warn(
              "[STORAGE] Updated base64 image data did not match expected pattern"
            );
          }
        } catch (e) {
          console.warn(
            "[STORAGE] Failed to upload updated profile picture:",
            e.message
          );
        }
      }
      // We will remove the temporary field before saving other updates
      delete updatedStudent.profilePicture;
    }
    // Persist updated fields
    const payload = { ...updatedStudent };
    if (profilePictureUrl) {
      payload.profilePictureUrl = profilePictureUrl;
    } else if (profilePictureUrl === null) {
      // Explicit removal
      payload.profilePictureUrl = null;
    }
    await studentRef.update(payload);

    // Optionally update credentials if username or name changed
    if (updatedStudent.username) {
      const credRef = rtdb.ref("credentials").child(updatedStudent.username);
      const credSnapshot = await credRef.once("value");
      if (credSnapshot.exists()) {
        await credRef.update({
          name: updatedStudent.name,
          username: updatedStudent.username,
          id: updatedStudent.id,
        });
      }
    }
    return { success: true, profilePictureUrl };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: error.message };
  }
});
// IPC handler to update teacher profile
ipcMain.handle("update-teacher", async (event, updatedTeacher) => {
  try {
    if (!updatedTeacher || !updatedTeacher.id) {
      return { success: false, error: "Missing teacher id" };
    }
    const teacherRef = rtdb.ref("teachers").child(updatedTeacher.id);
    const snapshot = await teacherRef.once("value");
    if (!snapshot.exists()) {
      return { success: false, error: "Teacher not found" };
    }
    const existingData = snapshot.val() || {};
    if (!updatedTeacher.username && existingData.username) {
      updatedTeacher.username = existingData.username;
    }

    // Process profile picture changes similar to student logic
    let profilePictureUrl = existingData.profilePictureUrl || null;
    if (
      Object.prototype.hasOwnProperty.call(updatedTeacher, "profilePicture")
    ) {
      const pp = updatedTeacher.profilePicture;
      if (pp === "REMOVE") {
        if (profilePictureUrl) {
          try {
            const match = profilePictureUrl.match(
              /teachers\/(.+?)\/profile\.[a-z0-9]+/i
            );
            if (match) {
              const filePath = `teachers/${updatedTeacher.id}/profile.${
                (profilePictureUrl.split(".").pop() || "jpg").split("?")[0]
              }`;
              const bucket = storage.bucket();
              await bucket.file(filePath).delete({ ignoreNotFound: true });
            }
          } catch (e) {
            console.warn(
              "[STORAGE] Failed to delete old teacher profile picture:",
              e.message
            );
          }
        }
        profilePictureUrl = null;
      } else if (typeof pp === "string" && pp.startsWith("data:image/")) {
        try {
          const matches = pp.match(/^data:(image\/[^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const b64 = matches[2];
            const buffer = Buffer.from(b64, "base64");
            const ext = (mimeType.split("/")[1] || "jpg").replace(
              /[^a-z0-9]/gi,
              ""
            );
            const filePath = `teachers/${updatedTeacher.id}/profile.${ext}`;
            const bucket = storage.bucket();
            const bucketFile = bucket.file(filePath);
            await bucketFile.save(buffer, {
              resumable: false,
              metadata: {
                contentType: mimeType,
                cacheControl: "public,max-age=31536000",
              },
            });
            try {
              const [signedUrl] = await bucketFile.getSignedUrl({
                action: "read",
                expires: Date.now() + 31536000000,
              });
              profilePictureUrl = signedUrl;
            } catch (e) {
              profilePictureUrl = `gs://${bucket.name}/${filePath}`;
              console.warn(
                "[STORAGE] Signed URL generation failed (teacher update), using gs:// path",
                e.message
              );
            }
          } else {
            console.warn(
              "[STORAGE] Updated teacher base64 image did not match expected pattern"
            );
          }
        } catch (e) {
          console.warn(
            "[STORAGE] Failed to upload updated teacher profile picture:",
            e.message
          );
        }
      }
      delete updatedTeacher.profilePicture;
    }

    const { newPassword } = updatedTeacher;
    delete updatedTeacher.newPassword;

    const payload = { ...updatedTeacher };
    if (profilePictureUrl) {
      payload.profilePictureUrl = profilePictureUrl;
    } else if (profilePictureUrl === null) {
      payload.profilePictureUrl = null; // explicit removal
    }
    await teacherRef.update(payload);

    let passwordUpdated = false;
    if (payload.username) {
      const credRef = rtdb.ref("credentials").child(payload.username);
      const credSnapshot = await credRef.once("value");
      if (credSnapshot.exists()) {
        await credRef.update({
          name: payload.name,
          id: payload.id,
          username: payload.username,
        });
        if (newPassword && newPassword.trim().length > 0) {
          await credRef.update({ password: newPassword.trim() });
          passwordUpdated = true;
        }
      } else if (newPassword && newPassword.trim().length > 0) {
        await credRef.set({
          password: newPassword.trim(),
          type: "teacher",
          name: payload.name,
          username: payload.username,
          id: payload.id,
        });
        passwordUpdated = true;
      }
    }

    return { success: true, passwordUpdated, profilePictureUrl };
  } catch (error) {
    console.error("Error updating teacher:", error);
    return { success: false, error: error.message };
  }
});
// IPC handler to get credentials (Realtime Database)
ipcMain.handle("get-credentials", async () => {
  try {
    const credentialsRef = rtdb.ref("credentials");
    const snapshot = await credentialsRef.once("value");
    const val = snapshot.val();
    let credentials = [];

    if (val) {
      // Convert credentials object to array with username as key
      if (typeof val === "object") {
        credentials = Object.entries(val).map(([username, credentialData]) => ({
          username,
          name: credentialData.name || "Unknown",
          password: credentialData.password || "",
          // Add any other fields that might be stored
          ...credentialData,
        }));
      }
    }

    return { success: true, credentials };
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return { success: false, error: error.message, credentials: [] };
  }
});

// ================== SUBJECTS & SECTION-SUBJECT ASSIGNMENTS ==================
// Fetch global subjects list (stored under /subjects)
ipcMain.handle("get-subjects", async () => {
  try {
    const subjectsRef = rtdb.ref("subjects");
    const snapshot = await subjectsRef.once("value");
    const val = snapshot.val() || {};
    // val could be { key: { name: 'Math' } } OR { key: 'Math' }
    const subjects = Object.values(val)
      .map((v) => (typeof v === "string" ? v : v.name || ""))
      .filter(Boolean);
    return { success: true, subjects };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return { success: false, error: error.message, subjects: [] };
  }
});

// Add a new global subject (idempotent by case-insensitive name)
ipcMain.handle("add-subject", async (event, { name }) => {
  try {
    if (!name || !name.toString().trim()) {
      return { success: false, error: "Subject name required" };
    }
    const clean = name.toString().trim();
    const lower = clean.toLowerCase();
    const subjectsRef = rtdb.ref("subjects");
    const snapshot = await subjectsRef.once("value");
    const existing = snapshot.val() || {};
    // Check duplicates
    const dup = Object.values(existing).some((v) => {
      const nm = typeof v === "string" ? v : v.name || "";
      return nm.toString().trim().toLowerCase() === lower;
    });
    if (dup) {
      return { success: false, error: "Subject already exists" };
    }
    // slug key
    const slug =
      lower.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") ||
      "sub_" + Date.now();
    await subjectsRef.child(slug).set({ name: clean, createdDate: Date.now() });
    return { success: true, name: clean };
  } catch (error) {
    console.error("Error adding subject:", error);
    return { success: false, error: error.message };
  }
});

// Update subjects assigned to a section (by sectionId or sectionName)
ipcMain.handle(
  "update-section-subjects",
  async (event, { sectionId, sectionName, subjects }) => {
    try {
      if (!Array.isArray(subjects)) {
        return { success: false, error: "Subjects must be an array" };
      }
      const sectionsRef = rtdb.ref("sections");
      let targetKey = sectionId || null;
      let sectionSnapshot = null;

      if (targetKey) {
        sectionSnapshot = await sectionsRef.child(targetKey).once("value");
        if (!sectionSnapshot.exists()) {
          targetKey = null; // fall back to name search
        }
      }

      if (!targetKey && sectionName) {
        const allSnap = await sectionsRef.once("value");
        const all = allSnap.val() || {};
        for (const [key, sec] of Object.entries(all)) {
          if (
            (sec.name || "").toString().trim().toLowerCase() ===
            sectionName.toString().trim().toLowerCase()
          ) {
            targetKey = key;
            break;
          }
        }
      }

      if (!targetKey) {
        return { success: false, error: "Section not found" };
      }

      // Persist subjects as simple array
      await sectionsRef.child(targetKey).child("subjects").set(subjects);
      return { success: true, sectionId: targetKey, subjects };
    } catch (error) {
      console.error("Error updating section subjects:", error);
      return { success: false, error: error.message };
    }
  }
);
// ============================================================================

// ================== FULL BACKUP & RESET (Danger Zone) ==================
ipcMain.handle("full-backup", async () => {
  try {
    const root = rtdb.ref();
    const [
      studentsSnap,
      teachersSnap,
      sectionsSnap,
      subjectsSnap,
      credentialsSnap,
    ] = await Promise.all([
      rtdb.ref("students").once("value"),
      rtdb.ref("teachers").once("value"),
      rtdb.ref("sections").once("value"),
      rtdb.ref("subjects").once("value"),
      rtdb.ref("credentials").once("value"),
    ]);
    const backup = {
      timestamp: Date.now(),
      meta: {
        students: studentsSnap.exists()
          ? Object.keys(studentsSnap.val()).length
          : 0,
        teachers: teachersSnap.exists()
          ? Object.keys(teachersSnap.val()).length
          : 0,
        sections: sectionsSnap.exists()
          ? Object.keys(sectionsSnap.val()).length
          : 0,
        subjects: subjectsSnap.exists()
          ? Object.keys(subjectsSnap.val()).length
          : 0,
        credentials: credentialsSnap.exists()
          ? Object.keys(credentialsSnap.val()).length
          : 0,
      },
      students: studentsSnap.val() || {},
      teachers: teachersSnap.val() || {},
      sections: sectionsSnap.val() || {},
      subjects: subjectsSnap.val() || {},
      credentials: credentialsSnap.val() || {},
    };
    return { success: true, backup };
  } catch (error) {
    console.error("Error generating full backup:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("reset-database", async () => {
  try {
    // Read counts before wipe
    const [
      studentsSnap,
      teachersSnap,
      sectionsSnap,
      subjectsSnap,
      credentialsSnap,
    ] = await Promise.all([
      rtdb.ref("students").once("value"),
      rtdb.ref("teachers").once("value"),
      rtdb.ref("sections").once("value"),
      rtdb.ref("subjects").once("value"),
      rtdb.ref("credentials").once("value"),
    ]);
    const counts = {
      students: studentsSnap.exists()
        ? Object.keys(studentsSnap.val()).length
        : 0,
      teachers: teachersSnap.exists()
        ? Object.keys(teachersSnap.val()).length
        : 0,
      sections: sectionsSnap.exists()
        ? Object.keys(sectionsSnap.val()).length
        : 0,
      subjects: subjectsSnap.exists()
        ? Object.keys(subjectsSnap.val()).length
        : 0,
      credentials: credentialsSnap.exists()
        ? Object.keys(credentialsSnap.val()).length
        : 0,
    };
    // Perform multi-path deletion
    await rtdb.ref().update({
      students: null,
      teachers: null,
      sections: null,
      subjects: null,
      credentials: null,
    });
    return { success: true, deleted: counts };
  } catch (error) {
    console.error("Error resetting database:", error);
    return { success: false, error: error.message };
  }
});
// ============================================================================
