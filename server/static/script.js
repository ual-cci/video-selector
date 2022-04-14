const socket = io()
let video
let splash
let current_video

document.addEventListener('DOMContentLoaded', ready)

function ready() {
	video = document.getElementById('playback')
	splash = document.getElementById('splash')

	splash.src = '/videos/splash.mp4'

	video.addEventListener('play', () => {
		socket.emit('playing', current_video)
	})

	video.addEventListener('ended', () => {
		socket.emit('stopped')
		stop()
	})

	video.addEventListener('timeupdate', () => {
		document.getElementById( 'progress' ).style.width = (video.currentTime / video.duration) * 100 + "%"
	})

	socket.on('play', (msg) => {
		console.log(msg)

		if (msg != current_video) {
			current_video = msg
			play()
		} else {
			stop()
		}
	})

	socket.on('stop', stop)
	socket.on('reload', () => {location.reload()})
}

function play() {
	video.pause()
	video.src = ''
	video.load()

	video.src = '/videos/' + current_video
	video.load()

	video.play()
	video.className = ''

	document.getElementById('bar').className = ''

	splash.pause()
	splash.className = 'hide'
}

function resume() {
	video.play()
	video.className = ''

	splash.pause()
	splash.className = 'hide'
}

function stop() {
	video.pause()
	video.className = 'hide'

	document.getElementById('bar').className = 'hide'

	splash.play()
	splash.className = ''

	current_video = null
	socket.emit('stopped')
}