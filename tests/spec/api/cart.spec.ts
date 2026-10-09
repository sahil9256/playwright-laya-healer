import { test, expect } from '../../../setup/api/fixtures.ts';

test.describe('API Cart', () => {
  test('create cart and add product', async ({ cartHelper, productHelper }) => {
    // 1. Create cart
    const createCartResponse = await cartHelper.createCartResponse();
    expect(createCartResponse.status()).toBe(201);

    const cart = await createCartResponse.json();
    expect(cart).toHaveProperty('id');
    const cartId = cart.id;
    expect(typeof cartId).toBe('string');

    // 2. Fetch sample product to add
    const productsData = await productHelper.getProducts();
    expect(productsData.data.length).toBeGreaterThan(0);
    const targetProduct = productsData.data[0];
    const quantity = 2;

    // 3. Add product to cart
    const addItemResponse = await cartHelper.addItemToCartResponse(cartId, targetProduct.id, quantity);
    expect(addItemResponse.status()).toBe(200);

    // 4. Retrieve cart contents and verify
    const getCartResponse = await cartHelper.getCartResponse(cartId);
    expect(getCartResponse.status()).toBe(200);

    const cartDetails = await getCartResponse.json();
    expect(cartDetails.id).toBe(cartId);
    expect(Array.isArray(cartDetails.cart_items)).toBe(true);
    expect(cartDetails.cart_items.length).toBeGreaterThanOrEqual(1);

    const item = cartDetails.cart_items.find((ci: any) => ci.product_id === targetProduct.id);
    expect(item).toBeDefined();
    expect(item.quantity).toBe(quantity);
  });
});
