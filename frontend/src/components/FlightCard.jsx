import React from 'react';
import './FlightCard.css';

function FlightCard({ flight, formatDate, getAirportName }) {
  return (
    <div className="flight-card" style={{ borderRadius: '8px', border: '1px solid #ccc', padding: '16px', marginBottom: '16px' }}>
      <div className="flight-header">
        <div className="flight-price">USD ${flight.price}</div>
        <div className="flight-duration">{flight.duration}</div>
      </div>
      
      <div className="flight-segments">
        {flight.segments.map((segment, index) => (
          <div key={index} className="flight-segment">
            <div className="segment-info">
              <div className="segment-airports">
                <span className="segment-airport">{getAirportName(segment.fromCode)}</span>
                <span className="segment-direction">→</span>
                <span className="segment-airport">{getAirportName(segment.toCode)}</span>
              </div>
              <div className="segment-times">
                <span>{formatDate(segment.departTime)}</span>
                <span>-</span>
                <span>{formatDate(segment.arrivalTime)}</span>
              </div>
            </div>
            <div className="segment-flight-number">
              Flight: {segment.flight}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flight-actions">
        <button className="select-flight-button">Select Flight</button>
      </div>
    </div>
  );
}

export default FlightCard;