const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files with known issues to fix
const specificFiles = [
  'app/accounting/cash-bank/page.tsx',
  'app/accounting/expense/[id]/edit/page.tsx',
  'app/accounting/expense/[id]/page.tsx',
  'app/accounting/expense/new/page.tsx',
  'app/accounting/expense/page.tsx',
  'app/all-entries/page.tsx'
];

// Function to fix a file
function fixFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return false;
    }
    
    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    
    // Remove PageWrapper component definitions
    content = content.replace(/\/\/\s*(?:Create|Define)\s+PageWrapper\s+component[\s\S]*?\(\s*children\s*\)\s*=>\s*\([\s\S]*?\);/g, '');
    
    // Remove PageWrapper imports
    content = content.replace(/import\s+PageWrapper\s+from\s+['"]@\/components\/PageWrapper['"];?\s*/g, '');
    
    // Replace PageWrapper usage in the return statement with a div
    content = content.replace(/<PageWrapper.*?>([\s\S]*?)<\/PageWrapper>/g, (match, innerContent) => {
      return innerContent;
    });
    
    // Fix broken return statements
    content = content.replace(/return\s*\(\s*<div/g, 'return (\n    <div');
    content = content.replace(/return\s*\(\s*<>/g, 'return (\n    <>');
    
    // Fix closing tags in return statements 
    content = content.replace(/<\/div>\s*\);/g, '</div>\n  );');
    content = content.replace(/<\/>\s*\);/g, '</>\n  );');
    
    // Fix arrow functions in event handlers
    content = content.replace(/onClick=\{\([\s\n]*\);=>/g, 'onClick={(e) =>');
    
    // Fix broken closing PageWrapper tags
    content = content.replace(/<\/PageWrapper>\s*\);/g, '  );');
    
    // Write the modified content back to the file
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
      return true;
    } else {
      console.log(`No changes needed for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Ensure we have glob installed
try {
  require.resolve('glob');
} catch (e) {
  console.log('Installing glob package...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
}

// Process the specific files with known issues
console.log('Fixing specific files with known issues:');
let fixedFiles = 0;
specificFiles.forEach(file => {
  const fixed = fixFile(file);
  if (fixed) fixedFiles++;
});

console.log(`\nDone! Fixed ${fixedFiles} out of ${specificFiles.length} files.`); 