const fs = require('fs');
const path = require('path');

// Files to process
const filesToFix = [
  'app/accounting/expense/[id]/edit/page.tsx',
  'app/inventory/stock/[id]/edit/page.tsx',
  'app/parties/page.tsx',
  'app/purchase/invoice/page.tsx',
  'app/purchase/orders/page.tsx',
  'app/inventory/barcode/page.tsx',
  'app/inventory/items/page.tsx',
  'app/inventory/stock/page.tsx',
  'app/inventory/stock/[id]/page.tsx',
  'app/inventory/stock/new/page.tsx',
  'app/auth/error/page.tsx',
  'app/create-account/page.tsx',
  'app/help/page.tsx'
];

// Process each file
filesToFix.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove import for PageWrapper
    content = content.replace(/import PageWrapper from ['"]@\/components\/PageWrapper['"];?\s*/g, '');
    
    // Remove local PageWrapper component definition
    content = content.replace(/\/\/ (Create |Define )?PageWrapper component.*\s*const PageWrapper = \(\{ children \}.*\) => \(\s*.*\s*.*\s*\);\s*/g, '');
    
    // Fix the return statements: <PageWrapper>content</PageWrapper> -> content
    // Extract the entire return statement block
    const returnRegex = /return \(\s*<(?:PageWrapper|div).*?>\s*([\s\S]*?)\s*<\/(?:PageWrapper|div)>\s*\);/g;
    content = content.replace(returnRegex, function(match, p1) {
      // If p1 starts with a tag, we need to wrap it
      if (p1.trim().startsWith('<')) {
        return `return (${p1.trim()});`;
      } else {
        // For fragments or other constructs
        return `return (${p1});`;
      }
    });
    
    // Write the modified content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Done fixing component issues.'); 