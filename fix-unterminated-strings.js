const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Files to fix manually
const specificFiles = [
  'app/all-entries/page.tsx',
  'components/AccessControl.tsx',
  'components/ClientAuthProvider.tsx',
  'components/staff/StaffForm.tsx',
  'components/ui/Header.tsx'
];

// Main function to fix unterminated strings
async function fixUnterminatedStrings() {
  const rootDir = process.cwd();
  
  for (const relativeFilePath of specificFiles) {
    const filePath = path.join(rootDir, relativeFilePath);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`File doesn't exist: ${filePath}`);
        continue;
      }
      
      const content = await readFile(filePath, 'utf8');
      let modifiedContent = content;
      
      // Fix specific string issues based on the file
      if (filePath.includes('all-entries/page.tsx')) {
        // Fix the hover:bg-gray-50&apos; issue
        modifiedContent = content.replace(
          /hover:bg-gray-50&apos;/g, 
          "hover:bg-gray-50'"
        );
      } else if (filePath.includes('AccessControl.tsx')) {
        // Fix the &apos;Access decision:' issue
        modifiedContent = content.replace(
          /&apos;Access decision:'/g, 
          "'Access decision:'"
        );
      } else if (filePath.includes('ClientAuthProvider.tsx')) {
        // Fix the '/login&apos; issue
        modifiedContent = content.replace(
          /router\.push\('\/login&apos;\);/g, 
          "router.push('/login');"
        );
      } else if (filePath.includes('StaffForm.tsx')) {
        // Fix the 'Staff member created successfully&apos; issue
        modifiedContent = content.replace(
          /'Staff member created successfully&apos;/g, 
          "'Staff member created successfully'"
        );
      } else if (filePath.includes('Header.tsx')) {
        // Fix the 'easeInOut&apos; issue
        modifiedContent = content.replace(
          /ease: 'easeInOut&apos;/g, 
          "ease: 'easeInOut'"
        );
      }
      
      if (modifiedContent !== content) {
        await writeFile(filePath, modifiedContent, 'utf8');
        console.log(`Fixed unterminated strings in: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log('Completed fixing unterminated strings.');
}

// Run the script
fixUnterminatedStrings().catch(console.error); 