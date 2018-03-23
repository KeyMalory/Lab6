function Level(plan) {
  // Use the length of a single row to set the width of the level
  this.width = plan[0].length;
  // Use the number of rows to set the height

  this.height = plan.length;

  // Store the individual tiles in our own, separate array
  this.grid = [];

  // Loop through each row in the plan, creating an array in our grid
  for (var y = 0; y < this.height; y++) {
    var line = plan[y], gridLine = [];

    // Loop through each array element in the inner array for the type of the tile
    for (var x = 0; x < this.width; x++) {
      // Get the type from that character in the string. It can be 'x', '!' or ' '
      // If the character is ' ', assign null.

      var ch = line[x], fieldType = null;
      // Use if and else to handle the three cases
      if (ch==='@')
        // Create a new player at that grid position.
        this.player = new Player(new Vector(x, y));
// this xy is wherever yr player will start, @ sign shows up.
      else if (ch == "x")
        fieldType = "wall";
      // Because there is a third case (space ' '), use an "else if" instead of "else"
      else if (ch == "!")
        fieldType = "lava";

      // "Push" the fieldType, which is a string, onto the gridLine array (at the end).
      gridLine.push(fieldType);
    }
    // Push the entire row onto the array of rows.
    this.grid.push(gridLine);
  }
}

function Vector(x, y) {
  this.x = x; this.y = y;
}

var myVector1 = new Vector(5,10);
var myVector2 = new Vector(25, 7);

// ******     if u wanted to add, cant do var myVector3 = myVector1 + myVector2;
// + takes Numbers, these are vectors, wont work: instead ->
// plus method, has to be assoc w one of the vectors. methods always assoc w an Object
// how u call method myVector1.plus
// *****      var myVector = myVector1.plus(myVector2);

// Vector arithmetic: v_1 + v_2 = <a,b>+<c,d> = <a+c,b+d>
Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

// Vector arithmetic: v_1 * factor = <a,b>*factor = <a*factor,b*factor>
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};


// A Player has a size, speed and position.
function Player(pos) {
  // takes position, which is a vector, it has 3 properties ^ post, size, speed.
  // start pos + -0.5 to y val. val is slightly taller
  // size thinner than bg elems, if falls thru a thing needs to be thinner or just phases.

  this.pos = pos.plus(new Vector(0, -0.5));
  this.size = new Vector(0.8, 1.5);
  this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

// Helper function to easily create an element of a type provided
// and assign it a class.
function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

// Main display class. We keep track of the scroll window using it.
function DOMDisplay(parent, level) {

// this.wrap corresponds to a div created with class of "game"
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;

  // In this version, we only have a static background.
  this.wrap.appendChild(this.drawBackground());

  // Keep track of actors
  this.actorLayer = null;

  // Update the world based on player position
  this.drawFrame();
}

var scale = 20;

DOMDisplay.prototype.drawBackground = function() {
  var table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";

  // Assign a class to new row element directly from the string from
  // each tile in grid
  this.level.grid.forEach(function(row) {
    var rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(function(type) {
      rowElt.appendChild(elt("td", type));
    });
  });
  return table;
};

// Draw the player agent
DOMDisplay.prototype.drawPlayer = function() {
  // Create a new container div for actor dom elements
  var wrap = elt("div");

  var actor = this.level.player;
  var rect = wrap.appendChild(elt("div",
                                    "actor " + actor.type));
  rect.style.width = actor.size.x * scale + "px";
  rect.style.height = actor.size.y * scale + "px";
  rect.style.left = actor.pos.x * scale + "px";
  rect.style.top = actor.pos.y * scale + "px";
  return wrap;
};

DOMDisplay.prototype.drawFrame = function() {
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawPlayer());
  this.scrollPlayerIntoView();
};

DOMDisplay.prototype.scrollPlayerIntoView = function() {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;

  // We want to keep player at least 1/3 away from side of screen
  var margin = width / 3;

  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;

  var player = this.level.player;
  // Change coordinates from the source to our scaled.
  var center = player.pos.plus(player.size.times(0.5))
                 .times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};


// Update simulation each step based on keys & step size
Level.prototype.animate = function(step, keys) {

  // Ensure each is maximum 100 milliseconds
  while (step > 0) {
    var thisStep = Math.min(step, maxStep);
      this.player.act(thisStep, this, keys);
   // Do this by looping across the step size, subtracing either the
   // step itself or 100 milliseconds
    step -= thisStep;
  }
};

// most player will move in a frame, to give it a smoother runAnimation
// so even if something jumps high it wont just teleport, but interpolate betw frames

Level.prototype.obstacleAt = function (pos, size){
  var xStart = Math.floor(pos.x); // rounds down decimals. 4.9 = 4, gives left most bound of x.
  var xEnd = Math.ceil(pos.x + size.x); // x pos + size of obstacle // 4.1 -> 5, rounds up
  var yStart = Math.floor (pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  // stop it from going out of bounds of game, consider borders as walls
  if (xStart < 0 || xEnd > this.width || yStart < 0 || yEnd >this.height) // this being level width
    // if top and bottom/ L R, || = OR
    return "wall"; // makes them into walls

  // check each grid position starting, make sure no grid objs in bg, return what is if is.
  // check yStart, xStart for possib obstacles, non null vals. douple loop situation
  for (var y=yStart; y<yEnd; y++);  // y first, rows first, then columns.
  {
    for (var x=xStart; x<xEnd; x++);
    {
      var fieldType = this.grid[y][x];
      if (fieldType) // null evals to false, if not null it's true, meaning anything other than null
        return fieldType;
    }
  }

}
// ^ create an obstacleAt method of all objs of type level

var maxStep = 0.05;

var playerXSpeed = 16;
// x speed, horizontal speed.
// gravity, how much the player gets pulled down when it jumps. floaty = lower #< vice versa
// jump speed, speed of jump up. balances w grav.
// yspeed, how quick vertically.
// moveX and moveY, methods part of / assoc w Player obj.
// by default, chara doesnt move. this.speed.x = 0;, this.speed. = 0
// keys.left, being pressed - Xspeed, keys.right it's + Xspeed. (-7, +7)

// y goes up as we go down. handling x w/in the y seperately
// always adding it to players current position, Xs and Ys. can move diagonally


// collision detection, make it so it doesnt run into walls and shit
Player.prototype.moveX = function(step, level, keys) {
  // accelerate player downwards always

  // this.speed.x = 0; -> change to
  this.speed.x =0;
  if (keys.left) this.speed.x -= playerXSpeed;
  if (keys.right) this.speed.x += playerXSpeed;

  var motion = new Vector(this.speed.x * step, 0);
  var newPos = this.pos.plus(motion);


  // find if there's an obstanct @ the newPas. create helper function.
  // creat method, obstactle @, position @ size we're looking at. need 2 kno size of boxes
  // see if there's an obstactle, return what type
  var obstacle = level.obstacleAt (newPos, this.size);
  // obstacleAt, either return null or whatever type an obstacle is.
  // Move if there's not a wall there
  if (obstacle != "wall")
    this.pos = newPos;
};

var gravity = 3;
var jumpSpeed = 33;
var playerYSpeed = 7;

Player.prototype.moveY = function(step, level, keys) {
  this.speed.y += step * gravity;
  var motion = new Vector(0, this.speed.y * step);
  var newPos = this.pos.plus(motion);

  var obstacle = level.obstacleAt(newPos, this.size);



  // floor also an obstacle = can only just if the player is touching an obstacle
  if (obstacle) {
    if (keys.up && this.speed.y > 0)
    this.speed.y = -jumpSpeed; // jumpspeed negative bc as Y goes down
    else {
      this.speed.y = 0;
    }
  }
  else {
    this.post = newPos;
  }

  // if (keys.up) this.speed.y -= playerYSpeed;
  // if (keys.down) this.speed.y += playerYSpeed;


};

Player.prototype.act = function(step, level, keys) {
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);
};


// Arrow key codes for readibility
var arrowCodes = {37: "left", 38: "up", 39: "right", 40: "down"};

// Translate the codes pressed from a key event
function trackKeys(codes) {
  var pressed = Object.create(null);

  // alters the current "pressed" array which is returned from this function.
  // The "pressed" variable persists even after this function terminates
  // That is why we needed to assign it using "Object.create()" as
  // otherwise it would be garbage collected

  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      // If the event is keydown, set down to true. Else set to false.
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      // We don't want the key press to scroll the browser window,
      // This stops the event from continuing to be processed
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

// frameFunc is a function called each frame with the parameter "step"
// step is the amount of time since the last call used for animation
function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      // Set a maximum frame step of 100 milliseconds to prevent
      // having big jumps
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// This assigns the array that will be updated anytime the player
// presses an arrow key. We can access it from anywhere.
var arrows = trackKeys(arrowCodes);

// Organize a single level and begin animation
function runLevel(level, Display) {
  var display = new Display(document.body, level);

  runAnimation(function(step) {
    // Allow the viewer to scroll the level
    level.animate(step, arrows);
    display.drawFrame(step);
  });
}

function runGame(plans, Display) {
  // plans ie lvl design, Display type of Display
  // zero means start at level zero. change # to shortcut to check other lvls
  // lvl plans n, 2D array, starting w 0 always, calling 1st elem in array
  function startLevel(n) {
    // Create a new level using the nth element of array plans
    // Pass in a reference to Display function, DOMDisplay (in index.html).
    runLevel(new Level(plans[n]), Display);
    //make new level, new + level name, construction, creates new level Object
    // construction all at top (function Level(plan)). creates new obj of type Level
    // new obj has same width as 1st level [ ]
  }
  startLevel(0);
}
