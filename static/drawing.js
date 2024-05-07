
let canvas = document.getElementById('canvas');
// canvas.width = window.innerWidth * 0.9;
// canvas.height = window.innerHeight * 0.9;

// canvas.style.width = `${window.innerWidth * 0.9}px`;
// canvas.style.height = `${window.innerHeight * 0.9}px`;
let context = canvas.getContext('2d');
let width = canvas.width;
let height = canvas.height;
let currentlineWidth = 4;
function updateCanvasSize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    width = canvas.width;
    height = canvas.height;
    sc_topLeft={x: 0, y:height};
    sc_bottomRight={x: width, y: 0};
    context = canvas.getContext('2d');
    currentlineWidth = 4;
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
function redraw(){
    for(let i=0; i < points.length; i++){
        drawLine( points[i].from, points[i].to,points[i].lineWidth/zoom_scale);
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
    // Предотвращаем прокрутку страницы
    event.preventDefault();
}, { passive: false });


function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;    // отношение реального размера к размеру CSS
    let scaleY = canvas.height / rect.height;  // отношение реального размера к размеру CSS
    return {
        x: (event.clientX - rect.left) * scaleX,   // масштабирование координат мыши после учета прокрутки страницы
        y: (event.clientY - rect.top) * scaleY
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
            if((currentPosition.x-lastPosition.x)**2+(currentPosition.y-lastPosition.y)**2>currentlineWidth){
                socket.emit('draw', { from: convert_to_cord(lastPosition), to: convert_to_cord(currentPosition) , lineWidth: (currentlineWidth) });
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
            let Top
            socket.emit('erase', { topLeft: topLeft, bottomRight: bottomRight});
            lastPosition = currentPosition;
        },
        mouseup: function() {
            canvas.removeEventListener('mousemove', tools.brush.mousemove);
        }
    },
    // Добавьте здесь другие инструменты...
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
    }
    tool.classList.add('active');
    activeTool = tool;
    // Добавить новые обработчики событий
    console.log(tool.id);
    if(tools.hasOwnProperty(tool.id)){
        canvas.addEventListener('mousedown', tools[tool.id].mousedown);
        canvas.addEventListener('mouseup', tools[tool.id].mouseup);
    }
}

document.getElementById('brush').addEventListener('click', function() {
    selectTool(this);

    // Код для выбора кисти
});

document.getElementById('eraser').addEventListener('click', function() {
    selectTool(this);
    // Код для выбора ластика
});

document.getElementById('move').addEventListener('click', function() {
    selectTool(this);
    // Код для выбора инструмента перемещения
});
let modal = document.getElementById("brushModal");
let brushBtn = document.getElementById("brush");
let span = document.getElementsByClassName("close")[0];

// Открываем модальное окно только при нажатии на кнопку "Кисть"
brushBtn.onclick = function() {
  modal.style.display = "block";
}

// Закрываем модальное окно при нажатии на "x"
span.onclick = function() {
  modal.style.display = "none";
}

// Закрываем модальное окно, если пользователь кликнул вне его
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
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
socket.on('erase', function(data) {
    points.push(data);
    console.log(data.lineWidth)
    drawLine(data.from,data.to, data.lineWidth/zoom_scale);
});