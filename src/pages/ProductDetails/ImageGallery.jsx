import React, { useState, useEffect } from 'react';

const ImageGallery = ({ images = [], productName = 'Product' }) => {
  const [activeImage, setActiveImage] = useState('');

  // Filter out empty, non-string, or whitespace-only URLs
  const validImages = (images || []).filter(
    (img) => typeof img === 'string' && img.trim() !== ''
  );

  // Update active image if the valid image list loads or changes
  useEffect(() => {
    if (validImages.length > 0) {
      setActiveImage(validImages[0]);
    } else {
      setActiveImage('');
    }
  }, [images]); // rely on images prop to recalculate

  if (validImages.length === 0) {
    return (
      <div className="aspect-square bg-slate-150 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-800">
        No Images Available
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
      {/* Thumbnails Column (Left on Desktop, Top/Row on Mobile) */}
      {validImages.length > 1 && (
        <div className="flex lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-y-auto w-full lg:w-auto flex-shrink-0 pb-2 lg:pb-0 scrollbar-thin max-h-none lg:max-h-[450px]">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImage(img)}
              className={`relative h-16 w-16 lg:h-20 lg:w-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-900 transition-all duration-300 ${
                activeImage === img
                  ? 'border-[#ff2a85] scale-[1.03] shadow-md shadow-[#ff2a85]/10'
                  : 'border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1} of ${productName}`}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image viewport */}
      <div className="flex-1 w-full lg:w-auto order-1 lg:order-2 aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-md relative group">
        <img
          src={activeImage}
          alt={`${productName} - Main View`}
          className="object-cover w-full h-full transform transition duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
    </div>
  );
};

export default ImageGallery;
