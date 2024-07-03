import React from 'react';

const Loader = ({ loading }) => {
  if (!loading || typeof loading.percent !== 'number') {
    return null; // Or return a fallback UI
  }

  return (
    <div className="loader-container">
      <div className="loader-bar" style={{ width: `${loading.percent}%` }}>
        <span className="loader-text">{`${loading.percent}%`}</span>
      </div>
    </div>
  );
};

export default Loader;
