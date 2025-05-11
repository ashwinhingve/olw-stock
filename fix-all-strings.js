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

// Function to fix all string literals
async function fixAllStringLiterals(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace all HTML entity strings with normal quotes
    let modifiedContent = content;
    
    // Fix string literals in imports
    modifiedContent = modifiedContent
      // Fix string imports
      .replace(/from\s+&apos;([^&]+)&apos;/g, "from '$1'")
      .replace(/from\s+&quot;([^&]+)&quot;/g, 'from "$1"')
      // Fix dynamic imports
      .replace(/import\(&apos;([^&]+)&apos;\)/g, "import('$1')")
      .replace(/import\(&quot;([^&]+)&quot;\)/g, 'import("$1")')
      // Fix require statements
      .replace(/require\(&apos;([^&]+)&apos;\)/g, "require('$1')")
      .replace(/require\(&quot;([^&]+)"\)/g, 'require("$1")');
    
    // Fix JSX attribute values
    modifiedContent = modifiedContent
      .replace(/(\w+)="([^&]*)&quot;/g, '$1="$2"')
      .replace(/(\w+)=&apos;([^&]*)'/g, "$1='$2'");
    
    // Fix string literals in arrays and object literals
    modifiedContent = modifiedContent
      .replace(/'([^&]*)&apos;/g, "'$1'")
      .replace(/&quot;([^&]*)&quot;/g, '"$1"');
    
    // Fix HTML entities inside JSX
    modifiedContent = modifiedContent
      .replace(/className=(['"])([^'"]*?)(['"])/g, (match, q1, content, q2) => {
        // Don't replace entities in className values
        return match;
      });
    
    if (modifiedContent !== content) {
      await writeFile(filePath, modifiedContent, 'utf8');
      console.log(`Fixed string literals in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
async function fixAllStrings() {
  const rootDir = process.cwd();
  const files = await findFiles(rootDir);
  
  console.log(`Found ${files.length} JS/TS files to check`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    const fixed = await fixAllStringLiterals(file);
    if (fixed) fixedCount++;
  }
  
  console.log(`Fixed string literals in ${fixedCount} files`);
}

// Run the script
fixAllStrings().catch(console.error); 