var video, splash, current_video;
var socket = io();

window.onload = function() {
	video = document.getElementById('playback');
	splash = document.getElementById('splash');

	splash.src = '/videos/splash.mp4';

	video.addEventListener( 'play', function() {
		socket.emit( 'playing', current_video );
	} );

	video.addEventListener( 'ended', function() {
		socket.emit( 'stopped' );
		stop();
	} );

	video.addEventListener( 'timeupdate', function() {
		document.getElementById( 'progress' ).style.width = ( video.currentTime / video.duration ) * 100 + "%";
	} );

	socket.on( 'play', function( msg ) {
		console.log( msg );

		if ( msg != current_video ) {
			current_video = msg;
			play();
		} else {
			stop();
		}
	} );

	socket.on( 'stop', function() {
		stop();
	} );

	socket.on( 'reload', function() {
		location.reload();
	} );

	function play() {
		video.pause();
		video.src = '';
		video.load();

		video.src = '/videos/' + current_video;
		video.load();

		video.play();
		video.className = '';

		document.getElementById( 'bar' ).className = '';

		splash.pause();
		splash.className = 'hide';
	}

	function resume() {
		video.play();
		video.className = '';

		splash.pause();
		splash.className = 'hide';
	}

	function stop() {
		video.pause();
		video.className = 'hide';

		document.getElementById( 'bar' ).className = 'hide';

		splash.play();
		splash.className = '';

		current_video = null;
		socket.emit( 'stopped' );
	}
}
