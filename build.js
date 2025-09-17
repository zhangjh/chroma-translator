// Build script for Chrome Translation Extension
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

const isDevelopment = process.argv.includes('--dev');
const isRelease = process.argv.includes('--release');

console.log(`Building Chrome Translation Extension (${isDevelopment ? 'development' : isRelease ? 'release' : 'production'} mode)...`);

async function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  await pipelineAsync(createReadStream(src), createWriteStream(dest));
}

async function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  try {
    if (isRelease) {
      console.log('Creating release package...');
      
      // Clean up root dist directory if it exists
      if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
        console.log('Cleaned up root dist directory');
      }
      
      // Create release directory
      const releaseDir = 'release';
      if (fs.existsSync(releaseDir)) {
        fs.rmSync(releaseDir, { recursive: true, force: true });
      }
      fs.mkdirSync(releaseDir);

      // Compile TypeScript directly to release/dist
      console.log('Compiling TypeScript to release/dist...');
      execSync(`npx tsc --outDir ${path.join(releaseDir, 'dist')}`, { stdio: 'inherit' });

      // Copy static files directly to dist directory
      const staticFiles = [
        { src: 'src/popup/popup.html', dest: 'dist/popup/popup.html' },
        { src: 'src/popup/popup.css', dest: 'dist/popup/popup.css' },
        { src: 'src/options/options.html', dest: 'dist/options/options.html' }, 
        { src: 'src/options/options.css', dest: 'dist/options/options.css' },
        { src: 'src/content/content.css', dest: 'dist/content/content.css' }
      ];

      const staticDirectories = [
        { src: 'src/icons', dest: 'dist/icons' }
      ];

      // Copy static files
      for (const file of staticFiles) {
        if (fs.existsSync(file.src)) {
          const destPath = path.join(releaseDir, file.dest);
          await copyFile(file.src, destPath);
          console.log(`Copied ${file.src} -> ${file.dest}`);
        }
      }

      // Copy static directories
      for (const dir of staticDirectories) {
        if (fs.existsSync(dir.src)) {
          await copyDirectory(dir.src, path.join(releaseDir, dir.dest));
          console.log(`Copied ${dir.src}/ -> ${dir.dest}/`);
        }
      }

      // Copy and modify manifest.json for release
      if (fs.existsSync('manifest.json')) {
        const manifestContent = fs.readFileSync('manifest.json', 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        // Manifest paths are already correct for the release structure
        // No need to modify paths since they already point to dist/ and src/
        
        // Write manifest to release directory
        fs.writeFileSync(path.join(releaseDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        console.log('Copied manifest.json');
      }

      // Copy README.md
      if (fs.existsSync('README.md')) {
        await copyFile('README.md', path.join(releaseDir, 'README.md'));
        console.log('Copied README.md');
      }

      // Create zip file for Chrome Web Store
      try {
        const archiver = require('archiver');
        const output = fs.createWriteStream('chrome-translation-extension-v1.0.0.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          console.log(`Release package created: chrome-translation-extension-v1.0.0.zip (${archive.pointer()} bytes)`);
        });

        archive.on('error', (err) => {
          throw err;
        });

        archive.pipe(output);
        archive.directory(releaseDir, false);
        await archive.finalize();
      } catch (error) {
        console.log('Note: Install archiver package to create zip file: npm install archiver');
        console.log('Release files are available in the "release" directory');
      }
    } else {
      // For development/production builds, use normal dist directory
      // Clean dist directory
      if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
      }

      // Compile TypeScript
      console.log('Compiling TypeScript...');
      execSync('npx tsc', { stdio: 'inherit' });
    }

    console.log('Build completed successfully!');
    
    if (!isRelease) {
      console.log('\nTo load the extension in Chrome:');
      console.log('1. Open Chrome and go to chrome://extensions/');
      console.log('2. Enable "Developer mode"');
      console.log('3. Click "Load unpacked" and select this directory');
    } else {
      console.log('\nRelease package ready!');
      console.log('- Upload chrome-translation-extension-v1.0.0.zip to Chrome Web Store');
      console.log('- Or use the "release" directory for manual installation');
    }
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

build();