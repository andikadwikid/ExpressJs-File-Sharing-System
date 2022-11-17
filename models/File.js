const mongoose = require('mongoose')
const Schema = mongoose.Schema

const fileSchema = new Schema({
    path: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    password: {
        type: String,
    },
    downloadCount: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('File', fileSchema)