const express = require("express");
const router = express.Router();

const _query = require("../../database/db");
const _auth = require("../user/auth");
const utils = require("../../utils/utils");

router.use((req, res, next) => {
    console.log(`${req.method}  ${req.ip} requested on ${req.path}`);
    next();
  });

  router.get('/comments/:post_id', _auth, async(req,res) => {
    let query_response = { status : "200 OK!" };

    try{
        query_response.data = await _query(`SELECT * FROM Comment WHERE post = ${req.params.post_id};`);
    }
    catch(error){
        query_response.status = "400 Bad Request.";
        query_response.data = error;
    }
    res.send(query_response);
});

router.post('/comments/:post_id', _auth, async(req,res) => {
    let query_response = { status : "200 OK!" };

    const content = req.body.content;
    const writer = res.locals.user_id;
    const post = req.params.post_id;

    try{
        await _query(
            `INSERT INTO Comment (content, writer, post)
            VALUES ('${content}','${writer}',${post})`);
        query_response.data = req.body;
    }
    catch(error){
        query_response.status = "400 Bad Request.";
        query_response.data = error;
    }
    res.send(query_response);
});

router.post('/comments/:comment_id/reply', _auth, async(req, res) => {
    let query_response = { status : "200 OK!" };

    const content = req.body.content;
    const writer = res.locals.user_id;
    const data = await _query(`SELECT post, parent_comment FROM Comment WHERE id = ${req.params.comment_id};`);
    const parent_comment = req.params.comment_id;

    try{
        if(data[0].parent_comment == null) {
            await _query(
                `INSERT INTO Comment (content, writer, post, parent_comment)
                VALUES ('${content}', '${writer}', ${data[0].post}, ${parent_comment});`);
        }
        else {
            await _query(
                `INSERT INTO Comment (content, writer, post, parent_comment)
                VALUES ('${content}', '${writer}', ${data[0].post}, ${data[0].parent_comment});`);
        }
        query_response.data = req.body;
    }
    catch(error){
        query_response.status = "400 Bad Request.";
        query_response.data = error;
    }
    res.send(query_response);
})

router.delete('/comments/:comment_id', _auth, async(req,res) => {
    let query_response = { status : "200 OK!" };

    const writer = res.locals.user_id;
    const comment_id = req.params.comment_id;
    const post = await _query(`SELECT post FROM Comment WHERE id = ${comment_id};`);
    const post_writer = await _query(`SELECT writer FROM Post WHERE id = ${post[0].post};`);
    const comment_writer = await _query(`SELECT writer FROM Comment WHERE id = ${comment_id};`);

    try{
        if(writer == post_writer[0].writer) {
            await _query(utils._delete("Comment", comment_id));
            query_response.message = `You delete a comment #${comment_id} successfully.`;
        }
        else if(writer == comment_writer[0].writer) {
            await _query(utils._delete("Comment", comment_id));
            query_response.message = `You delete a comment #${comment_id} successfully.`;
        }
        else {
            query_response.message = "No authority.";
        }
    }
    catch(error){
        query_response.status = "400 Bad Request.";
        query_response.data = error;
    }
    res.send(query_response);
});

module.exports = router;