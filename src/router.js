class Router{

    constructor(){

        this.routes={};

    }

    register(name,module){

        this.routes[name]=module;

    }

    go(name){

        if(!this.routes[name]) return;

        this.routes[name].render();

    }

}

export default new Router();