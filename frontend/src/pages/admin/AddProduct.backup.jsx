import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import "./AddProduct.css";

const API_URL = "http://localhost:5000/api/products";

const emptyProduct = {
  name: "",
  category: "",
  brand: "",
  price: "",
  stock: "",
  barcode: "",
  imageUrl: "",
  description: "",
};

function AddProduct() {
  const navigate = useNavigate();

  const [product, setProduct] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [savedProduct, setSavedProduct] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !product.name.trim() ||
      !product.category ||
      product.price === "" ||
      product.stock === ""
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    const price = Number(product.price);
    const stock = Number(product.stock);

    if (!Number.isFinite(price) || price <= 0) {
      setMessage("Enter a selling price greater than zero.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setMessage("Stock must be a non-negative whole number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          name: product.name.trim(),
          barcode: product.barcode.trim(),
          price,
          stock,
          imageUrl: product.imageUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save product.");
      }

      const saved = data.product;

      if (!saved?._id) {
        throw new Error(
          "Product was saved, but the server did not return its ID."
        );
      }

      setSavedProduct(saved);

      // Generate a unique QR code using the saved MongoDB product ID.
      const qrData = `SUPERMARKET_PRODUCT:${saved._id}`;

      const generatedQR = await QRCode.toDataURL(qrData, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
        color: {
          dark: "#172554",
          light: "#FFFFFF",
        },
      });

      setQrImage(generatedQR);
      setMessage("Product saved successfully. Your QR label is ready!");
      setProduct(emptyProduct);
    } catch (error) {
      console.error("Product save error:", error);
      setMessage(error.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const printQRCode = () => {
    if (!qrImage || !savedProduct) return;

    const printWindow = window.open("", "_blank", "width=500,height=600");

    if (!printWindow) {
      alert("Please allow pop-ups to print your QR label.");
      return;
    }

    const safeName = String(savedProduct.name).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char]
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product QR Label</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 30px;
              color: #172554;
            }
            .label {
              border: 1px solid #dbe3ef;
              border-radius: 12px;
              padding: 24px;
              display: inline-block;
            }
            img {
              width: 220px;
              height: 220px;
            }
            h2 { margin-bottom: 8px; }
            p { color: #64748b; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <h2>${safeName}</h2>
            <img src="${qrImage}" alt="Product QR Code" />
            <p>Product ID: ${savedProduct._id}</p>
            <p>Scan to identify this supermarket product</p>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const addAnotherProduct = () => {
    setSavedProduct(null);
    setQrImage("");
    setMessage("");
    setProduct(emptyProduct);
  };

  return (
    <div className="add-product-page">
      <div className="product-page-header">
        <div>
          <span className="page-eyebrow">INVENTORY MANAGEMENT</span>
          <h1>Add New Product</h1>
          <p>Add a product and create its unique supermarket QR label.</p>
        </div>

        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/admin")}
        >
          Back to Dashboard
        </button>
      </div>

      {savedProduct && qrImage ? (
        <section className="qr-success-card">
          <div className="success-icon">✓</div>
          <h2>Product Added Successfully!</h2>
          <p>
            {savedProduct.name} has been saved in your inventory.
          </p>

          <div className="generated-qr">
            <img src={qrImage} alt="Generated product QR code" />
            <h3>{savedProduct.name}</h3>
            <p>Product ID: {savedProduct._id}</p>
            <p>Price: ₹{Number(savedProduct.price).toFixed(2)}</p>
            <p>Original Barcode: {savedProduct.barcode}</p>
          </div>

          <div className="qr-actions">
            <button
              type="button"
              className="save-btn"
              onClick={printQRCode}
            >
              Print QR Label
            </button>

            <button
              type="button"
              className="secondary-action"
              onClick={addAnotherProduct}
            >
              Add Another Product
            </button>

            <button
              type="button"
              className="secondary-action"
              onClick={() => navigate("/admin")}
            >
              View Inventory
            </button>
          </div>
        </section>
      ) : (
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-section-heading">
            <div>
              <span className="section-number">01</span>
              <h2>Product Information</h2>
              <p>Enter the details printed on the product packaging.</p>
            </div>
          </div>

          <div className="product-form-grid">
            <label>
              Product Name *
              <input
                name="name"
                value={product.name}
                onChange={handleChange}
                placeholder="Example: Shampoo 180ml"
                required
              />
            </label>

            <label>
              Category *
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="Groceries">Groceries</option>
                <option value="Fruits & Vegetables">
                  Fruits & Vegetables
                </option>
                <option value="Dairy">Dairy</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Household">Household</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Brand Name
              <input
                name="brand"
                value={product.brand}
                onChange={handleChange}
                placeholder="Example: Dove"
              />
            </label>

            <label>
              Selling Price (₹) *
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="price"
                value={product.price}
                onChange={handleChange}
                placeholder="Enter selling price"
                required
              />
            </label>

            <label>
              Opening Stock *
              <input
                type="number"
                min="0"
                step="1"
                name="stock"
                value={product.stock}
                onChange={handleChange}
                placeholder="Example: 30"
                required
              />
            </label>

            <label>
              Original Product Barcode (Optional)
              <input
                name="barcode"
                value={product.barcode}
                onChange={handleChange}
                placeholder="Enter or scan barcode (optional)"
              />
              <small>
                Enter the barcode printed on the package, or leave it empty.
              </small>
            </label>

            <label className="full-width-field">
              Product Image URL
              <input
                type="url"
                name="imageUrl"
                value={product.imageUrl}
                onChange={handleChange}
                placeholder="Paste product image URL"
              />
            </label>
          </div>

          {product.imageUrl && (
            <div className="image-preview">
              <p>Product Image Preview</p>
              <img
                src={product.imageUrl}
                alt="Product preview"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <label className="description-field">
            Product Description
            <textarea
              name="description"
              value={product.description}
              onChange={handleChange}
              placeholder="Enter product details"
              rows="4"
            />
          </label>

          <div className="qr-info">
            <div className="qr-info-icon">QR</div>
            <div>
              <strong>Automatic QR Label</strong>
              <p>
                A unique QR code will be generated after the product
                is successfully saved.
              </p>
            </div>
          </div>

          {message && (
            <div className="form-message" role="alert">
              {message}
            </div>
          )}

          <div className="product-form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/admin")}
            >
              Cancel
            </button>

            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Saving Product..." : "Save Product & Generate QR"}
            </button>
          </div>
        </form>
      )}

      {!savedProduct && message && (
        <p className="form-message form-message-bottom" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

export default AddProduct;
