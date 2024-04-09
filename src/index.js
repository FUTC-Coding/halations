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

            processImageWithJimp();
        }
        img.src = reader.result;
    }
    reader.readAsDataURL(files[0]);
}

function processImageWithJimp() {
    var startTime = performance.now();
    let processedImage = new Jimp(img.src, function (err, image) {
        err ? console.log('image err' + err) : console.log('copy created and ready for use');

        image
            .greyscale()
            .scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                const brightness = (this.bitmap.data[idx] + this.bitmap.data[idx + 1] + this.bitmap.data[idx + 2]) / 3;
                if (brightness <= brightnessThreshold) {
                    this.bitmap.data[idx] = this.bitmap.data[idx + 1] = this.bitmap.data[idx + 2] = 0; // set all channels to 0 for this pixel
                } else {
                    this.bitmap.data[idx] = Math.min(255, brightness + strength); // Set red channel to the brightness of that pixel
                    this.bitmap.data[idx + 1] = 0; // set green to 0
                    this.bitmap.data[idx + 2] = 0; // set blue to 0
                }
            })
            .blur(blurAmount);

        return image;
    });
    
    Jimp.read(img.src).then(function(image) {
        image.composite(processedImage, 0, 0, { mode: Jimp.BLEND_SCREEN });
        const imageData = new ImageData(
            Uint8ClampedArray.from(image.bitmap.data),
            image.bitmap.width,
            image.bitmap.height
        );
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
    });

    var endTime = performance.now();
    console.log('process image with jimp took ' + (endTime - startTime) + 'ms');
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
        processImageWithJimp();
    }, 100); // Adjust the delay as needed
});

document.getElementById('strengthRange').addEventListener('input', function (event) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        strength = parseInt(event.target.value);
        document.getElementById('strengthValue').textContent = strength;
        processImageWithJimp();
    }, 100); // Adjust the delay as needed
});

document.getElementById('brightnessRange').addEventListener('input', function (event) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        brightnessThreshold = parseInt(event.target.value);
        document.getElementById('brightnessValue').textContent = brightnessThreshold;
        processImageWithJimp();
    }, 100); // Adjust the delay as needed
});
