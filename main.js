const 
    /** Tile size for rendering */
    tSize=30,//37
    /**Board with in number of tiles */
    bWidth=10,//10
    /**I'm not sure what this does right now */
    extraWidth=5,
    /**Same with this */
    extraHeight=3,
    /**The height of the board in tiles */
    bHeight=20,//20
    /**Tells if the coords for each tile gets drawn */
    drawCoords=false,
    /**Change in  mRate after each tetromino is placed */
    dMove=0.5, //1: 
    /**Minimum value for time between movement */
    mRateMin=30,//1
    /**Time between each movement */
    mRate=80

/** @type {(string)[][]} */
var board=[[]],
    paused = false;

/**Initializes the board */
function makeBoard(){
    board=new Array(bWidth)
    for(let i=0;i<bWidth;i++)
        board[i]=new Array(bHeight)
}

/**Enum for directions and rotations */
const Dir={up:'up',down:'down',left:'left',right:'right'}

function v(x,y){return {x:x,y:y}}

/**Gets or sets the board at a coord */
function b(x,y,type){
    if(type!==undefined)
        board[x][y]=type
    else
        return board[x][y]
}

/**Checks to see if a point has a value */
function chkPt(x,y){
    return !(x<0||x>=board.length||y<0||y>=board[0].length||b(x,y));
}

/**@param {{x,y}[]}pts  Checks multiple points at once*/
function chkPts(...pts){
    for(let i=0;i<pts.length;i++){
        if(!chkPt(pts[i].x,pts[i].y))
            return false;
    }
    return true
}

/**Class that allows you to watch a value at a specific point and move it around */
class Selector{
    constructor(x,y,color){
        if(!chkPt(x,y))
            throw new Error('Invalid point')
        this.x=x
        this.y=y
        this.color=color
        b(x,y,color)
        this.hasMoved=false
        this.stillMoving=true
    }
    move(dir){
        if(dir===Dir.down){
            if(chkPt(this.x,this.y+1)){
                b(this.x,this.y+1,b(this.x,this.y))
                b(this.x,this.y++,'')
            }else{ 
                this.stillMoving=false
                return false
            }
        }else if(dir===Dir.left){
            if(chkPt(this.x-1,this.y)){
                b(this.x-1,this.y,b(this.x,this.y))
                b(this.x--,this.y,'')
            }else return false
        }else if(dir===Dir.right){
            if(chkPt(this.x+1,this.y)){
                b(this.x+1,this.y,b(this.x,this.y))
                b(this.x++,this.y,'')
            }else return false
        }else if(dir===Dir.up){
            if(chkPt(this.x,this.y-1)){
                b(this.x,this.y-1,b(this.x,this.y))
                b(this.x,this.y--,'')
            }else return false
        } 
        this.hasMoved=true
    }
    checkMove(dir){
        if(dir===Dir.down)
            return chkPt(this.x,this.y+1)
        else if(dir===Dir.left)
            return chkPt(this.x-1,this.y)  
        else if(dir===Dir.right)
            return chkPt(this.x+1,this.y)
        else if(dir===Dir.up)
            return chkPt(this.x,this.y-1)
    }
    moveIn(x,y){
        var nx=this.x+x,
            ny=this.y+y
        if(chkPt(nx,ny)){
            b(this.x,this.y,'')
            this.x=nx
            this.y=ny
            b(this.x,this.y,this.color)
        }
    }
}

/**
 * Sorts an array of points 
 * @param {Selector[]} arr 
 */
function sort(arr){
    return arr.sort((a,b)=>(a.x==b.x)?a.y-b.y:a.x-b.x);
}
/**
 * Sorts the points backwards
 * @param {Selector[]} arr 
 */
function sortBack(arr){
    return arr.sort((a,b)=>(b.x-a.x)+(b.y-a.y))
}

/**
 * Class for tracking four points as well as handling rotations
 */
class Tetromino{
    constructor(s1,s2,s3,s4,rotate,type){
        this.selectors=sort([s1,s2,s3,s4])
        this.state=Dir.up
        this.rotateFunc=rotate
        this.type = type
    }
    /**Stops watching all points */
    clear(){
        this.selectors=[];
    }
    /**Moves all selectors in a direction. Returns true if it was successful */
    move(dir){
        var canMove=true
        var sels=sortBack(this.selectors),
            clearAfter=false

        sels.forEach(sel=>{
            b(sel.x,sel.y,'')
            sel.hasMoved=false
            if(!sel.stillMoving)
                canMove=false
        })
        for(let i=0;i<sels.length;i++)
            if(!sels[i].checkMove(dir)){
                canMove=false
                if(dir===Dir.down){
                    sels[i].stillMoving=false
                    clearAfter=true
                }
            }
            
        sels.forEach(sel=>b(sel.x,sel.y,sel.color))

        if(canMove){
            while(sels.some(sel=>sel.hasMoved===false))
                sels.forEach(sel=>{if(!sel.hasMoved)sel.move(dir)})
        }

        this.selectors=sels
        if(clearAfter) {
            this.clear()
            return false;
        }
        return true;
    }
    rotate(){
        if(this.selectors.length===4)
            this.rotateFunc(this)
    }
}

//#region Render

/**@type {CanvasRenderingContext2D} */
var ctx

function drawAll(){
    ctx.clearRect(0,0,document.querySelector('canvas').width,document.querySelector('canvas').height)
    for(let i=0;i<board.length;i++){
        for(let j=0;j<board[i].length;j++){
            ctx.strokeStyle = 'lightgrey'
            ctx.strokeRect(i*tSize,j*tSize,tSize,tSize)
            if(b(i,j)!==undefined&&b(i,j)!==''){
                ctx.fillStyle=b(i,j)
                ctx.fillRect(i*tSize,j*tSize,tSize,tSize)
            }
            if(drawCoords)
                ctx.strokeText(i+','+j,(i+0.1)*tSize,(j+0.9)*tSize)
        }
    }
    ctx.strokeStyle = 'black'
    for(let i=0;i<board.length;i++){
        for(let j=0;j<board[i].length;j++){
            if(b(i,j)!==undefined&&b(i,j)!==''){
                ctx.strokeRect(i*tSize+2,j*tSize+2,tSize-4,tSize-4)
                ctx.beginPath()
                ctx.moveTo(i*tSize+2,j*tSize+2);
                ctx.lineTo((1+i)*tSize-2,(1+j)*tSize-2);
                ctx.moveTo(i*tSize+2,(1+j)*tSize-2);
                ctx.lineTo((1+i)*tSize-2,j*tSize+2);
                ctx.stroke();
            }
        }
    }
}

function animate(){
    requestAnimationFrame(animate)
    drawAll()
}

//#endregion Render

//#region Tetro

/**Constructs a basic Tetromino */
function T(c,v1,v2,v3,v4,rot,type){
    if(board[v1.x][v1.y] || board[v2.x][v2.y] || board[v3.x][v3.y] || board[v4.x][v4.y]) {
        return null;
    }
    return new Tetromino(
        new Selector(v1.x,v1.y,c),
        new Selector(v2.x,v2.y,c),
        new Selector(v3.x,v3.y,c),
        new Selector(v4.x,v4.y,c),
        rot,
        type
    )
}

function pieceI(){
    return T('skyblue',v(3,0),v(4,0),v(5,0),v(6,0),
        (t)=>{
            var s=sort(t.selectors)
            if(t.state==='up'){
                if(chkPts(v(s[0].x+1,s[0].y-1),v(s[2].x-1,s[2].y+1),v(s[3].x-2,s[3].y+2))){               
                    s[0].moveIn(1,-1)
                    s[2].moveIn(-1,1)
                    s[3].moveIn(-2,2)
                    t.state='right'
                }
            }else if(t.state==='right'){
                if(chkPts(v(s[0].x-1,s[0].y+1),v(s[2].x+1,s[2].y-1),v(s[3].x+2,s[3].y-2))){
                    s[0].moveIn(-1,1)
                    s[2].moveIn(1,-1)
                    s[3].moveIn(2,-2)
                    t.state='up'
                }
            }
        },"T"
    )
}
function pieceT(){
    return T('purple',v(3,1),v(4,1),v(4,0),v(5,1),
        (t)=>{
            var s=sort(t.selectors)
            if(t.state==='up'){
                if(chkPt(s[0].x+1,s[0].y+1)){
                    s[0].moveIn(1,1)
                    t.state='right'
                }
            }else if(t.state==='right'){
                if(chkPt(s[0].x-1,s[0].y+1)){
                    s[0].moveIn(-1,1)
                    t.state='down'
                }
            }else if(t.state==='down'){
                if(chkPt(s[3].x-1,s[3].y-1)){
                    s[3].moveIn(-1,-1)
                    t.state='left'
                }
            }else if(t.state==='left'){
                if(chkPt(s[3].x+1,s[3].y-1)){
                    s[3].moveIn(1,-1)
                    t.state='up'
                }
            }
        },"T"
    )
}
function pieceO(){
    return T('yellow',v(4,1),v(4,0),v(5,0),v(5,1),()=>{},"O")
}
function pieceS(){
    return T('green',v(3,1),v(4,1),v(4,0),v(5,0),
        (t)=>{
            var s=sort(t.selectors)
            if(t.state==='up'){
                if(chkPts(v(s[0].x+2,s[0].y+1),v(s[3].x,s[3].y+1))){
                    s[0].moveIn(2,1)
                    s[3].moveIn(0,1)
                    t.state='right'
                }
            }else if(t.state==='right'){
                if(chkPts(v(s[2].x,s[2].y-1),v(s[3].x-2,s[3].y-1))){
                    s[2].moveIn(0,-1)
                    s[3].moveIn(-2,-1)
                    t.state='up'
                }
            }
        },"S"
    )
}
function pieceZ(){
    return T('red',v(3,0),v(4,1),v(4,0),v(5,1),
        (t)=>{
            var s=sort(t.selectors)
            if(t.state==='up'){
                if(chkPts(v(s[0].x+2,s[0].y),v(s[1].x,s[1].y+2))){
                    s[0].moveIn(2,0)
                    s[1].moveIn(0,2)
                    t.state='right'
                }
            }else if(t.state==='right'){
                if(chkPts(v(s[1].x-1,s[1].y-2),v(s[2].x-1,s[2].y))){
                    s[1].moveIn(-1,-2)
                    s[2].moveIn(-1,0)
                    t.state='up'
                }
            }
        },"Z"
    )
}
function pieceJ(){
    return T('magenta',v(3,1),v(4,1),v(5,1),v(3,0),
        (t)=>{
            var s=sort(t.selectors)
            if(t.state==='up'){
                if(chkPts(v(s[3].x-1,s[3].y+1),v(s[0].x+2,s[0].y),v(s[1].x+1,s[1].y-1))){
                    s[3].moveIn(-1,1)
                    s[0].moveIn(2,0)
                    s[1].moveIn(1,-1)
                    t.state='right'
                }
            }else if(t.state==='right'){
                if(chkPts(v(s[1].x+1,s[1].y),v(s[2].x-1,s[2].y-2))){
                    s[1].moveIn(1,0)
                    s[2].moveIn(-1,-2)
                    t.state='down'
                }
            }else if(t.state==='down'){
                if(chkPts(v(s[0].x+1,s[0].y+2),v(s[1].x+1,s[1].y+2))){
                    s[0].moveIn(1,2)
                    s[1].moveIn(1,2)
                    t.state='left'
                }
            }else if(t.state==='left'){
                if(chkPts(v(s[0].x-1,s[0].y-2),v(s[3].x-2,s[3].y-1),v(s[1].x-1,s[1].y+1))){
                    s[0].moveIn(-1,-2)
                    s[3].moveIn(-2,-1)
                    s[1].moveIn(-1,1)
                    t.state='up'
                }
            }
        },"J"
    )
}
function pieceL(){
    return T('orange',v(3,1),v(4,1),v(5,1),v(5,0),
        (t)=>{
            var s=sort(t.selectors)
            if(t.state==='up'){
                if(chkPts(v(s[0].x+1,s[0].y-1),v(s[2].x,s[2].y+2),v(s[3].x-1,s[3].y+1))){
                    s[0].moveIn(1,-1)
                    s[2].moveIn(0,2)
                    s[3].moveIn(-1,1)
                    t.state='right'
                }
            }else if(t.state==='right'){
                if(chkPts(v(s[1].x-2,s[1].y-1),v(s[2].x-1,s[2].y-2),v(s[3].x,s[3].y-2))){
                    s[1].moveIn(-1,-1)
                    s[2].moveIn(-1,-1)
                    s[3].moveIn(0,-2)
                    t.state='down'
                }
            }else if(t.state==='down'){
                if(chkPts(v(s[0].x+2,s[0].y+2),v(s[1].x+2,s[1].y))){
                    s[1].moveIn(2,0)
                    s[0].moveIn(2,2)
                    t.state='left'
                }
            }else if(t.state==='left'){
                if(chkPts(v(s[0].x,s[0].y+1),v(s[3].x-2,s[3].y-1))){
                    s[0].moveIn(0,1)
                    s[3].moveIn(-2,-1)
                    t.state='up'
                }
            }
        },"L"
    )
}

//#endregion Tetro

//#region PieceChoice

/**@type {[string,()=>Tetromino][]} */
var pieceBag = [];
/**@type {pieceBag[0]} */
var nextPiece = undefined;
var store = undefined;

function fillBag() {
    pieceBag = [
        ["J",()=>pieceJ()],["L",()=>pieceL()],
        ["O",()=>pieceO()],["S",()=>pieceS()],
        ["T",()=>pieceT()],["Z",()=>pieceZ()], 
        ["I",()=>pieceI()]
    ];

    for (let i = 6; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieceBag[i], pieceBag[j]] = [pieceBag[j], pieceBag[i]];
    }
}

function rndPiece(){
    if (pieceBag.length == 0)
        fillBag();
    let cur = (nextPiece == undefined)?undefined:nextPiece[1];
    nextPiece = pieceBag.pop();
    return (typeof cur == 'function')?cur():undefined;
}

function storePiece(){
    if(p == undefined)
        return undefined;
    p.selectors.map(s=>{return {x:s.x,y:s.y}}).forEach(p=>board[p.x][p.y]="")
    p.clear();
    store = pieceFuncFromPiece(p);
    p=rndPiece();
}

/**
 * Takes a piece and returns it to the form of it in the bag
 * @param {Tetromino} piece 
 * @returns {[string,()=>Tetromino]}*/
function pieceFuncFromPiece(piece){
    switch (piece.type){
        case "J":return [piece.type, ()=>pieceJ()];
        case "O":return [piece.type, ()=>pieceO()];
        case "L":return [piece.type, ()=>pieceL()];
        case "T":return [piece.type, ()=>pieceT()];
        case "S":return [piece.type, ()=>pieceS()];
        case "I":return [piece.type, ()=>pieceI()];
        case "Z":return [piece.type, ()=>pieceZ()];
        default:return undefined;
    }
}

//#endregion PieceChoice


(function makeElements(){
    makeBoard()
    var c=document.createElement('canvas');
    c.style.display = 'inline-block'
    c.style.height = "100%";
    //c.style.width = "100%";
    ctx=c.getContext('2d')
    c.width=tSize*board.length
    c.height=tSize*board[0].length
    document.body.appendChild(c)
    animate()
})()

function resizeCanvas(){
    var c=document.querySelector('canvas')
    c.width=tSize*board.length
    c.height=tSize*board[0].length
}

/**Helper that makes removing a row of elements very easy */
function flipRowAndCol(arr){
    var t=new Array(arr[0].length)
    for(let i=0;i<arr[0].length;i++){
        t[i]=new Array(arr.length)
        for(let j=0;j<arr.length;j++)
            t[i][j]=arr[j][i]
    }
    return t
}

/**Checks for lines and clears them */
function checkAndClearMatches(){
    var cpy=flipRowAndCol(board),
        hasMatch=false,
        toAdd=0
    for(let i=0;i<cpy.length;i++){
        hasMatch=true
        for(let j=0;j<cpy[i].length;j++){
            if(cpy[i][j]===''||cpy[i][j]===undefined)
                hasMatch=false
        }
        if(hasMatch){
            cpy.splice(i--,1)
            toAdd++
        }
    }
    if (toAdd === 4) {
        alert("TETRIS!!")
    }
    for(let i=0;i<toAdd;i++)
        cpy.unshift(new Array(cpy[0].length))
    return flipRowAndCol(cpy)
}

//Called once to get the prev piece set up
rndPiece()
var p=rndPiece();


document.addEventListener('keydown',(event)=>{
    if(p!==null){
        if(['ArrowDown','s','S'].includes(event.key)&&lastMoved==0){
            //p.move(Dir.down)
            time.cur=time.max;
            lastMoved=new Date().getTime();
        }else if(['ArrowRight','d','D'].includes(event.key))
            p.move(Dir.right)
        else if(['ArrowLeft','a','A'].includes(event.key))
            p.move(Dir.left)
    }
});
document.addEventListener('keyup',(event)=>{
    if(p != null) {
        if(['ArrowUp','w','W'].includes(event.key)&&p!==undefined) {
            p.rotate()
            time.cur -= 5
        }
        if(['ArrowDown','s','S'].includes(event.key))
            lastMoved=0
        if(event.key == " "){
            let c = 0;
            while(p.move(Dir.down) && c++ < board[0].length);
        }
    }
});

var lastMoved=0;

class Counter{
    constructor(onComplete=()=>{},max,cur=0){
        this.onComplete=onComplete;
        this.cur=cur;
        this.max=max;
    }
    count(){
        this.cur++;
        while(this.cur>=this.max){
            this.cur-=this.max;
            this.onComplete();
        }
    }
}
var time=new Counter(()=>{
    moveDown()
    if(time.max!=mRate)
        time.max=mRate
    
},mRate);

setInterval(()=>{
    if(lastMoved && p != null){
        var newTime=new Date().getTime()
        if(lastMoved-newTime>5000){
            time.cur=time.max;
        }
        //console.log(newTime-lastMoved)
        
        
    }
    if(p != null && !paused) {
        time.count()
        document.getElementById('b').innerHTML=time.cur+""
    }
    
},10)

function start(){
    pieceBag = [];
    lastMoved = 0;
    time.cur = 0;
    mRate = 60;
   
    board = [[]];
    makeBoard();
    p = rndPiece();
}
 
function moveDown(){
    if(lastMoved!==0){
        t=new Date().getTime()-lastMoved;
    }        
    if (p == null) {
        return;
    }
    p.move(Dir.down)
    if(p.selectors.length===0){
        try{
            board=checkAndClearMatches()
            p=rndPiece()
            if(p == null) {
                return;
            }
            if(mRate>mRateMin)
                mRate-=dMove
            if(mRate<mRateMin)
                mRate=mRateMin
        }catch(e){
            noMove=false
        }
    }
    time.cur=0
}
moveDown()