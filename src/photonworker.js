self.addEventListener("message", async function (e) {
  const processedImageData = await processImageWithPhoton(
    e.data.imageData,
    e.data.width,
    e.data.height,
    e.data.scaleFactor,
    e.data.blurAmount,
    e.data.strength,
    e.data.brightnessThreshold,
  );
  this.self.postMessage(processedImageData);
});

async function processImageWithPhoton(
  imageData,
  width,
  height,
  scaleFactor,
  blurAmount,
  strength,
  brightnessThreshold,
) {
  const photon = await import("@silvia-odwyer/photon");
  const offCanvas = new OffscreenCanvas(width, height);
  const offCtx = offCanvas.getContext("2d");
  // draw the imageData from the uploaded image
  offCtx.putImageData(imageData, 0, 0);

  // Import two copies of the uploaded image as photon images
  let originalImage = photon.open_image(offCanvas, offCtx);
  let photonImage = photon.open_image(offCanvas, offCtx);

  // Threshold the image depending on the brightness threshold set.
  // (Basically turn everything brighter into white, and everything less bright into black)
  photon.threshold(photonImage, brightnessThreshold);

  photon.gaussian_blur(photonImage, blurAmount * scaleFactor);
  // Make filtered bright pixels red
  const redImageData = photon.to_image_data(photonImage);
  const redData = redImageData.data;
  for (let i = 0; i < redData.length; i += 4) {
    // If the pixel is non-black (isolated and blurred parts), only keep the red channel
    if (redData[i] !== 0 || redData[i + 1] !== 0 || redData[i + 2] !== 0) {
      let brightness = (redData[i] + redData[i + 1] + redData[i + 2]) / 3;
      redData[i] = Math.min(255, brightness + strength); // Set red channel to the brightness of that pixel
      redData[i + 1] = 0; // Set green channel to 0
      redData[i + 2] = 0; // Set blue channel to 0
    }
  }
  offCtx.putImageData(redImageData, 0, 0);
  photonImage = photon.open_image(offCanvas, offCtx);
  photon.gaussian_blur(photonImage, blurAmount * scaleFactor);
  // overlay the selected and processed pixels over the original to create the final image
  photon.blend(originalImage, photonImage, "screen");

  // return the image data of the final processed image
  return photon.to_image_data(originalImage);
}
