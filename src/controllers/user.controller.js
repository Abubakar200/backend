import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
const registerUser = asyncHandler(async (req, res) => {
  // step 1: get the user details
  // step 2: validation for not empty
  // step 3: check user is already exist by using username, email
  // step 4: check for images avatar and cover image
  // step 5: upload this picture in cloudinary
  // step 6: create user by create query in mongodb
  // step 7: remove password and refresh token from the response
  // step 8 check the user creation successfully
  // step 9: finally return the response

  // step no 1 get the user information
  const { fullName, email, password, username } = req.body;

  // step 2 check the empty field validation
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //step 3 for check the existing user

  const existinguser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existinguser) {
    throw new ApiError(
      409,
      "User with this email or username is already exists"
    );
  } 

  // step 4 check for images avatar and cover image
  const avatarLocatPath=req.files?.avatar[0]?.path

});

export { registerUser };
