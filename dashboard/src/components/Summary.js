import React, { useEffect, useState } from "react";
import api from "../api";

const Summary = () => {
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.get("/allHoldings")
      .then(({ data }) => { if (isMounted && Array.isArray(data)) setHoldings(data); })
      .catch((error) => console.error("Could not load summary holdings:", error));
    return () => { isMounted = false; };
  }, []);

  const investment = holdings.reduce((sum, stock) => sum + (Number(stock.avg) || 0) * (Number(stock.qty) || 0), 0);
  const currentValue = holdings.reduce((sum, stock) => sum + (Number(stock.price) || 0) * (Number(stock.qty) || 0), 0);
  const profit = currentValue - investment;
  const format = (value) => value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return (
    <>
      <div className="username">
        <h6>Hi, User!</h6>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Equity</p>
        </span>

        <div className="data">
          <div className="first">
            <h3>3.74k</h3>
            <p>Margin available</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Margins used <span>0</span>{" "}
            </p>
            <p>
              Opening balance <span>3.74k</span>{" "}
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Holdings (13)</p>
        </span>

        <div className="data">
          <div className="first">
            <h3 className={profit >= 0 ? "profit" : "loss"}>
              {format(profit)} <small>{investment ? `${((profit / investment) * 100).toFixed(2)}%` : "0.00%"}</small>{" "}
            </h3>
            <p>P&L</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Current Value <span>{format(currentValue)}</span>{" "}
            </p>
            <p>
              Investment <span>{format(investment)}</span>{" "}
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </>
  );
};

export default Summary;
