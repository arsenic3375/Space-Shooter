let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


//Mouse
let mouseX = null;
let mouseY = null;

canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

//Keyboard
let spacePressed = false;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
    if(e.key == " ") {
        spacePressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key == " ") {
        spacePressed = false;
    }
}

function background(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

//Math
function distance(a, b) {
    let dx = b.x-a.x;
    let dy = b.y-a.y;
    return Math.sqrt(dx*dx + dy*dy);
}

function xComponent(a, b) {
    let dx = b.x-a.x;
    let d = distance(a, b);
    return (dx/d);
}

function yComponent(a, b) {
    let dy = b.y-a.y;
    let d = distance(a, b);
    return (dy/d);
}

//Objects
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    sum(b) {
        return new Point(this.x + b.x, this.y + b.y);
    }

    product(b) {
        return new Point(this.x * b.x, this.y * b.y);
    }

    rotate(angle) {
        //voddo:
        let newX = this.x*Math.cos(angle)-this.y*Math.sin(angle);
        let newY = this.y*Math.cos(angle)+this.x*Math.sin(angle); 
        return new Point(newX, newY);
    }
    
    toScreenPoint(coordinate, bearing){
        return this.rotate(bearing).sum(coordinate);
    }
}

class Vector {
    constructor(x, y, magnitude) {
        this.x = x;
        this.y = y;
        this.magnitude = magnitude;
    }
    
    sum(b) {
        return new Vector(this.x + b.x, this.y + b.y);
    }

    scalarProduct(b) {
        return new Vector(this.x * b, this.y * b);
    }

    setMagnitude(b) {
        this.magnitude = b;
        this.scalarProduct(this.magnitude);
    }

    dotProduct(b) {
        return new Vector(this.x * b.x, this.y * b.y);
    }

    getAngle() {
        return Math.atan2(this.y, this.x);
    }

    setAngle(angle) {
        this.x = Math.cos(angle) * this.magnitude;
        this.y = Math.sin(angle) * this.magnitude;
    }
}

class Part {
    constructor(center) {
        this.center = center;
        this.sprite = new Image();
        this.shift = new Point(0, 0);
        this.connections = [];

    }

    draw(coordinate, bearing) {
        ctx.save();
        ctx.translate(coordinate.x, coordinate.y);
        ctx.rotate(bearing);
        ctx.drawImage(this.sprite, this.center.x-this.shift.x, this.center.y-this.shift.y);
        ctx.restore();
    }
}

class Bullet {
    constructor(coordinate, bearing, timeCreated) {
        this.coordinate = coordinate;
        this.bearing = bearing;
        this.timeCreated = timeCreated;

        this.speed = 0;
        this.r = 0;
        this.color = 'rgb(0, 0, 0)';

        this.velocity = new Vector(1, 0, this.speed);
        this.velocity.setAngle(this.bearing);
    }
    
    move() {
        this.coordinate = this.coordinate.sum(this.velocity);
    }

    isDead() {
        if((Date.now() - this.timeCreated) < 1000) { return false; }
        return true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.coordinate.x, this.coordinate.y, this.r, 0, Math.PI * 2, true);
        ctx.fillStyle = this.color;
        ctx.fill();        
        ctx.closePath();
    }
}

class BulletA extends Bullet {
    constructor(coordinate, bearing, timeCreated) {
        super(coordinate, bearing, timeCreated);
        this.speed = 5;
        this.r = 5;
        this.color = 'rgb(255, 0, 0)';

        this.velocity = new Vector(1, 0, this.speed);
        this.velocity.setAngle(this.bearing);
    }
}

class BulletB extends Bullet {
    constructor(coordinate, bearing, timeCreated) {
        super(coordinate, bearing, timeCreated);
        this.v = 3;
        this.r = 8;
        this.color = 'rgb(255, 255, 0)';

        this.velocity = new Vector(1, 0, this.speed);
        this.velocity.setAngle(this.bearing);
    }
}

class Smoke {
    constructor(coordinate, timeCreated) {
        this.coordinate = coordinate;
        this.timeCreated = timeCreated;
    }
    
    isDead() {
        if((Date.now() - this.timeCreated) < 0) { return false; }
        return true;
    }

    draw() {
        /*ctx.beginPath();
        ctx.arc(this.coordinate.x, this.coordinate.y, 5, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgb(255, 255, 0)';
        ctx.fill();        
        ctx.closePath();*/
    }

}

class Shooter extends Part {
    constructor(center) {
        super(center);
        this.sprite.src = "shooterProto.png";
        this.shift = new Point(12.5, 12.5);


        this.lastShot = 0;
        this.direction = 0;
    }

    aim(coordinate, target) {
        let targetVector = new Vector(xComponent(coordinate, target),
                                      yComponent(coordinate, target),
                                      distance(coordinate, target));
        
        this.direction = targetVector.getAngle();
    }

    shoot(coordinate, bearing) {
        let newCenter = this.center.toScreenPoint(coordinate, bearing);

        if((Date.now() - this.lastShot) < 1000) { return new Smoke(newCenter, Date.now()); }

        this.lastShot = Date.now();
        return new BulletA(newCenter, this.direction, Date.now());
    }
}

class Hull extends Part {
    constructor(center) {
        super(center);
    }
}

class HullA extends Hull {
    constructor(center) {
        super(center);
        this.sprite.src = "hullProtoA.png";
        this.shift =  new Point(25,25);
        this.connections = [new Point(this.center.x+12.5, this.center.y-25),
                            new Point(this.center.x+75, this.center.y),
                            new Point(this.center.x+12.5, this.center.y+25)];
    }
}

class HullB extends Hull {
    constructor(center) {
        super(center);
        this.sprite.src = "hullProtoB.png";
        this.shift = new Point(50, 50);
    }
}

class Wing extends Part{
    constructor(center) {
        super(center);
    }
}

class RightWing extends Wing {
    constructor(center) {
        super(center);
        this.sprite.src = "rightWingProto.png";
        this.shift = new Point(25, 0);
        this.connections = [new Point(this.center.x+12.5, this.center.y+50),
                            new Point(this.center.x-12.5, this.center.y+100)];
    }
}

class LeftWing extends Wing {
    constructor(center) {
        super(center);
        this.sprite.src = "leftWingProto.png";
        this.shift = new Point(25, 100);
        this.connections = [new Point(this.center.x+12.5, this.center.y-50),
                            new Point(this.center.x-12.5, this.center.y-100)];
    }
}


class Fighter {
    constructor(coordinate, s, speed, color) {
        this.coordinate = coordinate;
        this.s = s;
        this.color = color;

        this.speed = speed;
        this.velocity = new Vector(1, 0, this.speed);
        this.bearing = 0;

        //hull
        this.hull = new HullA(new Point(0, 0));

        //wings
        this.w1 = new LeftWing(this.hull.connections[0]);
        this.w2 = new RightWing(this.hull.connections[2]);

        //shooters
        this.s1 = new Shooter(this.w1.connections[1]);
        this.s2 = new Shooter(this.hull.connections[1]);
        this.s3 = new Shooter(this.w2.connections[1]);

        this.parts = [
            this.hull,
            this.s1,
            this.s2,
            this.s3,
            this.w1,
            this.w2
        ];
    }

    move() {
        this.coordinate = this.coordinate.sum(this.velocity);
    }

    steer(target) {
        let targetVector = new Vector(xComponent(this.coordinate, target), 
                                      yComponent(this.coordinate, target), 
                                      distance(this.coordinate, target));
        let targetBearing = targetVector.getAngle();
        this.bearing = this.velocity.getAngle();
        
        if(targetVector.magnitude > 0) {
            /*if(this.bearing < targetBearing && targetBearing < this.bearing+Math.PI) {
                this.bearing += Math.PI/180;
                this.bearing = this.bearing%(2*Math.PI);
            }
            else if(this.bearing+Math.PI > targetBearing && targetBearing > this.bearing+2*Math.PI) {
                this.bearing -= Math.PI/180;
                this.bearing = this.bearing%(2*Math.PI);
            }*/
            //console.log((targetBearing*180/Math.PI)+"; "+(targetBearingInverse*180/Math.PI)+"; "+(this.bearing*180/Math.PI));
            this.bearing = targetBearing%(2*Math.PI);
            this.velocity.setAngle(this.bearing);
            this.velocity.setMagnitude(this.speed);
        }

        else {
            this.velocity.setMagnitude(0);
        } 
    }

    shoot() {
        return [this.s1.shoot(this.coordinate, this.bearing),
                this.s2.shoot(this.coordinate, this.bearing),
                this.s3.shoot(this.coordinate, this.bearing)];
    }

    aim(target) {
        this.s1.aim(this.coordinate, target);
        this.s2.aim(this.coordinate, target);
        this.s3.aim(this.coordinate, target);
    }

    draw() {
        for(let i = 0; i < this.parts.length; i++) {
            if(typeof(this.parts[i].draw) == "function") {
                this.parts[i].draw(this.coordinate, this.bearing);
            }
        }
    }
}

class Squadron {
}

class Space {
    constructor() {
        this.white = new Fighter(new Point(0, 0), 10, 2, 'rgb(255, 255, 255)');
        this.red = new Fighter(new Point(canvas.width/2, canvas.height/2), 10, 1, 'rgb(255, 0, 0)');

        this.objects = [
            this.white,
            this.red
        ];
    }

    move() {
        for(let i = 0; i < this.objects.length; i++) {
            if(typeof(this.objects[i].move) == "function") {
                this.objects[i].move();
            }
        }
    }

    remove() {
        for(let i = this.objects.length-1; i >= 0; i--) {
            if(typeof(this.objects[i].isDead) == "function") {
                if(this.objects[i].isDead() == true) {
                    this.objects.splice(i, 1);
                }
            }
        }
    }
    draw() {
        background('rgb(0, 0, 0)');
        for(let i = 0; i < this.objects.length; i++) {
            if(typeof(this.objects[i].draw) == "function") {
                this.objects[i].draw();
            }
        }
    }
}

//Setup

let space = new Space();

//Drawing
function draw() {
    mouse = new Point(mouseX, mouseY);
    space.remove();
    
    space.white.aim(mouse);
    space.red.aim(space.white.coordinate);

    space.objects = space.objects.concat(space.red.shoot());

    if(spacePressed == true){
        space.objects = space.objects.concat(space.white.shoot());
    }

    space.white.steer(mouse);
    space.red.steer(space.white.coordinate);

    //space.white.moveX();
    //space.white.moveY();

    space.move();
    space.draw();
}

setInterval(draw, 10);