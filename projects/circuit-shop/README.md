# Voltix — electronics store demo

A demo storefront for electronics parts: search, category / price / stock filters, sorting, product dialogs, a cart that survives reloads, free-shipping progress and a validated checkout. No payments, nothing leaves the browser.

## Highlights

- Product artwork generated in SVG from the product id
- Native `<dialog>` for focus trapping and Esc
- Cart sanitised on load (unknown or out-of-stock items dropped, quantities clamped)

## Run it

Open `index.html` in a browser. Unit tests: `node --test` from the repository root.

Part of [Charon's portfolio](../../).
