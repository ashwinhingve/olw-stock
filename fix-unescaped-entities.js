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

// Function to fix unescaped entities in a file
async function fixUnescapedEntities(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace common unescaped entities
    const replacements = [
      { pattern: /(\W|^)"(\w)/g, replacement: '$1"$2' },
      { pattern: /(\w)"(\W|$)/g, replacement: '$1"$2' },
      { pattern: /(\W|^)'(\w)/g, replacement: '$1'$2' },
      { pattern: /(\w)'(\W|$)/g, replacement: '$1'$2' },
      { pattern: /(\s|>)"/g, replacement: '$1"' },
      { pattern: /"(\s|<)/g, replacement: '"$1' },
      { pattern: /(\s|>)'/g, replacement: '$1'' },
      { pattern: /'(\s|<)/g, replacement: ''$1' },
      // Common contractions
      { pattern: /\bdon't\b/g, replacement: 'don't' },
      { pattern: /\bwon't\b/g, replacement: 'won't' },
      { pattern: /\bcan't\b/g, replacement: 'can't' },
      { pattern: /\bisn't\b/g, replacement: 'isn't' },
      { pattern: /\baren't\b/g, replacement: 'aren't' },
      { pattern: /\bdidn't\b/g, replacement: 'didn't' },
      { pattern: /\bhaven't\b/g, replacement: 'haven't' },
      { pattern: /\bhasn't\b/g, replacement: 'hasn't' },
      { pattern: /\bwouldn't\b/g, replacement: 'wouldn't' },
      { pattern: /\bcouldn't\b/g, replacement: 'couldn't' },
      { pattern: /\bshouldn't\b/g, replacement: 'shouldn't' },
      { pattern: /\bI'm\b/g, replacement: 'I'm' },
      { pattern: /\bI'll\b/g, replacement: 'I'll' },
      { pattern: /\bI've\b/g, replacement: 'I've' },
      { pattern: /\bI'd\b/g, replacement: 'I'd' },
      { pattern: /\byou're\b/g, replacement: 'you're' },
      { pattern: /\byou'll\b/g, replacement: 'you'll' },
      { pattern: /\byou've\b/g, replacement: 'you've' },
      { pattern: /\byou'd\b/g, replacement: 'you'd' },
      { pattern: /\bhe's\b/g, replacement: 'he's' },
      { pattern: /\bshe's\b/g, replacement: 'she's' },
      { pattern: /\bit's\b/g, replacement: 'it's' },
      { pattern: /\bwe're\b/g, replacement: 'we're' },
      { pattern: /\bthey're\b/g, replacement: 'they're' },
      { pattern: /\bthat's\b/g, replacement: 'that's' },
      { pattern: /\bwhat's\b/g, replacement: 'what's' },
      { pattern: /\bwhere's\b/g, replacement: 'where's' },
      { pattern: /\bwho's\b/g, replacement: 'who's' },
      { pattern: /\bthere's\b/g, replacement: 'there's' },
      { pattern: /\blet's\b/g, replacement: 'let's' }
    ];
    
    let modifiedContent = content;
    for (const { pattern, replacement } of replacements) {
      modifiedContent = modifiedContent.replace(pattern, replacement);
    }
    
    if (modifiedContent !== content) {
      await writeFile(filePath, modifiedContent, 'utf8');
      console.log(`Fixed unescaped entities in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function to fix unescaped entities
async function fixEntitiesInFiles() {
  const rootDir = process.cwd();
  const jsxFiles = await findJSXFiles(rootDir);
  
  console.log(`Found ${jsxFiles.length} JSX/TSX files to check`);
  
  let fixedCount = 0;
  
  for (const file of jsxFiles) {
    const fixed = await fixUnescapedEntities(file);
    if (fixed) fixedCount++;
  }
  
  console.log(`Fixed unescaped entities in ${fixedCount} files`);
}

// Run the script
fixEntitiesInFiles().catch(console.error); 