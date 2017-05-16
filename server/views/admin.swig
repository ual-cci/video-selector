<html>
	<head>
			<title>Admin</title>
	</head>
	<body>
		<a href="/admin/reload">Reload Remote Browser</a>

		<h3>Playback</h3>
		<a href="/admin/stop">Stop</a>
		<ul>
			{% for video in videos %}
				<li><a href="/admin/play/{{ loop.index }}">{{ video }}</a></li>
			{% endfor %}
		</ul>
	</body>
</html>
