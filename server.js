require("dotenv").config()
const express = require('express')
const multer = require('multer')
const app = express()
const bodyParser = require('body-parser')

const upload = multer({ dest: 'uploads' })

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const File = require('./models/file')
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

mongoose.connect(process.env.DATABASE_URL,
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB', err))

app.set("view engine", "ejs")

app.get('/', (req, res) => {
    let fileLink = req.cookies['fileLink']
    res.clearCookie('fileLink')
    res.render('index', {
        fileLink: fileLink
    })
})

app.post('/upload', upload.single("file"), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    }

    if (req.body.password) {
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }

    if (!req.file) {
        return res.render('index', {
            error: 'Please select a file'
        })
    }

    const file = await File.create(fileData)

    res.cookie('fileLink', `${req.protocol}://${req.get('host')}/file/${file._id}`)
    res.redirect('/')
})

app.route('/file/:id').get(handleDownlaod).post(handleDownlaod)

async function handleDownlaod(req, res) {
    const file = await File.findById(req.params.id)
    if (!file) {
        return res.render('index', {
            error: 'File not found'
        })
    }

    if (file.password) {
        if (!req.body.password) {
            return res.render('password', {
                error: 'Password is required'
            })
        }

        if (!(await bcrypt.compare(req.body.password, file.password))) {
            return res.render('password', {
                error: 'Password is incorrect'
            })
        }
    }

    file.downloadCount++
    await file.save()

    res.download(file.path, file.originalName)
}

app.listen(process.env.PORT)