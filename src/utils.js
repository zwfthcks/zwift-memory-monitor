function numberToPattern(number) {
  return ('00000000' + number.toString(16)).slice(-8).match(/../g).reverse().join(' ');
}

module.exports = {
  numberToPattern
};