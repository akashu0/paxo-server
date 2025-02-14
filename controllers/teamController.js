const Team = require('../models/team');
const Admin = require('../models/admin');
const Role = require('../models/role');

const teamController = {
  // Create a new team
  createTeam: async (req, res) => {
    try {
      const { name, description, department, members } = req.body;
      const teamLead = req.admin._id; // Assuming the logged-in admin will be team lead

      // Verify admin has permission to create team
      const adminRole = await Role.findById(req.admin.userRole);
      if (!adminRole?.permissions[department]?.includes('create')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create team'
        });
      }

      // Validate member roles
      for (const member of members) {
        const memberAdmin = await Admin.findById(member.admin);
        if (!memberAdmin) {
          return res.status(400).json({
            success: false,
            message: `Invalid admin ID: ${member.admin}`
          });
        }

        const memberRole = await Role.findById(member.userRole);
        if (!memberRole) {
          return res.status(400).json({
            success: false,
            message: `Invalid role ID: ${member.userRole}`
          });
        }
      }

      const team = new Team({
        name,
        description,
        department,
        teamLead,
        members
      });

      await team.save();

      res.status(201).json({
        success: true,
        data: team
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all teams
  getTeams: async (req, res) => {
    try {
      const teams = await Team.find()
        .populate('teamLead', 'username email')
        .populate('members.admin', 'username email')
        .populate('members.userRole', 'name');

      res.json({
        success: true,
        data: teams
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get team by ID
  getTeam: async (req, res) => {
    try {
      const team = await Team.findById(req.params.id)
        .populate('teamLead', 'username email')
        .populate('members.admin', 'username email')
        .populate('members.userRole', 'name');

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update team
  updateTeam: async (req, res) => {
    try {
      const { name, description, members, status } = req.body;
      const team = await Team.findById(req.params.id);

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Check if admin has permission to update team
      const adminRole = await Role.findById(req.admin.userRole);
      if (!adminRole?.permissions[team.department]?.includes('update') && 
          team.teamLead.toString() !== req.admin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update team'
        });
      }

      // Update team
      if (name) team.name = name;
      if (description) team.description = description;
      if (members) team.members = members;
      if (status) team.status = status;

      await team.save();

      res.json({
        success: true,
        data: team
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
    teamController
  }