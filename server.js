const express = require('express')
const mysql = require('mysql')
const path = require('path')
const app = express()
const { createHash } = require('crypto')
const port = 8080
const api = require('./api.js')
const res = require('express/lib/response')
const { resolve } = require('path')

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "password",
    database: "crypto"
})
async function insert_raw_data(data){
    for (let [_, coin] of Object.entries(data)){
        let name = coin.name
        let code = coin.symbol
        let price = coin.price
        let tf_change = coin.change
        let icon_url = coin.iconUrl

        let query_string = `INSERT INTO raw_coin_data (name, code, price, tf_change, img_link) VALUES (?,?,?,?,?)`
        db.query(query_string, [name, code, price, tf_change, icon_url], (err, res) => {
            if (err){
                console.log(err)
            }
        })
    }
}

async function insert_or_update_data(){
    //insert or update depending on 'action' parameter

    //get data
    let raw_data = await api.api_call()
    let data = raw_data.data.coins
	return data
}

function hash(str){
	return createHash('sha256').update(str).digest('hex')
}

function generate_code(length)
{
	//Generatres unique 5 letter joining code
	let code = ''
	for (let i=0;i<length;i++){
	let index = Math.floor(Math.random()*26)
	let letter_code = 'a'.charCodeAt()+index
	let letter = String.fromCharCode(letter_code)
	code+=letter
	}
	return code
}

async function check_user(user_data){
	//inputed data
	let username = user_data.username
	let password = user_data.password
	//query database for username, salt and hash
	let query_string = `SELECT * FROM user_details`
	let promise = new Promise(function(resolve, reject){
		db.query(query_string, (err, result)=>{
			if (err){
				reject(err)
			}
			for (let user of result){
				if (user.username === username){
					let salt = user.salt
					let db_pass_hash = user.password_hash
					let user_pass_hash = hash(password+salt)
					//password hash matches one stored in database?
					if (db_pass_hash === user_pass_hash){
						console.log("welcome back!")
						resolve({value: true, user_id: user.id})
						return
					}
					else{
						resolve({value: false, reason: 'pass', text: 'Wrong password'})
						return
					}
				}
			}
			resolve({value: false, reason: 'user', text: 'User does not exist'})
		})
	})
	let result = await promise 
	return result
}


async function register_user(user_data){
	let username = user_data.username
	let password = user_data.password
	let salt = generate_code(10)
	let password_hash = hash(password+salt)
	let query_string1 = `SELECT username FROM user_details`
	let query_string2 = `INSERT INTO user_details (username, password_hash, salt) VALUES ('${username}', '${password_hash}', '${salt}')`
	let query_string3 = `SELECT id FROM user_details WHERE username = '${username}'`

	//check if username already taken
	let query1 = new Promise(function(resolve, reject){
		db.query(query_string1, (err, result)=>{
			if (err){
				reject(err)
			}
			else{
				for (let user of result){
					if (username === user.username){
						resolve({value: false, reason: 'user', text: 'User already exists'})
						return
					}
				}
				resolve({value: true})
			}
		})
	})
	//insert user
	let query2 = new Promise(function(resolve, reject){
		db.query(query_string2, (err, result) => {
			if (err){
				reject(err)
			}
			else{
				resolve()
			}
		})
	})
	//get their id
	let query3 = new Promise(function(resolve, reject){
		db.query(query_string3, (err, result)=>{
			if (err){
				reject(err)
			}
			else{
				resolve({value: true, user_id: result[0].id})
			}
		})
	})

	let user_check = await query1
	if (!user_check.value){
		return user_check
	}
	else{
		await query2
		let result = await query3
		return result
	}
}

app.use('/', express.static(path.join(__dirname, '/public')))
//middleware
app.use(express.json())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // disabled for security on local
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.get('/raw-data', async function(req, res){
    let query_string = "SELECT * FROM raw_coin_data"
    db.query(query_string, (err, result)=>{
        if (err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

app.get('/coin-data', async function(req, res){
	let user_id = Number(req.headers.user_id)
	let coin_id = Number(req.headers.coin_id)
	let query_string;	
	//where getting all users coins or just one
	if (coin_id){
		query_string = `SELECT * FROM coin_data WHERE (user_id = '${user_id}' AND coin_id = '${coin_id}')`
	}
	else{
	 	query_string = `SELECT * FROM coin_data WHERE user_id = '${user_id}'`
	}

    db.query(query_string, (err, result)=>{
        if (err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

app.get('/coin-names', async function(req, res){
	let data = await api.api_call()
	let coin_data = data.data.coins
	res.send(coin_data)
})

app.post('/login', async function(req, res){
	let response = await check_user(req.body)
	res.send(response)
})

app.post('/register', async function(req, res){
	let response = await register_user(req.body)
	res.send(response)
})

app.post('/add-coin', async function(req, res){
    let obj = {}
    //client side data
    let name = req.body.name
    let in_AUD = req.body.in_AUD
    let in_coin = req.body.in_coin
	let user_id = req.body.user_id
    //server side data
    let code, price, tf_change, img_link, out_AUD, net
	let data = await insert_or_update_data()
	for (let coin of data){
		if (coin.name === name){
			code = coin.symbol
			price = coin.price
			tf_change = coin.change
			img_link = coin.iconUrl
			out_AUD = price*in_coin
			net = out_AUD - in_AUD
		}
	}
	let query_string_2 = `INSERT INTO coin_data (coin_name, code, price, tf_change, in_AUD, in_coin, out_AUD, net, img_link, user_id) VALUES (?,?,?,?,?,?,?,?,?,?)`
	db.query(query_string_2, [name, code, price, tf_change, in_AUD, in_coin, out_AUD, net, img_link, user_id], (err, res)=>{
		if (err){
			console.log(err)
		}
    })
    res.send({"penis": "large"})
})

app.post('/add-tx', async function(req, res){
    let name = req.body.name
	let user_id = req.body.user_id
    let AUD_to_add = Number(req.body.AUD_to_add)
    let coin_to_add = Number(req.body.coin_to_add)
    let query_string1 = `SELECT price, in_AUD, in_coin, out_AUD FROM coin_data WHERE coin_name = '${name}'`
    db.query(query_string1, (err, result) => {
        if (err){
            console.log(err)
        }
        else{
            let new_in_AUD = result[0].in_AUD + AUD_to_add
            let new_in_coin = result[0].in_coin + coin_to_add
            let new_out_AUD = result[0].out_AUD + (result[0].price*coin_to_add)
            let new_net = new_out_AUD - new_in_AUD
            let query_string2 = `UPDATE coin_data SET in_AUD = ${new_in_AUD}, in_coin = ${new_in_coin}, out_AUD = ${new_out_AUD}, net = ${new_net} WHERE coin_name = '${name}' AND user_id = ${user_id}`
            db.query(query_string2, (err, result)=>{
                if (err){
					console.log(err)
                }
				else{
					res.send({msg: 'updated'})
				}
            })
        }
    })

});

app.post('/delete-coin', async function(req, res){
	let user_id = req.body.user_id
	let coin_id = req.body.coin_id
	let query_string = `DELETE FROM coin_data WHERE user_id = ${user_id} AND coin_id = ${coin_id}`
	db.query(query_string, (err, res)=>{
		if (err){
			console.log(err)
		}
    })
    res.send({msg: "success"})
})

app.listen(port, () => {
    console.log(`Connected to server on ${port}...`)
	//clear all db tables
    db.query("truncate coin_data")
    db.query("truncate raw_coin_data")
	db.query('truncate user_details')
	//random user details
	register_user({username: 'hcmgr', password: 'bruh'})
	register_user({username: 'nah', password: 'bruh'})
	register_user({username: 'yeah', password: 'bruh'})
})
