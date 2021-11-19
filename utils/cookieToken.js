/** @format */

const cookieToken = (user, res) => {
  //create a token from the given user
  const token = user.getJwtToken();
  //config options for sending cookies
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  //to not show the user in the frontend
  user.password = undefined;

  //send a response with the token
  res.status(200).cookie('token', token, options).json({
    success: true,
    token: token,
    user,
  });
};

module.exports = cookieToken;
