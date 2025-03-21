# html-tailwind-javascript

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

Available scripts:

- `color`: Generates Tailwind CSS color classes.

  ```bash
  bun run tailwind-color-generator.ts
  ```

- `build:ts`: Compiles TypeScript files.

  ```bash
  bun run build.ts
  ```

- `build:css`: Builds and minifies the CSS using Tailwind CSS.

  ```bash
  tailwindcss -i ./src/globals.css -o ./dist/globals.min.css --minify
  ```

- `build`: Runs both the TypeScript and CSS build processes.

  ```bash
  bun run build:ts && bun run build:css
  ```

- `watch:ts`: Watches and recompiles TypeScript files on changes.

  ```bash
  bun run build.ts --watch
  ```

- `watch:css`: Watches and recompiles CSS files on changes.

  ```bash
  tailwindcss -i ./src/globals.css -o ./dist/globals.css --watch
  ```

- `serve`: Serves the `dist` directory.

  ```bash
  serve dist
  ```

- `dev`: Runs the development server with concurrent watching of TypeScript and CSS files.
  ```bash
  concurrently "bun run app.ts" "bun run watch:css" "bun run watch:ts"
  ```

This project was created using `bun init` in bun v1.1.28. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
