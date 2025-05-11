const fs = require('fs');
const path = require('path');

// Files with specific issues we need to fix
const filesToFix = [
  'app/components/ui/ThemeProvider.tsx',
  'app/accounting/cash-bank/page.tsx',
  'app/accounting/expense/[id]/edit/page.tsx',
  'app/accounting/expense/[id]/page.tsx',
  'app/accounting/expense/new/page.tsx'
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
    
    console.log(`Processing ${filePath}...`);
    
    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (filePath === 'app/components/ui/ThemeProvider.tsx') {
      // Fix useEffect return statement
      content = content.replace(
        /return null;=> mediaQuery.removeEventListener\('change', handleChange\);/g,
        'return () => mediaQuery.removeEventListener(\'change\', handleChange);'
      );
    } else if (filePath === 'app/accounting/expense/[id]/edit/page.tsx') {
      // Fix the complex conditional rendering in return statement
      content = content.replace(
        /return \(\s*<>\s*{isLoading \? .*?<\/>\s*\);.*?loadError \? \(/gs,
        `return (
    <>
      {isLoading ? (
        <div className="w-full flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : loadError ? (`
      );
    } else {
      // For other files, fix the indentation in the return statement
      content = content.replace(
        /return \(\s*<div/g,
        'return (\n    <div'
      );
      
      // Make sure the return statement is properly closed
      content = content.replace(
        /\s*<\/div>\s*\);/g,
        '\n  </div>\n);'
      );
    }
    
    // Write the modified content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Done fixing specific files.'); 