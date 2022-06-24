var width = null;
var height = null;
var bella = new Image();
let happyThreshold = 0.8;
function allFacesAreHappy(faces) {
  for (let i = 0; i < faces.length; i++) {
    if (faces[i].expressions.happy < happyThreshold )
      return false;
  }
  return true
}

window.onload = function() {
const video = document.getElementById('video');
// video.width = window.innerWidth;
// video.height = window.innerHeight;
 bella.src = '/assets/bella3.png';

  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    // faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ]).then(startVideo)

  function startVideo() {
      navigator.getUserMedia = ( navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia);

      navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
      )
  }

  video.addEventListener( "loadedmetadata", function (e) {
   width = this.videoWidth;
   height = this.videoHeight;
  }, false );

}
let bellaSize = 600;
let bellaOffset = bellaSize;
let bellaFrameSpeed = 150;
let buffer = -50;
let numberOfFaces = 1;
  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    const canvasContext = canvas.getContext('2d');
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    console.log(width, height);
    let bellaX = canvas.width - bellaSize;
    let bellaY =  canvas.height  - bellaSize;
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())/*.withFaceLandmarks()*/.withFaceExpressions();
      console.log(detections)
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      canvasContext.clearRect(0, 0, canvas.width, canvas.height)
      if (detections.length >= numberOfFaces && allFacesAreHappy(detections)) {
        // bellaOffset = bellaOffset > 0 ? (bellaOffset - bellaFrameSpeed) : bellaOffset;
        if (bellaOffset - bellaFrameSpeed < 0) {
          bellaOffset = 0;
        } else {
          bellaOffset -= bellaFrameSpeed;
        }
        canvasContext.drawImage(
          bella, canvas.width - bellaSize - buffer, canvas.height - bellaSize + bellaOffset - buffer ,bellaSize, bellaSize
        );

      } else {
        bellaOffset = bellaSize;
      }
      // faceapi.draw.drawDetections(canvas, resizedDetections)
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    }, 100)
  })  

