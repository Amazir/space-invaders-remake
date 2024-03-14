var method = player.prototype;

function player(cube){
    this.velocity = 1.0;

    this.positionX = 50;
    this.positionY = 50;

    this.isPressingLeft = false;
    this.isPressingRight = false;
}

method.updatePosition = function(){
    if(isPressingLeft)
        this.positionX += 1;
    if(isPressingRight)
        this.positionY -= 1;
}

module.exports = player;