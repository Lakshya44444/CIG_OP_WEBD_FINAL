import sharp from "sharp";

const svg = (size, rx) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="0.5" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
  <text x="${size/2}" y="${size*0.62}" font-size="${size*0.47}" text-anchor="middle" fill="white">📸</text>
</svg>`;

await sharp(Buffer.from(svg(192, 40))).png().toFile("public/icon-192.png");
console.log("✅ icon-192.png created");

await sharp(Buffer.from(svg(512, 100))).png().toFile("public/icon-512.png");
console.log("✅ icon-512.png created");
