const fs = require('fs');
const path = require('path');

// Files that need "use client" directive
const clientFiles = ['dist/app.js', 'dist/components.js'];

clientFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if "use client" is already at the beginning
    if (!content.startsWith('"use client"')) {
      // Add "use client" directive at the beginning
      content = '"use client";\n' + content;
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Added "use client" to ${file}`);
    } else {
      console.log(`${file} already has "use client"`);
    }
  } else {
    console.log(`${file} not found`);
  }
});