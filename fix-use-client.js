const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Files to ignore
const ignoreDirs = [
  'node_modules',
  '.next',
  'out',
  'dist',
  'build',
  'public'
];

// Function to find all JSX/TSX files
async function findJSXFiles(dir) {
  const files = [];
  
  async function scan(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        if (!ignoreDirs.includes(entry.name)) {
          await scan(fullPath);
        }
      } else if (
        entry.isFile() && 
        (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx'))
      ) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

// Function to fix 'use client' directive
async function fixUseClientDirective(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace escaped 'use client' directive with the proper version
    let modifiedContent = content.replace(/'use client'/g, "'use client'");
    
    if (modifiedContent !== content) {
      await writeFile(filePath, modifiedContent, 'utf8');
      console.log(`Fixed 'use client' directive in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
async function fixUseClientDirectives() {
  const rootDir = process.cwd();
  const jsxFiles = await findJSXFiles(rootDir);
  
  console.log(`Found ${jsxFiles.length} JSX/TSX files to check`);
  
  let fixedCount = 0;
  
  for (const file of jsxFiles) {
    const fixed = await fixUseClientDirective(file);
    if (fixed) fixedCount++;
  }
  
  console.log(`Fixed 'use client' directives in ${fixedCount} files`);
}

// Run the script
fixUseClientDirectives().catch(console.error); 