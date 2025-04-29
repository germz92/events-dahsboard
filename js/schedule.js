let tableData = { programs: [] };
const params = new URLSearchParams(window.location.search);
const tableId = params.get('id');
let saveTimeout;
let searchQuery = '';

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
  saveTimeout = setTimeout(savePrograms, 1000);
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
    const matchingPrograms = tableData.programs
      .map((p, i) => ({ ...p, __index: i }))
      .filter(p => p.date === date && matchesSearch(p)); // ✅ filter FIRST

    if (matchingPrograms.length === 0) {
      return; // ✅ If no matching programs, don't render this date at all
    }

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

    matchingPrograms.forEach(program => {
      const entry = document.createElement('div');
      entry.className = 'program-entry';
      entry.setAttribute('data-program-index', program.__index);
      entry.innerHTML = `
        <input class="program-name" type="text" placeholder="Program Name" value="${program.name || ''}" 
          onfocus="enableEdit(this)" onblur="autoSave(this, '${program.date}', ${program.__index}, 'name')">
        <div style="display:flex;align-items:center;gap:6px;">
          <input type="text" placeholder="Start Time" value="${program.startTime || ''}" 
            onfocus="this.type='time'; enableEdit(this);" onblur="autoSave(this, '${program.date}', ${program.__index}, 'startTime')">
          <input type="text" placeholder="End Time" value="${program.endTime || ''}" 
            onfocus="this.type='time'; enableEdit(this);" onblur="autoSave(this, '${program.date}', ${program.__index}, 'endTime')">
        </div>
        <div style="display:flex;align-items:center;margin-top:4px;">
          <span style="margin-right:6px;">📍</span>
          <input style="flex:1;" type="text" placeholder="Location" value="${program.location || ''}" 
            onfocus="enableEdit(this)" onblur="autoSave(this, '${program.date}', ${program.__index}, 'location')">
        </div>
        <div style="display:flex;align-items:center;margin-top:4px;">
          <span style="margin-right:6px;">👤</span>
          <input style="flex:1;" type="text" placeholder="Photographer" value="${program.photographer || ''}" 
            onfocus="enableEdit(this)" onblur="autoSave(this, '${program.date}', ${program.__index}, 'photographer')">
        </div>
        <button class="show-notes-btn" onclick="toggleNotes(this)">Show Notes</button>
        <div class="notes-field" style="display:none;">
          <textarea placeholder="Notes" 
            onfocus="enableEdit(this)" 
            oninput="autoResizeTextarea(this)" 
            onblur="autoSave(this, '${program.date}', ${program.__index}, 'notes')">${program.notes || ''}</textarea>
        </div>
        <button class="delete-btn" onclick="deleteProgram(this)">🗑️</button>
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

function matchesSearch(program) {
  if (!searchQuery.trim()) return true;
  const lower = searchQuery.toLowerCase();
  return (
    (program.name || '').toLowerCase().includes(lower) ||
    (program.startTime || '').toLowerCase().includes(lower) ||
    (program.endTime || '').toLowerCase().includes(lower) ||
    (program.location || '').toLowerCase().includes(lower) ||
    (program.photographer || '').toLowerCase().includes(lower) ||
    (program.notes || '').toLowerCase().includes(lower)
  );
}

function enableEdit(field) {
  field.classList.add('editing');
}

function autoSave(field, date, ignoredIndex, key) {
  field.classList.remove('editing');
  const entry = field.closest('.program-entry');
  const programIndex = parseInt(entry.getAttribute('data-program-index'), 10);

  if (!isNaN(programIndex)) {
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
    if (textarea) autoResizeTextarea(textarea);
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

function deleteProgram(button) {
  const entry = button.closest('.program-entry');
  const programIndex = parseInt(entry.getAttribute('data-program-index'), 10);

  if (!isNaN(programIndex)) {
    tableData.programs.splice(programIndex, 1);
    renderProgramSections();
    scheduleSave();
  }
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

function handleSearchInput(e) {
  searchQuery = e.target.value.trim();
  renderProgramSections();
}

window.addEventListener('DOMContentLoaded', () => {
  const searchBox = document.createElement('input');
  searchBox.type = 'text';
  searchBox.placeholder = 'Search...';
  searchBox.style.margin = '10px auto';
  searchBox.style.display = 'block';
  searchBox.style.padding = '8px';
  searchBox.style.width = '95%';
  searchBox.style.maxWidth = '500px';
  searchBox.style.fontSize = '16px';
  searchBox.addEventListener('input', handleSearchInput);

  document.body.insertBefore(searchBox, document.getElementById('programSections'));

  loadPrograms();
});
