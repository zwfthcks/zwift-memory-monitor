function numberToPattern(number, bytes = 4) {
  return ('0000000000000000' + number.toString(16)).slice(-2*bytes).match(/../g).reverse().join(' ');
}

module.exports = {
  numberToPattern
};