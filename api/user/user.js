const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();

const _query = require('../../database/db');
const middleware = require('../../utils/middleware');
const utils = require('../../utils/utils');

// Follow request API
router.put('/users/:user_id/follow', middleware._auth, async (req, res) => {
  let query_response = {};

  if (req.params.user_id == res.locals.user_id) {
    query_response.message = 'You can not follow yourself';
    return res.send(query_response);
  }

  try {
    let query = await _query(
      `SELECT user_id, name, is_private FROM User WHERE user_id='${req.params.user_id}'`
    );
    if (query.length === 0) {
      res.status(400);
      query_response.message = `User with user_id ${req.params.user_id} does not exists`;
    } else {
      let target_user = query[0].user_id;
      try {
        let follow_req = await _query(
          `SELECT * FROM User_User WHERE target_user='${target_user}' AND request_user='${res.locals.user_id}'`
        );

        if (follow_req.length === 0) {
          if (query[0].is_private === 0) {
            await _query(
              `INSERT INTO User_User (target_user, request_user, accepted) VALUES ('${target_user}', '${res.locals.user_id}', 1)`
            );
            query_response.message = `You are following ${target_user}`;
          } else {
            await _query(
              `INSERT INTO User_User (target_user, request_user) VALUES ('${target_user}', '${res.locals.user_id}')`
            );
            query_response.message = `Follow request has been sent to ${target_user}`;
          }
        } else if (follow_req[0].accepted === 0) {
          query_response.message = `You have already requested to follow ${target_user}`;
        } else {
          query_response.message = `You are already following ${target_user}`;
        }
      } catch (error) {
        res.status(400);
        query_response.message = error;
      }
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Unfollow request API
router.put('/users/:user_id/unfollow', middleware._auth, async (req, res) => {
  let query_response = {};

  if (req.params.user_id == res.locals.user_id) {
    query_response.message = 'You can not unfollow yourself';
    return res.send(query_response);
  }

  try {
    let query = await _query(
      `SELECT user_id, name, is_private FROM User WHERE user_id='${req.params.user_id}'`
    );
    if (query.length === 0) {
      res.status(400);
      query_response.message = `User with user_id ${req.params.user_id} does not exists`;
    } else {
      let target_user = query[0].user_id;
      try {
        let follow_req = await _query(
          `SELECT * FROM User_User WHERE target_user='${target_user}' AND request_user='${res.locals.user_id}'`
        );
        if (follow_req.length === 0) {
          query_response.message = `You are not following user_id ${target_user}`;
        } else {
          if (follow_req[0].accepted === 0) {
            query_response.message = `You have cancelled your follow request to user_id ${req.params.user_id}`;
          } else {
            query_response.message = `You have succesfully unfollowed user_id ${req.params.user_id}`;
          }
          try {
            await _query(`DELETE FROM User_User WHERE id=${follow_req[0].id}`);
          } catch (error) {
            res.status(400);
            query_response.message = error;
          }
        }
      } catch (error) {
        res.status(400);
        query_response.message = error;
      }
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Accept follow request API
router.put('/users/:user_id/accept', middleware._auth, async (req, res) => {
  let query_response = {};

  if (req.params.user_id == res.locals.user_id) {
    query_response.message = "You can't accept yourself";
    return res.send(query_response);
  }

  let query = await _query(
    `SELECT user_id, name, is_private FROM User WHERE user_id='${req.params.user_id}'`
  );
  if (query.length === 0) {
    res.status(400);
    query_response.message = `User with user_id ${req.params.user_id} does not exists`;
  } else {
    try {
      let follow_req = await _query(
        `SELECT * FROM User_User WHERE target_user='${res.locals.user_id}' AND request_user='${req.params.user_id}'`
      );
      if (follow_req.length === 0) {
        res.status(400);
        query_response.message = `You have no follow request from ${req.params.user_id}`;
      } else if (follow_req[0].accepted === 1) {
        query_response.message = `You have already accepted the follow request from ${req.params.user_id}`;
      } else {
        try {
          await _query(
            `UPDATE User_User SET accepted=1 WHERE id=${follow_req[0].id}`
          );
          query_response.message = `You have accepted the follow request of user_id ${req.params.user_id}`;
        } catch (error) {
          res.status(400);
          query_response.message = error;
        }
      }
    } catch (error) {
      res.status(400);
      query_response.message = error;
    }
  }
  res.send(query_response);
});

// Update account privacy API
router.put('/users/private', middleware._auth, async (req, res) => {
  let query_response = { message: 'Account privacy has been updated.' };
  const request_user = res.locals.user_id;

  const is_private = await _query(
    `SELECT is_private FROM User WHERE user_id='${request_user}'`
  );

  try {
    await _query(
      `UPDATE User set is_private=${Math.abs(
        is_private[0].is_private - 1
      )} WHERE user_id='${request_user}'`
    );
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Get list of user's followers API
router.get('/users/:user_id/followers', middleware._auth, async (req, res) => {
  let query_response = {};

  const request_user = res.locals.user_id;
  const target_user = req.params.user_id;

  if (request_user === target_user) {
    query_response.data = await _query(
      `SELECT request_user as user_id FROM User_User WHERE target_user='${target_user}' AND accepted=1`
    );
    return res.send(query_response);
  }

  const is_private = await _query(
    `SELECT is_private FROM User WHERE user_id='${target_user}'`
  );

  if (is_private.length === 0) {
    res.status(400);
    query_response.message = `User with user_id ${req.params.user_id} does not exists`;
    return res.send(query_response);
  }

  const accepted = await _query(
    `SELECT accepted FROM User_User WHERE target_user='${target_user}' AND request_user='${request_user}'`
  );

  try {
    if (is_private[0].is_private && accepted.length == 0) {
      res.status(400);
      query_response.message = `This account is private.`;
    } else if (is_private[0].is_private && !accepted[0].accepted) {
      res.status(400);
      query_response.message = `This account is private.`;
    } else {
      query_response.data = await _query(
        `SELECT request_user as user_id FROM User_User WHERE target_user='${target_user}' AND accepted=1`
      );
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Get list of user's followees API
router.get('/users/:user_id/followees', middleware._auth, async (req, res) => {
  let query_response = {};

  const request_user = res.locals.user_id;
  const target_user = req.params.user_id;

  if (request_user === target_user) {
    query_response.data = await _query(
      `SELECT target_user as user_id FROM User_User WHERE request_user='${target_user}' AND accepted=1`
    );
    return res.send(query_response);
  }

  const is_private = await _query(
    `SELECT is_private FROM User WHERE user_id='${target_user}'`
  );

  if (is_private.length === 0) {
    res.status(400);
    query_response.message = `User with user_id ${req.params.user_id} does not exists`;
    return res.send(query_response);
  }

  const accepted = await _query(
    `SELECT accepted FROM User_User WHERE target_user='${target_user}' AND request_user='${request_user}'`
  );

  try {
    if (is_private[0].is_private && accepted.length == 0) {
      res.status(400);
      query_response.message = `This account is private.`;
    } else if (is_private[0].is_private && !accepted[0].accepted) {
      res.status(400);
      query_response.message = `This account is private.`;
    } else {
      query_response.data = await _query(
        `SELECT target_user as user_id FROM User_User WHERE request_user='${target_user}' AND accepted=1`
      );
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Get list of follow requests API
router.get('/users/requests', middleware._auth, async (req, res) => {
  let query_response = {};
  const request_user = res.locals.user_id;

  try {
    query_response.data = await _query(
      `SELECT target_user, request_user, accepted from User_User where target_user='${request_user}' AND accepted=0`
    );
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Get user's profile API
router.get('/users/:user_id', middleware._auth, async (req, res) => {
  let query_response = {};

  const request_user = res.locals.user_id;
  const target_user = req.params.user_id;

  if (request_user === target_user) {
    query_response.data = await _query(
      `SELECT user_id, email, name, bio, profile_image, is_private FROM User WHERE user_id='${target_user}'`
    );
    return res.send(query_response);
  }

  const is_private = await _query(
    `SELECT is_private FROM User WHERE user_id='${target_user}'`
  );

  if (is_private.length === 0) {
    res.status(400);
    query_response.message = `User with user_id ${req.params.user_id} does not exists`;
    return res.send(query_response);
  }

  const accepted = await _query(
    `SELECT accepted FROM User_User WHERE target_user='${target_user}' AND request_user='${request_user}'`
  );

  try {
    if (is_private[0].is_private && accepted.length == 0) {
      query_response.data = await _query(
        `SELECT user_id, name, is_private FROM User WHERE user_id='${target_user}'`
      );
    } else if (is_private[0].is_private && !accepted[0].accepted) {
      query_response.data = await _query(
        `SELECT user_id, name, is_private FROM User WHERE user_id='${target_user}'`
      );
    } else {
      query_response.data = await _query(
        `SELECT user_id, email, name, bio, is_private FROM User WHERE user_id='${target_user}'`
      );
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }

  res.send(query_response);
});

// Delete a follower
router.delete('/users/:user_id/delete', middleware._auth, async (req, res) => {
  let query_response = {};

  if (req.params.user_id == res.locals.user_id) {
    query_response.message = 'You can not delete yourself';
    return res.send(query_response);
  }

  try {
    let query = await _query(
      `SELECT user_id, name, is_private FROM User WHERE user_id='${req.params.user_id}'`
    );
    if (query.length === 0) {
      res.status(400);
      query_response.message = `User with user_id ${req.params.user_id} does not exists`;
    } else {
      let target_user = query[0].user_id;
      try {
        let follow_req = await _query(
          `SELECT * FROM User_User WHERE target_user='${res.locals.user_id}' AND request_user='${target_user}'`
        );
        if (follow_req.length === 0) {
          query_response.message = `${target_user} is not following you.`;
        } else {
          await _query(`DELETE FROM User_User WHERE id=${follow_req[0].id}`);
          if (follow_req[0].accepted === 0) {
            query_response.message = `Follow request from ${target_user} has been declined.`;
          } else {
            query_response.message = `${target_user} is no longer following you.`;
          }
        }
      } catch (error) {
        res.status(400);
        query_response.message = error;
      }
    }
  } catch (error) {
    res.status(400);
    query_response.message = error;
  }
  res.send(query_response);
});

module.exports = router;
