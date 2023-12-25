import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
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

  const existinguser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existinguser) {
    throw new ApiError(
      409,
      "User with this email or username is already exists"
    );
  }

  // step 4 check for images avatar and cover image
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // step 5: upload this picture in cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // step 6: create user by create query in mongodb
  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // step 7: remove password and refresh token from the response
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // step 8 check the user creation successfully
  if (!userCreated) {
    throw new ApiError(500, "Something went wrong when registering the user");
  }

  // step 9: finally return the response
  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "user registered successfully"));
});
// 5. access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access and refresh token "
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // 1. access the data from req.body
  // 2. username or email
  // 3. find the user existing
  // 4. check password
  // 5. access and refresh token
  // 6. send cookies

  // 1. access the data from req.body
  const { username, email, password } = req.body;

  // 2. username or email
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  // 3. find the user existing
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User is not exists");
  }

  // 4. check password
  const validPassword = await user.isPasswordCorrect(password);

  if (!validPassword) {
    throw new ApiError(404, "Invalid user credientials");
  }
  // 5. access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  // neglect the password and refresh token
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 6. send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Loggedout successfully"));
});

const accessRefreshToken = asyncHandler(async (req, res) => {
  const incomingAccessToken = req.cookies.refreshToken || req.body.refreshToken;

  if (incomingAccessToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  try {
    const decodedToken = jwt.verify(
      incomingAccessToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  
    const user = await User.findOne(decodedToken?._id);
  
    if (!user) {
      throw new ApiError(401, "invalid refresh Token");
    }
  
    if (incomingAccessToken !== user?.refreshToken) {
      throw new ApiError(401, " Refresh token is expired or used");
    }
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(404, error?.message || "Invalid response")
  }
});
export { registerUser, loginUser, logoutUser, accessRefreshToken };
