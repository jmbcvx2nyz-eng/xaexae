// Script to convert PNG frames to WebP format
// Requires: npm install sharp

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp module not found.');
  console.log('Please install it by running: npm install sharp');
  process.exit(1);
}

const sequenceDir = path.join(__dirname, 'sequence');
const TOTAL_FRAMES = 240;

async function convertFrames() {
  console.log('Starting conversion to WebP...');
  let converted = 0;
  let errors = 0;

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const frameNum = i.toString().padStart(3, '0');
    const pngPath = path.join(sequenceDir, `ezgif-frame-${frameNum}.png`);
    const webpPath = path.join(sequenceDir, `ezgif-frame-${frameNum}.webp`);

    // Skip if WebP already exists
    if (fs.existsSync(webpPath)) {
      console.log(`Skipping frame ${frameNum} (WebP already exists)`);
      continue;
    }

    // Check if PNG exists
    if (!fs.existsSync(pngPath)) {
      console.log(`Warning: PNG file not found for frame ${frameNum}`);
      errors++;
      continue;
    }

    try {
      await sharp(pngPath)
        .webp({ quality: 85, effort: 6 }) // Good balance of quality and file size
        .toFile(webpPath);
      
      converted++;
      if (converted % 10 === 0) {
        console.log(`Converted ${converted} frames...`);
      }
    } catch (error) {
      console.error(`Error converting frame ${frameNum}:`, error.message);
      errors++;
    }
  }

  console.log(`\nConversion complete!`);
  console.log(`Converted: ${converted} frames`);
  console.log(`Errors: ${errors} frames`);
  console.log(`\nWebP files are now ready. The scrollytelling will use them automatically.`);
}

convertFrames().catch(console.error);
