// frontend/src/components/DonatePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper function to load the Razorpay script dynamically
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const DonatePage = () => {
    const [ngos, setNgos] = useState([]);

    useEffect(() => {
        // Fetch the list of NGOs with donation stats
        axios.get('/donations/ngos')
            .then(res => setNgos(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleDonate = async (ngoId, ngoName) => {
        const amount = prompt(`How much do you want to donate to ${ngoName}? (INR)`);
        
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        // 1. Ensure Razorpay script is loaded
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            // 2. Create Order on Backend (Internal DB record)
            const orderRes = await axios.post('/create-order', { 
                amount: parseFloat(amount), 
                ngo_id: ngoId 
            });

            // 3. SIMULATE Payment Process (Demo Mode)
            // Since this is a project demo, we are simulating the payment success
            // instead of opening the actual Razorpay payment window, which requires live keys.
            
            const demoPaymentId = "pay_demo_" + Math.floor(Math.random() * 1000000);

            // 4. Verify Payment on Backend (Update DB status to 'Success')
            await axios.post('/donations/verify', {
                payment_id: demoPaymentId,
                order_id: orderRes.data.order_id,
                signature: "demo_signature_bypass"
            });

            alert(`Successfully donated ₹${amount} to ${ngoName}! (Demo Mode)`);
            window.location.reload(); // Refresh to see the progress bar update

        } catch (err) {
            console.error("Donation Error:", err);
            alert("Donation failed. Please check the console for details.");
        }
    };

    // Inline styles for simplicity and reliability
    const containerStyle = {
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem 1rem',
        fontFamily: 'sans-serif'
    };
    
    const cardStyle = {
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    };

    const buttonStyle = {
        width: '100%',
        padding: '0.75rem',
        backgroundColor: '#2563eb',
        color: 'white',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        marginTop: '1rem',
        transition: 'background-color 0.2s'
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '2rem', color: '#1f2937' }}>
                Support Our Partner NGOs
            </h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {ngos.length > 0 ? (
                    ngos.map(ngo => (
                        <div key={ngo.id} style={cardStyle}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0' }}>{ngo.name}</h2>
                                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{ngo.email}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Raised (30 Days)</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669' }}>₹{ngo.total_donations_last_30_days}</span>
                                    </div>
                                </div>
                                
                                <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '9999px', height: '0.75rem', overflow: 'hidden' }}>
                                    <div 
                                        style={{
                                            backgroundColor: '#10b981', 
                                            height: '100%', 
                                            borderRadius: '9999px',
                                            width: `${Math.min((ngo.total_donations_last_30_days / 10000) * 100, 100)}%`,
                                            transition: 'width 0.5s ease-in-out'
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleDonate(ngo.id, ngo.name)}
                                style={buttonStyle}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                            >
                                Donate Now
                            </button>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#6b7280', gridColumn: '1 / -1' }}>Loading NGOs...</p>
                )}
            </div>
        </div>
    );
};

export default DonatePage;