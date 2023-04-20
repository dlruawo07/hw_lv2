const jwt = require("jsonwebtoken");
const User = require("../schemas/user");

module.exports = async (req, res, next) => {
  const { Authorization } = req.cookies;

  // authorization ?? "" -> null 병합 연산자
  const [authType, authToken] = (Authorization ?? "").split(" ");

  // Cookie가 존재하지 않을 경우
  if (authType !== "Bearer" || authToken === "") {
    return res
      .status(403)
      .json({ errorMessage: "로그인이 필요한 기능입니다." });
  }

  try {
    // 1. authToken이 만료되었는지
    // 2. authToken이 서버가 발급한 토큰이 맞는지
    const { userId } = jwt.verify(authToken, "customized-secret-key");

    // 3. authToken에 있는 userId에 해당하는 사용자가 실제 DB에 있는지
    const user = await User.findById(userId);

    // 미들웨어 다음으로 데이터 전달
    res.locals.user = user;

    next();
  } catch (e) {
    console.error(e);
    // Cookie가 비정상적이거나 만료된 경우
    return res
      .status(403)
      .json({ errorMessage: "전달된 쿠키에서 오류가 발생하였습니다." });
  }
};
