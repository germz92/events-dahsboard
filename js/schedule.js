let tableData = { programs: [] };
const params = new URLSearchParams(window.location.search);
const tableId = params.get('id');
let saveTimeout;

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

async function loadPrograms() {
  try {
    const res = await fetch(`${API_BASE}/api/tables/${tableId}/program-schedule`, {
      headers: { Authorization: localStorage.getItem('token') }
    });
    const data = await res.json();
    tableData.programs = data.programSchedule || [];
    renderProgramSections();
  } catch (err) {
    console.error('Failed to load programs:', err);
    tableData.programs = [];
    renderProgramSections();
  }
}

async function savePrograms() {
  try {
    await fetch(`${API_BASE}/api/tables/${tableId}/program-schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: localStorage.getItem('token')
      },
      body: JSON.stringify({ programSchedule: tableData.programs })
    });
    console.log('Programs saved!');
  } catch (err) {
    console.error('Failed to save programs:', err);
  }
}

function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(savePrograms, 2000);
}

function renderProgramSections() {
  const container = document.getElementById('programSections');
  if (!container) {
    console.error('Missing #programSections div!');
    return;
  }
  container.innerHTML = '';

  if (tableData.programs.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No programs yet. Add a new date to get started.';
    empty.style.textAlign = 'center';
    empty.style.padding = '40px';
    empty.style.color = '#777';
    container.appendChild(empty);
    return;
  }

  const dates = [...new Set(tableData.programs.map(p => p.date))].sort((a, b) => a.localeCompare(b));

  dates.forEach(date => {
    const section = document.createElement('div');
    section.className = 'date-section';
    section.setAttribute('data-date', date);

    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'date-header';
    headerWrapper.innerHTML = `
      <div>${formatDate(date)}</div>
      <button onclick="deleteDate('${date}')">🗑️</button>
    `;
    section.appendChild(headerWrapper);

    tableData.programs.filter(p => p.date === date).forEach((program, index) => {
      const entry = document.createElement('div');
      entry.className = 'program-entry';
      entry.innerHTML = `
        <input class="program-name" type="text" placeholder="Program Name" value="${program.name || ''}" 
          onfocus="enableEdit(this)" onblur="autoSave(this, '${date}', ${index}, 'name')">
        <div style="display:flex;align-items:center;gap:6px;">
          <input type="time" value="${program.startTime || ''}" 
            onfocus="enableEdit(this)" onblur="autoSave(this, '${date}', ${index}, 'startTime')">
          <input type="time" value="${program.endTime || ''}" 
            onfocus="enableEdit(this)" onblur="autoSave(this, '${date}', ${index}, 'endTime')">
        </div>
        <div style="display:flex;align-items:center;margin-top:4px;">
          <span style="margin-right:6px;">📍</span>
          <input style="flex:1;" type="text" placeholder="Location" value="${program.location || ''}" 
            onfocus="enableEdit(this)" onblur="autoSave(this, '${date}', ${index}, 'location')">
        </div>
        <div style="display:flex;align-items:center;margin-top:4px;">
          <span style="margin-right:6px;">👤</span>
          <input style="flex:1;" type="text" placeholder="Photographer" value="${program.photographer || ''}" 
            onfocus="enableEdit(this)" onblur="autoSave(this, '${date}', ${index}, 'photographer')">
        </div>
        <button class="show-notes-btn" onclick="toggleNotes(this)">Show Notes</button>
        <div class="notes-field" style="display:none;">
          <textarea placeholder="Notes" 
            onfocus="enableEdit(this)" 
            oninput="autoResizeTextarea(this)" 
            onblur="autoSave(this, '${date}', ${index}, 'notes')">${program.notes || ''}</textarea>
        </div>
        <button class="delete-btn" onclick="deleteProgram('${date}', ${index})">🗑️</button>
      `;
      section.appendChild(entry);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.textContent = '+ Add Row';
    addBtn.onclick = () => addProgram(date);
    section.appendChild(addBtn);

    container.appendChild(section);
  });

  setTimeout(() => {
    document.querySelectorAll('textarea').forEach(autoResizeTextarea);
  }, 50);
}

function enableEdit(field) {
  field.classList.add('editing');
}

function autoSave(field, date, index, key) {
  field.classList.remove('editing');
  const programIndex = tableData.programs.findIndex(
    (p, i) => p.date === date && i === index
  );
  if (programIndex !== -1) {
    tableData.programs[programIndex][key] = field.value.trim();
    scheduleSave();
  }
}

function toggleNotes(button) {
  const notesField = button.nextElementSibling;
  if (notesField.style.display === 'none' || notesField.style.display === '') {
    notesField.style.display = 'block';
    button.textContent = 'Hide Notes';
    const textarea = notesField.querySelector('textarea');
    if (textarea) autoResizeTextarea(textarea); // Resize immediately when showing
  } else {
    notesField.style.display = 'none';
    button.textContent = 'Show Notes';
  }
}

function autoResizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto'; 
  textarea.style.height = textarea.scrollHeight + 'px';
}

function captureCurrentPrograms() {
  const sections = document.querySelectorAll('.date-section');
  let newPrograms = [];
  sections.forEach(section => {
    const date = section.getAttribute('data-date');
    const entries = section.querySelectorAll('.program-entry');
    entries.forEach(entry => {
      const inputs = entry.querySelectorAll('input, textarea');
      newPrograms.push({
        date,
        name: inputs[0].value.trim(),
        startTime: inputs[1].value.trim(),
        endTime: inputs[2].value.trim(),
        location: inputs[3].value.trim(),
        photographer: inputs[4].value.trim(),
        notes: inputs[5].value.trim()
      });
    });
  });
  tableData.programs = newPrograms;
}

function addDateSection() {
  const date = document.getElementById('newDate').value;
  if (!date) return alert('Please select a date');
  captureCurrentPrograms();
  tableData.programs.push({
    date,
    name: '',
    startTime: '',
    endTime: '',
    location: '',
    photographer: '',
    notes: ''
  });
  document.getElementById('newDate').value = '';
  renderProgramSections();
  scheduleSave();
}

function addProgram(date) {
  captureCurrentPrograms();
  tableData.programs.push({
    date,
    name: '',
    startTime: '',
    endTime: '',
    location: '',
    photographer: '',
    notes: ''
  });
  renderProgramSections();
  scheduleSave();
}

function deleteProgram(date, index) {
  tableData.programs = tableData.programs.filter((p, i) => !(p.date === date && i === index));
  renderProgramSections();
  scheduleSave();
}

function deleteDate(date) {
  if (confirm('Delete all programs for this date?')) {
    tableData.programs = tableData.programs.filter(p => p.date !== date);
    renderProgramSections();
    scheduleSave();
  }
}

function goBack() {
    window.location.href = `event.html?id=${tableId}`;
  }
  

window.addEventListener('DOMContentLoaded', () => {
  loadPrograms();
});