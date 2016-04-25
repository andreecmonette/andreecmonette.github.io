var levels = {
    lev1: 
"\n\
 ------  ----- \n\
 |....|  |...| \n\
 |.0..----.0.| \n\
 |.0......0..| \n\
 |..--->---0.| \n\
 |---------.---\n\
 |..^^^<|.....|\n\
 |.^----|0....|\n\
 --^|   |.0...|\n\
  |^-----.0...|\n\
  |..^^^^0.0..|\n\
  |??----------\n\
  ----         "
};

var parseLevel = function(level) {
   entities = new Array();
   coords = {x:0, y:0};
   for (var k in level) {
     var c = level[k];
     if (c === "\n") {
       coords.y += 1;
       coords.x = 0;
       continue;
     } else if (c === "0") {
       entities.push({position:{x:coords.x, y:coords.y},
                      pushable:true,
                      color:"#0F0",
                      name:"boulder"});
     } else if (c === "^") {
       entities.push({position:{x:coords.x, y:coords.y},
                      color:"#445",
                      name:"hole"});
     } else if (c === ">") {
       entities.push({position:{x:coords.x, y:coords.y},
                      update: playerUpdate,
                      color:"#f07",
                      walkSpeed: 7,
                      name:"player",
                      size: {x: 10, y:10},
                      angle: 0});
     } else if (c === "<") {
       entities.push({position:{x:coords.x, y:coords.y},
                      color:"#EEF",
                      name:"goal"});
     } else if (c === "|" || c === "-") {
       entities.push({position:{x:coords.x, y:coords.y},
                      color:"#099",
                      name:"wall"});
     }
     coords.x += 1;
   }
   return entities;
};

var spawnBullet = function(game) {
    game.c.entities.create(Bullet, {
        color: "#EEE",
    })
}

var Game = function() {
  this.c = new Coquette(this, "thegame", 1024, 1024, "#000");
  this.c.camera = {x : -20, y: -20};
  
  var level1entities = parseLevel(levels.lev1);
  for (var entityIdx in level1entities) {
    this.c.entities.create(Sprite, level1entities[entityIdx])
  }
  this.c.entities.create(BulletSpawner, {});
  /*
  this.c.entities.create(Sprite, {
      position: { x:12, y:4 },
      color:"#099",
      name: "wall"});
  
  this.c.entities.create(Sprite, {
      position: { x:11, y:5 },
      color:"#0F0",
      pushable: true,
      name: "boulder"});
  this.c.entities.create(Sprite, {
      position: { x:19, y:5 },
      color:"#0F0",
      pushable: true,
      name: "boulder"});
  this.c.entities.create(Sprite, {
      position: { x:22, y:5 },
      color:"#0F0",
      pushable: true,
      name: "boulder"});
  this.c.entities.create(Sprite, {
      position: { x:28, y:5 },
      color:"#0F0",
      pushable: true,
      name: "boulder"});
  



  // player
  this.c.entities.create(Sprite, {
      position: { x:9, y:7 },
      color:"#f07",
      update: playerUpdate,
      walkSpeed: 7,
      name: "player"});
    
    collision: function(other) {
      other.center.y = -1; // follow the player
    }
    */
};

var BulletSpawner = function(game, settings) {
    this.c = game.c;
    var spawnrate = 60;
    var ticks = spawnrate;
    this.update = function() {
        ticks -= 1;
        if (ticks == 0){
            spawnBullet(game);
            ticks = spawnrate;
        }
    }
}

var Bullet = function(game, settings) {
    this.c = game.c;
    this.boundingBox = this.c.collider.RECTANGLE;
    this.size = { x:4, y:4 }
    for (var i in settings) {
      this[i] = settings[i];
    }
    this.bulletDist = 1000;
    this.bulletSpeed = 2;
    var theta = Math.random() * 2 * Math.PI;
    this.dir = {x: Math.sin(theta),
                y: Math.cos(theta)};
    this.initialCenter = {
        x: this.c.playerCenter.x - (this.dir.x * this.bulletDist / 0.75),
        y: this.c.playerCenter.y - (this.dir.y * this.bulletDist / 0.75)
    }
    this.center = this.initialCenter;
    this.update = function() {
        this.center.x += this.bulletSpeed * this.dir.x;
        this.center.y += this.bulletSpeed * this.dir.y;
        this.bulletDist -= 1; //this.bulletSpeed;
        if (this.bulletDist < 0) {
            this.c.entities.destroy(this)
        }
    }
    this.collision = function(other) {
        if (other.name === "player") {
            document.location.reload();
            this.c.entities.destroy(other);
        }
    }
    this.draw = function(ctx) {
        
        ctx.fillStyle = settings.color;
        ctx.fillRect(this.center.x - this.size.x / 2,
                     this.center.y - this.size.y / 2,
                     this.size.x,
                     this.size.y);
    }
}

var Sprite = function(game, settings) {
  this.c = game.c;
  this.boundingBox = this.c.collider.CIRCLE;
  this.updateCenter = function () {
    this.center = { x:this.size.x *
                      (-this.c.camera.x + this.position.x + 1/2),
                    y:this.size.y *
                      (-this.c.camera.y + this.position.y + 1/2) };
  };
  this.pushable = false;
  for (var i in settings) {
    this[i] = settings[i];
  }

  this.size = { x:16, y:16 };

  this.draw = function(ctx) {
    this.updateCenter();
    if (this.name === "player") {
        this.c.playerCenter = this.center;
    }
    ctx.fillStyle = settings.color;
    ctx.fillRect(this.center.x - this.size.x / 2,
                 this.center.y - this.size.y / 2,
                 this.size.x,
                 this.size.y);
  };
  this.tryMove = function(x, y, canPush) {
    var prospectivePosition = {x: this.position.x + x, y: this.position.y + y};
    sprites = this.c.entities.all(Sprite);
    //document.getElementById("logging").innerHTML +=
    //        "<br\>" + x + " " + y + " " + this.position.x + " " + this.position.y + " " + this.name + canPush;
    
    
    for (var idx in sprites) {
      entity = sprites[idx];
      if (!(typeof entity.position === "undefined") && 
          entity.position.x === prospectivePosition.x &&
          entity.position.y === prospectivePosition.y) {
        
        if (entity.name === "hole" && this.name === "boulder") {
          this.c.entities.destroy(entity);
          this.c.entities.destroy(this);
          return true;
        }
        if (entity.name === "goal" && this.name === "player") {
          alert("You are teh winnar!");
          return true;
        }
        if (canPush && entity.pushable && entity.tryMove(x, y, false)) {
          break;
        } else {
          return false;
        }
      }
    }
    this.position = prospectivePosition;
    return true;
  };
};

var playerUpdate = function() {
  if (this.movementFramesLeft) {
      this.movementFramesLeft -= 1;
  } else {

    if (this.c.inputter.isDown(this.c.inputter.UP_ARROW)) {
      this.tryMove(0, -1, true);
      this.movementFramesLeft = this.walkSpeed;
    }
    else if (this.c.inputter.isDown(this.c.inputter.DOWN_ARROW)) {
      this.tryMove(0, 1, true);
      this.movementFramesLeft = this.walkSpeed;
    }
    else if (this.c.inputter.isDown(this.c.inputter.LEFT_ARROW)) {
      this.tryMove(-1, 0, true);
      this.movementFramesLeft = this.walkSpeed;
    }
    else if (this.c.inputter.isDown(this.c.inputter.RIGHT_ARROW)) {
      this.tryMove(1, 0, true);
      this.movementFramesLeft = this.walkSpeed;
    }
    if (this.position.x - this.c.camera.x < 2) {
      this.c.camera.x -= 1;
    }
    else if (this.position.x - this.c.camera.x > 62) {
      this.c.camera.x += 1;
    }
    else if (this.position.y - this.c.camera.y < 2) {
      this.c.camera.y -= 1;
    }
    else if (this.position.y - this.c.camera.y > 62) {
      this.c.camera.y += 1;
    }
  }    
};



window.addEventListener('load', function() {
  new Game();
});