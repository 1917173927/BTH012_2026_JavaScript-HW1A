# Assignment 1 - Command Line Shopping Cart

A small Node.js command-line shop with inventory checks, a cart, checkout, and unit tests written with Vitest.

## Run locally

```sh
npm install
npm run tests
npm run start
```

The CLI accepts a product id, then a quantity. Enter `checkout` to finish a non-empty order or `quit` to leave without purchasing. An empty checkout reports the issue and returns to product selection.

## Run with Docker

Build the image after pushing the project to the configured public GitHub repository:

```sh
docker build --no-cache -t assignment1 .
docker run --rm -it assignment1
```

The Dockerfile clones the public GitHub repository configured for this assignment. Push the project to that repository before building the image, so it clones the latest submitted version.

## Design

- `src/cart.js` contains the pure product lookup, cart, total, checkout, and product-list formatting functions.
- `src/index.js` owns the readline interaction and prompt loop. The loop accepts injected `ask` and `write` functions, which allows predictable CLI-flow tests without a real terminal.
- `test/cart.test.js` covers valid behavior, errors, inventory updates, totals, and CLI flow.

Cart quantities are validated against available stock but inventory changes only after successful checkout. Repeated additions for one product are merged into one line. Checkout first validates every line, then updates stock and clears the cart.
