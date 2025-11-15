class Collectible {
  constructor({x, y, value, id}) {
    this.id = id;
    this.value = value;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
  }
  
}

/*
  Note: Attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
