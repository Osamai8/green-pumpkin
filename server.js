const express = require('express');
const bodyParser  = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
// controllers
// const register = require('./controllers/register.js');
// const signin = require('./controllers/signin.js');
// const image = require('./controllers/image.js');
// const profile = require('./controllers/profile.js');


const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'osama',
    database : 'smart_brain'
  }
});

db.select('*').from('users');

const app= express();
app.use(bodyParser.json());
app.use(cors());

app.get('/',(req,res)=>{
    res.send(db.users);
})

// signin post request
app.post('/signin',  (req, res) => { 
    const {email, password} = req.body;
     if(!email || !password ){
        return res.status(400).json('incorrect form submission')
    }
    db.select('email', 'hash').from('login')
    .where('email' ,'=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid){
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong credentials')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

// register post request
app.post('/register', (req,res) => {
    const {email, name, password} = req.body;
    if(!name || !password || !email){
        return res.status(400).json('incorrect form submission')
    }
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email:loginEmail[0],
                name:name,
                joined:new Date()
                })
            .then(user =>{
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(404).json('Unable to register'))   
})

// profile get request
app.get('/profile/:id', (req,res)=>{
    const {id} = req.params;
   db.select('*').from('users').where({id})
    .then(user =>{
        if(user.length){
             res.json(user[0])
         } else{
             res.status(400).json('Not found')
         }       
    }).catch(err => res.status(400).json('error getting user'))
})

// image put request
app.put('/image', (req,res)=>{
    const {id} = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries =>{
        res.json(entries[0]);
    }).catch(err => res.status(400).json('unable to get entries'))
})

app.listen(3000, ()=>{
    console.log('The app is working perfectly on port.')
})


// 
// (ROOT ROUUTE)--> res = this is working
// /signin --> POST  = success/fail
// /register --> POST = user
// /profile/:userId --> GET = user
// /image --> PUT --> user
// 