require('dotenv').config();

const PORT = process.env.PORT || 3000;
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const cors = require('cors');

// const modules = require('./modules');

/*------------------------------------------
parse application/json
--------------------------------------------*/
app.use(cors());
app.use(bodyParser.text());
app.use('/public', express.static('public'));
app.use(express.json());

/*------------------------------------------
Database Connection
--------------------------------------------*/

const conn = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USERNAME, 
	password: process.env.DB_PASSWORD, 
	database: process.env.DB_NAME
});


/*------------------------------------------
Shows Mysql Connect
--------------------------------------------*/
conn.connect((err) =>{
	if(err) throw err;
	console.log('Mysql Connected with App...');
});



app.get('/',(req, res) => {
	res.send(apiResponse('DMP Recruitment'));
});

// app.post("/api/register", (req, res) => {
// 	try {
// 		const { name, username, password} = req.body

// 		if (!(username && password && name)) {
// 			res.status(400).send("All input is required");
// 		}

// 		let data = {
// 			name: name,
// 			username: username
// 		};

// 		bcrypt.genSalt(10, function(err, salt) {
// 			bcrypt.hash(process.env.SECRETKEY, salt, function(err, hash) {

// 				const sqlQuery = "INSERT INTO `users` (`name`, `username`, `password`) VALUES ('"+name+"', '"+username+"', '"+hash+"')";
// 				console.log(sqlQuery);
// 				let query = conn.query(sqlQuery,(err, results) => {
// 					const token = jwt.sign({data},process.env.SECRETKEY);
// 					data.token = token;

// 					res.send(apiResponse('Data Berhasil di tambahkan'));
// 				});
// 			});
// 		});

// 	} catch (err) {
// 		console.log(err);
// 	}
// });

app.post('/api/login',(req,res)=>{
	// let username = req.body.username;
	// let password = req.body.password;
    //Mock user
    // let sqlQuery = "SELECT * FROM users where username='"+username+"'";
    // let query = conn.query(sqlQuery, (err, results) => {
    // 	if(err) throw err;
    // 	console.log(results);
    // 	res.send(apiResponse(results));
    // });

    let username ='ilham';
    let password ='admin';

    let data = {
    	username: username,
    	password: password
    };

    const token = jwt.sign({data},process.env.SECRETKEY);

    let resp = {
    	username: username,
    	token: token
    };

    res.send(apiResponse(resp));

});

app.get('/api/profile',verifyToken,(req,res)=>{
	jwt.verify(req.token,process.env.SECRETKEY,(err,authData)=>{
		if(err)
			res.sendStatus(403);
		else{
			res.json({
				code:200,
				success:true,
				message:"Data Berhasil ditemukan",
				data:authData
			});

		}
	});
});



app.get('/api/jobs',verifyToken,(req, res) => {
	let page = req.query.page || 1;
	let per_page = req.query.per_page || 5;
	let search = req.query.search;

	if(page==1){
		var offset=0;
	}else{
		var offset=(page*per_page)-per_page;
	}

	var searchQuery='';
	if(search!='' && search !=undefined){
		var searchQuery=" WHERE job_name like '%"+search+"%' OR location like '%"+search+"%' OR type like '%"+search+"%'";
	}
	
	let sqlQuery = "SELECT id,job_name,location,type FROM jobs "+searchQuery+" ORDER BY id LIMIT "+per_page+" OFFSET "+offset;
	console.log(sqlQuery);
	let query = conn.query(sqlQuery, (err, results) => {
		if(err) throw err;

		var response ={
			"code": 200,
			"page": page,
			"per_page": per_page,
			"data": results,
			"error": null
		}
		var resp = JSON.stringify(response);

		res.send(resp);
	});
});


app.get('/api/jobs/:id',verifyToken,(req, res) => {
	let sqlQuery = "SELECT * FROM jobs WHERE id=" + req.params.id;
	let query = conn.query(sqlQuery, (err, results) => {
		if(err) throw err;
		res.send(apiResponse(results));
	});
});


// app.post('/api/jobs',verifyToken,(req, res) => {
// 	let data = {title: req.body.title, body: req.body.body};
// 	let sqlQuery = "INSERT INTO jobs SET ?";
// 	let query = conn.query(sqlQuery, data,(err, results) => {
// 		if(err) throw err;
// 		res.send(apiResponse(results));
// 	});
// });


// app.put('/api/jobs/:id',verifyToken,(req, res) => {
// 	let sqlQuery = "UPDATE jobs SET title='"+req.body.title+"', body='"+req.body.body+"' WHERE id="+req.params.id;
// 	let query = conn.query(sqlQuery, (err, results) => {
// 		if(err) throw err;
// 		res.send(apiResponse(results));
// 	});
// });


// app.delete('/api/jobs/:id',verifyToken,(req, res) => {
// 	let sqlQuery = "DELETE FROM jobs WHERE id="+req.params.id+"";
// 	let query = conn.query(sqlQuery, (err, results) => {
// 		if(err) throw err;
// 		res.send(apiResponse(results));
// 	});
// });

/** Not found handler */
app.all('*', (req, res) => {
	let response = {status: 404, message: 'URL Not Found', data: null};
	return res.status(404).send(response);
});

function apiResponse(results){
	return JSON.stringify({"code": 200, "data": results,"error": null});
}


//Verify Token
function verifyToken(req,res,next){
	const bearerHeader = req.headers['authorization'];
    //check if bearer is undefined
    if(typeof bearerHeader !== 'undefined'){
    	const bearer = bearerHeader.split(' ');
    	const bearerToken = bearer[1];

        //set the token
        req.token = bearerToken;
        next();
    }else{
        //Fobidden
        var resp =JSON.stringify({"code": 403, "message":'Forbiden! You dont have access to this API'});
        res.send(resp);
    }
}


/*------------------------------------------
Server listening
--------------------------------------------*/

app.listen(3000,() =>{
	console.log('Server started on port 3000...');
});