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

let videos = {} // {video: '', caption: ''}

const video_exts = ['.mov', '.mp4']
const caption_exts = ['.vtt', '.webvtt']

console.log(process.env.VIDEOPATH)
let files = fs.readdir(process.env.VIDEOPATH, (err, files) => {
	files.forEach((file) => {
		const file_path = path.parse(file)

		if (video_exts.includes(file_path.ext) && file_path.name != 'splash') {
			if (typeof videos[file_path.name] != 'object') {
				videos[file_path.name] = {name: file_path.name}
			}
			videos[file_path.name].video = file
		}
		if (caption_exts.includes(file_path.ext) && file_path.name != 'splash') {
			if (typeof videos[file_path.name] != 'object') {
				videos.push() = {name: file_path.name}
			}
			videos[file_path.name].caption = file
		}
		
	})
	console.log(videos)
})

app.use('/static', express.static(__static))
app.use('/videos', express.static(process.env.VIDEOPATH))

app.get('/', (req, res) => {
	res.render('index');
})

app.get('/admin', (req, res) => {
	res.render('admin', {videos: Object.values(videos)})
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
		console.log('Playing: ' + msg)
		if (serial) serial.write(new Buffer("P" + msg))
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
		io.emit('play', {
			video: videos[index - 1],
			caption: captions[index - 1]
		})
	}
}

http.listen(3000, () => {
	console.log('Server started')
})