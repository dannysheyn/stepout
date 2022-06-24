/*
The MIT License (MIT)
Copyright (c) 2014 Chris Wilson
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var isPlaying = false;
var sourceNode = null;
var analyser = null;
var theBuffer = null;
var DEBUGCANVAS = null;
var mediaStreamSource = null;
var detectorElem, 
	canvasElem,
	waveCanvas,
	pitchElem,
	noteElem,
	detuneElem,
	detuneAmount;
var boat = new Image();
var bellaAnimation = new Image();
const numSkyImages = 300;
let skyImageArray = new Array(numSkyImages);
var seaImages = [];
const numSeaImages = 51;
for (let index = 0; index < numSeaImages; index++) {
	seaImages[index] = new Image();
}
for (let index = 0; index < numSkyImages; index++) {
	skyImageArray[index] = new Image();
}
let currentSeaImage = 0;
let skyImage = new Image();
let currentSkyImage = 0;
var moveRight = true;
let boatXmin =0;
let boatX = 0;
let boatXmax = 0;
window.onload = function() {
	audioContext = new AudioContext();
	MAX_SIZE = Math.max(4,Math.floor(audioContext.sampleRate/5000));	// corresponds to a 5kHz signal
	detectorElem = document.getElementById( "detector" );
	canvasElem = document.getElementById( "output" );
	DEBUGCANVAS = document.getElementById( "waveform" );
	bellaAnimation.src = './assets/surfer6.png';

	function initPics(images, imagesLength, folder, prefix) {
		let number;
		for (let i = 0; i < imagesLength; i++) {
			if (i < 10) {
				number = '00' + i;
			} else if (i < 100) {
				number = '0' + i;
			} else {
				number = i;
			}

			images[i].src = folder + number.toString() + prefix
		}

	}

	// initPics(seaImages, seaImages.length, './sea2/sea', '.gif');
	initPics(skyImageArray,skyImageArray.length, './black_white/BW', '.gif');
	DEBUGCANVAS.width = window.innerWidth;
	DEBUGCANVAS.height =window.innerHeight;
	boatXmin = window.innerWidth / 9;
	boatX = window.innerWidth / 2 ;
	boatXmax = window.innerWidth *(7/9);
	getUserMedia(
		{
			"audio": {
				"mandatory": {
					"googEchoCancellation": "false",
					"googAutoGainControl": "false",
					"googNoiseSuppression": "false",
					"googHighpassFilter": "false"
				},
				"optional": []
			},
		}, gotStream);

	if (DEBUGCANVAS) {
		waveCanvas = DEBUGCANVAS.getContext("2d");
		waveCanvas.strokeStyle = "black";
		waveCanvas.lineWidth = 1;

	}

}

function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}
function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
	
    // Connect it to the destination.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect( analyser );
    updatePitch();
	setInterval(function () {
		currentSeaImage = (currentSeaImage + 1) % numSeaImages;
		currentSkyImage = (currentSkyImage  + 1) % numSkyImages;
	}, 35);
}

function toggleLiveInput() {
    if (isPlaying) {
        //stop playing and return
        sourceNode.stop( 0 );
        sourceNode = null;
        analyser = null;
        isPlaying = false;
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
        window.cancelAnimationFrame( rafID );
    }
    getUserMedia(
    	{
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream);
}

var rafID = null;
var buflen = 2048;
var buf = new Float32Array( buflen );



function max(array) {
	let max = 0;
	for (let i = 0; i < array.length; i++) {
		if (array[i] > max) {
			max = array[i];
		}
	}
	return max;
}

var last_time = -1;
let bellaFrameSizeX = 710;
let bellaFrameSizeY = 710;
let stateHeightAjustment = -5;
let grabX = 0;
let grabY = 0;
let bellaSizeX = 985;
let bellaSizeY = 985;
const bellaStateOptions = {
	down: 'down',
	standing: 'standing', 
	goingDown: 'goingDown',
	up: 'up'
};
let bellaState = bellaStateOptions.down
let currentFrame = 0;
const numOfFrames = {
	down: '3',
	standing: '20',
	goingDown: '20',
	up: '6'
};

function decideState(buffer, currentFrame, grabX) {
	let pitch = 0;
	let soundThreshold = 5;
	let soundUpThreshold = 100;
	for (let index = 0; index < buffer.length; index++) {
		pitch += Math.abs(buffer[index])
	}
	switch (bellaState) {
		case bellaStateOptions.down:
			if ( pitch > soundUpThreshold) {
				return [bellaStateOptions.standing, 0, 0];
			} else {
				return [bellaStateOptions.down, currentFrame, grabX];
			}
		case bellaStateOptions.standing:
			if (currentFrame >= numOfFrames[bellaState] - 1) {
				return [bellaStateOptions.up, 0, 0];	
			} else {
				return [bellaStateOptions.standing, currentFrame, grabX];
			}
		case bellaStateOptions.up:
			if (pitch > soundThreshold) {
				return [bellaStateOptions.up, currentFrame, grabX];
			} else {
				return [bellaStateOptions.goingDown, 0, 0];
			}
		case bellaStateOptions.goingDown:
			if (currentFrame >= numOfFrames[bellaState] - 1) {
				return [bellaStateOptions.down, 0, 0];
			} else {
				return [bellaStateOptions.goingDown, currentFrame, grabX];
			}
		default:
			break;
	}
}

function mapSoundToSize(buff, numOfRects) {
	let soundRects = [];
	let soundRectsLength = Math.floor(buff.length / numOfRects);
	let avg;
	for (let i = 0; i < buff.length; i+= soundRectsLength) {
		avg = 0;
		for (let j = i; j < soundRectsLength; j++) {
			avg += buff[j]
		}
		avg /= soundRectsLength
		soundRects[i] = avg;
	}
	
	return soundRects;
}

function updatePitch( time ) {

	let width = window.innerWidth;
	let height  = window.innerHeight;
	if (last_time == -1){
		// first time
		last_time = time;
	}
	if (time - 150 < last_time) {
		rafID = window.requestAnimationFrame( updatePitch );
		// let res = decideState(buf);
		// console.log(res);
		return;
	}
	analyser.getFloatTimeDomainData( buf );
	[bellaState, currentFrame, grabX] = decideState(buf, currentFrame, grabX);
	console.log(bellaState);

	let numberOfRects = 600;
	let rectPixelwidth = Math.ceil(width / numberOfRects);
	let bellaSize = 400;
	let rectsUnderBella = [];
	let sum =0;



	if (DEBUGCANVAS) {  // This draws the current waveform, useful for debugging
		//  waveCanvas.clearRect(0,0,width,height);
		waveCanvas.clearRect(0,0,width,height);
		// waveCanvas.drawImage(
		// 	seaImages[currentSeaImage],
		// 	0, 0, // from where to grab
		// 	width, height, // how big to grab
		// )
		let takeX = 0;
		let skyPixelWidth = skyImage.width / numberOfRects;
        let soundMappedValues= mapSoundToSize(buf, numberOfRects)
		waveCanvas.drawImage(
			skyImageArray[currentSkyImage],
			0 , 0, // from where to grab
			// skyPixelWidth + 1, height, // how big to grab  //change
			// rectX , 0, // x and y
			window.innerWidth,window.innerHeight // size of placement //change
		)

		waveCanvas.strokeStyle = '#58CCED';
		waveCanvas.beginPath();
		waveCanvas.moveTo(0,height/2);
		let upperRectsData = [];
		let lowerRectsData = [];
		for (let i=0;i<numberOfRects;i++) {
			let rectX = i*rectPixelwidth;
			let rectY = (height*(5/12)+(buf[i]*height/2));
			if (i % 3 == 0) {
				rectY = 0; 
			}
			// 0, 115, 255 blue
			upperRectsData.push([rectX,height*(10/16),rectPixelwidth, -rectY*(5/16)]);
			lowerRectsData.push([rectX,height*(10/16),rectPixelwidth, rectY*(5/16)]);
			// waveCanvas.shadowBlur = 10;
			// waveCanvas.shadowColor = "black";
			takeX += rectPixelwidth + 1;
			// waveCanvas.drawImage(
			// 	skyImage, rectX,0,rectPixelwidth + 1,rectY
			// );
			//waveCanvas.fillRect(rectX,0,rectPixelwidth + 1,rectY); //works
			if (boatX < rectX && boatX + bellaSize > rectX && i % 3 != 0) {
				// collect all rectY values
				rectsUnderBella.push(rectY);
			}

		}
		
		for (let i =0 ; i< rectsUnderBella.length; i++){
			sum += rectsUnderBella[i];
		}

		switch (bellaState) {
			case bellaStateOptions['down']:
				grabX = (grabX + bellaFrameSizeX) % (numOfFrames['down'] *bellaFrameSizeX) ;
				grabY = 0;		
				break;
			case bellaStateOptions['standing']:
				grabX = (grabX + bellaFrameSizeX) % (numOfFrames['standing'] *bellaFrameSizeX) ;
				grabY = bellaFrameSizeY;
				break;
			case bellaStateOptions['up']:
				grabX = (grabX + bellaFrameSizeX) % (numOfFrames['up'] *bellaFrameSizeX) ;
				grabY = bellaFrameSizeY *2;
				break;
			case bellaStateOptions['goingDown']:
				grabX = (grabX + bellaFrameSizeX) % (numOfFrames['goingDown'] *bellaFrameSizeX) ;
				grabY = bellaFrameSizeY *3;
				break;
			default:
				break;
		}


		waveCanvas.drawImage(
			bellaAnimation,
			grabX, grabY, // from where to grab
			bellaFrameSizeX, bellaFrameSizeY, // how big to grab
			(width/2) - (bellaSize/2), (sum/rectsUnderBella.length) - (bellaSize/2 + stateHeightAjustment), // x and y
			bellaSize, bellaSize // size of placement
		)
		
		for (let i = 0; i < numberOfRects; i++) {
			waveCanvas.fillRect(upperRectsData[i][0],upperRectsData[i][1],upperRectsData[i][2],upperRectsData[i][3]); //work
			waveCanvas.fillRect(lowerRectsData[i][0],lowerRectsData[i][1],lowerRectsData[i][2],lowerRectsData[i][3]); //work
			waveCanvas.fillStyle = 'rgb(0, 0, 0 )';
		}
		// waveCanvas.setTransform(1,0,0,-1,0,waveCanvas.height);
		// waveCanvas.drawImage(waveCanvas,0,0);
		currentFrame += 1;
		waveCanvas.fill();			
		waveCanvas.stroke();

		last_time = time;
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = window.webkitRequestAnimationFrame;
	rafID = window.requestAnimationFrame( updatePitch );
}