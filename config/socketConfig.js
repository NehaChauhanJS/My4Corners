

module.exports= function(server)
{
    var io = require('socket.io').listen(server);
    var connectedclients ={};
    io.on('connection', function (socket) {
        console.log("hello");
        //added clients
        socket.on("setClientId", function (data) {
            connectedclients[data.id] = {
                id : data.id, //adds key to a map
                senderName : data.senderName
            };
            console.log(connectedclients);
        });

        //removes clients
        socket.on("deleteSharedById", function (data) {
            delete connectedclients[data.id]; //removes key from map
            socket.broadcast.emit("deleteShared",{ id : data.id}); //send to sender
        });

        //erases canvas
        socket.on("eraseRequestById", function (data) {
            socket.broadcast.emit("eraseShared",{ id : data.id});
        });

        //returns back a list of clients to the requester
        socket.on("getUserList", function (data) {
            socket.emit("setUserList", connectedclients); //send to sender
        });

        //request to share
        socket.on("requestShare", function (data) {
            socket.broadcast.emit("createNewClient", {
                listenerId: data.listenerId,
                senderId: data.senderId,
                senderName : data.senderName
            });
        });

        //confirm canvas share
        socket.on("confirmShare", function (data) {
            socket.broadcast.emit("setConfirmShare", {
                isSharing: data.isSharing,
                senderId: data.senderId,
                listenerId: data.listenerId,
                senderName : data.senderName
            });
        });

        //drawing data
        socket.on('drawRequest', function (data) {
            socket.broadcast.emit('draw', {
                x: data.x,
                y: data.y,
                type: data.type,

                color: data.color,
                stroke: data.stroke,
                isLineDrawing: data.isLineDrawing,
                //isErase: data.isErase,
                id: data.id
            });
        });
        //draw rectangle
        socket.on('drawRectangle', function (DTR) {
            socket.broadcast.emit('draw', {
                x: DTR.x,
                y: DTR.y,
                width: DTR.width,
                height: DTR.height,
                type: DTR.type,
                color: DTR.color,
                style: DTR.style,
                stroke:DTR.stroke,
                isRectangle: DTR.isRectangle,
                //isErase: DTR.isErase,
                id: DTR.id
            });
        });
        //draw circle
        socket.on('drawCircle', function (DTC) {
            socket.broadcast.emit('drawCircle', {
                x: DTC.x,
                y: DTC.y,
                type: DTC.type,

                color: DTC.color,
                style: DTC.style,
                stroke:DTC.stroke,
                isCircle: DTC.isCircle,
                //isErase: DTC.isErase,
                id: DTC.id
            });
        });

    })
}