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
    let query_response = { status : "200 OK" };

    const user = res.locals.user_id;
    const post_id = req.params.post_id;
    const page = req.query.page - 1;
    const limit = 10;
    let result;

    try{
        query_response.data = await _query(`SELECT * FROM Comment WHERE post = ${post_id} ORDER BY created_at LIMIT ${page*limit}, ${limit};`);
        for(let i=0;i<query_response.data.length;i++) {
            result = await _query(
                `SELECT * From Comment_User WHERE comment_id = ${query_response.data[i].id} AND user_id = '${user}';`
            )
            if(result.length == 0) {
                query_response.data[i].is_liked = false;
            }
            else {
                query_response.data[i].is_liked = true;
            }
        }
        if(query_response.data.length == 0){
            query_response.status = "400 Bad Request.";
            query_response.message = "No more comments";
        }
    }
    catch(error){
        query_response.status = "400 Bad Request.";
        query_response.data = error;
    }
    res.send(query_response);
});

router.post('/comments/:post_id', _auth, async(req,res) => {
    let query_response = { status : "200 OK" };

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
    let query_response = { status : "200 OK" };

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
    let query_response = { status : "200 OK" };

    const writer = res.locals.user_id;
    const comment_id = req.params.comment_id;
    const post_writer = await _query(`SELECT writer FROM Post WHERE id = (SELECT post FROM Comment WHERE id = ${comment_id});`);
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

router.post('/comments/:comment_id/like', _auth, async(req,res) => {
    let query_response = { status : "200 OK" };

    const user = res.locals.user_id;
    const comment_id = req.params.comment_id;
    const is_liked = await _query(`SELECT * FROM Comment_User WHERE comment_id = ${comment_id} AND user_id = '${user}';`);
    
    try{
        if(is_liked.length == 0 ){
            await _query(
                `INSERT INTO Comment_User (comment_id, user_id)
                    VALUES (${comment_id}, '${user}');`
            );
            await _query(
                `UPDATE Comment SET likes = likes + 1 where id = ${comment_id};`
            );
            query_response.message = `'${user}' like a comment #${comment_id}.`;
        }
        else{
            await _query(utils._delete("Comment_User", is_liked[0].id));
            await _query(
                `UPDATE Comment SET likes = likes - 1 where id = ${comment_id};`
            );
            query_response.message = `'${user}' cancel to like a comment #${comment_id}.`;
        }
    }
    catch(error){
        query_response.status = "400 Bad Request.";
        query_response.data = error;
    }
    res.send(query_response);
});

router.get('/comments/:comment_id/like', _auth, async(req,res) => {
    let query_response = { status : "200 OK" };

    const user = res.locals.user_id;
    const comment_id = req.params.comment_id;
    let result;
    
    try{
        query_response.data = await _query(
            `SELECT user_id,name FROM User WHERE user_id in (SELECT user_id FROM Comment_User WHERE comment_id = ${comment_id});`
        );
        for(let i=0;i<query_response.data.length;i++) {
            result = await _query(
                `SELECT * FROM User_User WHERE target_user = '${query_response.data[i].user_id}' AND request_user = '${user}';`
            )
            if(result.length == 0) {
                query_response.data[i].is_followed = false;
            }
            else {
                query_response.data[i].is_followed = true;
            }
        }
    }
    catch(error){
        query_response.status = "400 Bad Request.";
        query_response.data = error;
    }
    res.send(query_response);
});

module.exports = router;