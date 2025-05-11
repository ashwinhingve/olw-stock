// Script to replace Layout component usage with a div
const fs = require('fs');
const path = require('path');

// Files/directories to ignore
const IGNORE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'out',
  'build',
  'dist',
  'public'
];

// Process a file to replace Layout component
function processFile(filePath) {
  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file imports Layout
    if (!content.includes('import Layout from') && !content.includes('<Layout>')) {
      return false;
    }
    
    console.log(`Processing: ${filePath}`);
    
    // Replace import statement
    let newContent = content.replace(/import\s+Layout\s+from\s+['"]@\/components\/ui\/Layout['"]\s*;?/g, '');
    
    // Add PageWrapper component definition if not already there
    if (!newContent.includes('const PageWrapper')) {
      // Find the position after imports but before the main component
      const componentPos = newContent.match(/export\s+default\s+function/);
      const hookPos = newContent.match(/const\s+\[\w+,\s*set\w+\]\s*=\s*useState/);
      const arrowPos = newContent.match(/const\s+\w+\s*=\s*\(\s*\)\s*=>/);
      
      let insertPos = 0;
      
      if (componentPos) {
        insertPos = componentPos.index;
      } else if (hookPos) {
        insertPos = hookPos.index;
      } else if (arrowPos) {
        insertPos = arrowPos.index;
      } else {
        // Just add after imports
        const lastImportMatch = Array.from(newContent.matchAll(/import .+?;/g)).pop();
        if (lastImportMatch) {
          insertPos = lastImportMatch.index + lastImportMatch[0].length + 1;
        }
      }
      
      // Insert PageWrapper component definition
      const pageWrapperDef = `
// PageWrapper component 
const PageWrapper = ({ children }) => (
  <div className="container mx-auto px-4 py-8">{children}</div>
);

`;
      
      newContent = 
        newContent.slice(0, insertPos) + 
        pageWrapperDef + 
        newContent.slice(insertPos);
    }
    
    // Replace Layout tags with PageWrapper
    newContent = newContent.replace(/<Layout>\s*/g, '<PageWrapper>\n');
    newContent = newContent.replace(/\s*<\/Layout>/g, '\n</PageWrapper>');
    
    // Write the modified content back to the file
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Recursively scan directory for files
function scanDirectory(dir) {
  let modifiedCount = 0;
  
  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const currentPath = path.join(currentDir, file);
      const stats = fs.statSync(currentPath);
      
      if (stats.isDirectory()) {
        if (!IGNORE_DIRS.includes(file)) {
          modifiedCount += scan(currentPath);
        }
      } else if (stats.isFile() && (currentPath.endsWith('.tsx') || currentPath.endsWith('.jsx'))) {
        if (processFile(currentPath)) {
          modifiedCount++;
        }
      }
    }
    
    return modifiedCount;
  }
  
  return scan(dir);
}

// Main execution
const rootDir = process.cwd();
console.log(`Scanning directory: ${rootDir}`);
const modifiedCount = scanDirectory(rootDir);
console.log(`Modified ${modifiedCount} files`); 