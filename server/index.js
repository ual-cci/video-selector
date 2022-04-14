require('dotenv').config()

const fs = require('fs')
const path = require('path')

const express = require('express')
const app = express()
const http = require('http').Server(app)
const pug = require('pug')

const io = require('socket.io')(http)

const {SerialPort} = require('serialport')
const {ReadlineParser} = require('@serialport/parser-readline')
let serial

const __static = __dirname + '/static'
const __views = __dirname + '/views'

app.engine('pug', pug.renderFile)
app.set('views', __views)
app.set('view engine', 'pug')
app.set('view cache', false)

var videos = []
console.log(process.env.VIDEOPATH)
let files = fs.readdir(process.env.VIDEOPATH, (err, files) => {
	files.forEach((file) => {
		if (path.extname(file) === '.mp4' || path.extname(file) == '.mov') {
			if (file != 'splash.mp4')
				videos.push(file)
		}
	})
})

app.use('/static', express.static(__static))
app.use('/videos', express.static(process.env.VIDEOPATH))

app.get('/', (req, res) => {
	res.render('index');
})

app.get('/admin', (req, res) => {
	res.render('admin', {videos: videos})
})

app.get('/admin/reload', (req, res) => {
	io.emit('reload')
	res.redirect('/admin?reloaded')
})

app.get('/admin/play/:code', (req, res) => {
	io.emit('play', videos[req.params.code])
	res.redirect('/admin?played=' + req.params.code)
})

app.get('/admin/stop', (req, res) => {
	io.emit('stop')
	console.log('Stopped')
	if (serial) serial.write(new Buffer("R"))
	res.redirect('/admin?stopped')
})

io.on('connection', (socket) => {
	console.log('Browser connected')

	if (serial) serial.write(new Buffer("R"))

	socket.on('disconnect', () => {
		console.log('Browser disconnected')
		if (serial) serial.write(new Buffer("O"))
	})

	socket.on('playing', (msg) => {
		let index = videos.indexOf(msg) + 1
		index.toString()
		if (index < 10) index = "0" + index
		console.log('Playing: ' + index)
		if (serial) serial.write(new Buffer("P" + index))
	})

	socket.on('stopped', (msg) => {
		console.log('Stopped')
		if (serial) serial.write(new Buffer("R"))
	})
})

SerialPort.list().then((ports) => {
	ports.forEach((port) => {
		if (!serial && port.manufacturer && port.manufacturer.includes("Arduino")) {
			console.log('\nConnecting to: "' + port.path + '"...');
			serial = new SerialPort({
				path: port.path,
				baudRate: 115200
			})

			parser = serial.pipe(new ReadlineParser())
			parser.on('data', serialData);
		}
	})
})

function serialData(data) {
	let index = parseInt(data.toString().trim())
	if (videos[ index - 1 ]) {
		io.emit('play', videos[ index - 1 ])
	}
}

http.listen(3000, () => {
	console.log('Server started')
})