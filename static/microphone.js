class Microphone{
    constructor() {
        this.initialized = false;
        let size = 2048;
        let stream = navigator.mediaDevices.getUserMedia({audio:true}).
        then(function (stream) {
            this.audioContext = new AudioContext();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            console.log(this.analyser);
            this.analyser.fftSize = size;
            console.log(this.analyser.frequencyBinCount);
            this.dataArray = new Uint8Array(size/2);
            this.microphone.connect(this.analyser);
            this.initialized = true;
        }.bind(this)).
        catch(function(err) {
            console.log(err);
            alert(err);
        })
        
    }
    
    getSamples(){
        this.analsyer.getByteTimeDomainData(this.dataArray);
        let normSamples = [...this.dataArray].map(elem => elem/128 - 1);
        return normSamples;
    }
    getVolume(){
        let sum = 0;
        this.analsyer.getByteTimeDomainData(this.dataArray);
        let normSamples = [...this.dataArray].map(elem => elem/128 - 1);
        normSamples.forEach(elem => {
            sum += elem * elem;
        })
        let volume = Math.sqrt(sum / normSamples.length);
        return volume;
    }
}
// const microphone = new Microphone();
// console.log(microphone);