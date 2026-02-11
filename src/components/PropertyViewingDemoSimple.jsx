import React from "react";

export default function PropertyViewingDemoSimple() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fafafa',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#171717' }}>
          🏠 Property Viewing Demo
        </h1>
        <p style={{ fontSize: '20px', color: '#737373' }}>
          Demo is loading... If you see this, routing works!
        </p>
        <p style={{ fontSize: '16px', color: '#C5A059', marginTop: '20px' }}>
          Davidson & Co
        </p>
      </div>
    </div>
  );
}
