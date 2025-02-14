const Workflow = require('../models/workflow');
const Team = require('../models/team');
const Role = require("../models/role")
const workflowController = {
  // Create workflow
  createWorkflow: async (req, res) => {
    try {
      const { name, description, department, teamId, steps } = req.body;

      // Verify admin has permission
      const adminRole = await Role.findById(req.admin.userRole);
      if (!adminRole?.permissions[department]?.includes('create')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create workflow'
        });
      }

      // Verify team exists and belongs to department
      const team = await Team.findById(teamId);
      if (!team || team.department !== department) {
        return res.status(400).json({
          success: false,
          message: 'Invalid team for this department'
        });
      }

      // Validate steps and their roles
      for (const step of steps) {
        const role = await Role.findById(step.assignedRole);
        if (!role) {
          return res.status(400).json({
            success: false,
            message: `Invalid role ID in step: ${step.name}`
          });
        }
      }

      const workflow = new Workflow({
        name,
        description,
        department,
        team: teamId,
        steps,
        createdBy: req.admin._id
      });

      await workflow.save();

      res.status(201).json({
        success: true,
        data: workflow
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update workflow step status
  updateWorkflowStep: async (req, res) => {
    try {
      const { workflowId, stepId } = req.params;
      const { status } = req.body;

      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Workflow not found'
        });
      }

      // Find the step
      const step = workflow.steps.id(stepId);
      if (!step) {
        return res.status(404).json({
          success: false,
          message: 'Step not found'
        });
      }

      // Verify admin has required role and permissions
      const adminRole = await Role.findById(req.admin.userRole);
      if (!adminRole?.permissions[workflow.department]?.includes('update')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update workflow'
        });
      }

      step.status = status;
      await workflow.save();

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get workflows by department
  getWorkflows: async (req, res) => {
    try {
      const { department } = req.params;

      // Verify admin has access to department
      const adminRole = await Role.findById(req.admin.userRole);
      if (!adminRole?.permissions[department]?.includes('read')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view workflows'
        });
      }

      const workflows = await Workflow.find({ department })
        .populate('team', 'name')
        .populate('createdBy', 'username')
        .populate('steps.assignedRole', 'name');

      res.json({
        success: true,
        data: workflows
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = {
  workflowController
}