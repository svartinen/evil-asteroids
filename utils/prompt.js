// A simple custom prompt dialog (as regular one can't be styled)
function customPrompt(){
    this.message = document.getElementById("promptMessage");
    this.input = document.getElementById("promptInput");
    this.container = document.getElementById("promptContainer");
    this.closeButton = document.getElementById("promptCloseButton");
    this.submitButton = document.getElementById("promptSubmitButton");
    
    this.prompt = function(message) { 
        this.container.style.display = "flex";
        this.message.innerHTML = message;
        
        return new Promise((resolve) => {
            var self = this;
            this.closeButton.onclick = function(event) {
                self.container.style.display = "none";
                resolve(null);
            }
            
            this.input.onkeydown = function(event) {
                if(event.key === "Enter") {
                    self.container.style.display = "none";
                    self.beenSubmitted = true;
                    resolve(self.input.value);
                }
            }
            
            this.submitButton.onclick = function(event) {
                self.container.style.display = "none";
                resolve(self.input.value);
            }  
        })
    }
}