var video, current_video;
var socket = io();

window.onload = function() {
	video = document.getElementsByTagName('video')[0];

	video.addEventListener( 'play', function() {
		video.className = '';
		socket.emit( 'playing', current_video );
	} );

	video.addEventListener( 'pause', function() {
		socket.emit( 'paused', current_video );
	} );

	video.addEventListener( 'ended', function() {
		socket.emit( 'ended' );
		video.className = 'hide';
		current_video = null;
	} );

	socket.on( 'play', function( msg ) {
		if ( msg != current_video ) {
			current_video = msg;
			video.src = '/videos/' + msg + '.mov';
			video.play();
		} else {
			video.play();
		}
	} );
	socket.on( 'pause', function( msg ) {
		if ( current_video != null )
			video.pause();
	} );
}
