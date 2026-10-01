import https from 'https';
import { config } from '../src/config/env.js';
import cloudinary from '../src/config/cloudinary.js';
import prisma from '../src/config/prisma.js';

async function test() {
  const apps = await prisma.application.findMany({ take: 5 });
  console.log('Found applications:', apps.map(a => ({ id: a.id, resumeUrl: a.resumeUrl })));

  for (const app of apps) {
    if (!app.resumeUrl) continue;
    console.log('\nTesting application:', app.id);
    console.log('URL:', app.resumeUrl);

    // Test 1: Direct GET
    await new Promise((resolve) => {
      https.get(app.resumeUrl, (res) => {
        console.log('1. Direct GET status:', res.statusCode, res.headers['x-cld-error'] || '');
        resolve();
      });
    });

    // Test 2: GET with Basic Auth
    const authHeader = 'Basic ' + Buffer.from(config.cloudinaryApiKey + ':' + config.cloudinaryApiSecret).toString('base64');
    await new Promise((resolve) => {
      https.get(app.resumeUrl, { headers: { 'Authorization': authHeader } }, (res) => {
        console.log('2. Basic Auth GET status:', res.statusCode, res.headers['content-type'], res.headers['x-cld-error'] || '');
        resolve();
      });
    });

    // Test 3: Parse & Private Download URL via Cloudinary SDK
    const urlParts = app.resumeUrl.split('/upload/');
    if (urlParts.length === 2) {
      const isRaw = urlParts[0].endsWith('/raw');
      const resourceType = isRaw ? 'raw' : 'image';
      const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
      const extMatch = pathAfterUpload.match(/\.([^.]+)$/);
      const format = extMatch ? extMatch[1] : (isRaw ? '' : 'pdf');
      const publicId = isRaw ? pathAfterUpload : pathAfterUpload.replace(/\.[^.]+$/, '');

      try {
        const privateUrl = cloudinary.utils.private_download_url(publicId, format, {
          resource_type: resourceType,
          type: 'upload',
          attachment: false
        });
        console.log('3. Generated private_download_url:', privateUrl);
        await new Promise((resolve) => {
          https.get(privateUrl, (res) => {
            console.log('3. Private Download URL status:', res.statusCode, res.headers['content-type'], res.headers['x-cld-error'] || '');
            resolve();
          });
        });
      } catch (e) {
        console.log('3. Private download error:', e.message);
      }

      // Test 4: Cloudinary API Download / Admin API asset URL
      try {
        const apiResourceUrl = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}`;
        await new Promise((resolve) => {
          https.get(apiResourceUrl, { headers: { 'Authorization': authHeader } }, (res) => {
            console.log('4. API Resource endpoint status:', res.statusCode);
            resolve();
          });
        });
      } catch (e) {
        console.log('4. API resource error:', e.message);
      }
    }
  }

  await prisma.$disconnect();
}

test().catch(console.error);
