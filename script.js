const video = document.getElementById('video');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);

    resizedDetections.forEach((detection) => {
      const expressions = detection.expressions;
      const sortedEmotions = Object.entries(expressions).sort(
        (a, b) => b[1] - a[1]
      );

      const [emotion, emotionValue] = sortedEmotions[0];

      if (emotion === 'happy' || emotion === 'neutral' || emotion === 'angry') {
        const text = `${emotion}: ${Math.round(emotionValue * 100)}%`;
        const { x, y, width, height } = detection.detection.box;
        const box = new faceapi.draw.DrawBox(
          { x, y, width, height },
          { label: text }
        );
        box.draw(canvas);
      }
    });
  }, 100);
});
