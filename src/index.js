import 'jimp';
const cachedJpegDecoder = Jimp.decoders['image/jpeg']
Jimp.decoders['image/jpeg'] = (data) => {
    const userOpts = { maxMemoryUsageInMB: 1024 }
    return cachedJpegDecoder(data, userOpts)
}

let blurAmount = 10;
let brightnessThreshold = 200;
let strength = 50;
let img;

function handleFiles(files) {
    const reader = new FileReader();
    reader.onload = function () {
        img = new Image();
        img.onload = function () {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            processImageWithPhoton();
        }
        img.src = reader.result;
    }
    reader.readAsDataURL(files[0]);
}

function processImageWithPhoton() {
    var startTime = performance.now();
    import('@silvia-odwyer/photon').then(photon => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let originalImage = photon.open_image(canvas, ctx);
        photon.resize_img_browser(originalImage, originalImage.get_width() * 0.3, originalImage.get_height() * 0.3, 1)
        let photonImage = photon.open_image(canvas, ctx);
        photon.resize_img_browser(photonImage, photonImage.get_width() * 0.3, photonImage.get_height() * 0.3, 1)

        //photon.r_grayscale(photonImage);
        photon.threshold(photonImage, brightnessThreshold);

        //maybe edge detect here?
        photon.gaussian_blur(photonImage, blurAmount);
        photon.remove_blue_channel(photonImage);
        photon.remove_green_channel(photonImage);
        photon.alter_red_channel(photonImage, strength)
        photon.gaussian_blur(photonImage, blurAmount);
        photon.blend(originalImage, photonImage, 'screen')

        photon.putImageData(canvas, ctx, originalImage);
    });
    var endTime = performance.now();
    console.log('processImageWithPhoton took ' + (endTime - startTime) + 'ms');
}

function processImageWithJimp() {
    var worker = new Worker(new URL('./jimpworker.js', import.meta.url));
    worker.onmessage = function (e) {
        // const imageData = new ImageData(
        //     Uint8ClampedArray.from(image.bitmap.data),
        //     image.bitmap.width,
        //     image.bitmap.height
        // );

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        var finalImage = new Image();
        finalImage.onload = function() {
            ctx.drawImage(finalImage, 0, 0);
        }
        finalImage.src = e.data;
    }
    worker.postMessage({ src: img.src, blurAmount: blurAmount, brightnessThreshold: brightnessThreshold, strength: strength });
}

function processImage() {
    var startTime = performance.now();

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    // Step 1: Create a black and white copy of the original image
    const bwCanvas = document.createElement('canvas');
    const bwCtx = bwCanvas.getContext('2d');
    bwCanvas.width = img.width;
    bwCanvas.height = img.height;
    bwCtx.drawImage(img, 0, 0);
    const imageData = bwCtx.getImageData(0, 0, bwCanvas.width, bwCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = brightness;
    }
    bwCtx.putImageData(imageData, 0, 0);

    // Step 2: Keep only the very bright parts of the black and white copy
    const brightPartsImageData = bwCtx.getImageData(0, 0, bwCanvas.width, bwCanvas.height);
    const brightPartsData = brightPartsImageData.data;
    for (let i = 0; i < brightPartsData.length; i += 4) {
        const brightness = (brightPartsData[i] + brightPartsData[i + 1] + brightPartsData[i + 2]) / 3;
        if (brightness <= brightnessThreshold) {
            brightPartsData[i] = brightPartsData[i + 1] = brightPartsData[i + 2] = 0;
        }
    }
    bwCtx.putImageData(brightPartsImageData, 0, 0);

    // Step 3: Apply Gaussian Blur to the bright parts of the black and white copy
    const blurCanvas = document.createElement('canvas');
    const blurCtx = blurCanvas.getContext('2d');
    blurCanvas.width = img.width;
    blurCanvas.height = img.height;
    blurCtx.filter = 'blur(' + blurAmount + 'px)'; // Adjust the blur radius as needed
    blurCtx.drawImage(bwCanvas, 0, 0);

    // Step 4: Turn the isolated and blurred parts of the copy red
    const redCanvas = document.createElement('canvas');
    redCanvas.width = img.width;
    redCanvas.height = img.height;
    const redCtx = redCanvas.getContext('2d');

    // Draw the blurred and isolated parts onto the red canvas
    redCtx.drawImage(blurCanvas, 0, 0);

    // Set the red channel to maximum for the isolated and blurred parts
    const redImageData = redCtx.getImageData(0, 0, redCanvas.width, redCanvas.height);
    const redData = redImageData.data;
    for (let i = 0; i < redData.length; i += 4) {
        // If the pixel is non-black (isolated and blurred parts), set the red channel to maximum
        if (redData[i] !== 0 || redData[i + 1] !== 0 || redData[i + 2] !== 0) {
            let brightness = (redData[i] + redData[i + 1] + redData[i + 2]) / 3;
            redData[i] = Math.min(255, brightness + strength); // Set red channel to the brightness of that pixel
            redData[i + 1] = 0; // Set green channel to 0
            redData[i + 2] = 0; // Set blue channel to 0
        }
    }
    redCtx.putImageData(redImageData, 0, 0);

    // Step 5: Blur the isolated and red-colored parts again to create a smooth falloff
    const halationBlurCanvas = document.createElement('canvas');
    halationBlurCanvas.width = img.width;
    halationBlurCanvas.height = img.height;
    const halationBlurCtx = halationBlurCanvas.getContext('2d');
    halationBlurCanvas.width = img.width;
    halationBlurCanvas.height = img.height;
    halationBlurCtx.filter = 'blur(' + blurAmount + 'px)'; // Adjust the blur radius as needed
    halationBlurCtx.drawImage(redCanvas, 0, 0);

    // Create a new canvas for the final processed image
    const processedCanvas = document.createElement('canvas');
    processedCanvas.width = img.width;
    processedCanvas.height = img.height;
    const processedCtx = processedCanvas.getContext('2d');

    // Step 6: Composite the red copy over the original image using the "screen" blend mode
    // Draw the original image first
    processedCtx.drawImage(img, 0, 0);

    // Set the blending mode to "screen" and draw the red copy
    processedCtx.globalCompositeOperation = 'screen';
    processedCtx.drawImage(halationBlurCanvas, 0, 0);

    // Draw the final processed image onto the main canvas
    ctx.drawImage(processedCanvas, 0, 0);

    var endTime = performance.now();
    console.log('process image took ' + (endTime - startTime) + 'ms');

    // Enable download button
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.disabled = false;
    downloadBtn.addEventListener('click', function () {
        const dataURL = canvas.toDataURL('image/jpeg', 1); // Quality set to 1 (100%)
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'processed_image.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}


// Prevent default behavior for dragover event
document.getElementById('drop-area').addEventListener('dragover', function (event) {
    event.preventDefault();
});

// Handle drop event
document.getElementById('drop-area').addEventListener('drop', function (event) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
});

let debounceTimer;

// Update blur amount, strength, and brightness threshold when sliders are adjusted
document.getElementById('blurRange').addEventListener('input', function (event) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        blurAmount = parseInt(event.target.value);
        document.getElementById('blurValue').textContent = blurAmount;
        processImageWithPhoton();
    }, 100); // Adjust the delay as needed
});

document.getElementById('strengthRange').addEventListener('input', function (event) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        strength = parseInt(event.target.value);
        document.getElementById('strengthValue').textContent = strength;
        processImageWithPhoton();
    }, 100); // Adjust the delay as needed
});

document.getElementById('brightnessRange').addEventListener('input', function (event) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        brightnessThreshold = parseInt(event.target.value);
        document.getElementById('brightnessValue').textContent = brightnessThreshold;
        processImageWithPhoton();
    }, 100); // Adjust the delay as needed
});
