# FuelHub - Shopify Theme

A custom Shopify theme for FuelHub, a meal delivery service with dynamic cart management, tiered discounting, and intelligent meal quantity tracking.

## Setup

### Running the Theme Locally

Run this command from the root folder

```bash
shopify theme dev --store=your-store-name
```

## Preview Link
https://fuelhub-test-2.myshopify.com/

## Files Overview

### Core Files

| File | Purpose |
|------|---------|
| [snippets/cart.liquid](snippets/cart.liquid) | Complete cart functionality, discounts, and messaging |
| [snippets/product-card.liquid](snippets/product-card.liquid) | Product card component with quantity input |
| [sections/header.liquid](sections/header.liquid) | Header section |
| [sections/hero.liquid](sections/hero.liquid) | Hero banner |
| [sections/main-page.liquid](sections/main-page.liquid) | Main product listing page |
| [assets/theme.css](assets/theme.css) | Global styles and typography |
| [assets/global.js](assets/global.js) | Global scripts |
| [layout/theme.liquid](layout/theme.liquid) | Master layout template |


## Features

### Dynamic Shopping Cart
- **Sidebar Cart**: Fixed sidebar that slides in from the right with cart contents
- **Real-time Updates**: Cart updates instantly as users add/remove items
- **Remove Items**: One-click removal with "×" button next to each item
- **Quantity Adjustment**: Inline quantity adjusters for each product
- **Clear Cart**: Button to clear all selections at once

### Meal Selection System
- **Minimum & Maximum**: Requires 5-10 meals per order
- **Meal Counter**: Displays current meal count with min/max limits
- **Visual Feedback**: Red text when below minimum, orange when exceeding maximum
- **Bottom Message**: Fixed message at bottom of page showing: "You have selected X meals"

### Tiered Discount System
- **5-6 Meals**: 10% discount
- **7-8 Meals**: 15% discount
- **9-10 Meals**: 15% discount + Free shipping
- **Display**: Shows savings amount in cart (`Savings: -$X.XX`)
- **Automatic Application**: Discount codes applied automatically based on meal count

### Smart Messaging
- **Discount Pop-ups**: Contextual messages appear when users select meals:
  - Under 5 meals: "Add at least 5 meals to get a 10% discount"
  - 5 meals: "Add 2 more meals to unlock a 15% discount"
  - 6 meals: "Add 1 more meal to unlock a 15% discount"
  - 7-8 meals: "You've unlocked a 15% discount! 🎉"
  - 9-10 meals: "Free shipping unlocked 🚚"
- **Product Cards**: Shows quantity of each product added (e.g., "2 products added to cart")
- **Messages auto-dismiss** after 3 seconds

### Dynamic Pricing
- **Multi-Currency Support**: Displays prices in store's configured currency
- **Shipping Display**: Shows configurable default shipping price
- **Real-time Calculations**: All totals update instantly
- **User-Friendly Formatting**: Currency formatting handled automatically

### Checkout Controls
- **Checkout Button**: Only enabled when 5-10 meals are selected
- **Disabled States**: Button disabled if less than 5 or more than 10 meals
- **Validation**: Prevents invalid orders from proceeding

## Project Structure

```
fuelhub-shopify-test/
├── assets/
│   ├── global.js                # Global scripts
│   └── theme.css                # Global stylesheet with Roboto font
├── config/
│   └── settings_schema.json     # Theme settings configuration
├── layout/
│   └── theme.liquid             # Main layout template
├── sections/
│   ├── header.liquid            # Header with background color settings
│   ├── main-page.liquid         # Main product page
│   └── hero.liquid              # Hero section
├── snippets/
│   ├── cart.liquid              # Cart sidebar with all cart functionality
│   └── product-card.liquid      # Product card component
└── templates/
    └── index.json
```

## Configuration

### 1. Default Shipping Price

Set your store's default shipping price via metafield:

1. Go to **Shopify Admin** → **Content** → **Metafields**
2. Click **Shop**
3. Add/edit metafield:
   - **Namespace**: `custom`
   - **Key**: `default_shipping_price`
   - **Type**: Number (decimal)
   - **Value**: Enter your default shipping price (e.g., 10.00)

### 2. Discount Codes Setup

Create three discount codes in Shopify Admin for auto-application:

**Code 1: MEALS_10OFF** (10% discount)
- Type: Percentage discount
- Discount: 10%
- Applies to: All products

**Code 2: MEALS_15OFF** (15% discount)
- Type: Percentage discount  
- Discount: 15%
- Applies to: All products

**Code 3: MEALS_15OFF_FREESHIPPING** (Free shipping + 15% Discount)
- Type: Free shipping + 15% Discount
- Applies to: All shipping zones

These codes are automatically applied based on meal count.

### 3. Product Collection

Set up a product collection in the main page section:

1. Edit any page using the **Main Page** section
2. Select your product collection from settings

### Fonts

Uses **Roboto** from Google Fonts. Change in [layout/theme.liquid](layout/theme.liquid).

## Key JavaScript Functions

### In cart.liquid

- `toggleCart()` - Opens/closes cart sidebar
- `updateCart()` - Recalculates totals, discounts, and shipping
- `updateMealCount()` - Updates meal counter display
- `updateProductMessages()` - Updates "X products added" messages
- `applyDiscountCode(code)` - Applies discount code to cart
- `autoApplyDiscount(mealCount)` - Auto-selects discount based on meal count
- `showDiscountMessage()` - Displays contextual discount popup
- `updateBottomQuantityMessage()` - Updates bottom fixed quantity message

## Troubleshooting

### Discount codes not applying at checkout
1. Verify codes exist in Shopify Admin → Discounts
2. Check codes are "Active" (not archived or draft)
3. Verify code conditions are correct
4. Test codes manually in checkout first
5. Check browser console (F12) for error messages

## API Reference

### Shopify Cart API Endpoints Used

- `GET /cart.js` - Retrieve current cart
- `POST /cart/add.js` - Add items to cart
- `POST /cart/update.js` - Update quantities and apply discounts
- `POST /cart/clear.js` - Clear entire cart