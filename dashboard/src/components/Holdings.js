import React, { useEffect, useState } from "react";
import { VerticalGraph } from "./VerticalGraph";
import api from "../api";

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    api.get("/allHoldings")
      .then(({ data }) => {
        if (isMounted) setAllHoldings(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        console.error("Could not load holdings:", requestError);
        if (isMounted) setError("Holdings could not be loaded. Check that the API is running and try again.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const labels = allHoldings.map((holding) => holding.name);
  const data = {
    labels,
    datasets: [{
      label: "Stock Price",
      data: allHoldings.map((stock) => Number(stock.price) || 0),
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    }],
  };

  const formatNumber = (value) => (Number(value) || 0).toFixed(2);
  const totalInvestment = allHoldings.reduce((total, stock) => total + (Number(stock.avg) || 0) * (Number(stock.qty) || 0), 0);
  const currentValue = allHoldings.reduce((total, stock) => total + (Number(stock.price) || 0) * (Number(stock.qty) || 0), 0);
  const profitLoss = currentValue - totalInvestment;

  return (
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>
      {loading && <p role="status">Loading holdings…</p>}
      {error && <p role="alert">{error}</p>}

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Instrument</th><th>Qty.</th><th>Avg. cost</th><th>LTP</th>
              <th>Cur. val</th><th>P&amp;L</th><th>Net chg.</th><th>Day chg.</th>
            </tr>
          </thead>
          <tbody>
            {allHoldings.map((stock) => {
              const qty = Number(stock.qty) || 0;
              const avg = Number(stock.avg) || 0;
              const price = Number(stock.price) || 0;
              const curValue = price * qty;
              const profit = curValue - avg * qty;
              return (
                <tr key={stock._id || stock.name}>
                  <td>{stock.name}</td><td>{qty}</td><td>{formatNumber(avg)}</td>
                  <td>{formatNumber(price)}</td><td>{formatNumber(curValue)}</td>
                  <td className={profit >= 0 ? "profit" : "loss"}>{formatNumber(profit)}</td>
                  <td className={profit >= 0 ? "profit" : "loss"}>{stock.net}</td>
                  <td className={stock.isLoss ? "loss" : "profit"}>{stock.day}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="row">
        <div className="col"><h5>{formatNumber(totalInvestment)}</h5><p>Total investment</p></div>
        <div className="col"><h5>{formatNumber(currentValue)}</h5><p>Current value</p></div>
        <div className="col"><h5 className={profitLoss >= 0 ? "profit" : "loss"}>{formatNumber(profitLoss)}</h5><p>P&amp;L</p></div>
      </div>
      <VerticalGraph data={data} />
    </>
  );
};

export default Holdings;
