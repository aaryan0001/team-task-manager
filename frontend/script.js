const state = {
  token: localStorage.getItem("token") || "",
  user: JSON.parse(localStorage.getItem("user") || "null"),
  mode: "login",
  projects: [],
  tasks: [],
  users: []
};

const els = {
  authView: document.getElementById("authView"),
  dashboardView: document.getElementById("dashboardView"),
  authForm: document.getElementById("authForm"),
  loginTab: document.getElementById("loginTab"),
  signupTab: document.getElementById("signupTab"),
  authSubmit: document.getElementById("authSubmit"),
  authMessage: document.getElementById("authMessage"),
  nameInput: document.getElementById("nameInput"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  roleInput: document.getElementById("roleInput"),
  userText: document.getElementById("userText"),
  logoutButton: document.getElementById("logoutButton"),
  projectForm: document.getElementById("projectForm"),
  projectName: document.getElementById("projectName"),
  projectDescription: document.getElementById("projectDescription"),
  projectMembers: document.getElementById("projectMembers"),
  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskProject: document.getElementById("taskProject"),
  taskAssignee: document.getElementById("taskAssignee"),
  taskDescription: document.getElementById("taskDescription"),
  taskStatus: document.getElementById("taskStatus"),
  taskDueDate: document.getElementById("taskDueDate"),
  projectList: document.getElementById("projectList"),
  taskBoard: document.getElementById("taskBoard"),
  userList: document.getElementById("userList"),
  refreshButton: document.getElementById("refreshButton"),
  appMessage: document.getElementById("appMessage"),
  totalTasks: document.getElementById("totalTasks"),
  todoTasks: document.getElementById("todoTasks"),
  progressTasks: document.getElementById("progressTasks"),
  doneTasks: document.getElementById("doneTasks"),
  overdueTasks: document.getElementById("overdueTasks")
};

const isAdmin = () => state.user?.role === "admin";

const api = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
};

const setMode = (mode) => {
  state.mode = mode;
  const isSignup = mode === "signup";

  els.loginTab.classList.toggle("active", !isSignup);
  els.signupTab.classList.toggle("active", isSignup);
  els.authSubmit.textContent = isSignup ? "Create Account" : "Login";
  document.querySelectorAll(".signup-only").forEach((element) => {
    element.classList.toggle("hidden", !isSignup);
  });
  els.authMessage.textContent = "";
};

const saveSession = (token, user) => {
  state.token = token;
  state.user = user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

const clearSession = () => {
  state.token = "";
  state.user = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const showDashboard = async () => {
  els.authView.classList.add("hidden");
  els.dashboardView.classList.remove("hidden");
  els.userText.textContent = `${state.user.name} (${state.user.role})`;
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("hidden", !isAdmin());
  });
  await loadData();
};

const showAuth = () => {
  els.dashboardView.classList.add("hidden");
  els.authView.classList.remove("hidden");
};

const loadData = async () => {
  try {
    els.appMessage.textContent = "Loading...";
    const requests = [api("/api/projects"), api("/api/tasks")];
    if (isAdmin()) requests.push(api("/api/auth/users"));

    const [projects, tasks, users = []] = await Promise.all(requests);

    state.projects = projects;
    state.tasks = tasks;
    state.users = isAdmin() ? users : [state.user];
    renderUsers();
    renderProjects();
    renderTasks();
    renderStats();
    els.appMessage.textContent = "";
  } catch (error) {
    els.appMessage.textContent = error.message;
  }
};

const selectedValues = (select) => (
  Array.from(select.selectedOptions).map((option) => option.value)
);

const renderUsers = () => {
  if (!els.userList) return;

  renderProjectMemberOptions();
  renderTaskAssignees();

  if (!isAdmin()) return;

  els.userList.innerHTML = state.users.map((user) => `
    <article class="item">
      <div class="item-header">
        <div>
          <h3>${escapeHtml(user.name)}</h3>
          <p>${escapeHtml(user.email)}</p>
        </div>
        <span class="pill">${escapeHtml(user.role)}</span>
      </div>
    </article>
  `).join("");
};

const renderProjectMemberOptions = () => {
  els.projectMembers.innerHTML = state.users.map((user) => `
    <option value="${user._id}" ${user._id === state.user._id ? "selected" : ""}>
      ${escapeHtml(user.name)} (${escapeHtml(user.role)})
    </option>
  `).join("");
};

const renderProjectOptions = () => {
  els.taskProject.innerHTML = "";

  if (state.projects.length === 0) {
    els.taskProject.innerHTML = '<option value="">Create a project first</option>';
    renderTaskAssignees();
    return;
  }

  els.taskProject.innerHTML = state.projects.map((project) => `
    <option value="${project._id}">${escapeHtml(project.name)}</option>
  `).join("");
  renderTaskAssignees();
};

const renderTaskAssignees = () => {
  const project = state.projects.find((item) => item._id === els.taskProject.value);
  const members = project?.members || [];

  if (project && members.length === 0) {
    els.taskAssignee.innerHTML = '<option value="">Add project members first</option>';
    return;
  }

  els.taskAssignee.innerHTML = members.map((user) => `
    <option value="${user._id}">${escapeHtml(user.name)} (${escapeHtml(user.role)})</option>
  `).join("");
};

const renderProjects = () => {
  renderProjectOptions();

  if (state.projects.length === 0) {
    els.projectList.innerHTML = '<div class="empty">No projects yet.</div>';
    return;
  }

  els.projectList.innerHTML = state.projects.map((project) => {
    const memberNames = project.members?.map((user) => user.name).join(", ") || "No members";
    const memberOptions = state.users.map((user) => `
      <option value="${user._id}" ${project.members?.some((member) => member._id === user._id) ? "selected" : ""}>
        ${escapeHtml(user.name)}
      </option>
    `).join("");

    return `
      <article class="item">
        <div class="item-header">
          <div>
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.description || "No description")}</p>
          </div>
          ${isAdmin() ? `<button class="danger-button" type="button" data-delete-project="${project._id}">Delete</button>` : ""}
        </div>
        <div class="meta-row">
          <span class="pill">${project.members?.length || 0} members</span>
          <span class="pill">${countProjectTasks(project._id)} tasks</span>
        </div>
        <p>${escapeHtml(memberNames)}</p>
        ${isAdmin() ? `
          <div class="member-editor">
            <select multiple size="4" data-project-members="${project._id}">
              ${memberOptions}
            </select>
            <button class="ghost-button" type="button" data-save-members="${project._id}">Save Team</button>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
};

const renderTasks = () => {
  if (state.tasks.length === 0) {
    els.taskBoard.innerHTML = '<div class="empty">No tasks yet.</div>';
    return;
  }

  els.taskBoard.innerHTML = state.tasks.map((task) => {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date";
    const projectName = task.projectId?.name || "No project";
    const assignedName = task.assignedTo?.name || "Unassigned";
    const overdueClass = isOverdue(task) ? " overdue-item" : "";

    return `
      <article class="item${overdueClass}">
        <div class="item-header">
          <div>
            <h3>${escapeHtml(task.title)}</h3>
            <p>${escapeHtml(task.description || "No description")}</p>
          </div>
          ${isAdmin() ? `<button class="danger-button" type="button" data-delete-task="${task._id}">Delete</button>` : ""}
        </div>
        <div class="meta-row">
          <span class="pill">${escapeHtml(task.status)}</span>
          <span class="pill">${escapeHtml(projectName)}</span>
          <span class="pill">${escapeHtml(assignedName)}</span>
          <span class="pill">${escapeHtml(dueDate)}</span>
          ${isOverdue(task) ? '<span class="pill danger-pill">Overdue</span>' : ""}
        </div>
        <div class="status-row">
          <select data-status-task="${task._id}">
            <option value="todo" ${task.status === "todo" ? "selected" : ""}>Todo</option>
            <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
            <option value="done" ${task.status === "done" ? "selected" : ""}>Done</option>
          </select>
        </div>
      </article>
    `;
  }).join("");
};

const renderStats = () => {
  els.totalTasks.textContent = state.tasks.length;
  els.todoTasks.textContent = state.tasks.filter((task) => task.status === "todo").length;
  els.progressTasks.textContent = state.tasks.filter((task) => task.status === "in-progress").length;
  els.doneTasks.textContent = state.tasks.filter((task) => task.status === "done").length;
  els.overdueTasks.textContent = state.tasks.filter(isOverdue).length;
};

const countProjectTasks = (projectId) => (
  state.tasks.filter((task) => {
    const taskProjectId = typeof task.projectId === "string" ? task.projectId : task.projectId?._id;
    return taskProjectId === projectId;
  }).length
);

const isOverdue = (task) => {
  if (!task.dueDate || task.status === "done") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

els.loginTab.addEventListener("click", () => setMode("login"));
els.signupTab.addEventListener("click", () => setMode("signup"));
els.taskProject.addEventListener("change", renderTaskAssignees);

els.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    els.authMessage.textContent = "Please wait...";
    const payload = {
      email: els.emailInput.value.trim(),
      password: els.passwordInput.value
    };

    if (state.mode === "signup") {
      payload.name = els.nameInput.value.trim();
      payload.role = els.roleInput.value;
    }

    const data = await api(`/api/auth/${state.mode}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveSession(data.token, data.user);
    els.authForm.reset();
    await showDashboard();
  } catch (error) {
    els.authMessage.textContent = error.message;
  }
});

els.logoutButton.addEventListener("click", () => {
  clearSession();
  showAuth();
});

els.refreshButton.addEventListener("click", loadData);

els.projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: els.projectName.value.trim(),
        description: els.projectDescription.value.trim(),
        members: selectedValues(els.projectMembers)
      })
    });

    els.projectForm.reset();
    await loadData();
  } catch (error) {
    els.appMessage.textContent = error.message;
  }
});

els.taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: els.taskTitle.value.trim(),
        description: els.taskDescription.value.trim(),
        projectId: els.taskProject.value,
        assignedTo: els.taskAssignee.value,
        status: els.taskStatus.value,
        dueDate: els.taskDueDate.value || undefined
      })
    });

    els.taskForm.reset();
    await loadData();
  } catch (error) {
    els.appMessage.textContent = error.message;
  }
});

document.addEventListener("change", async (event) => {
  const taskId = event.target.dataset.statusTask;
  if (!taskId) return;

  try {
    await api(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: event.target.value })
    });

    await loadData();
  } catch (error) {
    els.appMessage.textContent = error.message;
  }
});

document.addEventListener("click", async (event) => {
  const projectId = event.target.dataset.deleteProject;
  const taskId = event.target.dataset.deleteTask;
  const saveMembersId = event.target.dataset.saveMembers;

  try {
    if (projectId) {
      await api(`/api/projects/${projectId}`, { method: "DELETE" });
      await loadData();
    }

    if (taskId) {
      await api(`/api/tasks/${taskId}`, { method: "DELETE" });
      await loadData();
    }

    if (saveMembersId) {
      const select = document.querySelector(`[data-project-members="${saveMembersId}"]`);
      await api(`/api/projects/${saveMembersId}/members`, {
        method: "PATCH",
        body: JSON.stringify({ members: selectedValues(select) })
      });
      await loadData();
    }
  } catch (error) {
    els.appMessage.textContent = error.message;
  }
});

const boot = async () => {
  setMode("login");

  if (!state.token) {
    showAuth();
    return;
  }

  try {
    state.user = await api("/api/auth/me");
    localStorage.setItem("user", JSON.stringify(state.user));
    await showDashboard();
  } catch (_error) {
    clearSession();
    showAuth();
  }
};

boot();
