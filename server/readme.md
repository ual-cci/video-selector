# Instructions to install the server

1. Install [Node.js](https://nodejs.org/en/).
1. Download the server to a working director somewhere on your computer.
1. Navigate within the Terminal to that directory.
1. Type `npm i` to install the dependencies.
1. Type `cp .env.example .env` .
1. Create a folder somewhere on your computer for your videos.
1. Number the videos `(01-20.mp4)` and one called `splash.mp4`.
1. Edit `.env` in an editor such as `nano .env` to point to the path of your videos folder.
1. Type `npm i -g pm2`.
1. Type `pm2 start` to start the app/
1. Type `pm2 startup` and follow instructions to make pm2 run at startup.
1. Then open your browser to: `http://localhost:3000` - you will need to turn autoplay on in the browser.

## Admin
You can remotely simulate buttons and reload the browser by visiting `http://hostname:3000/admin` where hostname is replaced with the machine hostname or IP address.

## Autoplay

### Firefox
Guide: https://support.mozilla.org/en-US/kb/block-autoplay

### Google Chrome

- Windows: `chrome.exe --autoplay-policy=no-user-gesture-required`
- macOS: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome  --autoplay-policy=no-user-gesture-required`

Source: https://developer.chrome.com/blog/autoplay/#developer-switches

## Converting SRT to VTT
`ffmpeg -i file.srt file.vtt`