const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files with known issues to fix
const specificFiles = [
  'app/accounting/expense/[id]/edit/page.tsx',
  'app/accounting/expense/[id]/page.tsx',
  'app/accounting/expense/page.tsx',
  'app/all-entries/page.tsx',
  'app/dashboard/page.tsx'
];

// Function to fix a file by completely rewriting the return statement
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
    
    // Create a valid return statement wrapper
    content = content.replace(/return\s*\(\s*(.*?)(\s*\);|\s*\}\s*\)?;)/gs, (match, innerContent) => {
      // Create a string with the correct indentation and structure
      return `return (
    <div className="container mx-auto px-4 py-8">
${innerContent.trim().split('\n').map(line => '      ' + line.trim()).join('\n')}
    </div>
  );`;
    });
    
    // Fix any remaining arrow function syntax issues
    content = content.replace(/onClick=\{\([\s\n]*\);=>/g, 'onClick={(e) =>');
    content = content.replace(/onChange=\{\([\s\n]*\);=>/g, 'onChange={(e) =>');
    content = content.replace(/onSubmit=\{\([\s\n]*\);=>/g, 'onSubmit={(e) =>');
    
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