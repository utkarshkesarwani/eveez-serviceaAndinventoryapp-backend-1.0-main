async function getProductByMakeAndProductName(make, product_name, products) {
  for (let i = 0; i < products.length; i++) {
    if (
      products[i].make === make &&
      products[i].product_name === product_name
    ) {
      return products[i];
    }
  }
  return -1;
}

async function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  return distance; // Distance in kilometers
}

// Example usage
//   const result = getProductByMakeAndProductName('Apple', 'Macbook');
module.exports = {
  getProductByMakeAndProductName,
  calculateDistance,
};
