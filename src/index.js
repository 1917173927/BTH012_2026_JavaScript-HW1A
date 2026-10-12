import readline from 'node:readline'
import { addToCart, calculateCartTotal, checkout, formatProducts } from './cart.js'

export const products = [
  { id: 1, name: 'Notebook', description: 'Ruled paper, 100 pages', price: 3.5, quantityAvailable: 12 },
  { id: 2, name: 'Pen', description: 'Blue ink ballpoint pen', price: 1.25, quantityAvailable: 20 },
  { id: 3, name: 'Water bottle', description: 'Reusable, 500 ml', price: 8.99, quantityAvailable: 5 }
]

/** Run the prompt loop; injected input/output callbacks keep it easy to test. */
export async function runShoppingCart ({ productList, ask, write }) {
  const cart = []
  write('Welcome to the command-line shop!')

  while (true) {
    write('\nProducts:\n' + formatProducts(productList))
    const selection = (await ask('Enter a product id, "checkout", or "quit": ')).trim()
    const command = selection.toLowerCase()

    if (command === 'quit') {
      write('Goodbye!')
      return
    }

    if (command === 'checkout') {
      try {
        const order = checkout(productList, cart)
        write(`Checkout complete. Total: $${order.total.toFixed(2)}`)
        return
      } catch (error) {
        write(error.message)
        write(`Cart total: $${calculateCartTotal(cart).toFixed(2)}`)
        continue
      }
    }

    const product = productList.find(item => String(item.id) === selection)
    if (!product) {
      write(`Product with id "${selection}" was not found.`)
      write(`Cart total: $${calculateCartTotal(cart).toFixed(2)}`)
      continue
    }

    const quantityInput = await ask(`Quantity for ${product.name}: `)
    const quantity = Number(quantityInput.trim())
    try {
      addToCart(productList, cart, selection, quantity)
      write(`Added ${quantity} ${product.name}(s) to the cart.`)
    } catch (error) {
      write(error.message)
    }
    write(`Cart total: $${calculateCartTotal(cart).toFixed(2)}`)
  }
}

/** Start the real terminal interface and close readline when the session ends. */
export async function main () {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = query => new Promise(resolve => terminal.question(query, resolve))
  try {
    await runShoppingCart({ productList: products, ask, write: message => console.log(message) })
  } finally {
    terminal.close()
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main()
}
