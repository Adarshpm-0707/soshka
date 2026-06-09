import React, { useState, useEffect } from 'react';

const ImageGallery = ({ images = [] }) => {
  const [activeImage, setActiveImage] = useState('');

  // Update active image if the image list loads or changes
  useEffect(() => {
    if (images && images.length > 0) {
      setActiveImage(images[0]);
    } else {
      setActiveImage('https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60');
    }
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
        No Images Available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image viewport */}
      <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800/80 shadow-sm relative group">
        <img
          src={activeImage}
          alt="Product viewport"
          className="object-cover w-full h-full transform transition duration-500 hover:scale-103"
        />
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`relative h-18 w-18 flex-shrink-0 rounded-xl overflow-hidden border-2 bg-slate-100 transition ${
                activeImage === img ? 'border-primary-600 scale-102 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
