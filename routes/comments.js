const express = require("express");
const router = express.Router();

const Comment = require("../schemas/comment");
const Post = require("../schemas/post");

const authMiddleware = require("../middlewares/auth-middleware");

// 6. 댓글 목록 조회 API
//     - 제목, 작성자명(nickname), 작성 날짜를 조회하기
//     - 작성 날짜 기준으로 내림차순 정렬하기
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId }).exec();

    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    const comments = await Comment.find({ postId: postId })
      .sort("-createdAt")
      .exec();

    if (!comments.length) {
      return res
        .status(404)
        .json({ errorMessage: "댓글이 존재하지 않습니다." });
    }

    const commentsWithoutPasswords = [];

    comments.forEach((comment) => {
      const withoutPassword = {
        commentId: comment._id.toString(),
        userId: comment.userId,
        nickname: comment.nickname,
        comment: comment.comment,
        createAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };
      commentsWithoutPasswords.push(withoutPassword);
    });

    return res.status(200).json({ comments: commentsWithoutPasswords });
  } catch (e) {
    return res
      .status(400)
      .json({ errorMessage: "게시글 조회에 실패하였습니다." });
  }
});

// 7. 댓글 작성 API
//     - 로그인 토큰을 검사하여, 유효한 토큰일 경우에만 댓글 작성 가능
//     - 댓글 내용을 비워둔 채 댓글 작성 API를 호출하면 "댓글 내용을 입력해주세요" 라는 메세지를 return하기
//     - 댓글 내용을 입력하고 댓글 작성 API를 호출한 경우 작성한 댓글을 추가하기
router.post("/posts/:postId/comments", authMiddleware, async (req, res) => {
  try {
    const { userId, nickname } = res.locals.user;
    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId }).exec();

    // 댓글을 작성할 게시글이 존재하지 않는 경우
    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    // 데이터가 정상적으로 전달되지 않는 경우
    if (
      Object.keys(req.body).length !== 1 ||
      !req.body.hasOwnProperty("comment")
    ) {
      return res.status(412).json({
        errorMessage: "데이터 형식이 올바르지 않습니다.",
      });
    }

    const { comment } = req.body;

    // 댓글이 비어있는 경우
    if (comment === "") {
      return res
        .status(400)
        .json({ errorMessage: "댓글 내용을 입력해주세요." });
    }

    await Comment.create({
      postId: postId,
      userId: userId,
      nickname: nickname,
      comment: comment,
    });

    res.status(201).json({ errorMessage: "댓글을 작성하였습니다." });
  } catch (e) {
    return res
      .status(400)
      .json({ errorMessage: "게시글 조회에 실패하였습니다." });
  }
});

// 8. 댓글 수정 API
//     - 로그인 토큰을 검사하여, 해당 사용자가 작성한 댓글만 수정 가능
//     - 댓글 내용을 비워둔 채 댓글 수정 API를 호출하면 "댓글 내용을 입력해주세요" 라는 메세지를 return하기
//     - 댓글 내용을 입력하고 댓글 수정 API를 호출한 경우 작성한 댓글을 수정하기
router.put(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = res.locals.user;
      const { postId } = req.params;
      const post = await Post.findOne({ _id: postId }).exec();

      // 댓글을 수정할 게시글이 존재하지 않는 경우
      if (!post) {
        return res
          .status(404)
          .json({ errorMessage: "게시글이 존재하지 않습니다." });
      }

      try {
        const { commentId } = req.params;
        const targetComment = await Comment.findOne({ _id: commentId }).exec();

        // 댓글이 존재하지 않는 경우
        if (!targetComment) {
          return res
            .status(404)
            .json({ errorMessage: "댓글이 존재하지 않습니다." });
        }

        // 댓글의 수정 권한이 존재하지 않는 경우
        if (userId !== targetComment.userId) {
          return res
            .status(403)
            .json({ errorMessage: "댓글의 수정 권한이 존재하지 않습니다." });
        }

        // body 데이터가 정상적으로 전달되지 않는 경우
        if (
          Object.keys(req.body).length !== 1 ||
          !req.body.hasOwnProperty("comment")
        ) {
          return res
            .status(412)
            .json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
        }

        const { comment } = req.body;

        // 댓글이 비어있는 경우
        if (comment === "") {
          return res
            .status(400)
            .json({ errorMessage: "댓글 내용을 입력해주세요." });
        }

        // 댓글의 수정 권한이 존재하지 않는 경우
        if (userId !== targetComment.userId) {
          return res
            .status(400)
            .json({ errorMessage: "비밀번호가 일치하지 않습니다." });
        }

        const updated = await Comment.updateOne(
          { _id: commentId },
          { $set: { comment: comment, updatedAt: new Date() } }
        );

        if (!updated) {
          return res.status(400).json({
            errorMessage: "댓글 수정이 정상적으로 처리되지 않았습니다.",
          });
        }

        return res.status(200).json({ errorMessage: "댓글을 수정하였습니다." });
      } catch (e) {
        return res
          .status(400)
          .json({ errorMessage: "댓글 조회에 실패하였습니다." });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ errorMessage: "게시글 조회에 실패하였습니다." });
    }
  }
);

// 9. 댓글 삭제 API
//     - 로그인 토큰을 검사하여, 해당 사용자가 작성한 댓글만 삭제 가능
//     - 원하는 댓글을 삭제하기
router.delete(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { userId } = res.locals.user;
      const { postId } = req.params;
      const post = await Post.findOne({ _id: postId }).exec();

      // 댓글을 삭제할 게시글이 존재하지 않는 경우
      if (!post) {
        return res
          .status(404)
          .json({ errorMessage: "게시글이 존재하지 않습니다." });
      }

      try {
        const { commentId } = req.params;
        const targetComment = await Comment.findOne({ _id: commentId }).exec();

        // 댓글이 존재하지 않는 경우
        if (!targetComment) {
          return res
            .status(404)
            .json({ errorMessage: "댓글이 존재하지 않습니다." });
        }

        if (userId !== targetComment.userId) {
          return res
            .status(403)
            .json({ errorMessage: "댓글의 삭제 권한이 존재하지 않습니다." });
        }

        const deleted = await Comment.deleteOne({ _id: commentId });

        if (!deleted) {
          return res.status(400).json({
            errorMessage: "댓글 삭제가 정상적으로 처리되지 않았습니다.",
          });
        }

        return res.status(200).json({ errorMessage: "댓글을 삭제하였습니다." });
      } catch (e) {
        return res
          .status(400)
          .json({ errorMessage: "댓글 조회에 실패하였습니다." });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ errorMessage: "게시글 조회에 실패하였습니다." });
    }
  }
);

module.exports = router;
