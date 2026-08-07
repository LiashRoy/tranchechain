const fs = require('fs');
fs.appendFileSync('src/index.css', `\n
/* Hide number input spin buttons */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
`);
console.log('Appended to index.css');
