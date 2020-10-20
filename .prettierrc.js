module.exports = {
    arrowParens: "avoid",
    trailingComma: "none",
    overrides: [
      {
        files: "*.ts",
        options: {
          parser: "typescript"
        }
      },
      {
        files: "*.tsx",
        options: {
          parser: "typescript"
        }
      }
    ]
  }
  