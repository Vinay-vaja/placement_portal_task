import https from 'https';
import { config } from '../src/config/env.js';
import cloudinary from '../src/config/cloudinary.js';
import prisma from '../src/config/prisma.js';

async function verifyAll() {
  const apps = await prisma.application.findMany({});
  console.log(`Found ${apps.length} applications in database.`);

  for (const app of apps) {
    if (!app.resumeUrl) continue;
    console.log(`\nVerifying App ID: ${app.id}`);
    console.log(`Stored resumeUrl: ${app.resumeUrl}`);

    const urlParts = app.resumeUrl.split('/upload/');
    if (urlParts.length !== 2) {
      console.log('Invalid Cloudinary URL structure!');
      continue;
    }

    const isRaw = urlParts[0].endsWith('/raw');
    const resourceType = isRaw ? 'raw' : 'image';
    const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
    const extMatch = pathAfterUpload.match(/\.([^.]+)$/);
    const format = isRaw ? (extMatch ? extMatch[1] : '') : (extMatch ? extMatch[1] : 'pdf');
    const publicId = isRaw ? pathAfterUpload : pathAfterUpload.replace(/\.[^.]+$/, '');

    const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: 'upload',
      attachment: false,
    });

    console.log(`Generated Private Download URL: ${downloadUrl}`);

    await new Promise((resolve, reject) => {
      https.get(downloadUrl, (res) => {
        console.log(`HTTP Status: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log(`Content-Length: ${res.headers['content-length']}`);
        let bytesReceived = 0;
        let pdfHeader = '';
        res.on('data', (chunk) => {
          bytesReceived += chunk.length;
          if (!pdfHeader) pdfHeader = chunk.toString('utf8', 0, 5);
        });
        res.on('end', () => {
          console.log(`Total Bytes Received: ${bytesReceived}`);
          console.log(`PDF Header: "${pdfHeader}" (Should be "%PDF-")`);
          if (pdfHeader.startsWith('%PDF')) {
            console.log('SUCCESS: Valid PDF Document retrieved!');
          } else {
            console.log('WARNING: Non-PDF header received!');
          }
          resolve();
        });
        res.on('error', reject);
      });
    });
  }

  await prisma.$disconnect();
}

verifyAll().catch(console.error);
