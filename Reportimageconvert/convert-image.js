const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// Replace this with the exact name of your image file
const FILENAME = 'cover.jpg'; 
// ---------------------

const filePath = path.join(__dirname, FILENAME);

try {
    // 1. Read the file into a buffer
    const fileBuffer = fs.readFileSync(filePath);

    // 2. Get the file extension to ensure correct MIME type
    const ext = path.extname(FILENAME).slice(1).toLowerCase();
    
    // Map common extensions to MIME types
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'image/jpeg';

    // 3. Convert to Base64
    const base64String = fileBuffer.toString('base64');

    // 4. Create the full Data URI string for CSS
    const cssString = `data:${mimeType};base64,${base64String}`;

    // 5. Write to a text file for easy copying
    fs.writeFileSync('output.txt', cssString);

    console.log('✅ Success!');
    console.log(`📂 Converted "${FILENAME}" to Base64.`);
    console.log('📋 The string has been saved to "output.txt".');
    console.log('👉 Open output.txt, copy everything, and paste it into your CSS.');

} catch (error) {
    console.error('❌ Error:', error.message);
}