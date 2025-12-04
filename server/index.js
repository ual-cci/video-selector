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
let parser
let reconnectInterval
const RECONNECT_DELAY = 3000 // 3 seconds between reconnection attempts

const __static = __dirname + '/static'
const __views = __dirname + '/views'

app.engine('pug', pug.renderFile)
app.set('views', __views)
app.set('view engine', 'pug')
app.set('view cache', false)

let videos = {} // {video: '', caption: ''}

const video_exts = ['.mov', '.mp4']
const caption_exts = ['.vtt', '.webvtt']

if (!process.env.VIDEOPATH) {
	console.error('ERROR: VIDEOPATH environment variable is not set!')
	console.error('Please set VIDEOPATH in your .env file or environment variables.')
	process.exit(1)
}

console.log('Video path:', process.env.VIDEOPATH)

function loadVideos() {
	fs.readdir(process.env.VIDEOPATH, (err, files) => {
		if (err) {
			console.error('Error reading video directory:', err.message)
			return
		}
		
		// Reset videos object
		videos = {}
		
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
					videos[file_path.name] = {name: file_path.name}
				}
				videos[file_path.name].caption = file
			}
			
		})
		console.log('Loaded videos:', videos)
	})
}

// Initial load
loadVideos()

// Watch for changes in the video directory
let reloadTimeout
fs.watch(process.env.VIDEOPATH, (eventType, filename) => {
	if (filename) {
		// Debounce reload to avoid multiple rapid reloads
		clearTimeout(reloadTimeout)
		reloadTimeout = setTimeout(() => {
			console.log(`Video directory changed (${eventType}: ${filename}). Reloading videos...`)
			loadVideos()
		}, 500) // Wait 500ms after last change before reloading
	}
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

function connectSerialPort() {
	// Don't attempt to connect if already connected or connecting
	if (serial) {
		return
	}

	SerialPort.list().then((ports) => {
		let attemptedConnection = false
		ports.forEach((port) => {
			if (!serial && port.manufacturer && port.manufacturer.includes("Arduino")) {
				console.log('\nConnecting to: "' + port.path + '"...');
				attemptedConnection = true
				try {
					serial = new SerialPort({
						path: port.path,
						baudRate: 115200
					})

					parser = serial.pipe(new ReadlineParser())
					parser.on('data', serialData);

					serial.on('open', () => {
						console.log('Serial port opened successfully');
						// Clear any existing reconnect interval since we're connected
						if (reconnectInterval) {
							clearInterval(reconnectInterval)
							reconnectInterval = null
						}
					})

					serial.on('error', (err) => {
						console.error('Serial port error:', err.message);
						handleSerialDisconnection()
					})

					serial.on('close', () => {
						console.log('Serial port closed');
						handleSerialDisconnection()
					})
				} catch (err) {
					console.error('Error creating serial port:', err.message);
					handleSerialDisconnection()
				}
			}
		})
		
		// If no Arduino device found and we don't have a connection, schedule a retry
		if (!attemptedConnection && !serial) {
			console.log('No Arduino device found. Will retry...');
			if (!reconnectInterval) {
				reconnectInterval = setInterval(connectSerialPort, RECONNECT_DELAY)
			}
		}
	}).catch((err) => {
		console.error('Error listing serial ports:', err.message);
		handleSerialDisconnection()
	})
}

function handleSerialDisconnection() {
	if (serial) {
		serial = null
		parser = null
	}
	
	// Start reconnection attempts if not already running
	if (!reconnectInterval) {
		console.log(`Attempting to reconnect serial port in ${RECONNECT_DELAY/1000} seconds...`);
		reconnectInterval = setInterval(connectSerialPort, RECONNECT_DELAY)
	}
}

// Initial connection attempt
connectSerialPort()

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