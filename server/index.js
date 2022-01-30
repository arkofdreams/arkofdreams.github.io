const express = require('express')
const path = require('path')
const app = express()
const port = 3000

app.use(express.static(path.resolve(__dirname, '../docs')));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
  process.argv.push('-i')
  process.argv.push(path.resolve(__dirname, '../docs/assets/styles/input.css'))
  process.argv.push('-o')
  process.argv.push(path.resolve(__dirname, '../docs/assets/styles/theme.css'))
  process.argv.push('--watch')
  
  require('tailwindcss/lib/cli')
})