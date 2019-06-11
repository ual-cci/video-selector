# Instructions to install the server

1. Install [Node.js](https://nodejs.org/en/).
2. Download the server to a working director somewhere on your computer.
3. Navigate within the Terminal to that directory.
4. Type `npm install` to install the dependencies.
5. Type `npm install -g pm2`.
6. Type `pm2 startup` and follow instructions to make pm2 run at startup.
7. Navigate to `/Users/Shared/` and create a `video` folder with the videos in it numbered `(01-20).mp4` and one called `splash.mp4`.
7. Type `pm2 start app` 
8. Then open your browser to: `http://localhost:3000`
