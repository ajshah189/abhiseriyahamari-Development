import App from "./src/app.js";

console.log("1 - script.js loaded");

try {
    console.log("2 - calling App.start()");
    App.start();
    console.log("3 - App.start() returned");
} catch (e) {
    console.error("ERROR:", e);
}