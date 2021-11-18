/** @format */

exports.home = (req, res) => {
  res.status(200).json({
    success: true,
    greeting: 'Hello from api',
  });
};

exports.homeDummy = (req, res) => {
  res.status(200).json({
    success: true,
    greeting: 'Hello22222 from api',
  });
};
