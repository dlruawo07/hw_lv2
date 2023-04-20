const express = require("express");
const router = express.Router();

// User 모델 사용
const User = require("../schemas/user");
// jwt 모듈
const jwt = require("jsonwebtoken");

// 회원가입 API
router.post("/signup", async (req, res) => {
  // req.body로 들어온 값이 3개가 아닌 경우
  // 그 값들이 nickname, password, confirm이 아닌 경우
  if (
    Object.keys(req.body).length !== 3 ||
    !req.body.hasOwnProperty("nickname") ||
    !req.body.hasOwnProperty("password") ||
    !req.body.hasOwnProperty("confirm")
  ) {
    return res
      .status(400)
      .json({ errorMessage: "요청한 데이터 형식이 올바르지 않습니다." });
  }

  const { nickname, password, confirm } = req.body;

  // nickname, password, confirm이 string 타입이 아닌 경우
  if (
    typeof nickname !== "string" ||
    typeof password !== "string" ||
    typeof confirm !== "string"
  ) {
    return res
      .status(400)
      .json({ errorMessage: "요청한 데이터 형식이 올바르지 않습니다." });
  }

  // 3자 이상의 알파벳이나 숫자가 아닌 경우
  if (!/^[a-zA-Z0-9]{3,}/.test(nickname)) {
    return res
      .status(412)
      .json({ errorMessage: "닉네임의 형식이 일치하지 않습니다." });
  }

  // 4자 미만인 경우
  if (password.length < 4) {
    return res
      .status(412)
      .json({ errorMessage: "패스워드 형식이 일치하지 않습니다." });
  }

  // 닉네임과 같은 값을 포함하는 경우
  if (password.includes(nickname)) {
    return res
      .status(412)
      .json({ errorMessage: "패스워드에 닉네임이 포함되어 있습니다." });
  }

  // password와 confirm이 일치하지 않는 경우
  if (password !== confirm) {
    return res
      .status(412)
      .json({ errorMessage: "패스워드가 일치하지 않습니다." });
  }

  const user = await User.findOne({ nickname }).exec();

  // db에 존재하는 닉네임인 경우
  if (user) {
    return res.status(412).json({ errorMessage: "중복된 닉네임입니다." });
  }

  await User.create({
    nickname,
    password,
  });

  return res.status(201).json({ message: "회원가입에 성공하였습니다." });
});

// 로그인 API
router.post("/login", async (req, res) => {
  // req.body로 들어온 값이 2개가 경우
  // 그 값들이 nickname, password, confirm이 아닌 경우
  if (
    Object.keys(req.body).length !== 2 ||
    !req.body.hasOwnProperty("nickname") ||
    !req.body.hasOwnProperty("password")
  ) {
    return res.status(400).json({ errorMessage: "로그인에 실패하였습니다." });
  }
  const { nickname, password } = req.body;

  // nickname, password가 string 타입이 아닌 경우
  if (typeof nickname !== "string" || typeof password !== "string") {
    return res
      .status(400)
      .json({ errorMessage: "요청한 데이터 형식이 올바르지 않습니다." });
  }

  const user = await User.findOne({ nickname }).exec();

  // user를 찾지 못했거나 password가 일치하지 않은 경우
  if (!user || user.password !== password) {
    return res
      .status(412)
      .json({ errorMessage: "닉네임 또는 패스워드를 확인해주세요." });
  }

  // userId값을 가진 token 만들기
  const token = jwt.sign(
    { userId: user._id.toString() },
    "customized-secret-key",
    { expiresIn: "1h" }
  );

  res.cookie("Authorization", `Bearer ${token}`);

  return res.status(200).json({ token });
});

module.exports = router;
