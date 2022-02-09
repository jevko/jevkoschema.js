import {renameSync, existsSync} from 'fs'

const rename = (name) => {
  if (existsSync(`${name}.old.js`) === false) {
    renameSync(`${name}.js`, `${name}.old.js`)
    console.log(`renamed ${name}.js -> ${name}.old.js`)
    renameSync(`${name}.node.js`, `${name}.js`)
    console.log(`renamed ${name}.node.js -> ${name}.js`)
  } else {
    renameSync(`${name}.js`, `${name}.node.js`)
    console.log(`renamed ${name}.js -> ${name}.node.js`)
    renameSync(`${name}.old.js`, `${name}.js`)
    console.log(`renamed ${name}.old.js -> ${name}.js`)
  }
}

rename('deps')
rename('devDeps')