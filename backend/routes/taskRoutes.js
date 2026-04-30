const router = require("express").Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Create Task
router.post("/", auth, role("admin"), async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: "Title and project are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (assignedTo && !project.members.map(String).includes(String(assignedTo))) {
      return res.status(400).json({ message: "Assigned user must be a project member" });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || req.user.id,
      status: status || "todo",
      dueDate
    });

    const populatedTask = await task.populate([
      { path: "assignedTo", select: "name email role" },
      { path: "projectId", select: "name description" }
    ]);

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Tasks
router.get("/", auth, async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? {}
      : { assignedTo: req.user.id };

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email role")
      .populate("projectId", "name description")
      .sort({ _id: -1 });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Task Status
router.patch("/:id", auth, async (req, res) => {
  try {
    const allowedUpdates = {};
    const fields = req.user.role === "admin"
      ? ["title", "description", "projectId", "assignedTo", "status", "dueDate"]
      : ["status"];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) allowedUpdates[field] = req.body[field];
    });

    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) return res.status(404).json({ message: "Task not found" });

    if (
      req.user.role !== "admin"
      && String(existingTask.assignedTo) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (allowedUpdates.projectId || allowedUpdates.assignedTo) {
      const projectId = allowedUpdates.projectId || existingTask.projectId;
      const assignedTo = allowedUpdates.assignedTo || existingTask.assignedTo;
      const project = await Project.findById(projectId);

      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map(String).includes(String(assignedTo))) {
        return res.status(400).json({ message: "Assigned user must be a project member" });
      }
    }

    const task = await Task.findByIdAndUpdate(
      existingTask._id,
      allowedUpdates,
      { new: true, runValidators: true }
    )
      .populate("assignedTo", "name email role")
      .populate("projectId", "name description");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Task
router.delete("/:id", auth, role("admin"), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
