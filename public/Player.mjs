class Player {
  constructor({x, y, score = 0, id, width = 50, height = 50}) {
    this.id = id;
    this.score = score;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case 'up':
        this.y -= speed;
      break;
      case 'down':
        this.y += speed;
      break;
      case 'left':
        this.x -= speed;
      break;
      case 'right':
        this.x += speed;
      break;
    }
    return this;
  }

  collision(item) {
    return (
      this.x < item.x + 30 &&
      this.x + this.width > item.x &&
      this.y < item.y + 30 &&
      this.y + this.height > item.y
    );
  }

  calculateRank(arr) {
    if (!arr || arr.length === 0) {
      return 'Rank: 1/1';
    }
    const sortedPlayers = [...arr].sort((a, b) => b.score - a.score);

    const rank = sortedPlayers.findIndex(p => p.id === this.id) + 1;
        
    return `Rank: ${rank}/${arr.length}`;
  }
}

export default Player;
