const fs = require('fs');
const file = 'd:\\PROJECTS\\Super market\\mobile-app\\src\\components\\ReceiptModal.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/ActivityIndicator,,/g, 'ActivityIndicator,');
fs.writeFileSync(file, content, 'utf8');
console.log('✅ Fixed double comma in ReceiptModal.tsx!');
