const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to fix a file
function fixFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    
    // Remove imports for Layout and PageWrapper if they exist
    content = content.replace(/import Layout from ['"].*?['"];?\s*/g, '');
    content = content.replace(/import PageWrapper from ['"].*?['"];?\s*/g, '');
    
    // Remove Layout and PageWrapper component definitions
    content = content.replace(/\/\/ (Define|Create) (Layout|PageWrapper) component.*\s*const (Layout|PageWrapper) = \(\{ children \}.*\) => \(\s*.*?\s*\);\s*/g, '');
    
    // Fix function return statements
    content = content.replace(/return\s*\(\s*(?:{|<PageWrapper.*?>|<div.*?>|<Layout.*?>|<>)?([\s\S]*?)(?:<\/PageWrapper>|<\/div>|<\/Layout>|<\/>)?\s*\)\s*;?/g, (match, inner) => {
      if (!inner.trim()) {
        return 'return null;';
      }
      
      // Try to clean up the inner content if it contains conditionals or fragments
      let cleanedInner = inner.trim();
      
      // Handle conditional rendering with ternary operators
      if (cleanedInner.startsWith('{') && (cleanedInner.includes(' ? ') || cleanedInner.includes(' && '))) {
        // Make sure the conditional rendering expressions are properly wrapped
        const fixedInner = cleanedInner
          .replace(/\?\s*\(\s*</, '? <')
          .replace(/\)\s*:\s*\(\s*</, ') : <')
          .replace(/\)\s*\)\s*;?$/, ')}');
          
        return `return (\n  <>\n    ${fixedInner}\n  </>\n);`;
      }
      
      // If starts with a <div> tag, wrap it properly
      if (cleanedInner.startsWith('<div')) {
        return `return (\n  ${cleanedInner}\n);`;
      }
      
      // For other jsx elements
      if (cleanedInner.startsWith('<')) {
        return `return (\n  ${cleanedInner}\n);`;
      }
      
      // Default case: wrap in a fragment
      return `return (\n  <>\n    ${cleanedInner}\n  </>\n);`;
    });
    
    // Fix useEffect return functions that were incorrectly modified
    content = content.replace(/return \(\s*<>\s*\n?\s*<\/>\s*\n?\s*\);=>/g, 'return () =>');
    
    // Fix arrow functions that were incorrectly modified
    content = content.replace(/\(e\)\s*=>\s*\(\s*<>\s*\n?\s*<\/>\s*\n?\s*\);=>/g, '(e) =>');
    content = content.replace(/\) =>\s*\(\s*<>\s*\n?\s*<\/>\s*\n?\s*\);=>/g, ') =>');
    
    // Fix incomplete/broken JSX in return statements
    content = content.replace(/return\s*\(\s*<div([^>]*)>\s*(<div[^>]*>.*?<\/div>)\s*<\/div>\s*\);/gs, 'return (\n  <div$1>\n    $2\n  </div>\n);');
    
    // Fix common patterns of broken return statements
    content = content.replace(/return\s*\(\s*<>\s*{([^}]*?)}\s*<\/>\s*\);/g, 'return (\n  <>\n    {$1}\n  </>\n);');
    
    // Fix unclosed div tags
    content = content.replace(/<div([^>]*)>\s*([^<]*?)(?!<\/div>)(\s*<\/[a-z]+>)/g, '<div$1>\n    $2\n  </div>$3');
    
    // Fix missing fragment closing tags
    content = content.replace(/<>\s*(.*?)(?!<\/>)(\s*<\/[a-z]+>)/g, '<>\n    $1\n  </>$2');
    
    // Fix syntax in useEffect hooks
    content = content.replace(/useEffect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)return\s+\(\s*<>\s*<\/>\s*\);\s*\}/g, 'useEffect(() => {$1return () => {};');
    
    // Only write back if changes were made
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

// Find all TypeScript React files in the app directory
const tsxFiles = glob.sync('app/**/*.tsx');

// Try to install glob if it doesn't exist
try {
  require.resolve('glob');
} catch (e) {
  console.log('Installing glob package...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
}

// Process each file
let fixedFiles = 0;
tsxFiles.forEach(file => {
  const fixed = fixFile(file);
  if (fixed) fixedFiles++;
});

console.log(`Done! Fixed ${fixedFiles} out of ${tsxFiles.length} files.`); 