var video, splash, current_video;
var socket = io();
var pauseTimeout;

window.onload = function() {
	video = document.getElementsByTagName('video')[0];
	splash = document.getElementsByTagName('div')[0];

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

	socket.on( 'play', function( msg ) {
		if ( msg != current_video ) {
			current_video = msg;
			play();
		} else {
			if ( video.paused ) {
				resume();
			} else {
				pause();
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
		splash.className = 'hide';
		clearTimeout( pauseTimeout );
	}

	function resume() {
		video.play();
		video.className = '';
		splash.className = 'hide';
		clearTimeout( pauseTimeout );
	}

	function pause() {
		video.pause();
		pauseTimeout = setTimeout( function() {
			video.className = 'hide';
			current_video = null;
			socket.emit( 'ended' );
		}, 1000 * 60 * 3 );
	}

	function stop() {
		video.pause();
		video.className = 'hide';
		splash.className = '';
		current_video = null;
		clearTimeout( pauseTimeout );
	}
}
