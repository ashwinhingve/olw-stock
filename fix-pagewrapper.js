const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
  'app/accounting/expense/[id]/edit/page.tsx',
  'app/inventory/stock/[id]/edit/page.tsx',
  'app/parties/page.tsx',
  'app/purchase/invoice/page.tsx',
  'app/purchase/orders/page.tsx'
];

// Process each file
filesToProcess.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if the file has PageWrapper component without proper typing
    const hasPageWrapperWithoutTyping = /const\s+PageWrapper\s*=\s*\(\{\s*children\s*\}\)\s*=>/i.test(content) || 
                                       /const\s+PageWrapper\s*=\s*\(\{\s*children\s*\}(?!\s*:\s*\{\s*children\s*:\s*React\.ReactNode\s*\}))/i.test(content);
    
    if (hasPageWrapperWithoutTyping) {
      // Replace PageWrapper definition with the typed version
      content = content.replace(
        /const\s+PageWrapper\s*=\s*\(\{\s*children\s*\}\)\s*=>/i,
        'const PageWrapper = ({ children }: { children: React.ReactNode }) =>'
      );
      
      // Write back to file
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed PageWrapper in: ${filePath}`);
    } else {
      console.log(`⏭️ No untyped PageWrapper found in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Done fixing PageWrapper components.'); 