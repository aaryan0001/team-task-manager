const router = require("express").Router();
const Project = require("../models/Project");
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Create Project
router.post("/", auth, role("admin"), async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      members: [...new Set([req.user.id, ...members])],
      createdBy: req.user.id
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Projects
router.get("/", auth, async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? {}
      : { members: req.user.id };

    const projects = await Project.find(filter)
      .populate("members", "name email role")
      .populate("createdBy", "name email role")
      .sort({ _id: -1 });

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Project Members
router.patch("/:id/members", auth, role("admin"), async (req, res) => {
  try {
    const { members = [] } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { members: [...new Set([req.user.id, ...members])] },
      { new: true, runValidators: true }
    )
      .populate("members", "name email role")
      .populate("createdBy", "name email role");

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Project
router.delete("/:id", auth, role("admin"), async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await Task.deleteMany({ projectId: req.params.id });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
