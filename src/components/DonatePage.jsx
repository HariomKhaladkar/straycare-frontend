import React, { useState, useEffect } from "react";
import axios from "axios";

// LOAD Razorpay SDK dynamically
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const DonatePage = () => {
  const [ngos, setNgos] = useState([]);

  // Load NGOs
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/donations/ngos`)
      .then((res) => setNgos(res.data))
      .catch((err) => console.error("NGO fetch error:", err));
  }, []);

  // Handle donation
  const handleDonate = async (ngoId, ngoName) => {
    const amount = prompt(`How much do you want to donate to ${ngoName}? (₹)`);

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay SDK");
      return;
    }

    try {
      // 1️⃣ Create order on backend
      const orderRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/donations/create-order`,
        {
          amount: parseFloat(amount),
          ngo_id: ngoId,
        }
      );

      const { order_id, amount: amt } = orderRes.data;

      // 2️⃣ Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amt,
        currency: "INR",
        name: "StrayCare",
        description: `Donation to ${ngoName}`,
        order_id: order_id,

        handler: async function (response) {
          await axios.post(
            `${process.env.REACT_APP_API_URL}/donations/verify`,
            {
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
            }
          );

          alert("🎉 Donation successful! Thank you ❤️");
          window.location.reload();
        },

        prefill: {
          name: "StrayCare User",
          email: "donor@example.com",
        },

        theme: {
          color: "#2563eb",
        },
      };

      const razorpayObject = new window.Razorpay(options);
      razorpayObject.open();

    } catch (err) {
      console.error("Donation failed:", err);
      alert("Donation failed. Please try again.");
    }
  };

  // --- Styles ---
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 1rem",
  };

  const cardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    backgroundColor: "white",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  };

  const buttonStyle = {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#2563eb",
    color: "white",
    fontWeight: "bold",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    marginTop: "1rem",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: "center", fontSize: "2rem", fontWeight: "800" }}>
        Support Our Partner NGOs ❤️
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        {ngos.length ? (
          ngos.map((ngo) => (
            <div key={ngo.id} style={cardStyle}>
              <h2 style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                {ngo.name}
              </h2>
              <p style={{ color: "#6b7280" }}>{ngo.email}</p>

              <button
                onClick={() => handleDonate(ngo.id, ngo.name)}
                style={buttonStyle}
              >
                Donate Now
              </button>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center" }}>Loading NGOs...</p>
        )}
      </div>
    </div>
  );
};

export default DonatePage;
