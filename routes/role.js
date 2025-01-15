const express = require('express');
const router = express.Router();
const { adminVerify, checkPermission } = require("../middlewares/admin");
const { createRole,editPermission , searchRole, viewRole,deleteRole,getRoleAdminUser} = require("../controllers/roleController")


router.post('/create',adminVerify,checkPermission("role", "create"),createRole);

router.put('/edit-permissions/:id', adminVerify, checkPermission("role", "edit"), editPermission);

router.get('/search-roles', adminVerify, checkPermission("role", "view"),searchRole);

router.get("/view-role/:id", adminVerify, checkPermission("role", "view"),viewRole)

router.delete('/delete-role/:id', adminVerify, checkPermission("role", "delete"),deleteRole );

router.get("/get-roles-admin-user", adminVerify, checkPermission("user", "view"), getRoleAdminUser)

module.exports = router;