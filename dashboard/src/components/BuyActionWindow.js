import React, { useContext, useState } from "react";

import GeneralContext from "./GeneralContext";
import api from "../api";

import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const generalContext = useContext(GeneralContext);

  const handleBuyClick = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/newOrder", {
        name: uid,
        qty: Number(stockQuantity),
        price: Number(stockPrice),
        mode: "BUY",
      });
      generalContext.closeBuyWindow();
    } catch (requestError) {
      console.error("Could not submit order:", requestError);
      setError(requestError.response?.data?.message || "Order could not be saved. Check your API connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    generalContext.closeBuyWindow();
  };

  return (
    <div className="container" id="buy-window" draggable="true">
      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
            />
          </fieldset>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
      <div className="buttons">
        <span>Margin required ₹140.65</span>
        <div>
          <button type="button" className="btn btn-blue" onClick={handleBuyClick} disabled={submitting}>
            {submitting ? "Submitting…" : "Buy"}
          </button>
          <button type="button" className="btn btn-grey" onClick={handleCancelClick} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
