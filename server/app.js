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

app.get( '/admin', function( req, res ) {
	res.sendFile( __dirname + '/views/admin.html' );
} );

app.get( '/admin/reload', function( req, res ) {
	io.emit( 'reload' );
	res.redirect( '/admin?reloaded' );
} )

app.get( '/admin/play/:code', function( req, res ) {
	io.emit( 'play', req.params.code );
	res.redirect( '/admin?played' + req.params.code );
} )

app.get( '/admin/stop', function( req, res ) {
	io.emit( 'stop' );
	console.log( 'Stopped' );
	serial.write( new Buffer( "R" ) );
	res.redirect( '/admin?stopped' );
} )

app.use( '/static', express.static( __dirname + '/static' ) );
app.use( '/videos', express.static( __dirname + '/videos' ) );

io.on( 'connection', function( socket ) {
	console.log( 'Browser connected' );
	serial.write( new Buffer( "R" ) );

	socket.on( 'disconnect', function() {
		console.log( 'Browser disconnected' );
		serial.write( new Buffer( "O" ) );
	} );

	socket.on( 'playing', function( msg ) {
		console.log( 'Playing: ' + msg );
		serial.write( new Buffer( "P" + msg ) );
	} );

	socket.on( 'stopped', function( msg ) {
		console.log( 'Stopped' );
		serial.write( new Buffer( "R" ) );
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
