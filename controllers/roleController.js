const Role = require("../models/role");

/// Create a new role
const createRole = async (req, res) => {
    try {
      const { name, permissions } = req.body;
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({ error: "Role Already Exist" });
      }
      const newRole = new Role({ name, permissions });
      await newRole.save();
      res
        .status(201)
        .json({ message: "Role created successfully", role: newRole });
    } catch (error) {
      res.status(500).json({ error: "Server error", error });
    }
  };
  
  
  const editPermission = async (req,res) => {
      const id = req.params.id;
      const { permissions } = req.body;   
      try {
     const permission = await Role.findById(id);
          permission.permissions = permissions;
          await permission.save();
          res.status(200).json({ message: "Edited Successfully" });
      } catch (error) {
      res.status(500).json({ error: "Server error", error });
      }
  }
  
  
  const searchRole = async (req, res) => {
      const { searchQuery } = req.body;
  
      try {
          if (!searchQuery) {
              const roles = await Role.find({ name: { $ne: "ROOT" } }).select('name permissions');
              return res.status(200).json({ roles });
          }
  
          const roles = await Role.find({
              name: { $regex: searchQuery, $options: 'i' }
          }).select('name');
  
          if (roles.length === 0) {
              return res.status(404).json({ message: 'No roles found' });
          }

          console.log(roles);
          
  
          res.status(200).json(roles);
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Server Error' });
      }
  }
  
  
  const viewRole =  async (req, res) => {
      const id = req.params.id;
      try {
          const role = await Role.findById(id);
          res.status(200).json(role);
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Server Error" })
      }
  }
  
  const deleteRole = async (req, res) => {
      const id = req.params.id;
  
      try {
          // Check if any admin is associated with this role
          const adminWithRole = await Admin.findOne({ userRole: id });
  
          if (adminWithRole) {
              return res.status(400).json({ error: 'Role is associated with one or more users and cannot be deleted' });
          }
  
          // If no admin is associated with the role, proceed with deletion
          const deletedRole = await Role.findByIdAndDelete(id);
  
          if (!deletedRole) {
              return res.status(404).json({ error: 'Role not found' });
          }
  
          res.status(200).json({ message: 'Role deleted successfully' });
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Server Error' });
      }
  }
  
  const getRoleAdminUser = async (req, res) => {
      try {
          const roles = await Role.find({ name: { $ne: "ROOT" } }).select();
          res.status(200).json(roles)
  
      } catch (error) {
          console.error(error)
          res.status(500).json({ error: "Server Error" })
      }
  }
  


module.exports = { createRole, editPermission,searchRole,viewRole , deleteRole,getRoleAdminUser};