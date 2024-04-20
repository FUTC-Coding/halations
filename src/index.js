import "beercss";
import "./style.css";
import van from "vanjs-core";
import { Navigation, Dialogs, Main, Dropzone } from "./site.js";

let blurAmount = 10;
let brightnessThreshold = 200;
let strength = 50;
let uploadedImage;
let scaledWidth;
let scaledHeight;
let scaleFactor = 0.2;

export function setBlurAmount(value) {
  blurAmount = value;
}

export function setBrightnessThreshold(value) {
  brightnessThreshold = value;
}

export function setStrength(value) {
  strength = value;
}

// Add everything to body
const body = document.body;
van.add(body, Dropzone());
van.add(body, Navigation("m l left secondary"));
van.add(body, Navigation("s bottom secondary"));
van.add(body, Dialogs());
van.add(body, Main());

export function handleFiles(files) {
  const reader = new FileReader();
  reader.onload = function () {
    uploadedImage = new Image();
    uploadedImage.onload = function () {
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");
      // unhide canvas to display image
      canvas.hidden = false;

      // hide ui elements not needed while editing
      document.getElementById("uploadButton").style.display = "none";
      document.querySelectorAll("h1")[0].style.display = "none";
      document.querySelectorAll("h4")[0].style.display = "none";

      //enable reload button
      document.getElementById("reload").style.display = "inline-block";
      //enable download button
      document.getElementById("downloadBtn").disabled = false;

      // enable sliders for editing
      let sliders = document.getElementsByClassName("imageSetting");
      for (let index = 0; index < sliders.length; index++) {
        sliders[index].disabled = false;
      }

      scaledWidth = uploadedImage.width * scaleFactor;
      scaledHeight = uploadedImage.height * scaleFactor;
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      updateCanvas();
    };
    uploadedImage.src = reader.result;
  };
  reader.readAsDataURL(files[0]);
}

export function updateCanvas() {
  // process image and draw the processed image on screen
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(uploadedImage, 0, 0, scaledWidth, scaledHeight);
  const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);
  const worker = new Worker(new URL("./photonworker.js", import.meta.url));
  worker.onmessage = function (e) {
    // Draw the image data from the worker on the canvas
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.putImageData(e.data, 0, 0);
    // terminate the worker because it has finished processing
    worker.terminate();
  };
  worker.postMessage({
    imageData: imageData,
    width: scaledWidth,
    height: scaledHeight,
    scaleFactor: scaleFactor,
    blurAmount: blurAmount,
    strength: strength,
    brightnessThreshold: brightnessThreshold,
  });
}

export function fullResDownload() {
  // process image at full res and download it after
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = uploadedImage.width;
  tempCanvas.height = uploadedImage.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(
    uploadedImage,
    0,
    0,
    uploadedImage.width,
    uploadedImage.height,
  );
  const imageData = tempCtx.getImageData(
    0,
    0,
    uploadedImage.width,
    uploadedImage.height,
  );
  const worker = new Worker(new URL("./photonworker.js", import.meta.url));
  worker.onmessage = function (e) {
    tempCtx.putImageData(e.data, 0, 0);
    const a = document.createElement("a");
    tempCanvas.toBlob(function (blob) {
      a.href = URL.createObjectURL(blob);
      console.log(a.href);
      a.download = "processed_image.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, "image/jpeg");
    document.getElementById("downloadSnackbar").classList.remove("active");
    // terminate the worker because it has finished processing
    worker.terminate();
  };

  worker.postMessage({
    imageData: imageData,
    width: uploadedImage.width,
    height: uploadedImage.height,
    scaleFactor: 1,
    blurAmount: blurAmount,
    strength: strength,
    brightnessThreshold: brightnessThreshold,
  });
}
