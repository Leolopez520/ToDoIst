const taskInput = document.getElementById('task');
const dueDateInput = document.getElementById('due-date');
const submitButton = document.getElementById('submit');
const taskList = document.getElementById('task-list');

const filterAllBtn = document.getElementById('filter-all');
const filterCompletedBtn = document.getElementById('filter-completed');
const filterPendingBtn = document.getElementById('filter-pending');

submitButton.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});

filterAllBtn.addEventListener('click', () => showTasks('all'));
filterCompletedBtn.addEventListener('click', () => showTasks('completed'));
filterPendingBtn.addEventListener('click', () => showTasks('pending'));

function addTask() {
  const valueInput = taskInput.value.trim();
  const dueDateValue = dueDateInput.value;

  if (valueInput === '') return;

  const newTask = createTaskElement(valueInput, false, dueDateValue);
  taskList.appendChild(newTask);
  taskInput.value = '';
  dueDateInput.value = '';

  saveTasksToLocalStorage();
  showTasks(currentFilter);  // Aplicar filtro actual después de agregar
}

function createTaskElement(text, completed = false, dueDate = '') {
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.style.cursor = 'pointer';

  // Asignar texto + fecha al span al crear
  span.textContent = text;
  if (dueDate) {
    const dateLabel = document.createElement('small');
    const parts = dueDate.split('-');
    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    dateLabel.textContent = ` (${completed ? 'Venció' : 'Vence'}: ${formattedDate})`;
    span.appendChild(dateLabel);
  }

  if (completed) span.classList.add('completed');

  if (dueDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDateTime = new Date(dueDate).getTime();
    const todayTime = new Date(todayStr).getTime();
    const timeDiff = dueDateTime - todayTime;

    li.classList.remove('overdue', 'warning');

    if (!completed) {
      if (timeDiff < 0) {
        li.classList.add('overdue');
      } else if (timeDiff <= 2 * 86400000) {
        li.classList.add('warning');
      }
    }
  }

  span.addEventListener('dblclick', () => {
    const inputEdit = document.createElement('input');
    inputEdit.type = 'text';
    inputEdit.classList.add('editing');
    inputEdit.value = text;
    li.replaceChild(inputEdit, span);
    inputEdit.focus();

    function finishEditing(save) {
      if (save) {
        const newValue = inputEdit.value.trim();
        if (newValue) {
          // Limpiar y reconstruir span con texto + fecha
          span.textContent = newValue;
          if (dueDate) {
            const dateLabel = document.createElement('small');
            const parts = dueDate.split('-');
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            dateLabel.textContent = ` (${li.classList.contains('overdue') ? 'Venció' : 'Vence'}: ${formattedDate})`;
            span.appendChild(dateLabel);
          }
        }
      }
      li.replaceChild(span, inputEdit);
      saveTasksToLocalStorage();
      showTasks(currentFilter); // Actualizar filtro tras edición
    }

    inputEdit.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') finishEditing(true);
      else if (event.key === 'Escape') finishEditing(false);
    });

    inputEdit.addEventListener('blur', () => finishEditing(true));
  });

  span.addEventListener('click', () => {
    span.classList.toggle('completed');
    saveTasksToLocalStorage();
    showTasks(currentFilter); // Actualizar filtro tras toggle completado
  });

  const deleteBtn = document.createElement('span');
  deleteBtn.textContent = '❌';
  deleteBtn.classList.add('delete');
  deleteBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    li.remove();
    saveTasksToLocalStorage();
  });

  // --- Drag & Drop ---
  li.setAttribute('draggable', 'true');

  li.addEventListener('dragstart', (e) => {
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData('text/plain', null); // para compatibilidad Firefox
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    saveTasksToLocalStorage();
  });

  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingEl = document.querySelector('.dragging');
    if (draggingEl === li) return;

    const bounding = li.getBoundingClientRect();
    const offset = e.clientY - bounding.top;
    const after = offset > bounding.height / 2;

    if (after) {
      li.parentNode.insertBefore(draggingEl, li.nextSibling);
    } else {
      li.parentNode.insertBefore(draggingEl, li);
    }
  });

  li.appendChild(span);
  li.appendChild(deleteBtn);
  return li;
}

// Variable para mantener el filtro actual
let currentFilter = 'all';

function showTasks(filter) {
  currentFilter = filter; // Actualizamos filtro actual
  const items = taskList.querySelectorAll('li');

  items.forEach(li => {
    const span = li.querySelector('span');
    const isCompleted = span.classList.contains('completed');

    switch(filter) {
      case 'all':
        li.style.display = '';
        break;
      case 'completed':
        li.style.display = isCompleted ? '' : 'none';
        break;
      case 'pending':
        li.style.display = !isCompleted ? '' : 'none';
        break;
    }
  });

  updateFilterButtons();
}

// Opcional: marcar botón activo
function updateFilterButtons() {
  filterAllBtn.classList.toggle('active', currentFilter === 'all');
  filterCompletedBtn.classList.toggle('active', currentFilter === 'completed');
  filterPendingBtn.classList.toggle('active', currentFilter === 'pending');
}

function saveTasksToLocalStorage() {
  const tasks = [];
  const listItems = taskList.querySelectorAll('li');

  listItems.forEach(item => {
    const span = item.querySelector('span');
    let textNode = '';
    if (span.childNodes.length > 0) {
      const firstNode = span.childNodes[0];
      textNode = firstNode.textContent || firstNode.nodeValue || '';
      textNode = textNode.trim();
    } else {
      textNode = span.textContent.trim();
    }

    const completed = span.classList.contains('completed');
    const dueDateText = span.querySelector('small')?.textContent || '';
    const dueDate = dueDateText.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';

    tasks.push({ text: textNode, completed, dueDate });
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  tasks.forEach(task => {
    const newTask = createTaskElement(task.text, task.completed, task.dueDate);
    taskList.appendChild(newTask);
  });

  showTasks(currentFilter); // Aplicar filtro al cargar tareas
}

const toggleBtn = document.getElementById('toggle-theme');

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');

  const darkMode = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', darkMode);

  toggleBtn.textContent = darkMode ? '☀️ Modo claro' : '🌙 Modo oscuro';
});

window.addEventListener('DOMContentLoaded', () => {
  const savedMode = localStorage.getItem('darkMode') === 'true';
  if (savedMode) {
    document.body.classList.add('dark');
    toggleBtn.textContent = '☀️ Modo claro';
  }
});

loadTasksFromLocalStorage();
