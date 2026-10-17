import React from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AppsIcon from "@mui/icons-material/Apps";
import "./Apps.css";

const Apps = () => {
  const products = [
    { name: "Kite", type: "Trading platform", description: "Track markets and place orders with Zerodha’s trading platform.", url: "https://kite.zerodha.com/", tag: "Trading" },
    { name: "Console", type: "Account analytics", description: "Review your portfolio, statements, and account reports.", url: "https://console.zerodha.com/", tag: "Portfolio" },
    { name: "Coin", type: "Direct mutual funds", description: "Explore Zerodha’s direct mutual fund platform.", url: "https://coin.zerodha.com/", tag: "Mutual funds" },
    { name: "Varsity", type: "Market education", description: "Learn about markets, investing, and trading with free lessons.", url: "https://zerodha.com/varsity/", tag: "Learn" },
    { name: "Kite Connect", type: "Partner developer APIs", description: "Build trading and investment applications with Kite Connect APIs.", url: "https://kite.trade/", tag: "Developers" },
  ];
  return <section className="apps-page">
    <header className="apps-heading"><div className="apps-icon"><AppsIcon /></div><div><p className="apps-kicker">ZERODHA ECOSYSTEM</p><h1>Apps &amp; partners</h1><p>Explore Zerodha products and developer tools from one place.</p></div></header>
    <div className="apps-grid">{products.map((product) => <article className="app-card" key={product.name}>
      <div className="app-card-top"><span className="app-tag">{product.tag}</span><span className="app-mark">{product.name.slice(0, 1)}</span></div>
      <h2>{product.name}</h2><p className="app-type">{product.type}</p><p className="app-description">{product.description}</p>
      <a href={product.url} target="_blank" rel="noreferrer">Visit {product.name}<OpenInNewIcon fontSize="small" /></a>
    </article>)}</div>
    <p className="apps-note">These links open official Zerodha services. This demo dashboard is independent and does not connect to brokerage accounts.</p>
  </section>;
};

export default Apps;
