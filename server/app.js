var fs = require('fs'),
	path = require('path');

var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	pug = require('pug');

var io = require('socket.io')(http);

var SerialPort = require('serialport');
var Readline = require('@serialport/parser-readline');
var serial;

var __videos = '/Users/Shared/videos';
var __static = __dirname + '/static';
var __views = __dirname + '/views';

app.engine('pug', pug.renderFile);
app.set('views', __views);
app.set('view engine', 'pug');
app.set('view cache', false);

var videos = [];

var files = fs.readdir(__videos, function(err, files) {
	files.forEach(function(file) {
		if (path.extname(file) === '.mp4' || path.extname(file) == '.mov') {
			if (file != 'splash.mp4')
				videos.push(file);
		}
	});
});

app.use('/static', express.static(__static));
app.use('/videos', express.static(__videos));

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/admin', function(req, res) {
	res.render('admin', { videos: videos });
});

app.get('/admin/reload', function(req, res) {
	io.emit('reload');
	res.redirect('/admin?reloaded');
});

app.get('/admin/play/:code', function(req, res) {
	io.emit('play', videos[req.params.code]);
	res.redirect('/admin?played=' + req.params.code);
});

app.get('/admin/stop', function(req, res) {
	io.emit('stop');
	console.log('Stopped');
	if (serial) serial.write(new Buffer("R"));
	res.redirect('/admin?stopped');
});

io.on('connection', function(socket) {
	console.log('Browser connected');

	if (serial) serial.write(new Buffer("R"));

	socket.on('disconnect', function() {
		console.log('Browser disconnected');
		if (serial) serial.write(new Buffer("O"));
	});

	socket.on('playing', function(msg) {
		var index = videos.indexOf(msg) + 1;
		index.toString();
		if (index < 10) index = "0" + index;
		console.log('Playing: ' + index);
		if (serial) serial.write(new Buffer("P" + index));
	});

	socket.on('stopped', function(msg) {
		console.log('Stopped');
		if (serial) serial.write(new Buffer("R"));
	});
});

SerialPort.list(function (err, ports) {
	ports.forEach(function(port) {
		console.log(port.comName);
		if (! serial && port.comName.indexOf("usbmodem") != -1) {
			console.log('\nConnecting to: "' + port.comName + '"...');
			serial = new SerialPort(port.comName, {
				baudRate: 115200
			});
			const parser = new Readline();
			serial.pipe(parser);

			parser.on('data', serialData);
		}
	});
});

function serialData(data) {
	var index = parseInt(data.toString().trim());
	if (videos[ index - 1 ])
		io.emit('play', videos[ index - 1 ]);
}

http.listen(3000, function() {
	console.log('Server started');
});
