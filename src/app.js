import Dashboard from "./modules/dashboard/dashboard.js";

class App {

    constructor(){

        this.currentModule="home";

    }

    start(){

        console.log("AR Airways Started");

    }

    navigate(module){

        this.currentModule=module;

        console.log("Navigate to",module);

    }

}

export default new App();