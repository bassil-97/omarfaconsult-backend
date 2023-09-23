const express = require("express");
const usersControllers = require("../controllers/user-controllers");

const router = express.Router();

router.get("/get-user-courses/:userId", usersControllers.getUserCourses);
router.post("/register", usersControllers.register);
router.post("/login", usersControllers.login);
router.post("/create-transaction", usersControllers.handlePurchaseCourse);

module.exports = router;
