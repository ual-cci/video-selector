var video, splash, current_video;
var socket = io();
var pauseTimeout;

window.onload = function() {
	video = document.getElementById('playback');
	splash = document.getElementById('splash');

	splash.src = '/videos/splash.mov';

	video.addEventListener( 'play', function() {
		socket.emit( 'playing', current_video );
	} );

	video.addEventListener( 'pause', function() {
		socket.emit( 'paused', current_video );
	} );

	video.addEventListener( 'ended', function() {
		socket.emit( 'stopped' );
		stop();
	} );

	video.addEventListener( 'timeupdate', function() {
		document.getElementById( 'progress' ).style.width = ( video.currentTime / video.duration ) * 100 + "%";
	} );

	socket.on( 'play', function( msg ) {
		if ( msg != current_video ) {
			current_video = msg;
			play();
		} else {
			if ( video.paused ) {
				resume();
			} else {
				stop();
			}
		}
	} );

	socket.on( 'pause', function() {
		if ( video.paused ) {
			resume();
		} else {
			pause();
		}
	} );

	socket.on( 'stop', function() {
		stop();
	} );

	socket.on( 'reload', function() {
		location.reload();
	} );

	function play() {
		video.src = '/videos/' + current_video + '.mov';

		video.play();
		video.className = '';

		document.getElementById( 'bar' ).className = '';

		splash.pause();
		splash.className = 'hide';

		clearTimeout( pauseTimeout );
	}

	function resume() {
		video.play();
		video.className = '';

		splash.pause();
		splash.className = 'hide';

		clearTimeout( pauseTimeout );
	}

	function pause() {
		video.pause();
		pauseTimeout = setTimeout( stop, 1000 * 60 * 3 );
	}

	function stop() {
		video.pause();
		video.className = 'hide';

		document.getElementById( 'bar' ).className = 'hide';

		splash.play();
		splash.className = '';

		current_video = null;
		socket.emit( 'stopped' );
		clearTimeout( pauseTimeout );
	}
}
