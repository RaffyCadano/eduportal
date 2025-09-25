window.addEventListener('DOMContentLoaded', () => {
  function handleForm(formId, type, resultId) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const result = await window.api.createEntity(type, data);
      document.getElementById(resultId).textContent = result.success ? `Created with ID: ${result.id}` : `Error: ${result.error}`;
      form.reset();
    });
  }
  handleForm('student-form', 'students', 'student-result');
  handleForm('teacher-form', 'teachers', 'teacher-result');
  handleForm('section-form', 'sections', 'section-result');
  handleForm('subject-form', 'subjects', 'subject-result');
});
