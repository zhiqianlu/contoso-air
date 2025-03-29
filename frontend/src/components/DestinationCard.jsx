import React from 'react';

function DestinationCard({ destination }) {
  return (
    <div className="destination-card">
      <div className="image-container">
        {destination.image ? (
          <img src={destination.image} alt={destination.city} className="destination-image" />
        ) : (
          <div className="placeholder-image">
            <div>
              <p>{destination.city}, {destination.country}</p>
            </div>
          </div>
        )}
        <div className="country-overlay">{destination.country}</div>
      </div>
      <div className="destination-info">
        <h3>{destination.city}</h3>
        <p>{destination.tagline}</p>
        <p>from USD {destination.price}*</p>
      </div>
    </div>
  );
}

export default DestinationCard;