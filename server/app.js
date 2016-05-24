var express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app );

var io = require( 'socket.io' )( http );

var serialPort = require( 'serialport' );
var SerialPort = serialPort.SerialPort;
var serial;

app.get( '/', function( req, res ) {
	res.sendFile( __dirname + '/views/index.html' );
} );

app.use( '/static', express.static( 'static' ) );
app.use( '/videos', express.static( 'videos' ) );

io.on( 'connection', function( socket ) {
	console.log( 'Browser connected' );

	socket.on( 'disconnect', function() {
		console.log( 'Browser disconnected' );
	} );

	socket.on( 'playing', function( msg ) {
		console.log( 'Playing: ' + msg );
	} );

	socket.on( 'paused', function( msg ) {
		console.log( 'Paused: ' + msg );
	} );

	socket.on( 'ended', function( msg ) {
		console.log( 'Ended' );
	} );
} );

http.listen( 3000 );

serialPort.list( function ( err, ports ) {
	ports.forEach( function( port ) {
		if ( ! serial && port.comName.indexOf( "cu.usb" ) != -1 ) {
			console.log( '\nConnecting to: "' + port.comName + '"...' );
			serial = new SerialPort( port.comName, {
				baudrate: 115200,
				praser: serialPort.parsers.readline( '\n' )
			} );
			serial.on( 'open', function () {
				serial.on( 'data', function( data ) {
					var data = data.toString().trim();
					if ( data.length == 2 )
						io.emit( 'play', data );
				} );
			} );
		}
	} );
} );
