
let canvas = document.getElementById('canvas');
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.9;

canvas.style.width = `${window.innerWidth * 0.9}px`;
canvas.style.height = `${window.innerHeight * 0.9}px`;

let context = canvas.getContext('2d');
let width = canvas.width;
let height = canvas.height;

currentlineWidth = 4;
context.globalAlpha = 1.0;
context.imageSmoothingEnabled = true;
context.lineCap = 'round';

let drawing = false;
let lastPosition = { x: 0, y: 0 };

let sc_topLeft={x: 0, y:height} 
let sc_bottomRight={x: width, y: 0};
function in_screen(x,y){
    if(x<sc_topLeft.x||y>sc_topLeft.y||x>sc_bottomRight.x||y<sc_bottomRight.y){
        return false;
    }else{
        return true;
    }
}
function convert_to_pix(x,y){
    x-=sc_topLeft.x;
    y-=sc_topLeft.y;
    return { x:Math.round((x*width)/(sc_bottomRight.x-sc_topLeft.x)), y:Math.round((-y*height)/(sc_topLeft.y-sc_bottomRight.y)) }; 
}
function convert_to_cord(x,y){
    x=x*(sc_bottomRight.x-sc_topLeft.x)/(width);
    y=-y*(sc_topLeft.y-sc_bottomRight.y)/(height)
    x+=sc_topLeft.x
    y+=sc_topLeft.y
    return { x: x, y: y }; 
}
function convert_to_pix(point){
    let x=point.x;
    let y=point.y;
    x-=sc_topLeft.x;
    y-=sc_topLeft.y;
    return { x:Math.round((x*width)/(sc_bottomRight.x-sc_topLeft.x)), y:Math.round((-y*height)/(sc_topLeft.y-sc_bottomRight.y)) }; 
}
function convert_to_cord(point){
    let x=point.x;
    let y=point.y;
    x=x*(sc_bottomRight.x-sc_topLeft.x)/(width);
    y=-y*(sc_topLeft.y-sc_bottomRight.y)/(height)
    x+=sc_topLeft.x
    y+=sc_topLeft.y
    return { x: x, y: y }; 
}
window.onload = function() {
    for(let i=0; i < points.length; i++){
        drawLine( points[i].from, points[i].to,points[i].lineWidth/zoom_scale);
    }
};

canvas.onmousedown = function(e) {
    drawing = true;
    lastPosition = getMousePosition(canvas, e);
};

canvas.onmouseup = function() {
    drawing = false;
};
let currentPosition;
canvas.onmousemove = function(e) {
    currentPosition = getMousePosition(canvas, e);
    if(drawing) {
        if((currentPosition.x-lastPosition.x)**2+(currentPosition.y-lastPosition.y)**2>currentlineWidth){
            socket.emit('draw', { from: convert_to_cord(lastPosition), to: convert_to_cord(currentPosition) , lineWidth: (currentlineWidth*zoom_scale) });
            lastPosition = currentPosition;
        }
    }
};
let zoom_scale=1;
let zoom_scale_coef=0.1; 
let zoom_count=0;
canvas.addEventListener('wheel', function(event) {
    let position = convert_to_cord(currentPosition);
    if (event.deltaY < 0) {
        sc_topLeft.x += (position.x-sc_topLeft.x)*zoom_scale_coef;
        sc_topLeft.y -=(sc_topLeft.y-position.y)*zoom_scale_coef;
        sc_bottomRight.x += (position.x-sc_bottomRight.x)*zoom_scale_coef;
        sc_bottomRight.y -= (sc_bottomRight.y-position.y)*zoom_scale_coef;
        zoom_count++;
    } else if (event.deltaY > 0) {
        sc_topLeft.x -= (position.x-sc_topLeft.x)*(zoom_scale_coef/(1-zoom_scale_coef));
        sc_topLeft.y +=(sc_topLeft.y-position.y)*(zoom_scale_coef/(1-zoom_scale_coef));
        sc_bottomRight.x -= (position.x-sc_bottomRight.x)*(zoom_scale_coef/(1-zoom_scale_coef));
        sc_bottomRight.y += (sc_bottomRight.y-position.y)*(zoom_scale_coef/(1-zoom_scale_coef));
        zoom_count--;
    }
    zoom_scale=(1-zoom_scale_coef)**zoom_count
    console.log(zoom_scale);
    console.log((sc_bottomRight.x-sc_topLeft.x));
    context.clearRect(0, 0, canvas.width, canvas.height);
    window.onload();
    // Предотвращаем прокрутку страницы
    event.preventDefault();
}, { passive: false });


function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function drawLine(from, to, lineWidth) {
    context.lineWidth=lineWidth;
    if(in_screen(from)||in_screen(to)){
        from=convert_to_pix(from)
        to=convert_to_pix(to)
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
    }
}   
let socket = io.connect('http://' + document.domain + ':' + location.port + '/draw');
socket.on('connect', function() {
    socket.emit('join1');
});
socket.on('draw', function(data) {
    points.push(data);
    console.log(data.lineWidth)
    drawLine(data.from,data.to, data.lineWidth/zoom_scale);
});