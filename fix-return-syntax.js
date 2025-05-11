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
    
    // Fix return statements that have broken syntax
    // Find all return statements
    const returnRegex = /return\s*\(\s*(?:(?:<PageWrapper.*?>|<div.*?>))?([^]*?)(?:<\/PageWrapper>|<\/div>)?\s*\)\s*;?/gs;
    
    content = content.replace(returnRegex, (match, p1) => {
      // Check if it's already a JSX fragment or element and correctly formatted
      if (p1.trim().startsWith('<>') || p1.trim().startsWith('<React.Fragment>')) {
        return `return (${p1});`;
      }
      
      // Check if it starts with a ternary or conditional expression
      if (p1.trim().startsWith('{') && (p1.includes(' ? ') || p1.includes(' && '))) {
        return `return (\n    <>\n      ${p1}\n    </>\n  );`;
      }
      
      // If it's starting with a JSX element (tag)
      if (p1.trim().startsWith('<')) {
        return `return (\n    ${p1}\n  );`;
      }
      
      // For other content, wrap it in a fragment
      return `return (\n    <>\n      ${p1}\n    </>\n  );`;
    });
    
    // Write the modified content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Done fixing return syntax in all files.'); 