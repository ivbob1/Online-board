
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let width = canvas.width;
let height = canvas.height;
let currentlineWidth = document.getElementById('lineWidth');
function updateCanvasSize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    width = canvas.width;
    height = canvas.height;
    sc_topLeft={x: 0, y:height};
    sc_bottomRight={x: width, y: 0};
    context = canvas.getContext('2d');
    context.globalAlpha = 1.0;
    context.imageSmoothingEnabled = true;
    context.lineCap = 'round';
}

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
function redraw(){
    for(let i=0; i < points.length; i++){
        drawLine( points[i].from, points[i].to,points[i].lineWidth/zoom_scale,points[i].color);
    }
}
window.onload = function() {
    updateCanvasSize();
    redraw();
};
window.onresize = function() {
    updateCanvasSize();
    console.log("ok");
    context.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
};

let currentPosition;
canvas.onmousemove = function(e) {
    currentPosition = getMousePosition(canvas, e);
};
let zoom_scale=1;
let zoom_scale_coef=0.1; 
let zoom_count=0;
function zoomIn(position){
    sc_topLeft.x += (position.x-sc_topLeft.x)*zoom_scale_coef;
    sc_topLeft.y -=(sc_topLeft.y-position.y)*zoom_scale_coef;
    sc_bottomRight.x += (position.x-sc_bottomRight.x)*zoom_scale_coef;
    sc_bottomRight.y -= (sc_bottomRight.y-position.y)*zoom_scale_coef;
    zoom_count++;
    zoom_scale=(1-zoom_scale_coef)**zoom_count
    context.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
}
function zoomOut(position){
    sc_topLeft.x -= (position.x-sc_topLeft.x)*(zoom_scale_coef/(1-zoom_scale_coef));
    sc_topLeft.y +=(sc_topLeft.y-position.y)*(zoom_scale_coef/(1-zoom_scale_coef));
    sc_bottomRight.x -= (position.x-sc_bottomRight.x)*(zoom_scale_coef/(1-zoom_scale_coef));
    sc_bottomRight.y += (sc_bottomRight.y-position.y)*(zoom_scale_coef/(1-zoom_scale_coef));
    zoom_count--;
    zoom_scale=(1-zoom_scale_coef)**zoom_count
    context.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
}
canvas.addEventListener('wheel', function(event) {
    let position = convert_to_cord(currentPosition);
    if (event.deltaY < 0) {
        zoomIn(position);
    } else if (event.deltaY > 0) {
        zoomOut(position);
    }
    event.preventDefault();
}, { passive: false });


function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;    
    let scaleY = canvas.height / rect.height; 
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

function drawLine(from, to, lineWidth,color) {
    context.lineWidth=lineWidth;
    context.strokeStyle=color;
    if(in_screen(from)||in_screen(to)){
        from=convert_to_pix(from)
        to=convert_to_pix(to)
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
    }
}
document.getElementById('zoomIn_button').addEventListener('click', function() {
    zoomIn({x:width/2,y:height/2});
});

document.getElementById('zoomOut_button').addEventListener('click', function() {
    zoomOut({x:width/2,y:height/2});
});
let tools = {
    brush: {
        mousedown: function(e) {
            canvas.addEventListener('mousemove', tools.brush.mousemove);
            lastPosition = getMousePosition(canvas, e);
        },
        mousemove: function(e) {
            currentPosition = getMousePosition(canvas, e);
            if((currentPosition.x-lastPosition.x)**2+(currentPosition.y-lastPosition.y)**2>currentlineWidth.value){
                socket.emit('draw', { from: convert_to_cord(lastPosition), to: convert_to_cord(currentPosition) , lineWidth: (currentlineWidth.value),color: color_pic.value});
                lastPosition = currentPosition;
            }
        },
        mouseup: function() {
            canvas.removeEventListener('mousemove', tools.brush.mousemove);
        }
    },
    eraser: {
        mousedown: function(e) {
            canvas.addEventListener('mousemove', tools.eraser.mousemove);
            lastPosition = getMousePosition(canvas, e);
        },
        mousemove: function(e) {
            currentPosition = getMousePosition(canvas, e);
            let R = circleRadius.value*(sc_topLeft.y-sc_bottomRight.y)/(height);
            socket.emit('erase', { R: R, center:convert_to_cord(currentPosition)});
            lastPosition = currentPosition;
        },
        mouseup: function() {
            canvas.removeEventListener('mousemove', tools.eraser.mousemove);
        },
        mousemovecircle : function(e) {
            cursorCircle.style.display = 'block';
            cursorCircle.style.top = Math.round(e.pageY - circleRadius.value ) + 'px'; // Смещаем круг на половину его высоты
            cursorCircle.style.left = Math.round(e.pageX - circleRadius.value ) + 'px'; // Смещаем круг на половину его ширины
            cursorCircle.style.height = circleRadius.value*2 + 'px'; // Изменяем размер круга
            cursorCircle.style.width = circleRadius.value*2 + 'px'; // Изменяем размер круга
        },
        mouseoutcircle : function() {
            cursorCircle.style.display = 'none';
        }
    },
    move: {
        mousedown: function(e) {
            canvas.addEventListener('mousemove', tools.move.mousemove);
            lastPosition = getMousePosition(canvas, e);
        },
        mousemove: function(e) {
            currentPosition = getMousePosition(canvas, e);
            let currentPosition_cord=convert_to_cord(currentPosition);
            let lastPosition_cord=convert_to_cord(lastPosition);
            let posdiff={x: (currentPosition_cord.x-lastPosition_cord.x),y: (currentPosition_cord.y-lastPosition_cord.y)};
            sc_bottomRight={x: sc_bottomRight.x-posdiff.x,y: sc_bottomRight.y-posdiff.y};
            sc_topLeft={x: sc_topLeft.x-posdiff.x,y: sc_topLeft.y-posdiff.y};
            context.clearRect(0, 0, canvas.width, canvas.height);
            redraw();
            lastPosition = currentPosition;
        },
        mouseup: function() {
            canvas.removeEventListener('mousemove', tools.move.mousemove);
        }
    }
};
let activeTool = null;
function selectTool(tool) {
    if (activeTool) {
        activeTool.classList.remove('active');
        // Удалить старые обработчики событий
        if(tools.hasOwnProperty(activeTool.id)){
            canvas.removeEventListener('mousedown', tools[activeTool.id].mousedown);
            canvas.removeEventListener('mouseup', tools[activeTool.id].mouseup);
        }
        if(activeTool.id=='eraser'){    
            cursorCircle.style.display = 'none';
            canvas.removeEventListener('mousemove', tools.eraser.mousemovecircle);
            canvas.removeEventListener('mouseout', tools.eraser.mouseoutcircle);
        }
    }
    tool.classList.add('active');
    activeTool = tool;
    // Добавить новые обработчики событий
    console.log(tool.id);
    if(tools.hasOwnProperty(tool.id)){
        canvas.addEventListener('mousedown', tools[tool.id].mousedown);
        canvas.addEventListener('mouseup', tools[tool.id].mouseup);
    }
    if(tool.id=='eraser'){
        canvas.addEventListener('mousemove', tools.eraser.mousemovecircle);
        canvas.addEventListener('mouseout', tools.eraser.mouseoutcircle);
    }
}

document.getElementById('move').addEventListener('click', function() {
    selectTool(this);
    brushModal.style.display = "none";
    eraserModal.style.display = "none";
});
document.getElementById('erase').addEventListener('click', function() {
    socket.emit('erase_all');
});
let cursorCircle = document.getElementById('cursorCircle');
let circleRadius = document.getElementById('circleRadius');
let brushModal = document.getElementById("brushModal");
let eraserModal = document.getElementById("eraserModal");
let brushBtn = document.getElementById("brush");
let eraserBtn = document.getElementById("eraser");
let span = document.getElementsByClassName("close_brush")[0];
let color_pic = document.getElementById("colorPicker");
// Открываем модальное окно только при нажатии на кнопку "Кисть"
brushBtn.onclick = function() {
    selectTool(brushBtn);
    if(brushModal.style.display == "block"){
        brushModal.style.display = "none";
    }else{
        brushModal.style.display = "block";
    }
    eraserModal.style.display = "none";
}
eraserBtn.onclick = function() {
    selectTool(eraserBtn);
    brushModal.style.display = "none";
    if(eraserModal.style.display == "block"){
        eraserModal.style.display = "none";
    }else{
        eraserModal.style.display = "block";
    }
}

span.onclick = function() {
    brushModal.style.display = "none";
}
eraserModal.getElementsByClassName('close_eraser')[0].onclick = function() {
    eraserModal.style.display = 'none';
}

let socket = io.connect('http://' + document.domain + ':' + location.port + '/draw');
socket.on('connect', function() {
    socket.emit('join1');
});
socket.on('draw', function(data) {
    points.push(data);
    drawLine(data.from,data.to, data.lineWidth/zoom_scale,data.color);
});
socket.on('erase_all', function() {
    points=[];
    context.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
});
socket.on('erase', function(data) {
    points_new= [];
    for(let i=0;i<points.length;i++){
        let x1=points[i].from.x;
        let y1=points[i].from.y;
        let x3=points[i].to.x;
        let y3=points[i].to.y;
        let x2=data.center.x;
        let y2=data.center.y;
        if((x1-x2)**2+(y1-y2)**2>data.R*data.R&&(x3-x2)**2+(y3-y2)**2>data.R*data.R){
            points_new.push(points[i]);
        }
    }
    points=points_new;
    context.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
});
