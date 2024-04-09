import 'jimp';
const cachedJpegDecoder = Jimp.decoders['image/jpeg']
Jimp.decoders['image/jpeg'] = (data) => {
    const userOpts = { maxMemoryUsageInMB: 1024 }
    return cachedJpegDecoder(data, userOpts)
}

self.addEventListener("message", function(e) {
    var startTime = performance.now();
    let processedImage = new Jimp(e.data.src, function (err, image) {
        err ? console.log('image err' + err) : console.log('copy created and ready for use');

        image
            .greyscale()
            .scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                const brightness = (this.bitmap.data[idx] + this.bitmap.data[idx + 1] + this.bitmap.data[idx + 2]) / 3;
                if (brightness <= e.data.brightnessThreshold) {
                    this.bitmap.data[idx] = this.bitmap.data[idx + 1] = this.bitmap.data[idx + 2] = 0; // set all channels to 0 for this pixel
                } else {
                    this.bitmap.data[idx] = Math.min(255, brightness + e.data.strength); // Set red channel to the brightness of that pixel
                    this.bitmap.data[idx + 1] = 0; // set green to 0
                    this.bitmap.data[idx + 2] = 0; // set blue to 0
                }
            })
            .blur(e.data.blurAmount);

        return image;
    });

    Jimp.read(e.data.src).then(function(image) {
        image
            .composite(processedImage, 0, 0, { mode: Jimp.BLEND_SCREEN })
            .getBase64(Jimp.MIME_JPEG, function (err, src) {
                self.postMessage(src); // message the main thread
            });
    });

    var endTime = performance.now();
    console.log('process image with jimp took ' + (endTime - startTime) + 'ms');
})