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
    
    // Replace usage of PageWrapper in return statements
    content = content.replace(/<PageWrapper.*?>\s*(.*?)\s*<\/PageWrapper>/gs, (match, p1) => {
      return `<div className="container mx-auto px-4 py-8">\n      ${p1}\n    </div>`;
    });
    
    // Write the modified content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Done fixing component issues.'); 