document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const taskDate = document.getElementById("task-date");
  const taskTime = document.getElementById("task-time");
  const taskList = document.getElementById("task-list");
  const filterButtons = document.querySelectorAll(".filters button");
  const themeToggle = document.getElementById("theme-toggle");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = "all";

  // Cargar modo desde localStorage
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️ Modo Claro";
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggle.textContent = isDark ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newTask = {
      id: Date.now(),
      text: taskInput.value,
      date: taskDate.value || null,
      time: taskTime.value || null,
      completed: false,
    };
    tasks.push(newTask);
    form.reset();
    saveTasks();
    renderTasks();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function renderTasks() {
    taskList.innerHTML = "";
    const now = new Date();
    tasks.filter(task => {
      if (!task.date || !task.time) return currentFilter === "all" || currentFilter === "pending";
      const taskDateTime = new Date(`${task.date}T${task.time}`);
      if (currentFilter === "completed") return task.completed;
      if (currentFilter === "pending") return !task.completed && taskDateTime >= now;
      if (currentFilter === "expired") return !task.completed && taskDateTime < now;
      return true;
    }).forEach(task => {
      const li = document.createElement("li");
      li.className = "task";
      if (task.completed) li.classList.add("completed");
      else if (task.date && task.time && new Date(`${task.date}T${task.time}`) < now) li.classList.add("expired");

      const timeInfo = task.date && task.time ? ` - ${task.date} ${task.time}` : "";
      li.innerHTML = `
        <span>${task.text}${timeInfo}</span>
        <div>
          <button class="toggle">${task.completed ? "↩" : "✔"}</button>
          <button class="edit">✏️</button>
          <button class="delete">🗑️</button>
        </div>
      `;

      li.querySelector(".toggle").addEventListener("click", () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
      });

      li.querySelector(".delete").addEventListener("click", () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      li.querySelector(".edit").addEventListener("click", () => {
        const newText = prompt("Editar tarea:", task.text);
        if (newText) {
          task.text = newText;
          saveTasks();
          renderTasks();
        }
      });

      taskList.appendChild(li);
    });
  }

  renderTasks();
});
