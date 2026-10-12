/** Find a product by id, treating typed CLI input and stored ids consistently. */
export function findProduct (products, productId) {
  return products.find(product => String(product.id) === String(productId).trim())
}

/** Add a valid quantity to the cart without changing inventory before checkout. */
export function addToCart (products, cart, productId, quantity) {
  const product = findProduct(products, productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" was not found.`)
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a positive whole number.')
  }
  if (!Number.isFinite(product.price) || product.price < 0) {
    throw new Error('Product price must be a non-negative number.')
  }
  if (!Number.isInteger(product.quantityAvailable) || product.quantityAvailable < 0) {
    throw new Error('Product stock must be a non-negative whole number.')
  }

  const line = cart.find(item => String(item.productId) === String(product.id))
  const currentQuantity = line ? line.quantity : 0
  if (currentQuantity + quantity > product.quantityAvailable) {
    throw new Error(`Only ${product.quantityAvailable - currentQuantity} more unit(s) are available.`)
  }

  const newQuantity = currentQuantity + quantity
  const totalPrice = roundMoney(product.price * newQuantity)
  if (line) {
    line.quantity = newQuantity
    line.totalPrice = totalPrice
    return line
  }

  const newLine = { productId: product.id, quantity: newQuantity, totalPrice }
  cart.push(newLine)
  return newLine
}

/** Sum cart line totals, rounded to two decimal places. */
export function calculateCartTotal (cart) {
  return roundMoney(cart.reduce((total, line) => total + line.totalPrice, 0))
}

/** Complete a non-empty order atomically, updating stock and emptying the cart. */
export function checkout (products, cart) {
  if (cart.length === 0) {
    throw new Error('Your cart is empty.')
  }

  const quantitiesByProduct = new Map()
  for (const line of cart) {
    const product = findProduct(products, line.productId)
    if (!product) {
      throw new Error(`Product with id "${line.productId}" was not found.`)
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error('Cart quantities must be positive whole numbers.')
    }
    const totalQuantity = (quantitiesByProduct.get(product) ?? 0) + line.quantity
    quantitiesByProduct.set(product, totalQuantity)
    if (totalQuantity > product.quantityAvailable) {
      throw new Error(`Not enough stock for ${product.name}.`)
    }
  }

  const total = calculateCartTotal(cart)
  const purchasedItems = cart.map(line => ({ ...line }))
  for (const [product, quantity] of quantitiesByProduct) {
    product.quantityAvailable -= quantity
  }
  cart.length = 0
  return { total, purchasedItems }
}

/** Format product information for the text-based product list. */
export function formatProducts (products) {
  if (products.length === 0) return 'No products are available.'
  return products.map(product =>
    `${product.id}: ${product.name} - ${product.description} | $${product.price.toFixed(2)} | available: ${product.quantityAvailable}`
  ).join('\n')
}

function roundMoney (amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
