import React from "react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    api.get("/allOrders")
      .then(({ data }) => { if (isMounted) setOrders(Array.isArray(data) ? data : []); })
      .catch((requestError) => {
        console.error("Could not load orders:", requestError);
        if (isMounted) setError("Orders could not be loaded. Check your API connection and try again.");
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="orders">
      <h3 className="title">Orders ({orders.length})</h3>
      {loading && <p role="status">Loading orders…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && orders.length === 0 && <div className="no-orders">
        <p>You haven't placed any orders yet</p>
        <Link to="/" className="btn">Get started</Link>
      </div>}
      {orders.length > 0 && <div className="order-table"><table>
        <thead><tr><th>Instrument</th><th>Qty.</th><th>Price</th><th>Mode</th></tr></thead>
        <tbody>{orders.map((order) => <tr key={order._id}>
          <td>{order.name}</td><td>{order.qty}</td><td>{Number(order.price).toFixed(2)}</td><td>{order.mode}</td>
        </tr>)}</tbody>
      </table></div>}
    </div>
  );
};

export default Orders;
