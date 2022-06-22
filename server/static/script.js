const socket = io()
let body
let current_video
let current_caption
let active_video
let bar

document.addEventListener('DOMContentLoaded', ready)

function ready() {
	body = document.body;
	stop() // show splash screen

	socket.on('play', playMsgHandler)
	socket.on('stop', stop)
	socket.on('reload', () => {location.reload()})
}

function play() {
	const video = createVideoElement('/videos/' + current_video)
	if (current_caption) createTrackElement(video, '/videos/' + current_caption)
	video.play()

	window.getComputedStyle(video).opacity // Force CSS to update so you can show the video
	video.className = ''

	createBarElement()
	bar.className = ''
	active_video = video // This makes the progress bar point at the right thing
}

function createVideoElement(videoSrc) {
	// Schedule removal of existing video elements
	Array.from(document.body.getElementsByTagName('video')).forEach(removeAfterTime)

	// Create new video element
	const video = document.createElement('video')
	video.addEventListener('playing', playHandler)
	video.addEventListener('ended', stopHandler)
	video.addEventListener('timeupdate', timeUpdateHandler)
	
	video.className = 'hide'
	video.src = videoSrc
	video.load()
	body.appendChild(video)
	
	return video
}

function createTrackElement(video, trackSrc) {
	const track = document.createElement('track')
	video.appendChild(track)
	track.kind = 'subtitles'
	track.default = true
	track.src = trackSrc
	return track
}

function createBarElement() {
	if (document.getElementById('bar')) document.getElementById('bar').remove()

	const barElm = document.createElement('div')
	barElm.id = 'bar'
	barElm.className = 'hide'
	
	const progress = document.createElement('div')
	progress.id = 'progress'
	barElm.appendChild(progress)

	bar = barElm
	document.body.appendChild(barElm)
	return barElm
}

function removeAfterTime(elm) {
	elm.muted = true
	setTimeout(() => {
		elm.remove()
	}, 500)
}

function stop() {
	const video = createVideoElement('/videos/splash.mp4')
	createTrackElement(video, '/videos/splash.vtt')
	video.dataset.splash = 'true'
	video.play()
	video.loop = true

	window.getComputedStyle(video).opacity // Force CSS to update so you can show the video
	video.className = ''

	if (bar) {
		bar.className = 'hide'
		setTimeout(() => {bar.remove()}, 500)
	}
	active_video = null
}

function playMsgHandler(msg) {
	console.log(msg)
	if (msg != current_video) {
		current_video = msg.video
		current_caption = msg.caption
		play()
	} else {
		stop()
	}
}

function playHandler(e) {
	if (!e.target.dataset.splash) socket.emit('playing', current_video)
}

function stopHandler(e) {
	socket.emit('stopped')
	stop()
}

function timeUpdateHandler(e) {
	if (active_video) document.getElementById('progress').style.width = (active_video.currentTime / active_video.duration) * 100 + "%"
}