/* eslint-disable no-inner-declarations */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const path = require('path');
const fs = require('fs');

const parts = ['api', 'cli', 'core', 'database', 'http', 'websocket'];

const folders = [{
  path: 'src',
  subFolders: [{
    path: 'interfaces',
    subFolders: [],
  }],
}, {
  path: 'tests',
  subFolders: [],
}];

const files = [{
  name: '.prettierc',
  content: `{
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "all",
  "printWidth": 100
}`,
}, {
  name: 'tsconfig.json',
  content: `{  {
      "allowSyntheticDefaultImports": true,
      "compilerOptions": {
        "lib": ["ES6", "DOM", "ES2015", "ES2017"],
        "esModuleInterop": true,
        "target": "ES6",
        "module": "commonjs",
        "removeComments": true,
        "outDir": "build",
        "types": ["node", "chalk"]
      },
      "exclude": ["node_modules", "build", "tsconfig.json"]
    }
  
}`,
}, {
  name: '.eslintignore',
  content: `build/**/*`,
}, {
  name: '.eslintrc',
  content: `{
  "rules": {
    "@typescript-eslint/ban-ts-ignore": ["off"],
    "@typescript-eslint/explicit-function-return-type": ["error"],
    "@typescript-eslint/interface-name-prefix": ["off"],
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/no-unused-expressions": ["error"],
    "@typescript-eslint/no-var-requires": ["off"],
    "@typescript-eslint/no-use-before-define": ["error"],
    "array-bracket-spacing": ["warn", "never"],
    "capIsNew": ["off"],
    "comma-dangle": ["error", "always-multiline"],
    "computed-property-spacing": "warn",
    "default-case": ["error", { "commentPattern": "^no default$" }],
    "eol-last": ["error", "always"],
    "indent": ["warn", 2, {"SwitchCase": 1}],
    "keyword-spacing": [
      "warn",
      {
        "before": true,
        "after": true
      }
    ],
    "linebreak-style": ["error", "unix"],
    "max-len": [
      "warn",
      {
        "code": 180,
        "ignoreComments": true,
        "ignoreUrls": true
      }
    ],
    "new-cap": 0,
    "no-async-promise-executor": ["off"],
    "no-await-in-loop": "warn",
    "no-caller": 2,
    "no-compare-neg-zero": "error",
    "no-cond-assign": [2, "except-parens"],
    "no-empty-pattern": ["off"],
    "no-template-curly-in-string": "error",
    "no-unsafe-negation": "error",
    "no-undef": ["error"],
    "no-unused-vars": 1,
    "no-empty": [
      "error",
      {
        "allowEmptyCatch": true
      }
    ],
    "no-console": "off",
    "no-multi-spaces": "warn",
    "no-use-before-define": [
      2,
      {
        "functions": false,
        "classes": false,
        "variables": false
      }
    ],
    "no-var": ["off"],
    "no-prototype-builtins": ["off"],
    "object-curly-spacing": ["error", "always"],
    "prefer-const": [
      "warn",
      {
        "destructuring": "all"
      }
    ],
    "quotes": ["error", "single", { "allowTemplateLiterals": true }],
    "strict": ["error", "global"],
    "semi": ["error", "always"],
    "spaced-comment": ["warn", "always"],
    "sort-keys": ["off"],
    "space-before-function-paren": ["off"],
    "space-infix-ops": "warn"
  },
  "env": {
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "extends": [
    "standard",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "globals": {},
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "plugins": ["prettier", "@typescript-eslint"]
}`,
}, {
  name: 'src/index.ts',
  content: '',
}, {
  name: 'src/interfaces/index.ts',
  content: '',
},
];

for (const part of parts) {
  function createFolder(dir, thePath) {
    if (!fs.existsSync(path.join(__dirname, '..', '..', '..', part, thePath))) {
      fs.mkdirSync(path.join(__dirname, '..', '..', '..', part, thePath));
    }

    fs.writeFileSync(path.join(__dirname, '..', '..', '..', part, thePath, '.gitkeep'), '', { encoding: 'utf8' });

    for (var i = 0; i < dir.subFolders.length; i++) {
      createFolder(dir.subFolders[i], path.join(thePath, dir.subFolders[i].path));
    }
  }

  for (var i = 0; i < folders.length; i++) {
    createFolder(folders[i], folders[i].path);
  }

  // eslint-disable-next-line no-redeclare
  for (var i = 0; i < files.length; i++) {
    fs.writeFileSync(path.join(__dirname, '..', '..', '..', part, files[i].name), files[i].content, { encoding: 'utf8' });
  }
}
