//import modules
const express = require('express')
const mongoose = require ('mongoose')
const cors = require ('cors')
require('dotenv').config()
const fs = require('fs')
const path = require('path')

//creating express app
const app = express()
const uploadRoot = path.join(__dirname, 'uploads')
fs.mkdirSync(path.join(uploadsRoot, 'avatars'),{recursive: true})

app.use('uploads', express.static(uploadRoot) )
app.use(espress.json)
const AuthOrigin = process.env.CORS_ORIGIN
? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
:['localhost:5000', 'localhost:435'];