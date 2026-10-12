import { describe, expect, it } from 'vitest'
import { addToCart, calculateCartTotal, checkout, findProduct, formatProducts } from '../src/cart.js'
import { runShoppingCart } from '../src/index.js'

function makeProducts () {
  return [
    { id: 1, name: 'Notebook', description: '100 pages', price: 3.5, quantityAvailable: 4 },
    { id: 2, name: 'Pen', description: 'Blue ink', price: 1.25, quantityAvailable: 10 }
  ]
}

describe('findProduct', () => {
  it('finds a product when the id matches', () => {
    expect(findProduct(makeProducts(), 1).name).toBe('Notebook')
  })

  it('returns undefined for an unknown id', () => {
    expect(findProduct(makeProducts(), 'missing')).toBeUndefined()
  })
})

describe('addToCart', () => {
  it('adds a product line with its quantity and line total', () => {
    const products = makeProducts()
    const cart = []
    addToCart(products, cart, '1', 2)
    expect(cart).toEqual([{ productId: 1, quantity: 2, totalPrice: 7 }])
    expect(products[0].quantityAvailable).toBe(4)
  })

  it('merges a repeated product into its existing line', () => {
    const products = makeProducts()
    const cart = []
    addToCart(products, cart, 1, 1)
    addToCart(products, cart, 1, 2)
    expect(cart).toEqual([{ productId: 1, quantity: 3, totalPrice: 10.5 }])
  })

  it('rejects a product id that does not exist without changing the cart', () => {
    const cart = []
    expect(() => addToCart(makeProducts(), cart, 99, 1)).toThrow(/not found/)
    expect(cart).toEqual([])
  })

  it.each([0, -1, 1.5, NaN, 'two', undefined])('rejects invalid quantity %s', quantity => {
    const cart = []
    expect(() => addToCart(makeProducts(), cart, 1, quantity)).toThrow(/positive whole number/)
    expect(cart).toEqual([])
  })

  it('rejects quantities above available stock, including quantities already in the cart', () => {
    const products = makeProducts()
    const cart = []
    addToCart(products, cart, 1, 3)
    expect(() => addToCart(products, cart, 1, 2)).toThrow(/available/)
    expect(cart).toEqual([{ productId: 1, quantity: 3, totalPrice: 10.5 }])
    expect(products[0].quantityAvailable).toBe(4)
  })
})

describe('calculateCartTotal', () => {
  it('returns zero for an empty cart', () => {
    expect(calculateCartTotal([])).toBe(0)
  })

  it('adds all line totals and rounds to cents', () => {
    const cart = [
      { productId: 1, quantity: 3, totalPrice: 10.5 },
      { productId: 2, quantity: 2, totalPrice: 2.5 }
    ]
    expect(calculateCartTotal(cart)).toBe(13)
  })
})

describe('checkout', () => {
  it('rejects an empty cart without changing inventory', () => {
    const products = makeProducts()
    expect(() => checkout(products, [])).toThrow(/empty/)
    expect(products[0].quantityAvailable).toBe(4)
  })

  it('returns the total, reduces stock, and clears the cart after success', () => {
    const products = makeProducts()
    const cart = []
    addToCart(products, cart, 1, 2)
    addToCart(products, cart, 2, 3)
    const order = checkout(products, cart)
    expect(order.total).toBe(10.75)
    expect(order.purchasedItems).toHaveLength(2)
    expect(products.map(product => product.quantityAvailable)).toEqual([2, 10 - 3])
    expect(cart).toEqual([])
  })

  it('leaves all inventory and cart data unchanged if any line is out of stock', () => {
    const products = makeProducts()
    const cart = [
      { productId: 1, quantity: 1, totalPrice: 3.5 },
      { productId: 2, quantity: 11, totalPrice: 13.75 }
    ]
    const originalCart = cart.map(item => ({ ...item }))
    expect(() => checkout(products, cart)).toThrow(/stock/)
    expect(products.map(product => product.quantityAvailable)).toEqual([4, 10])
    expect(cart).toEqual(originalCart)
  })

  it('checks combined demand if the cart contains repeated product lines', () => {
    const products = makeProducts()
    const cart = [
      { productId: 1, quantity: 3, totalPrice: 10.5 },
      { productId: 1, quantity: 2, totalPrice: 7 }
    ]
    expect(() => checkout(products, cart)).toThrow(/stock/)
    expect(products[0].quantityAvailable).toBe(4)
    expect(cart).toHaveLength(2)
  })
})

describe('formatProducts', () => {
  it('includes the product details and stock in the listing', () => {
    expect(formatProducts(makeProducts())).toContain('1: Notebook - 100 pages | $3.50 | available: 4')
  })

  it('explains when the product list is empty', () => {
    expect(formatProducts([])).toBe('No products are available.')
  })
})

describe('runShoppingCart', () => {
  it('loops after an invalid product and add action until the user quits', async () => {
    const inputs = ['not-an-id', '1', '2', 'quit']
    const messages = []
    await runShoppingCart({
      productList: makeProducts(),
      ask: async () => inputs.shift(),
      write: message => messages.push(message)
    })
    expect(messages.some(message => message.includes('not found'))).toBe(true)
    expect(messages).toContain('Added 2 Notebook(s) to the cart.')
    expect(messages).toContain('Cart total: $7.00')
    expect(messages).toContain('Goodbye!')
  })

  it('continues the loop after an empty checkout attempt', async () => {
    const inputs = ['checkout', 'quit']
    const messages = []
    await runShoppingCart({
      productList: makeProducts(),
      ask: async () => inputs.shift(),
      write: message => messages.push(message)
    })
    expect(messages).toContain('Your cart is empty.')
    expect(messages).toContain('Goodbye!')
  })

  it('ends the session after a successful checkout', async () => {
    const products = makeProducts()
    const inputs = ['2', '2', 'checkout']
    const messages = []
    await runShoppingCart({
      productList: products,
      ask: async () => inputs.shift(),
      write: message => messages.push(message)
    })
    expect(messages).toContain('Checkout complete. Total: $2.50')
    expect(products[1].quantityAvailable).toBe(8)
  })
})
