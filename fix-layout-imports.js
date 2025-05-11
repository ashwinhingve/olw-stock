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

// Function to find all files containing Layout component
async function findLayoutFiles(dir) {
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
        (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) &&
        entry.name !== 'Layout.tsx'
      ) {
        // Check if file contains Layout component
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('<Layout') || content.includes('from \'@/components/ui/Layout\'')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  await scan(dir);
  return files;
}

// Function to fix Layout JSX issues
async function fixLayoutJSX(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // First, check if there's an import statement for Layout
    const hasLayoutImport = /import\s+Layout\s+from\s+['"]@\/components\/ui\/Layout['"]/g.test(content);
    
    if (!hasLayoutImport) {
      console.log(`File ${filePath} uses Layout but doesn't import it. Skipping.`);
      return false;
    }
    
    // Replace the Layout component with a div if there are JSX issues
    let modifiedContent = content;
    
    // Check if there are files with direct Layout usage in JSX without import
    if (content.includes('<Layout>') && !hasLayoutImport) {
      modifiedContent = content.replace(/<Layout>/g, '<div className="layout-container">');
      modifiedContent = modifiedContent.replace(/<\/Layout>/g, '</div>');
      
      await writeFile(filePath, modifiedContent, 'utf8');
      console.log(`Fixed Layout usage in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
async function fixLayoutImports() {
  const rootDir = process.cwd();
  const layoutFiles = await findLayoutFiles(rootDir);
  
  console.log(`Found ${layoutFiles.length} files using Layout component`);
  
  let fixedCount = 0;
  
  for (const file of layoutFiles) {
    const fixed = await fixLayoutJSX(file);
    if (fixed) fixedCount++;
  }
  
  console.log(`Fixed Layout imports in ${fixedCount} files`);
}

// Run the script
fixLayoutImports().catch(console.error); 