var fs = require( 'fs' ),
	path = require( 'path' );

var express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	swig = require( 'swig' );

var io = require( 'socket.io' )( http );

var serialPort = require( 'serialport' );
var SerialPort = serialPort.SerialPort;
var serial;

var __videos = '/Users/Tom/Desktop/videos';
var __static = __dirname + '/static';
var __views = __dirname + '/views';

app.engine( 'swig', swig.renderFile );
app.set( 'views', __views );
app.set( 'view engine', 'swig' );
app.set( 'view cache', false );
swig.setDefaults( { cache: false } );

var videos = [];

var files = fs.readdir( __videos, function( err, files ) {
	files.forEach( function( file ) {
		if ( path.extname( file ) === '.mp4' || path.extname( file ) == '.mov' ) {
			videos.push( file );
		}
	} );
} );

app.use( '/static', express.static( __static ) );
app.use( '/videos', express.static( __videos ) );

app.get( '/', function( req, res ) {
	res.render( 'index' );
} );

app.get( '/admin', function( req, res ) {
	res.render( 'admin', { videos: videos } );
} );

app.get( '/admin/reload', function( req, res ) {
	io.emit( 'reload' );
	res.redirect( '/admin?reloaded' );
} );

app.get( '/admin/play/:code', function( req, res ) {
	io.emit( 'play', videos[req.params.code] );
	res.redirect( '/admin?played=' + req.params.code );
} );

app.get( '/admin/stop', function( req, res ) {
	io.emit( 'stop' );
	console.log( 'Stopped' );
	serial.write( new Buffer( "R" ) );
	res.redirect( '/admin?stopped' );
} );

io.on( 'connection', function( socket ) {
	console.log( 'Browser connected' );
	serial.write( new Buffer( "R" ) );

	socket.on( 'disconnect', function() {
		console.log( 'Browser disconnected' );
		serial.write( new Buffer( "O" ) );
	} );

	socket.on( 'playing', function( msg ) {
		var index = videos.indexOf( msg ) + 1;
		index.toString();
		if ( index < 10 ) index = "0" + index;
		console.log( 'Playing: ' + index );
		serial.write( new Buffer( "P" + index ) );
	} );

	socket.on( 'stopped', function( msg ) {
		console.log( 'Stopped' );
		serial.write( new Buffer( "R" ) );
	} );
} );

serialPort.list( function ( err, ports ) {
	ports.forEach( function( port ) {
		if ( ! serial && port.comName.indexOf( "cu.usb" ) != -1 ) {
			console.log( '\nConnecting to: "' + port.comName + '"...' );
			serial = new SerialPort( port.comName, {
				baudrate: 115200,
				praser: serialPort.parsers.readline( '\n' )
			} );
			serial.on( 'open', serialOpen );
		}
	} );
} );

function serialOpen() {
	serial.on( 'data', serialData );
}

function serialData( data ) {
	var index = parseInt( data.toString().trim() );
	if ( videos[ index - 1 ] )
		io.emit( 'play', videos[ index - 1 ] );
}

http.listen( 3000, function() {
	console.log( 'Server started' );
} );
