const express = require('express')
const mysql =  require('mysql2')
const db = require('../db')
const utils = require('../utils')
const crypto = require('crypto-js')
const jwt = require('jsonwebtoken')
const config = require('../config')

const router = express.Router()

router.post('/register', (request,response)=>{
    const{name, email, password, phone, address, role_id=1}  = request.body;
    const statement = 'insert into users_tb(name, email, password, phone, address, role_id) values(?, ?, ?, ?, ?, ?)'
    const encryptedPassword = String(crypto.SHA256(password))
    db.pool.execute(statement,
        [name, email, encryptedPassword, phone, address, role_id],
    (error, result) =>{
        response.send(utils.createResult(error, result))
    }
    )
})

//o/p: for first query {
//     "status": "success",
//     "data": {
//         "fieldCount": 0,
//         "affectedRows": 1,
//         "insertId": 2,
//         "info": "",
//         "serverStatus": 2,
//         "warningStatus": 0,
//         "changedRows": 0
//     }
// }

router.post('/login', (request, response)=>{
    const {email, password}  = request.body
    const statement = 'select id, name, email, password, phone, is_deleted from users_tb where email = ? and password = ?'
    const encryptedPassword = String(crypto.SHA256(password))
    db.pool.query(statement, [email, encryptedPassword], (error, data)=>{
        if(error){
            response.send(utils.createErrorResult(error))
        }else{
            if(data.length == 0){
                response.send(utils.createErrorResult('user does not exits'))
            }
            else{
                const user = data[0]
                if(user.isDeleted){
                    response.send(utils.createErrorResult('your account is closed'))
                }else{

                     // payload for token 
                    const payload = {id: user.id}
                    const token = jwt.sign(payload, config.secret)
                    const userData = {
                        token, 
                        name: `${user['name']} ${user['email']}`,
                    }
                    response.send(utils.createSuccessResult(userData))
                }
            }
        }

    })
})

router.get('/profile/', (request,response)=>{
    const statement = `select name, email, phone, address, created_at from users_tb where id = ?`
    const userId = request.userId; 
    db.pool.execute(statement, [userId], (error, result)=>{
        if (error) {
            response.send(utils.createErrorResult(error));
        } else {
            if (result.length > 0) {
                const user = result[0];
                const userData = {
                    name: `${user.name} ${user.email}`,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    created_at: user.created_at
                };
                response.send(utils.createSuccessResult(userData));
            } else {
                response.send(utils.createErrorResult('User not found'));
            }
        }
    })
});

router.post('/addProperty', (request,response)=>{
    // const{from_date, to_date, user_id = request.userId, property_id, status_id, bill, }
    const{title, address, rate, description, place_id, category_id} = request.body
    const statement = `insert into properties_tb(title, address, rate, description, place_id, category_id) values(?, ?, ?, ?, ?, ?)`
    db.pool.execute(statement, [title, address, rate, description, place_id, category_id], (error, result)=>{
    response.send(utils.createResult(error, result))
    })
})

router.get('/bookings', (request, response)=>{
    const statement = `select id, from_date, to_date, user_id, property_id, status_id, bill from bookings_tb`
    db.pool.execute(statement, (error, result)=>{
        if(error){
            response.send(utils.createErrorResult(error))
        }
        else{
            if(result.length > 0){
                // for (let index = 0; index < result.length; index++) {
                //     const booking = result[index];
                //     // //   const booking = result[0]
                //     //   const bookingData = {
                //     //     id : booking.id,
                //     //     from_date : booking.from_date,
                //     //     to_date : booking.to_date,
                //     //     property_id : booking['property_id'],
                //     //     status_id : booking.status_id,
                //     //     bill : booking.bill
                //     //   };
                //     response.send(utils.createSuccessResult(bookingData))
                // }
                response.send(utils.createSuccessResult(result))
            }else{
                response.send(utils.createErrorResult("no any booking availabe"))
            }
        }

    })
})

module.exports = router