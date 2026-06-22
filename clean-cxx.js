const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'android/app/.cxx');

try {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log('[Clean CXX] Successfully deleted android/app/.cxx cache folder.');
  } else {
    console.log('[Clean CXX] android/app/.cxx does not exist, skipping.');
  }
} catch (error) {
  console.error('[Clean CXX] Failed to delete cache folder:', error.message);
}
