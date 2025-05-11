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

// Function to find all TypeScript/JavaScript files
async function findFiles(dir) {
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
        (entry.name.endsWith('.js') || 
         entry.name.endsWith('.jsx') || 
         entry.name.endsWith('.ts') || 
         entry.name.endsWith('.tsx'))
      ) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

// Function to fix import string literals
async function fixImportStringLiterals(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Find import statements with escaped entities
    const importRegex = /import.*from\s+&apos;([^&]+)'/g;
    const importWithJsonRegex = /import\s+(\w+)\s+=\s+require\('(.+?)'\)/g;
    
    // Replace with proper quotes
    let modifiedContent = content
      .replace(importRegex, (match, importPath) => {
        return match.replace(`'${importPath}'`, `'${importPath}'`);
      })
      .replace(importWithJsonRegex, (match, varName, importPath) => {
        return match.replace(`'${importPath}'`, `'${importPath}'`);
      });
      
    // Fix dynamic imports
    modifiedContent = modifiedContent.replace(/import\('(.+?)&apos;\)/g, "import('$1')");
    
    if (modifiedContent !== content) {
      await writeFile(filePath, modifiedContent, 'utf8');
      console.log(`Fixed import strings in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
async function fixImports() {
  const rootDir = process.cwd();
  const files = await findFiles(rootDir);
  
  console.log(`Found ${files.length} JS/TS files to check`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    const fixed = await fixImportStringLiterals(file);
    if (fixed) fixedCount++;
  }
  
  console.log(`Fixed import strings in ${fixedCount} files`);
}

// Run the script
fixImports().catch(console.error); 