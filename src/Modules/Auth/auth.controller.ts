import { Router } from "express";
import authServices from "./auth.services";
import { validation } from "../../Middleware/validation.middleware";
import { confirmEmailSchema, signUpSchema } from "./auth.validation";
const router:Router = Router()

router.post("/signup" , validation(signUpSchema) ,authServices.signup)
router.post("/login" , authServices.login)
router.patch("/confirm-email" , validation(confirmEmailSchema) ,authServices.confirmEmail)

export default router;