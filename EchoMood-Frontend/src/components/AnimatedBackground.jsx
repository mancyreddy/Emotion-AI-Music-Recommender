import React from 'react';
import './animated-bg.css';

export default function AnimatedBackground() {
  return (
    <div className="animated-bg" aria-hidden="true">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
    </div>
  );
}