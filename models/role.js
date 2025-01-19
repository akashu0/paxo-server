const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
    properties: [{ type: String }],
    order: [{ type: String }],
    legal: [{ type: String }],
    logs: [{ type: String }],
    enquiry: [{ type: String }],
    user: [{ type: String }],
    role: [{ type: String }],
    category: [{ type: String }],
    prelistedBuyer: [{ type: String }],
  
}, { _id: false });

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    permissions: permissionSchema
})

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;