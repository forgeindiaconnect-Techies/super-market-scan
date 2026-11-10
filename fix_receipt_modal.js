const fs = require('fs');
const filePath = 'd:\\PROJECTS\\Super market\\mobile-app\\src\\components\\ReceiptModal.tsx';

let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('Platform,')) {
  content = content.replace(
    /import\s*\{\s*([\s\S]*?)\s*\}\s*from\s*["']react-native["'];/,
    (match, imports) => {
      if (imports.includes('Platform')) return match;
      return `import {\n  ${imports.trim()},\n  Platform,\n} from "react-native";`;
    }
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Platform successfully added to react-native imports in ReceiptModal.tsx');
} else {
  console.log('Platform is already imported.');
}
