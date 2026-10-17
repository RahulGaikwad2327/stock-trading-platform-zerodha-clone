import React, { useState } from "react";
import "./Funds.css";

const STARTING_CASH = 4043.1;
const formatRupees = (amount) => amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Funds = () => {
  const [availableCash, setAvailableCash] = useState(STARTING_CASH);
  const [dialog, setDialog] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const withdrawAmount = Number(amount);
  const canSubmit = Number.isFinite(withdrawAmount) && withdrawAmount > 0 &&
    (dialog !== "withdraw" || withdrawAmount <= availableCash);

  const openDialog = (type) => {
    setAmount("");
    setMessage("");
    setDialog(type);
  };

  const submitDemoTransfer = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setAvailableCash((cash) => dialog === "add" ? cash + withdrawAmount : cash - withdrawAmount);
    setMessage(`Demo ${dialog === "add" ? "deposit" : "withdrawal"} of ₹${formatRupees(withdrawAmount)} applied to this screen only. No money was transferred.`);
    setAmount("");
    setDialog(null);
  };

  return (
    <section className="funds-page">
      <div className="funds funds-actions">
        <p>Demo account · no real funds are transferred</p>
        <button className="btn btn-green" type="button" onClick={() => openDialog("add")}>Add funds</button>
        <button className="btn btn-blue" type="button" onClick={() => openDialog("withdraw")}>Withdraw</button>
      </div>
      {message && <div className="funds-message" role="status">{message}</div>}

      <div className="row">
        <div className="col">
          <span><p>Equity</p></span>
          <div className="table">
            <div className="data"><p>Available margin</p><p className="imp colored">{formatRupees(availableCash)}</p></div>
            <div className="data"><p>Used margin</p><p className="imp">3,757.30</p></div>
            <div className="data"><p>Available cash</p><p className="imp">{formatRupees(availableCash)}</p></div>
            <hr />
            <div className="data"><p>Opening Balance</p><p>4,043.10</p></div>
            <div className="data"><p>Opening Balance</p><p>3,736.40</p></div>
            <div className="data"><p>Payin</p><p>4,064.00</p></div>
            <div className="data"><p>SPAN</p><p>0.00</p></div>
            <div className="data"><p>Delivery margin</p><p>0.00</p></div>
            <div className="data"><p>Exposure</p><p>0.00</p></div>
            <div className="data"><p>Options premium</p><p>0.00</p></div>
            <hr />
            <div className="data"><p>Collateral (Liquid funds)</p><p>0.00</p></div>
            <div className="data"><p>Collateral (Equity)</p><p>0.00</p></div>
            <div className="data"><p>Total Collateral</p><p>0.00</p></div>
          </div>
        </div>

        <div className="col">
          <div className="commodity">
            <p>You don't have a commodity account</p>
            <a className="btn btn-blue" href="https://zerodha.com/open-account" target="_blank" rel="noreferrer">
              Open Account
            </a>
          </div>
        </div>
      </div>

      {dialog && (
        <div className="funds-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
          <section className="funds-dialog" role="dialog" aria-modal="true" aria-labelledby="funds-dialog-title">
            <button className="funds-dialog-close" type="button" aria-label="Close" onClick={() => setDialog(null)}>×</button>
            <p className="funds-dialog-kicker">DEMO ONLY</p>
            <h2 id="funds-dialog-title">{dialog === "add" ? "Add demo funds" : "Withdraw demo funds"}</h2>
            <p className="funds-dialog-description">This changes the sample balance shown on this page only. It does not connect to Zerodha or move real money.</p>
            <form onSubmit={submitDemoTransfer}>
              <label htmlFor="funds-amount">Amount (₹)</label>
              <input id="funds-amount" type="number" min="0.01" max={dialog === "withdraw" ? availableCash : undefined}
                step="0.01" inputMode="decimal" required value={amount} onChange={(event) => setAmount(event.target.value)} />
              {dialog === "withdraw" && withdrawAmount > availableCash && <p className="funds-validation" role="alert">Amount exceeds the available demo balance.</p>}
              <div className="funds-dialog-actions">
                <button className="funds-cancel" type="button" onClick={() => setDialog(null)}>Cancel</button>
                <button className="funds-confirm" type="submit" disabled={!canSubmit}>{dialog === "add" ? "Add demo funds" : "Withdraw demo funds"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};

export default Funds;
