function main() {
    const canvas = document.getElementById('stepOutAnimation');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height= window.innerHeight;

    class Point {
        constructor(x, y, width, height, color){
            this.x = x;
            this.y = y;
            this.height = height;
            this.width = width;
            this.color = color;
        }
        update(micInput){
            this.x++;
            //this.height = micInput
        }
        draw(context){
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    //const bar = new Point(10,10,100,200, 'black');
    let barWidth = canvas.width/256;
    let bars = createBars(barWidth);
    const microphone = new Microphone();

    animate()
    
    function animate() {
        if (microphone.initialized) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const samples = microphone.getSamples();
        console.log(samples);
        bars.forEach((elem) => {
            elem.update(1);
            elem.draw(ctx);
        })
        }

        
        requestAnimationFrame(animate);
    }
    
    function createBars(barWidth) {
        let bars = []
        for (let i = 0; i < 256; i++) {
            let color = 'hsl('+ i +',100%, 50%)'
            bars.push(new Point(i* barWidth, i, 200, 100, color))
        }
        return bars;
    }
}