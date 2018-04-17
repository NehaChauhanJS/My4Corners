/**
 * Created by chirag on 12-Dec-14.
 */
/**
 * Main Application Function
 * @param {Object} options
 */
CanvasDraw = function(options) {
	"use strict";
	var defaults = {
		width : 500,
		height : 500,
		defaultColor : "#00000",
		defaultStroke : 4
	}, 
	tools = [
		"share",
		"draw",
		"line",
		"rectangle",
        "circle",
        "trash"
	],
	settings = $.extend(defaults, options), 
	CD={};
	CD.points=[];

	/*Socket.io callbacks*/
	
	/**
	 * Clear content from shared canvas
	 * @param {Object} data
	 */
    /*(8)*/
	function eraseShared(data){
		if(CD.thisObj[data.id]){
            CD.thisObj[data.id].ctx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
		}
	}
	
	/**
	 * Create the list of shared users
	 * @param {Object} data
	 */
    /*(3)*/
	function setUserList(data){
		
		//Build HTML
		$("body").append(buildUsersList(data));
		$('.userListWrapper').on('shown', function () {
			$(".userList li").click(function(){
				//announce new user added
                CD.thisObj.socket.emit('requestShare', {senderId : CD.thisObj.id, listenerId : $(this).attr("data-id"), senderName : CD.myName}); //callback createNewClient
			});
		});
		$('.userListWrapper').modal("show");
	}
	
	/**
	 * Delete user id from share user list in case of
     * logout or closing browser window
	 * @param {Object} data
	 */
    /*(11)*/
	function deleteShared(data){
        CD.thisObj.find("#" + data.id).remove();
	}
	/**
	 * Generate alert for share confirmation.
     * Create a new canvas on that users instance if request is accepted.
	 * @param {Object} data
	 */
    /*(9)*/
	function createNewClient(data){
		
		if(CD.thisObj.id === data.listenerId && !CD.thisObj[data.senderId]){ //test to see if this instance is the one i want.
			if(confirm(data.senderName + " wants to share their canvas.")){
                CD.thisObj.socket.emit('confirmShare', {isSharing : true, senderId : data.senderId, listenerId : CD.thisObj.id, senderName : CD.myName});
                CD.isSharing = true; //you are now sharing
				createSharedCanvas(data.senderId);
			} else { //not sharing
                CD.thisObj.socket.emit('confirmShare', {isSharing : false, senderId : data.senderId, listenerId : CD.thisObj.id, senderName : CD.myName});
			}
		}
	}
	
	/**
	* Generate alert if share request is accepted
	* @param {Object} data
	*/
    /*(12)*/
	function setConfirmShare(data){
		var message="";
		
		if(CD.thisObj.id === data.senderId){
			if(data.isSharing){
				message = data.senderName + " has agreed to share.";
				//create new canvas
                CD.isSharing = true;
				createSharedCanvas(data.listenerId);
			} else {
				message = data.senderName + " has NOT agreed to share.";
			}
			alert(message);
		}
	}
	/**
	 * draws on canvas - Line or basic drawing tool
	 * @param {Object} data
	 */ /*(5)*/
	function draw(data, fromMe){

		if(CD.thisObj[data.id]){
			var eventType = eventTypes(),
			ctx = CD.thisObj[data.id].ctx,
                tempCtx = CD.thisObj.temp.ctx;

			ctx.strokeStyle = data.color;
			ctx.lineWidth = data.stroke;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";

            tempCtx.strokeStyle = data.color;
            tempCtx.lineWidth = data.stroke;
            tempCtx.lineCap = "round";
            tempCtx.lineJoin = "round";

			if (data.type === eventType.down) {
                CD.okToDraw = true;
				if(fromMe && !data.isLineDrawing){
                    CD.points.push({x : data.x, y : data.y});
				} else if(data.isLineDrawing) {	//for line drawing we only need the coords
                    CD.thisObj[data.id].x = data.x;
                    CD.thisObj[data.id].y = data.y;
				} else { //from a shared canvas
					ctx.beginPath();
					ctx.moveTo(data.x, data.y);
				}
			} else if ((data.type === eventType.move) && CD.okToDraw) {

			    if(data.isLineDrawing && fromMe) {	//draw the line on a temp canvas
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    tempCtx.beginPath();
                    tempCtx.moveTo(CD.thisObj[data.id].x, CD.thisObj[data.id].y);
                    tempCtx.lineTo(data.x, data.y);
                    tempCtx.stroke();
				} else if(fromMe){
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    CD.points.push({x : data.x, y : data.y});
					drawPoints(tempCtx);
				} else if(!data.isLineDrawing) { //this is coming from drawing a shared canvas
					ctx.lineTo(data.x, data.y);
					ctx.stroke();
				}
			} else if(data.type === eventType.up){
				if(data.isLineDrawing) {	//when done put the temp line on the temp canvas
					ctx.beginPath();
					ctx.moveTo(CD.thisObj[data.id].x, CD.thisObj[data.id].y);
					ctx.lineTo(data.x, data.y);
					ctx.stroke();
					ctx.closePath();
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
				} else if(fromMe){  
					ctx.drawImage(CD.tempCanvas, 0, 0);
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
				} else {
					ctx.closePath();
				}
                CD.okToDraw = false;
                tempCtx.closePath();
                CD.points = [];
                CD.isLineDrawing = false;
			}
		}
	
	}

    /**
     * draws on canvas - rectangle
     * @param {Object} data
     */
    /*(6)*/
    function drawRectangle(DTR, fromMe){

        if(CD.thisObj[DTR.id]){
            var eventType = eventTypes(),
                ctx = CD.thisObj[DTR.id].ctx,
                tempCtx = CD.thisObj.temp.ctx;

            ctx.strokeStyle = DTR.color;
            ctx.fillStyle =DTR.style;
            ctx.lineWidth = DTR.stroke;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            tempCtx.strokeStyle = DTR.color;
            tempCtx.fillStyle =DTR.style;
            tempCtx.lineWidth =DTR.stroke;
            tempCtx.lineCap = "round";
            tempCtx.lineJoin = "round";

            var fillShapes = true;
            //check the checkbox here to fill colours.
            CD.thisObj.getFillShapesStatus = function(){
                return $("#fillShapes").prop("checked");
            };

            if (DTR.type === eventType.down) {
                CD.okToDraw = true;
                if(fromMe && !DTR.isRectangle){
                    CD.points.push({x : DTR.x, y : DTR.y});
                } else if(DTR.isRectangle) {
                    console.log("down");
                    CD.thisObj[DTR.id].x = DTR.x;
                    CD.thisObj[DTR.id].y = DTR.y;

                } else { //from a shared canvas
                    ctx.beginPath();
                    ctx.moveTo(DTR.x, DTR.y);
                }
            } else if ((DTR.type === eventType.move) && CD.okToDraw) {

                if(DTR.isRectangle && fromMe) {	//draw the rect on a temp canvas
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    if(CD.thisObj.getFillShapesStatus()) {
                        tempCtx.fillRect(DTR.x,DTR.y, 50,50);
                    }
                    tempCtx.strokeRect(DTR.x,DTR.y, 50,50);
                    console.log("movee");
                } else if(fromMe){
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    CD.points.push({x : DTR.x, y : DTR.y});
                    drawPoints(tempCtx);
                } else if(!data.isRectangle) { //this is coming from a shared canvas
                   ctx.strokeRect(DTR.x,DTR.y, 50,50);
                }
            } else if(DTR.type === eventType.up){
                if(DTR.isRectangle) {	//when done put the temp rect on the temp canvas
                    ctx.strokeRect(DTR.x,DTR.y, 50,50);
                    if(CD.thisObj.getFillShapesStatus()) {
                        ctx.fillRect(DTR.x,DTR.y, 50,50);
                    }
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    console.log("upup");
                } else if(fromMe){
                    ctx.drawImage(CD.tempCanvas, 0, 0);
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                } else {
                    ctx.closePath();
                }
                CD.okToDraw = false;
                tempCtx.closePath();

                CD.points = [];
                CD.isRectangle = false;
            }
        }

    }

    /**
     * draws on canvas - Circle
     * @param {Object} data
     */
    /*(7)*/
    function drawCircle(DTC, fromMe){

        if(CD.thisObj[DTC.id]){
            var eventType = eventTypes(),
                ctx = CD.thisObj[DTC.id].ctx,
                tempCtx = CD.thisObj.temp.ctx;

            ctx.strokeStyle =DTC.color;
            ctx.fillStyle =DTC.style;
            ctx.lineWidth = DTC.stroke;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            tempCtx.strokeStyle =DTC.color;
            tempCtx.fillStyle =DTC.style;
            tempCtx.lineWidth = DTC.stroke;
            tempCtx.lineCap = "round";
            tempCtx.lineJoin = "round";

            var fillShapes = true;
            //check the checkbox here to fill colours.
            CD.thisObj.getFillShapesStatus = function(){
                return $("#fillShapes").prop("checked");
            };

            if(DTC.isErase){
                ctx.globalCompositeOperation = "destination-out";
                tempCtx.globalCompositeOperation = "destination-out";
            } else {
                ctx.globalCompositeOperation = "source-over";
                tempCtx.globalCompositeOperation = "source-over";
            }

            if (DTC.type === eventType.down) {
                CD.okToDraw = true;
                if(fromMe && !DTC.isCircle){
                    CD.points.push({x : DTC.x, y : DTC.y});
                } else if(DTC.isCircle) {
                    console.log("down");
                    CD.thisObj[DTC.id].x = DTC.x;
                    CD.thisObj[DTC.id].y = DTC.y;

                } else { //from a shared canvas
                    ctx.beginPath();
                    ctx.moveTo(DTC.x, DTC.y);
                }
            } else if ((DTC.type === eventType.move) && CD.okToDraw) {


                if(DTC.isCircle && fromMe) {
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    tempCtx.beginPath();
                    tempCtx.arc(DTC.x,DTC.y,50,0,Math.PI*2,false);
                    if(CD.thisObj.getFillShapesStatus()) {
                        tempCtx.fill();
                    }
                    tempCtx.stroke();

                    console.log("movee");
                } else if(fromMe){
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    CD.points.push({x : DTC.x, y : DTC.y});
                    drawPoints(tempCtx);
                } else if(!DTC.isCircle) { //this is coming from a shared canvas
                    ctx.arc(DTC.x,DTC.y,50,0,Math.PI*2,false);
                    ctx.stroke();
                }
            } else if(DTC.type === eventType.up){
                if(DTC.isCircle) {
                    ctx.beginPath();
                    ctx.arc(DTC.x,DTC.y,50,0,Math.PI*2,false);

                    ctx.stroke();

                    ctx.closePath();
                    if(CD.thisObj.getFillShapesStatus()) {
                        ctx.fill();
                    }
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    console.log("upup");
                } else if(fromMe){
                    ctx.drawImage(CD.tempCanvas, 0, 0);
                    tempCtx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                } else {
                    ctx.closePath();
                }
                CD.okToDraw = false;
                tempCtx.closePath();

                CD.points = [];
                CD.isCircle = false;
            }
        }

    }
    /*(16)*/

    function filll(){

        var clr = "#" + $("#strokeColor").val();
        var fill ="#" + $("#fillColor").val();
        var stroke = $("#strokeSize").val();

        return{
            "clr": clr,
            "fil": fill,
            "strk": stroke
        };
    }

	/**
	 * Simple Random Id Generator for main canvas
	 * @param {int} strLength
	 */
    /*(1)*/
	function getCanvasID(strLength) {
		var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz", randomstring = '', rnum, i;
		if (strLength === undefined) {
			strLength = 5;
		}
		for ( i = 0; i < strLength; i++) {
			rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum, rnum + 1);
		}
		return randomstring;
	}
	
	/**
	 * Creates a shared Canvas instance
	 * @param {int} id
	 */
    /*(10)*/
	function createSharedCanvas(id) {

		if (!CD.thisObj[id]) {
			var sharedCanvas = document.createElement('canvas'),
			canvas = CD.thisObj.find("#" + CD.thisObj.id);
			
			sharedCanvas.id = id;
			sharedCanvas.width = canvas.width();
			sharedCanvas.height = canvas.height();

			$(sharedCanvas).addClass("sharedCanvas");

            CD.thisObj[id] = {};
            CD.thisObj[id].ctx = sharedCanvas.getContext('2d');

			$(CD.thisObj).append(sharedCanvas);
		}
	}
	
	/**
	 * create the tool bar
	 */ /*(2)*/
	function createToolBar(){
		var i, 
		len = tools.length,
		tool="";
		for(i=0; i < len;i+=1) {
			tool +=  "<li data-toggle='tooltip' data-placement='right' data-original-title='" + tools[i] + "' class='sprite " + tools[i] + "'></li>"; 
		}
		
		return "<ul class='toolbar'>" + tool + "</ul>";
	}

    /*create header*/
    function createHeader(){
        return '<div id="bg_top">' +
            '<h4 class="poswelc"><span>welcome :</span></h4>'+
           '<h2 class="postitle">My<span>4</span>Corners</h2>' +
            '<a class="poslog" href="/logout"><h4 class="hw">Log out</h4></a>'
            '</div>';
    }
    function _welcome(){
        return '<div id="bg_top">' +
        '<h4 class="poswelc"><span>welcome :'+ CD.myName + '</span></h4>'+
            '<h2 class="postitle">My<span>4</span>Corners</h2>' +
            '<a class="poslog" href="/logout"><h4 class="hw">Log out</h4></a>'
            '</div>';
    }

    /*create color Tool*/
    function createColorTool(){
        return '<div id="drawCommands">'+
                    '<ul >'+
                        '<li>' +
                            ' Fill color :' +
                            '<input id="fillColor" class="color" value="FFFFF"/></li>'+
                        '<li>' +
                            'Stroke color :' +
                            '<input id="strokeColor" class="color" value="000000"/></li>'+
                        '<li>' +
                            'Stroke size :' +
                            '<input id="strokeSize" type="range" min="0" max="20" value="1" step="0.5" style="position:relative;top:6px;"/></li>'+
                        '<li>' +
                            'Fill shapes :' +
                            '<input id="fillShapes" type="checkbox" checked/></li>'+
                    '</ul>'+
                '</div>';
    }


	/**
	 * Builds a model box for user to create a user name.
	 */
    /*(17)*/
	function buildUserCreate(){
		return '<div class="modal fade userNameModal">' +
		'<div class="modal-header">' +
		'<h3>Create a user name.</h3>' +
		'</div>' +
		'<div class="modal-body">' +
		'<input type="text" size="30" name="name" class="userNameInput">' +
		'</div>' +
		'<div class="modal-footer">' +
		'<a href="#" class="btn confirm" data-dismiss="modal">Confirm</a>' +
		'</div>' +
		'</div>';
	}
	
	/**
	 * Builds a User list
	 * @param {Object} userList
	 */
    /*(4)*/
	function buildUsersList(userList){
		var uList="", key="", clientCount=0, modal;
		
		
		for(key in userList) {
			var sharing = "";
			if(userList[key].id !== CD.thisObj.id){

                CD.thisObj[key]? sharing = " - ( X )" : sharing = "";
				uList += "<li data-dismiss='modal' data-id='" + userList[key].id + "'>" + userList[key].senderName + sharing + "</li>";
				clientCount++;
			}
		}
		//clear any old lists
		$(".userListWrapper").remove();
		
		//create modal
		modal = '<div class="modal fade userListWrapper">' +
		'<div class="modal-header">' +
		'<h3>Users to share with</h3>' +
		'</div>' +
		'<div class="modal-body">' +
		'<ul class="userList">' + uList + '</ul>' +
		'</div>' +
		'<div class="modal-footer">' +
		'<a href="#" class="btn" data-dismiss="modal">Close</a>' +
		'</div>' +
		'</div>';

		if(clientCount === 0) {
			alert("There are no other users at this time.");
		}
		
		return clientCount > 0 ? modal : ""; //only show this if there are users to share with
		
	}
	/**
	 * Maps Coords to mouse location.
	 */
    /*(15)*/
	function getCoordinates(e) {
		var _x = 0, _y = 0;
		 if (e.layerX || e.layerX === 0) {
			_x = e.layerX;
			_y = e.layerY;
		} else {
			_x = e.pageX - $(CD.mainCanvas).offset().left;
			_y = e.pageY - $(CD.mainCanvas).offset().top;
		}

		return {
			"x" : _x,
			"y" : _y
		};
	}
	
	/**
	 * Determine event types and assigns the correct event types
	 */
    /*(14)*/
	function eventTypes(){
		return {
			down :  "mousedown",
			move :  "mousemove",
			up :  "mouseup",
			out : "mouseout"
		};
	}

	/**
	 * Adds the event handlers
	 */ /*(13)*/
	function setEventHandlers(){
		var eventType = eventTypes(),
		events = eventType.down + " " + eventType.move + " " + eventType.up + " " + eventType.out;

        //update shared user list if any user log out
		window.onbeforeunload = function(e) {
            CD.thisObj.socket.emit('deleteSharedById', {id : CD.thisObj.id});
            console.log("user logged out");
		};
		
		$(".toolbar li").tooltip(options);
		
		//events for tool bar
		$(".toolbar").find(".sprite").click(function(){
            CD.isDrawing = false;
            CD.isLineDrawing = false;
            CD.isType = false;
            CD.isRectangle=false;
            CD.isCircle=false;
			//clear selected
			$(".sprite").removeClass("selected");
			if($(this).hasClass(tools[0])){			//share
				//Get Users List
                CD.thisObj.socket.emit("getUserList");
			} else if($(this).hasClass(tools[1])){		//draw
				$(this).addClass("selected");
                CD.isDrawing = true;
			} else if($(this).hasClass(tools[2])){		//line
				$(this).addClass("selected");
                CD.isLineDrawing = true;
			}  else if($(this).hasClass(tools[3])){		//rectangle
                $(this).addClass("selected");
                CD.isRectangle = true;
            }
            else if($(this).hasClass(tools[4])){		//circle
                $(this).addClass("selected");
                CD.isCircle = true;
            }
            else if($(this).hasClass(tools[5])){		//trash
				$("body").prepend('<div class="alert alert-block alert-error fade in">' +
				'<h4>Oh Snap you sure?!</h4>' +
				'<p>Are you sure you want to clear your drawpad.</p><br/>' +
				'<a class="btn btn-danger" href="#" data-dismiss="alert">Clear Drawing</a> <a class="btn btn-default" href="#" data-dismiss="alert">NO don\'t!</a>' +
				'</div>');
				$(".btn-danger").click(function(){
                    CD.thisObj[CD.thisObj.id].ctx.clearRect(0, 0, CD.mainCanvas.width, CD.mainCanvas.height);
                    CD.thisObj.socket.emit("eraseRequestById",{id : CD.thisObj.id});
				});
				$(".alert").show().alert();
			}
		}).hover(function(){
			$(this).addClass("hover");
		},function(){
			$(this).removeClass("hover");
		});

        CD.thisObj.find(".myCanvas").bind(events, function(e){
			e.preventDefault();
            if(CD.isDrawing || CD.isLineDrawing) {
				var coords = getCoordinates(e.originalEvent),
                    filD =filll(),
				data = {
					x: coords.x,
					y: coords.y,
					type: e.type,
					color: filD.clr,
					stroke : filD.strk,
					isLineDrawing : CD.isLineDrawing,
					id : CD.thisObj.id
				};
				
				draw(data, true);
				
				if(CD.okToDraw || e.type === eventType.up) {
                    CD.isSharing ? CD.thisObj.socket.emit('drawRequest', data) : "";
				}
			} else if(CD.isRectangle) {
                var coordsR = getCoordinates(e.originalEvent),
                    filR= filll(),
                    DTR = {
                        x: coordsR.x,
                        y: coordsR.y,
                        type: e.type,
						color: filR.clr,
                        style: filR.fil,
                        stroke:filR.strk,
                        isRectangle : CD.isRectangle,
                        id : CD.thisObj.id
                    };

                drawRectangle(DTR, true);

                if(CD.okToDraw || e.type === eventType.up) {
                    CD.isSharing ? CD.thisObj.socket.emit('drawRectangle', DTR) : "";
                }
            } else if(CD.isCircle) {
                var coordsC = getCoordinates(e.originalEvent),
                    filC= filll(),
                    DTC = {
                        x: coordsC.x,
                        y: coordsC.y,
                        type: e.type,
						color: filC.clr,
                        style: filC.fil,
                        stroke:filC.strk,
                        isCircle : CD.isCircle,
                        id : CD.thisObj.id
                    };

                drawCircle(DTC, true);

                if(CD.okToDraw || e.type === eventType.up) {
                    CD.isSharing ? CD.thisObj.socket.emit('drawCircle', DTC) : "";
                }
            }
		});
		
	}
	/**
	 * to get points for line drawing
	 * @param {Object} ctx 
	 */
	function drawPoints(ctx) {
		var i, len, c, d;
		if (CD.points.length < 3) {
			return;
		}

		ctx.beginPath();
		ctx.moveTo(CD.points[0].x, CD.points[0].y);

		len = (CD.points.length -2);

		for ( i = 1; i < len; i++) {
			c = ((CD.points[i].x + CD.points[i + 1].x) / 2);
			d = ((CD.points[i].y + CD.points[i + 1].y) / 2);
			ctx.quadraticCurveTo(CD.points[i].x, CD.points[i].y, c, d);
		}

		ctx.quadraticCurveTo(CD.points[i].x, CD.points[i].y, CD.points[i + 1].x, CD.points[i + 1].y);
		ctx.stroke();
	}

	/**
	 * Init DrawingPad
	 */
	this.init = function(selector) {
		
		var id = getCanvasID(5);
        CD.mainCanvas = document.createElement('canvas');
        CD.tempCanvas = document.createElement('canvas');
        CD.thisObj = $(selector);
        CD.thisObj.id = id;

        CD.mainCanvas.id = id;
        CD.mainCanvas.width = settings.width;
        CD.mainCanvas.height = settings.height;
        CD.thisObj[id] = {}; //create new obj
        CD.thisObj[id].ctx = CD.mainCanvas.getContext('2d');
        CD.thisObj[id].ctx.strokeStyle = settings.defaultColor;
        CD.thisObj[id].ctx.lineWidth = settings.defaultStroke;

        CD.tempCanvas.id = "tempId";
        CD.tempCanvas.width = CD.mainCanvas.width;
        CD.tempCanvas.height = CD.mainCanvas.height;
        CD.thisObj.temp = {};
        CD.thisObj.temp.ctx = CD.tempCanvas.getContext('2d');
        CD.thisObj.temp.ctx.strokeStyle = settings.defaultColor;
        CD.thisObj.temp.ctx.lineWidth = settings.defaultStroke;
		
		$(CD.mainCanvas).addClass("myCanvas");
		$(CD.tempCanvas).addClass("myCanvas");

		$(selector).append(CD.tempCanvas); //add canvas to DOM
		$(selector).append(CD.mainCanvas); //add canvas to DOM
        $(selector).append(createHeader); //add header to DOM
		$(selector).append(createToolBar); //add tool bar to DOM
        $(selector).append(createColorTool); //add color tool to DOM

		//register socket listeners
        CD.thisObj.socket = io.connect("http://localhost:3000");

        CD.thisObj.socket.on('setUserList', function(data) {
			return setUserList(data); //show pop up list
		});

        CD.thisObj.socket.on('draw', function(data) {
			return draw(data);
	    });
        CD.thisObj.socket.on('drawRectangle', function(DTR) {
            return drawRectangle(DTR);
        });
        CD.thisObj.socket.on('drawCircle', function(DTC) {
            return drawCircle(DTC);
        });

        CD.thisObj.socket.on('eraseShared', function(data) {
			return eraseShared(data);
		});

        CD.thisObj.socket.on('createNewClient', function(data) {
			return createNewClient(data);
	    });

        CD.thisObj.socket.on('deleteShared', function(data) {
			return deleteShared(data); //remove shared canvas
		});

        CD.thisObj.socket.on('setConfirmShare', function(data) {
			return setConfirmShare(data);
	    });
		
		//set event handlers
		setEventHandlers();
		
		$("body").append(buildUserCreate());
		$('.userNameModal').on('shown', function () {
			$(".confirm").click(function(){
                CD.myName = $(".userNameInput").val().trim();
				//tell the server i'm here
                CD.thisObj.socket.emit('setClientId', {id : id, senderName : CD.myName});
                $(selector).append(_welcome); // add welcome to DOM
			});

		});
		$('.userNameModal').modal("show");

	};
};

