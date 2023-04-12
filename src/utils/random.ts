export function randomIntFromInterval(min, max) { // min and max excluded
    return Math.floor(Math.random() * (max - min) + min);
}